from __future__ import annotations

import logging
import re
import time
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from motor.motor_asyncio import AsyncIOMotorDatabase

from app.services.netsuite_service import fetch_customers_from_netsuite

logger = logging.getLogger(__name__)

_MAX_SEARCH_LEN = 200
_CACHE_TTL_SEC = 300
_STALE_MAX_SEC = 1800

_cache: Dict[str, Any] = {"rows": None, "at": 0.0}


def _sanitize_search(q: Optional[str]) -> str:
    if not q:
        return ""
    s = re.sub(r"[^\w\s\-.,%()/+@]", "", q, flags=re.UNICODE).strip()
    return s[:_MAX_SEARCH_LEN]


def _normalize_address(raw: str) -> str:
    return re.sub(r"[\r\n]+", " ", raw or "").strip()


def _matches_search(row: Dict[str, str], search: str) -> bool:
    if not search:
        return True
    s = search.lower()
    for key in (
        "displayName",
        "customerCode",
        "companyName",
        "firstName",
        "lastName",
        "email",
        "phone",
        "subsidiary",
        "address",
        "internalId",
    ):
        if s in str(row.get(key) or "").lower():
            return True
    return False


def _to_api_row(row: Dict[str, str]) -> Dict[str, Any]:
    iid = str(row.get("internalId") or "")
    return {
        "_id": iid,
        "internalId": iid,
        "customerCode": str(row.get("customerCode") or ""),
        "displayName": str(row.get("displayName") or ""),
        "email": str(row.get("email") or ""),
        "phone": str(row.get("phone") or ""),
        "subsidiary": str(row.get("subsidiary") or ""),
        "address": _normalize_address(str(row.get("address") or "")),
        "isPerson": bool(row.get("isPerson") in (True, "true", "1", 1)),
        "companyName": str(row.get("companyName") or ""),
        "firstName": str(row.get("firstName") or ""),
        "lastName": str(row.get("lastName") or ""),
        "source": "netsuite",
        "isActive": True,
    }


def _stale_rows() -> Optional[List[Dict[str, str]]]:
    cached = _cache.get("rows")
    if not isinstance(cached, list):
        return None
    if (time.time() - float(_cache.get("at") or 0)) > _STALE_MAX_SEC:
        return None
    return list(cached)


async def fetch_customers_live(*, force_refresh: bool = False) -> List[Dict[str, str]]:
    now = time.time()
    cached = _cache.get("rows")
    if (
        not force_refresh
        and isinstance(cached, list)
        and (now - float(_cache.get("at") or 0)) < _CACHE_TTL_SEC
    ):
        return cached

    rows = await fetch_customers_from_netsuite()
    if rows:
        _cache["rows"] = rows
        _cache["at"] = now
        logger.info("Customer cache refreshed from NetSuite count=%s", len(rows))
        return rows

    stale = _stale_rows()
    if stale is not None:
        logger.warning(
            "Customer fetch failed — serving stale in-memory cache count=%s",
            len(stale),
        )
        return stale

    _cache["rows"] = []
    _cache["at"] = now
    return []


def _filter_rows(
    rows: List[Dict[str, str]],
    *,
    search: Optional[str] = None,
) -> List[Dict[str, str]]:
    s = _sanitize_search(search)
    out = [r for r in rows if _matches_search(r, s)]
    out.sort(key=lambda r: str(r.get("displayName") or "").lower())
    return out


async def _log_fetch(
    db: Optional[AsyncIOMotorDatabase],
    *,
    user_id: Optional[str],
    response_count: int,
    success: bool,
) -> None:
    if db is None:
        return
    doc: Dict[str, Any] = {
        "action": "FETCH_CUSTOMERS",
        "entityType": "customer",
        "responseCount": response_count,
        "success": success,
        "timestamp": datetime.now(timezone.utc),
        "performedBy": user_id,
    }
    if user_id:
        doc["userId"] = user_id
    try:
        await db.activity_log.insert_one(doc)
    except Exception:
        logger.exception("Failed to write FETCH_CUSTOMERS activity log")


async def get_customers_live(
    db: Optional[AsyncIOMotorDatabase] = None,
    *,
    user_id: Optional[str] = None,
    search: Optional[str] = None,
    page: int = 1,
    limit: int = 50,
) -> Dict[str, Any]:
    try:
        rows = _filter_rows(await fetch_customers_live(), search=search)
        page = max(1, page)
        limit = min(max(1, limit), 200)
        total = len(rows)
        start = (page - 1) * limit
        page_rows = rows[start : start + limit]
        data = [_to_api_row(r) for r in page_rows]
        await _log_fetch(db, user_id=user_id, response_count=total, success=True)
        return {
            "success": True,
            "count": total,
            "page": page,
            "limit": limit,
            "data": data,
            "source": "netsuite",
        }
    except Exception:
        logger.exception("Customer live fetch failed")
        await _log_fetch(db, user_id=user_id, response_count=0, success=False)
        return {
            "success": False,
            "message": "Unable to fetch customer data",
            "count": 0,
            "data": [],
        }


async def get_customers_page(
    db: Optional[AsyncIOMotorDatabase] | None,
    *,
    page: int = 1,
    limit: int = 50,
    search: Optional[str] = None,
) -> Dict[str, Any]:
    del db
    page = max(1, page)
    limit = min(max(1, limit), 200)
    rows = _filter_rows(await fetch_customers_live(), search=search)
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


async def search_customers(
    db: Optional[AsyncIOMotorDatabase] | None,
    *,
    q: str,
    page: int = 1,
    limit: int = 50,
) -> Dict[str, Any]:
    del db
    page = max(1, page)
    limit = min(max(1, limit), 100)
    rows = _filter_rows(await fetch_customers_live(), search=q)
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


async def get_customer_by_internal_id(
    db: Optional[AsyncIOMotorDatabase] | None, internal_id: str
) -> Optional[Dict[str, Any]]:
    del db
    iid = str(internal_id).strip()
    if not iid:
        return None
    for row in await fetch_customers_live():
        if str(row.get("internalId")) == iid:
            return _to_api_row(row)
    return None
