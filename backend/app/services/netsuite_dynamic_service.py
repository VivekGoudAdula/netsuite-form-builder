from __future__ import annotations

import logging
import re
import time
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

from cachetools import TTLCache
from fastapi import HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.database import get_database
from app.services.netsuite_datasource_store import get_datasource_by_key
from app.services.netsuite_restlet import restlet_get_with_retry

logger = logging.getLogger(__name__)

_MAX_SEARCH_LEN = 200
_CACHE_TTL_SEC = 300
_STALE_MAX_SEC = 1800

# TTLCache: datasourceKey -> (rows, fetched_at)
_data_cache: TTLCache = TTLCache(maxsize=64, ttl=_CACHE_TTL_SEC)
_stale_cache: Dict[str, Tuple[List[Dict[str, Any]], float]] = {}

_sync_status: Dict[str, Dict[str, Any]] = {}


def _sanitize_search(q: Optional[str]) -> str:
    if not q:
        return ""
    s = re.sub(r"[^\w\s\-.,%()/+@]", "", q, flags=re.UNICODE).strip()
    return s[:_MAX_SEARCH_LEN]


def _extract_rows_from_body(body: Any, response_path: str) -> Any:
    """Resolve list payload from RESTlet JSON (handles data / results / nested)."""
    if isinstance(body, list):
        return body
    if not isinstance(body, dict):
        return None
    raw_list = _extract_path(body, response_path)
    if raw_list is None:
        for alt in ("data", "results", "items", "records"):
            if alt != response_path:
                raw_list = _extract_path(body, alt)
            if isinstance(raw_list, list):
                break
    return raw_list


def _extract_path(data: Any, path: str) -> Any:
    if not path or path == ".":
        return data
    current = data
    for part in path.split("."):
        part = part.strip()
        if not part:
            continue
        if not isinstance(current, dict):
            return None
        current = current.get(part)
    return current


def _first_present(row: Dict[str, Any], keys: tuple[str, ...]) -> str:
    for k in keys:
        v = row.get(k)
        if v is not None and str(v).strip():
            return str(v).strip()
    return ""


def infer_label_value_keys(sample: Dict[str, Any]) -> tuple[str, str]:
    """Pick label/value fields from a NetSuite row (e.g. tax nature uses name only)."""
    if not sample:
        return "displayName", "internalId"
    keys = set(sample.keys())
    label_key = next(
        (k for k in ("displayName", "name", "label", "title", "hsncode") if k in keys),
        next(iter(keys), "name"),
    )
    value_key = next(
        (k for k in ("internalId", "id", "value", "name", "hsncode") if k in keys),
        label_key,
    )
    return label_key, value_key


def _normalize_rows(
    raw_rows: List[Any],
    *,
    label_key: str,
    value_key: str,
) -> List[Dict[str, Any]]:
    out: List[Dict[str, Any]] = []
    seen: set[str] = set()
    value_fallbacks = (value_key, "internalId", "id", "value", "name", "hsncode")
    label_fallbacks = (label_key, "displayName", "name", "label", "title", "hsncode")

    for item in raw_rows:
        if not isinstance(item, dict):
            continue
        val = _first_present(item, value_fallbacks)
        if not val or val in seen:
            continue
        seen.add(val)
        label = _first_present(item, label_fallbacks) or val
        row = dict(item)
        row["internalId"] = val
        row["_id"] = val
        row["label"] = label
        row["value"] = val
        row["source"] = "netsuite"
        row["isActive"] = True
        out.append(row)
    out.sort(key=lambda r: str(r.get("label") or "").lower())
    return out


def _matches_search(row: Dict[str, Any], search: str, search_fields: List[str]) -> bool:
    if not search:
        return True
    s = search.lower()
    fields = search_fields or list(row.keys())
    for key in fields:
        if s in str(row.get(key) or "").lower():
            return True
    if s in str(row.get("internalId") or "").lower():
        return True
    return False


