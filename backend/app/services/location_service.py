from __future__ import annotations

import logging
import re
import time
from typing import Any, Dict, List, Optional

from motor.motor_asyncio import AsyncIOMotorDatabase

from app.services.netsuite_service import fetch_locations_from_netsuite

logger = logging.getLogger(__name__)

_MAX_SEARCH_LEN = 200
_CACHE_TTL_SEC = 300  # in-memory only — never persisted to MongoDB

_cache: Dict[str, Any] = {"rows": None, "at": 0.0}


def _sanitize_search(q: Optional[str]) -> str:
    if not q:
        return ""
    s = re.sub(r"[^\w\s\-.,%()/+]", "", q, flags=re.UNICODE).strip()
    return s[:_MAX_SEARCH_LEN]


def _matches_subsidiary(row: Dict[str, str], subsidiary: Optional[str]) -> bool:
    if not subsidiary or not str(subsidiary).strip():
        return True
    sub = str(row.get("subsidiary") or "").lower()
    return str(subsidiary).strip().lower() in sub


def _matches_search(row: Dict[str, str], search: str) -> bool:
    if not search:
        return True
    s = search.lower()
    for key in ("name", "subsidiary", "internalId"):
        if s in str(row.get(key) or "").lower():
            return True
    return False


def _to_api_row(row: Dict[str, str]) -> Dict[str, Any]:
    iid = str(row.get("internalId") or "")
    return {
        "_id": iid,
        "internalId": iid,
        "name": str(row.get("name") or ""),
        "subsidiary": str(row.get("subsidiary") or ""),
        "source": "netsuite",
        "isActive": True,
    }


async def _load_locations(*, force_refresh: bool = False) -> List[Dict[str, str]]:
    """Fetch from NetSuite RESTlet; optional short-lived process memory cache."""
    now = time.time()
    cached = _cache.get("rows")
    if (
        not force_refresh
        and isinstance(cached, list)
        and (now - float(_cache.get("at") or 0)) < _CACHE_TTL_SEC
    ):
        return cached

    rows = await fetch_locations_from_netsuite()
    _cache["rows"] = rows
    _cache["at"] = now
    logger.info("Location cache refreshed from NetSuite count=%s", len(rows))
    return rows


def _filter_rows(
    rows: List[Dict[str, str]],
    *,
    search: Optional[str] = None,
    subsidiary: Optional[str] = None,
) -> List[Dict[str, str]]:
    s = _sanitize_search(search)
    out: List[Dict[str, str]] = []
    for row in rows:
        if not _matches_subsidiary(row, subsidiary):
            continue
        if not _matches_search(row, s):
            continue
        out.append(row)
    out.sort(key=lambda r: (str(r.get("name") or "").lower(), str(r.get("internalId") or "")))
    return out


async def refresh_locations_from_netsuite() -> Dict[str, Any]:
    """Force-refresh in-memory cache from NetSuite (no database write)."""
    rows = await _load_locations(force_refresh=True)
    return {
        "success": True,
        "fetched": len(rows),
        "cached": True,
        "source": "netsuite",
    }


async def get_locations_page(
    db: AsyncIOMotorDatabase | None,
    *,
    page: int = 1,
    limit: int = 50,
    search: Optional[str] = None,
    include_inactive: bool = False,
    subsidiary: Optional[str] = None,
) -> Dict[str, Any]:
    del db, include_inactive  # live NetSuite data only
    page = max(1, page)
    limit = min(max(1, limit), 200)
    rows = _filter_rows(
        await _load_locations(),
        search=search,
        subsidiary=subsidiary,
    )
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


async def search_locations(
    db: AsyncIOMotorDatabase | None,
    *,
    q: str,
    limit: int = 50,
    include_inactive: bool = False,
    subsidiary: Optional[str] = None,
    performed_by: Optional[str] = None,
) -> Dict[str, Any]:
    del db, include_inactive, performed_by
    s = _sanitize_search(q)
    if not s:
        return {"success": True, "count": 0, "data": [], "source": "netsuite"}
    lim = min(max(1, limit), 100)
    rows = _filter_rows(
        await _load_locations(),
        search=s,
        subsidiary=subsidiary,
    )[:lim]
    return {
        "success": True,
        "count": len(rows),
        "data": [_to_api_row(r) for r in rows],
        "source": "netsuite",
    }


async def get_location_by_internal_id(
    db: AsyncIOMotorDatabase | None, internal_id: str
) -> Optional[Dict[str, Any]]:
    del db
    iid = str(internal_id).strip()
    if not iid:
        return None
    for row in await _load_locations():
        if str(row.get("internalId")) == iid:
            return _to_api_row(row)
    return None


async def get_location_by_id(
    db: AsyncIOMotorDatabase | None,
    location_id: str,
    *,
    performed_by: Optional[str] = None,
) -> Optional[Dict[str, Any]]:
    del performed_by
    return await get_location_by_internal_id(db, location_id)
