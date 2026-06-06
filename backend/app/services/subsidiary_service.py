from __future__ import annotations

import logging
import re
import time
from typing import Any, Dict, List, Optional

from app.services.netsuite_service import fetch_subsidiaries_from_netsuite

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
    for key in ("name", "internalId"):
        if s in str(row.get(key) or "").lower():
            return True
    return False


def _to_api_row(row: Dict[str, str]) -> Dict[str, Any]:
    iid = str(row.get("internalId") or "")
    return {
        "_id": iid,
        "internalId": iid,
        "name": str(row.get("name") or ""),
        "source": "netsuite",
        "isActive": True,
    }


async def _load_subsidiaries(*, force_refresh: bool = False) -> List[Dict[str, str]]:
    now = time.time()
    cached = _cache.get("rows")
    if (
        not force_refresh
        and isinstance(cached, list)
        and (now - float(_cache.get("at") or 0)) < _CACHE_TTL_SEC
    ):
        return cached

    rows = await fetch_subsidiaries_from_netsuite()
    _cache["rows"] = rows
    _cache["at"] = now
    logger.info("Subsidiary cache refreshed from NetSuite count=%s", len(rows))
    return rows


async def refresh_subsidiaries_from_netsuite() -> Dict[str, Any]:
    rows = await _load_subsidiaries(force_refresh=True)
    return {
        "success": True,
        "fetched": len(rows),
        "cached": True,
        "source": "netsuite",
    }


async def get_all_subsidiaries(
    *,
    search: Optional[str] = None,
) -> List[Dict[str, Any]]:
    rows = await _load_subsidiaries()
    q = _sanitize_search(search)
    return [_to_api_row(row) for row in rows if _matches_search(row, q)]


async def get_subsidiary_by_internal_id(subsidiary_id: str) -> Optional[Dict[str, Any]]:
    rows = await _load_subsidiaries()
    sid = str(subsidiary_id or "").strip()
    for row in rows:
        if str(row.get("internalId") or "") == sid:
            return _to_api_row(row)
    return None


def _looks_like_internal_id(value: Any) -> bool:
    s = str(value or "").strip()
    return bool(s) and s.isdigit()


async def resolve_subsidiary_internal_id(
    value: Any,
) -> tuple[str, Optional[str]]:
    """
    Resolve a subsidiary field value to NetSuite internalId.
    Returns (internalId, displayName if resolved from label).
    """
    raw = str(value or "").strip()
    if not raw:
        return "", None
    if _looks_like_internal_id(raw):
        return raw, None

    rows = await _load_subsidiaries()
    lower = raw.lower()
    for row in rows:
        name = str(row.get("name") or "").strip()
        iid = str(row.get("internalId") or "").strip()
        if not iid:
            continue
        if lower == name.lower():
            return iid, name
        if lower in name.lower() or name.lower() in lower:
            return iid, name

    logger.warning("Subsidiary value could not be resolved to internalId: %s", raw[:120])
    return raw, None
