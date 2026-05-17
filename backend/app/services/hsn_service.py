from __future__ import annotations

import logging
import re
import time
from typing import Any, Dict, List, Optional

from app.services.netsuite_service import fetch_hsn_codes_from_netsuite

logger = logging.getLogger(__name__)

_MAX_SEARCH_LEN = 200
_CACHE_TTL_SEC = 300

_cache: Dict[str, Any] = {"rows": None, "at": 0.0}


def _sanitize_search(q: Optional[str]) -> str:
    if not q:
        return ""
    s = re.sub(r"[^\w\s\-.,%()/+]", "", q, flags=re.UNICODE).strip()
    return s[:_MAX_SEARCH_LEN]


def _matches_search(row: Dict[str, str], search: str) -> bool:
    if not search:
        return True
    s = search.lower()
    for key in ("hsncode", "name", "hsndescription", "internalId"):
        if s in str(row.get(key) or "").lower():
            return True
    return False


def _to_api_row(row: Dict[str, str]) -> Dict[str, Any]:
    iid = str(row.get("internalId") or "")
    return {
        "_id": iid,
        "internalId": iid,
        "name": str(row.get("name") or ""),
        "hsncode": str(row.get("hsncode") or ""),
        "hsndescription": str(row.get("hsndescription") or ""),
        "source": "netsuite",
        "isActive": True,
    }


async def _load_hsn(*, force_refresh: bool = False) -> List[Dict[str, str]]:
    now = time.time()
    cached = _cache.get("rows")
    if (
        not force_refresh
        and isinstance(cached, list)
        and (now - float(_cache.get("at") or 0)) < _CACHE_TTL_SEC
    ):
        return cached

    rows = await fetch_hsn_codes_from_netsuite()
    _cache["rows"] = rows
    _cache["at"] = now
    logger.info("HSN cache refreshed from NetSuite count=%s", len(rows))
    return rows


def _filter_rows(
    rows: List[Dict[str, str]],
    *,
    search: Optional[str] = None,
) -> List[Dict[str, str]]:
    s = _sanitize_search(search)
    out = [r for r in rows if _matches_search(r, s)]
    out.sort(key=lambda r: str(r.get("hsncode") or r.get("name") or "").lower())
    return out


async def refresh_hsn_from_netsuite() -> Dict[str, Any]:
    rows = await _load_hsn(force_refresh=True)
    return {
        "success": True,
        "fetched": len(rows),
        "cached": True,
        "source": "netsuite",
    }


async def get_hsn_codes_page(
    *,
    page: int = 1,
    limit: int = 50,
    search: Optional[str] = None,
    include_inactive: bool = False,
) -> Dict[str, Any]:
    del include_inactive
    page = max(1, page)
    limit = min(max(1, limit), 200)
    rows = _filter_rows(await _load_hsn(), search=search)
    total = len(rows)
    start = (page - 1) * limit
    page_rows = rows[start : start + limit]
    return {
        "success": True,
        "count": total,
        "page": page,
        "limit": limit,
        "data": [_to_api_row(r) for r in page_rows],
        "source": "netsuite",
    }


async def search_hsn_codes(
    *,
    q: str,
    limit: int = 50,
    include_inactive: bool = False,
) -> Dict[str, Any]:
    del include_inactive
    s = _sanitize_search(q)
    if not s:
        lim = min(max(1, limit), 100)
        rows = (await _load_hsn())[:lim]
        data = [_to_api_row(r) for r in rows]
        return {"success": True, "count": len(data), "data": data, "source": "netsuite"}
    lim = min(max(1, limit), 100)
    rows = _filter_rows(await _load_hsn(), search=s)[:lim]
    return {
        "success": True,
        "count": len(rows),
        "data": [_to_api_row(r) for r in rows],
        "source": "netsuite",
    }


async def get_hsn_by_internal_id(internal_id: str) -> Optional[Dict[str, Any]]:
    iid = str(internal_id).strip()
    if not iid:
        return None
    for row in await _load_hsn():
        if str(row.get("internalId")) == iid:
            return _to_api_row(row)
    return None


async def get_hsn_by_id(hsn_id: str) -> Optional[Dict[str, Any]]:
    return await get_hsn_by_internal_id(hsn_id)