def _update_sync_status(
    key: str,
    *,
    success: bool,
    count: int,
    latency_ms: float,
    message: Optional[str] = None,
) -> None:
    _sync_status[key] = {
        "datasourceKey": key,
        "lastFetchedAt": datetime.now(timezone.utc),
        "responseCount": count,
        "latencyMs": round(latency_ms, 2),
        "status": "ok" if success else "error",
        "message": message,
    }


def get_sync_status(datasource_key: str) -> Dict[str, Any]:
    key = datasource_key.strip().lower()
    return _sync_status.get(key) or {
        "datasourceKey": key,
        "lastFetchedAt": None,
        "responseCount": 0,
        "latencyMs": None,
        "status": "never",
        "message": None,
    }


async def _load_config(db: AsyncIOMotorDatabase, datasource_key: str) -> Dict[str, Any]:
    key = datasource_key.strip().lower()
    doc = await get_datasource_by_key(db, key)
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Datasource '{key}' not found or inactive",
        )
    if not doc.get("scriptId") or not doc.get("deployId"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Datasource missing scriptId or deployId",
        )
    if not doc.get("labelKey") or not doc.get("valueKey"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Datasource missing labelKey or valueKey",
        )
    return doc


async def fetch_dynamic_netsuite_data(
    datasource_key: str,
    *,
    force_refresh: bool = False,
    db: Optional[AsyncIOMotorDatabase] = None,
) -> List[Dict[str, Any]]:
    """
    Core engine: lookup config, call RESTlet, normalize rows, cache by datasourceKey.
    """
    db = get_database() if db is None else db
    key = datasource_key.strip().lower()
    config = await _load_config(db, key)

    if not force_refresh and key in _data_cache:
        return list(_data_cache[key])

    script_id = str(config["scriptId"])
    deploy_id = str(config["deployId"])
    response_path = str(config.get("responseDataPath") or "data")
    label_key = str(config["labelKey"])
    value_key = str(config["valueKey"])

    start = time.perf_counter()
    try:
        body = await restlet_get_with_retry(script_id, deploy_id)
        latency_ms = (time.perf_counter() - start) * 1000

        if isinstance(body, dict) and body.get("success") is False:
            msg = str(body.get("message") or body.get("error") or "NetSuite returned success=false")
            raise ValueError(msg)

        raw_list = _extract_rows_from_body(body, response_path)
        if not isinstance(raw_list, list):
            raise ValueError(
                f"Expected list at path '{response_path}', got {type(raw_list).__name__}"
            )

        if raw_list and isinstance(raw_list[0], dict):
            inferred_label, inferred_value = infer_label_value_keys(raw_list[0])
            if not any(raw_list[0].get(k) for k in (value_key, "internalId", "id")):
                value_key = inferred_value
            if not any(raw_list[0].get(k) for k in (label_key, "displayName", "name")):
                label_key = inferred_label

        rows = _normalize_rows(raw_list, label_key=label_key, value_key=value_key)
        _data_cache[key] = rows
        _stale_cache[key] = (list(rows), time.time())
        _update_sync_status(key, success=True, count=len(rows), latency_ms=latency_ms)
        logger.info(
            "Dynamic fetch success key=%s script=%s count=%s",
            key,
            script_id,
            len(rows),
        )
        return rows

    except Exception as exc:
        latency_ms = (time.perf_counter() - start) * 1000
        logger.exception("Dynamic fetch failed key=%s", key)
        _update_sync_status(
            key,
            success=False,
            count=0,
            latency_ms=latency_ms,
            message=str(exc),
        )
        stale = _stale_cache.get(key)
        if stale and (time.time() - stale[1]) < _STALE_MAX_SEC:
            logger.warning("Serving stale cache for datasource key=%s", key)
            return list(stale[0])
        return []


def invalidate_cache(datasource_key: Optional[str] = None) -> None:
    if datasource_key:
        key = datasource_key.strip().lower()
        _data_cache.pop(key, None)
        _stale_cache.pop(key, None)
    else:
        _data_cache.clear()
        _stale_cache.clear()


async def get_fetch_page(
    datasource_key: str,
    *,
    page: int = 1,
    limit: int = 50,
    search: Optional[str] = None,
    force_refresh: bool = False,
    db: Optional[AsyncIOMotorDatabase] = None,
) -> Dict[str, Any]:
    rows = await fetch_dynamic_netsuite_data(
        datasource_key, force_refresh=force_refresh, db=db
    )
    config = await _load_config(get_database() if db is None else db, datasource_key)
    search_fields = list(config.get("searchFields") or [])
    s = _sanitize_search(search)
    if s:
        rows = [r for r in rows if _matches_search(r, s, search_fields)]

    page = max(1, page)
    limit = min(max(1, limit), 200)
    total = len(rows)
    start = (page - 1) * limit
    page_rows = rows[start : start + limit]
    key = datasource_key.strip().lower()
    sync = get_sync_status(key)
    payload: Dict[str, Any] = {
        "success": True,
        "count": total,
        "page": page,
        "limit": limit,
        "data": page_rows,
        "source": "netsuite",
        "datasourceKey": key,
        "labelKey": config.get("labelKey"),
        "valueKey": config.get("valueKey"),
    }
    if total == 0 and sync.get("status") == "error":
        payload["success"] = False
        payload["message"] = sync.get("message") or "NetSuite returned no rows"
    elif total == 0:
        payload["message"] = "No matching records (check label/value keys in connector)"
    return payload


async def search_dynamic(
    datasource_key: str,
    *,
    query: str = "",
    page: int = 1,
    limit: int = 50,
    db: Optional[AsyncIOMotorDatabase] = None,
) -> Dict[str, Any]:
    return await get_fetch_page(
        datasource_key,
        page=page,
        limit=limit,
        search=query,
        db=db,
    )


async def lookup_dynamic(
    datasource_key: str,
    internal_id: str,
    *,
    db: Optional[AsyncIOMotorDatabase] = None,
) -> Optional[Dict[str, Any]]:
    db = get_database() if db is None else db
    config = await _load_config(db, datasource_key)
    value_key = str(config["valueKey"])
    iid = str(internal_id).strip()
    if not iid:
        return None
    for row in await fetch_dynamic_netsuite_data(datasource_key, db=db):
        if str(row.get(value_key) or row.get("internalId")) == iid:
            return row
    return None


async def test_connection(
    datasource_key: str,
    *,
    db: Optional[AsyncIOMotorDatabase] = None,
) -> Dict[str, Any]:
    """Fetch once and return sample + detected keys for admin preview."""
    db = get_database() if db is None else db
    config = await _load_config(db, datasource_key)
    key = datasource_key.strip().lower()
    invalidate_cache(key)
    start = time.perf_counter()
    try:
        body = await restlet_get_with_retry(
            str(config["scriptId"]),
            str(config["deployId"]),
        )
        latency_ms = (time.perf_counter() - start) * 1000
        response_path = str(config.get("responseDataPath") or "data")
        raw_list = _extract_rows_from_body(body, response_path)
        sample: List[Any] = []
        detected_keys: List[str] = []
        suggested_label = "displayName"
        suggested_value = "internalId"
        if isinstance(raw_list, list) and raw_list:
            first = raw_list[0]
            if isinstance(first, dict):
                detected_keys = sorted(first.keys())
                suggested_label, suggested_value = infer_label_value_keys(first)
            sample = raw_list[:5]
        count = len(raw_list) if isinstance(raw_list, list) else 0
        return {
            "success": count > 0 or (isinstance(body, dict) and body.get("success") is not False),
            "latencyMs": round(latency_ms, 2),
            "responseCount": count,
            "detectedKeys": detected_keys,
            "suggestedLabelKey": suggested_label,
            "suggestedValueKey": suggested_value,
            "sample": sample,
            "rawSuccess": body.get("success") if isinstance(body, dict) else None,
            "message": None if count else "No rows at response path — check script or responseDataPath",
        }
    except Exception as exc:
        return {
            "success": False,
            "message": str(exc),
            "latencyMs": round((time.perf_counter() - start) * 1000, 2),
        }
