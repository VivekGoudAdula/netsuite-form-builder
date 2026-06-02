from __future__ import annotations

import logging
import time
from typing import Any, Dict, List, Optional

import requests
from requests_oauthlib import OAuth1

from app.config import settings
from app.services.netsuite_restlet import restlet_get, restlet_get_with_retry

logger = logging.getLogger(__name__)

_EMPLOYEE_CACHE_TTL_SEC = 300
_EMPLOYEE_STALE_MAX_SEC = 1800
_employee_cache: Dict[str, Any] = {"rows": None, "at": 0.0}


def _access_token() -> str:
    return (settings.NETSUITE_ACCESS_TOKEN or settings.NETSUITE_TOKEN or "").strip()


def get_oauth():
    """
    Generate OAuth1 object for NetSuite authentication.
    """
    return OAuth1(
        settings.NETSUITE_CONSUMER_KEY,
        settings.NETSUITE_CONSUMER_SECRET,
        _access_token(),
        settings.NETSUITE_TOKEN_SECRET,
        realm=settings.NETSUITE_REALM,
        signature_method="HMAC-SHA256",
    )


def _normalize_employees(data: Dict[str, Any]) -> List[Dict[str, Any]]:
    employees = data.get("employees")
    if not isinstance(employees, list):
        return []
    return [
        {
            "label": f"{emp.get('firstName', '')} {emp.get('lastName', '')}".strip(),
            "value": emp.get("id"),
            "email": emp.get("email"),
        }
        for emp in employees
        if isinstance(emp, dict) and emp.get("id") is not None
    ]


def _netsuite_error_code(data: Dict[str, Any]) -> Optional[str]:
    err = data.get("error")
    if isinstance(err, dict):
        return str(err.get("code") or "") or None
    return None


def _is_rate_limited(status_code: int, data: Dict[str, Any]) -> bool:
    if status_code != 400:
        return False
    return _netsuite_error_code(data) == "SSS_REQUEST_LIMIT_EXCEEDED"


def _stale_employee_cache() -> Optional[List[Dict[str, Any]]]:
    cached = _employee_cache.get("rows")
    if not isinstance(cached, list):
        return None
    age = time.time() - float(_employee_cache.get("at") or 0)
    if age > _EMPLOYEE_STALE_MAX_SEC:
        return None
    return list(cached)


def get_employees(*, force_refresh: bool = False) -> List[Dict[str, Any]]:
    """
    Fetch employees from NetSuite for dropdowns.
    Uses a short in-memory cache to avoid hitting NetSuite governance limits.
    """
    now = time.time()
    cached = _employee_cache.get("rows")
    if (
        not force_refresh
        and isinstance(cached, list)
        and (now - float(_employee_cache.get("at") or 0)) < _EMPLOYEE_CACHE_TTL_SEC
    ):
        logger.debug("NetSuite GET employees: cache hit count=%s", len(cached))
        return list(cached)

    url = f"{settings.NETSUITE_BASE_URL}/app/site/hosting/restlet.nl"
    params = {
        "script": settings.NETSUITE_GET_SCRIPT,
        "deploy": settings.NETSUITE_DEPLOY,
    }
    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
    }

    last_data: Dict[str, Any] = {}
    for attempt in range(4):
        try:
            response = requests.get(
                url, auth=get_oauth(), params=params, headers=headers, timeout=60
            )
            try:
                data = response.json()
            except ValueError:
                logger.error("NetSuite GET employees: failed to parse JSON")
                data = {}
            last_data = data if isinstance(data, dict) else {}

            if _is_rate_limited(response.status_code, last_data):
                wait_s = min(12.0, 2.0 ** attempt)
                logger.warning(
                    "NetSuite GET employees: rate limited (attempt %s/4), retry in %.1fs",
                    attempt + 1,
                    wait_s,
                )
                if attempt < 3:
                    time.sleep(wait_s)
                    continue
                stale = _stale_employee_cache()
                if stale is not None:
                    logger.warning(
                        "NetSuite GET employees: serving stale cache count=%s",
                        len(stale),
                    )
                    return stale
                return []

            response.raise_for_status()
            rows = _normalize_employees(last_data)
            _employee_cache["rows"] = rows
            _employee_cache["at"] = time.time()
            logger.info("NetSuite GET employees: success count=%s", len(rows))
            return rows
        except requests.HTTPError as exc:
            logger.warning("NetSuite GET employees HTTP error: %s", exc)
            if attempt < 3:
                time.sleep(min(8.0, 2.0**attempt))
                continue
            break
        except Exception as exc:
            logger.warning("NetSuite GET employees failed: %s", exc)
            break

    stale = _stale_employee_cache()
    if stale is not None:
        logger.warning(
            "NetSuite GET employees: serving stale cache after error count=%s",
            len(stale),
        )
        return stale
    if last_data:
        logger.error(
            "NetSuite GET employees error payload: %s",
            str(last_data)[:500],
        )
    return []


def send_to_netsuite(payload: dict):
    """
    Send form submission data to NetSuite.
    """
    url = f"{settings.NETSUITE_BASE_URL}/app/site/hosting/restlet.nl"

    params = {
        "script": settings.NETSUITE_POST_SCRIPT,
        "deploy": settings.NETSUITE_DEPLOY,
    }

    try:
        logger.info("NetSuite POST submission: sending payload keys=%s", list(payload.keys()))

        response = requests.post(
            url,
            auth=get_oauth(),
            params=params,
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=120,
        )

        try:
            data = response.json()
        except ValueError:
            data = {"status": "error", "message": "Invalid JSON response from NetSuite"}

        response.raise_for_status()
        return data
    except Exception as e:
        logger.exception("NetSuite POST submission failed: %s", e)
        if "response" in locals() and hasattr(response, "text"):
            logger.error("NetSuite response text: %s", response.text[:2000])
        return {"status": "error", "message": str(e)}


async def fetch_currencies_from_netsuite() -> List[Dict[str, str]]:
    """
    Fetch currencies from the NetSuite currency RESTlet and return normalized rows.
    """
    logger.info(
        "NetSuite currency fetch: request start script=%s deploy=%s",
        settings.NETSUITE_CURRENCY_SCRIPT,
        settings.NETSUITE_CURRENCY_DEPLOY,
    )
    try:
        data = await restlet_get(
            settings.NETSUITE_CURRENCY_SCRIPT,
            settings.NETSUITE_CURRENCY_DEPLOY,
            timeout=60,
        )
    except Exception as exc:
        logger.error("NetSuite currency fetch: failure %s", exc)
        return []

    if not data.get("success"):
        logger.warning(
            "NetSuite currency fetch: success flag false payload_keys=%s",
            list(data.keys()),
        )
        return []

    raw = data.get("data")
    if not isinstance(raw, list):
        logger.warning("NetSuite currency fetch: data is not a list")
        return []

    out: List[Dict[str, str]] = []
    for item in raw:
        if not isinstance(item, dict):
            continue
        iid = item.get("internalId")
        name = item.get("name")
        if iid is None or name is None:
            continue
        rate = item.get("exchangeRate") or item.get("exchangerate") or item.get("rate")
        row = {"internalId": str(iid), "name": str(name)}
        if rate is not None and str(rate).strip():
            row["exchangeRate"] = str(rate)
        out.append(row)

    logger.info(
        "NetSuite currency fetch: success response_count=%s normalized=%s",
        data.get("count"),
        len(out),
    )
    return out


async def fetch_hsn_codes_from_netsuite() -> List[Dict[str, str]]:
    """
    Fetch HSN master rows from the NetSuite HSN RESTlet (OAuth1 HMAC-SHA256).
    Returns normalized dicts for Mongo upsert.
    """
    logger.info(
        "NetSuite HSN fetch: request start script=%s deploy=%s",
        settings.NETSUITE_HSN_SCRIPT,
        settings.NETSUITE_HSN_DEPLOY,
    )
    try:
        data = await restlet_get_with_retry(
            settings.NETSUITE_HSN_SCRIPT,
            settings.NETSUITE_HSN_DEPLOY,
            timeout=120,
            max_retries=3,
        )
    except Exception as exc:
        logger.error("NetSuite HSN fetch: failure %s", exc)
        return []

    if not data.get("success"):
        logger.warning(
            "NetSuite HSN fetch: success flag false payload_keys=%s",
            list(data.keys()),
        )
        return []

    raw = data.get("data")
    if not isinstance(raw, list):
        logger.warning("NetSuite HSN fetch: data is not a list")
        return []

    out: List[Dict[str, str]] = []
    for item in raw:
        if not isinstance(item, dict):
            continue
        iid = item.get("internalId")
        name = item.get("name")
        if iid is None or name is None:
            continue
        out.append(
            {
                "internalId": str(iid),
                "name": str(name),
                "hsncode": str(item.get("hsncode") or ""),
                "hsndescription": str(item.get("hsndescription") or ""),
            }
        )

    logger.info(
        "NetSuite HSN fetch: success response_count=%s normalized=%s",
        data.get("count"),
        len(out),
    )
    return out


async def fetch_locations_from_netsuite() -> List[Dict[str, str]]:
    """
    Fetch Location master rows from the NetSuite Location RESTlet (OAuth1 HMAC-SHA256).
    Returns normalized dicts for Mongo upsert.
    """
    logger.info(
        "NetSuite Location fetch: request start script=%s deploy=%s",
        settings.NETSUITE_LOCATION_SCRIPT,
        settings.NETSUITE_LOCATION_DEPLOY,
    )
    try:
        data = await restlet_get_with_retry(
            settings.NETSUITE_LOCATION_SCRIPT,
            settings.NETSUITE_LOCATION_DEPLOY,
            timeout=120,
            max_retries=3,
        )
    except Exception as exc:
        logger.warning("NetSuite Location fetch: failure %s", exc)
        return []

    if not data.get("success"):
        logger.warning(
            "NetSuite Location fetch: success flag false payload_keys=%s",
            list(data.keys()),
        )
        return []

    raw = data.get("data")
    if not isinstance(raw, list):
        logger.warning("NetSuite Location fetch: data is not a list")
        return []

    out: List[Dict[str, str]] = []
    for item in raw:
        if not isinstance(item, dict):
            continue
        iid = item.get("internalId")
        name = item.get("name")
        if iid is None or name is None:
            continue
        out.append(
            {
                "internalId": str(iid),
                "name": str(name),
                "subsidiary": str(item.get("subsidiary") or ""),
            }
        )

    logger.info(
        "NetSuite Location fetch: success response_count=%s normalized=%s",
        data.get("count"),
        len(out),
    )
    return out


async def fetch_departments_from_netsuite() -> List[Dict[str, str]]:
    """
    Fetch Department master rows from NetSuite RESTlet (OAuth1 HMAC-SHA256).
    """
    logger.info(
        "NetSuite Department fetch: request start script=%s deploy=%s",
        settings.NETSUITE_DEPARTMENT_SCRIPT,
        settings.NETSUITE_DEPARTMENT_DEPLOY,
    )
    try:
        data = await restlet_get_with_retry(
            settings.NETSUITE_DEPARTMENT_SCRIPT,
            settings.NETSUITE_DEPARTMENT_DEPLOY,
            timeout=120,
            max_retries=3,
        )
    except Exception as exc:
        logger.error("NetSuite Department fetch: failure %s", exc)
        return []

    if not data.get("success"):
        logger.warning(
            "NetSuite Department fetch: success flag false payload_keys=%s",
            list(data.keys()),
        )
        return []

    raw = data.get("data")
    if not isinstance(raw, list):
        logger.warning("NetSuite Department fetch: data is not a list")
        return []

    out: List[Dict[str, str]] = []
    seen: set[str] = set()
    for item in raw:
        if not isinstance(item, dict):
            continue
        iid = item.get("internalId")
        name = item.get("name")
        if iid is None or name is None:
            continue
        iid_s = str(iid)
        if iid_s in seen:
            continue
        seen.add(iid_s)
        out.append(
            {
                "internalId": iid_s,
                "name": str(name),
                "subsidiary": str(item.get("subsidiary") or ""),
            }
        )

    logger.info(
        "NetSuite Department fetch: success response_count=%s normalized=%s",
        data.get("count"),
        len(out),
    )
    return out


async def fetch_classes_from_netsuite() -> List[Dict[str, str]]:
    """
    Fetch Class master rows from NetSuite RESTlet (OAuth1 HMAC-SHA256).
    """
    logger.info(
        "NetSuite Class fetch: request start script=%s deploy=%s",
        settings.NETSUITE_CLASS_SCRIPT,
        settings.NETSUITE_CLASS_DEPLOY,
    )
    try:
        data = await restlet_get_with_retry(
            settings.NETSUITE_CLASS_SCRIPT,
            settings.NETSUITE_CLASS_DEPLOY,
            timeout=120,
            max_retries=3,
        )
    except Exception as exc:
        logger.error("NetSuite Class fetch: failure %s", exc)
        return []

    if not data.get("success"):
        logger.warning(
            "NetSuite Class fetch: success flag false payload_keys=%s",
            list(data.keys()),
        )
        return []

    raw = data.get("data")
    if not isinstance(raw, list):
        logger.warning("NetSuite Class fetch: data is not a list")
        return []

    out: List[Dict[str, str]] = []
    seen: set[str] = set()
    for item in raw:
        if not isinstance(item, dict):
            continue
        iid = item.get("internalId")
        name = item.get("name")
        if iid is None or name is None:
            continue
        iid_s = str(iid)
        if iid_s in seen:
            continue
        seen.add(iid_s)
        out.append(
            {
                "internalId": iid_s,
                "name": str(name),
                "subsidiary": str(item.get("subsidiary") or ""),
            }
        )

    logger.info(
        "NetSuite Class fetch: success response_count=%s normalized=%s",
        data.get("count"),
        len(out),
    )
    return out


async def fetch_accounts_from_netsuite() -> List[Dict[str, str]]:
    """
    Fetch GL Account master rows from NetSuite RESTlet (OAuth1 HMAC-SHA256).
    """
    logger.info(
        "NetSuite Account fetch: request start script=%s deploy=%s",
        settings.NETSUITE_ACCOUNT_SCRIPT,
        settings.NETSUITE_ACCOUNT_DEPLOY,
    )
    try:
        data = await restlet_get_with_retry(
            settings.NETSUITE_ACCOUNT_SCRIPT,
            settings.NETSUITE_ACCOUNT_DEPLOY,
            timeout=120,
            max_retries=3,
        )
    except Exception as exc:
        logger.error("NetSuite Account fetch: failure %s", exc)
        return []

    if not data.get("success"):
        logger.warning(
            "NetSuite Account fetch: success flag false payload_keys=%s",
            list(data.keys()),
        )
        return []

    raw = data.get("data")
    if not isinstance(raw, list):
        logger.warning("NetSuite Account fetch: data is not a list")
        return []

    out: List[Dict[str, str]] = []
    seen: set[str] = set()
    for item in raw:
        if not isinstance(item, dict):
            continue
        iid = item.get("internalId")
        name = item.get("name")
        if iid is None or name is None:
            continue
        iid_s = str(iid)
        if iid_s in seen:
            continue
        seen.add(iid_s)
        out.append(
            {
                "internalId": iid_s,
                "number": str(item.get("number") or ""),
                "name": str(name),
                "type": str(item.get("type") or ""),
                "generalratetype": str(item.get("generalratetype") or ""),
                "cashflowratetype": str(item.get("cashflowratetype") or ""),
            }
        )

    logger.info(
        "NetSuite Account fetch: success response_count=%s normalized=%s",
        data.get("count"),
        len(out),
    )
    return out


async def fetch_items_from_netsuite() -> List[Dict[str, str]]:
    """Fetch Item master rows from NetSuite RESTlet (OAuth1 HMAC-SHA256)."""
    logger.info(
        "NetSuite Item fetch: request start script=%s deploy=%s",
        settings.NETSUITE_ITEM_SCRIPT,
        settings.NETSUITE_ITEM_DEPLOY,
    )
    try:
        data = await restlet_get_with_retry(
            settings.NETSUITE_ITEM_SCRIPT,
            settings.NETSUITE_ITEM_DEPLOY,
            timeout=120,
            max_retries=3,
        )
    except Exception as exc:
        logger.error("NetSuite Item fetch: failure %s", exc)
        return []

    if not data.get("success"):
        logger.warning(
            "NetSuite Item fetch: success flag false payload_keys=%s",
            list(data.keys()),
        )
        return []

    raw = data.get("data")
    if not isinstance(raw, list):
        logger.warning("NetSuite Item fetch: data is not a list")
        return []

    out: List[Dict[str, str]] = []
    seen: set[str] = set()
    for item in raw:
        if not isinstance(item, dict):
            continue
        iid = item.get("internalId")
        display = item.get("displayname") or item.get("displayName")
        if iid is None or not display:
            continue
        iid_s = str(iid)
        if iid_s in seen:
            continue
        seen.add(iid_s)
        out.append(
            {
                "internalId": iid_s,
                "displayName": str(display),
                "itemCategory": str(item.get("itemcategory") or item.get("itemCategory") or ""),
                "department": str(item.get("department") or ""),
                "className": str(item.get("class") or item.get("className") or ""),
                "location": str(item.get("Location") or item.get("location") or ""),
                "hsnCode": str(item.get("hsncode") or item.get("hsnCode") or ""),
                "gstRate": str(item.get("gstrate") or item.get("gstRate") or ""),
            }
        )

    logger.info(
        "NetSuite Item fetch: success response_count=%s normalized=%s",
        data.get("count"),
        len(out),
    )
    return out


def _vendor_display_name(item: Dict[str, Any]) -> str:
    company = str(item.get("companyname") or item.get("companyName") or "").strip()
    if company:
        return company
    first = str(item.get("firstname") or item.get("firstName") or "").strip()
    last = str(item.get("lastname") or item.get("lastName") or "").strip()
    if first or last:
        return f"{first} {last}".strip()
    code = str(item.get("CustomerID") or item.get("vendorCode") or "").strip()
    if code:
        return code.strip("-") or code
    return "Unknown"


async def fetch_customers_from_netsuite() -> List[Dict[str, str]]:
    """Fetch Customer master rows from NetSuite RESTlet (OAuth1 HMAC-SHA256)."""
    logger.info(
        "NetSuite Customer fetch: request start script=%s deploy=%s",
        settings.NETSUITE_CUSTOMER_SCRIPT,
        settings.NETSUITE_CUSTOMER_DEPLOY,
    )
    try:
        data = await restlet_get_with_retry(
            settings.NETSUITE_CUSTOMER_SCRIPT,
            settings.NETSUITE_CUSTOMER_DEPLOY,
            timeout=120,
            max_retries=3,
        )
    except Exception as exc:
        logger.warning("NetSuite Customer fetch: failure %s", exc)
        return []

    if not data.get("success"):
        logger.warning(
            "NetSuite Customer fetch: success flag false payload_keys=%s",
            list(data.keys()),
        )
        return []

    raw = data.get("data")
    if not isinstance(raw, list):
        logger.warning("NetSuite Customer fetch: data is not a list")
        return []

    out: List[Dict[str, str]] = []
    seen: set[str] = set()
    for item in raw:
        if not isinstance(item, dict):
            continue
        iid = item.get("internalId")
        if iid is None:
            continue
        iid_s = str(iid)
        if iid_s in seen:
            continue
        seen.add(iid_s)
        raw_type = item.get("type")
        is_person = raw_type is True or str(raw_type).lower() in ("true", "1", "t")
        addr = str(item.get("address") or "").replace("\r\n", " ").replace("\r", " ").replace("\n", " ")
        out.append(
            {
                "internalId": iid_s,
                "customerCode": str(item.get("CustomerID") or ""),
                "displayName": _vendor_display_name(item),
                "email": str(item.get("email") or ""),
                "phone": str(item.get("phone") or ""),
                "subsidiary": str(item.get("subsidiary") or ""),
                "address": addr.strip(),
                "isPerson": "true" if is_person else "false",
                "companyName": str(item.get("companyname") or item.get("companyName") or ""),
                "firstName": str(item.get("firstname") or item.get("firstName") or ""),
                "lastName": str(item.get("lastname") or item.get("lastName") or ""),
            }
        )

    logger.info(
        "NetSuite Customer fetch: success response_count=%s normalized=%s",
        data.get("count"),
        len(out),
    )
    return out


async def fetch_vendors_from_netsuite() -> List[Dict[str, str]]:
    """Fetch Vendor master rows from NetSuite RESTlet (OAuth1 HMAC-SHA256)."""
    logger.info(
        "NetSuite Vendor fetch: request start script=%s deploy=%s",
        settings.NETSUITE_VENDOR_SCRIPT,
        settings.NETSUITE_VENDOR_DEPLOY,
    )
    try:
        data = await restlet_get_with_retry(
            settings.NETSUITE_VENDOR_SCRIPT,
            settings.NETSUITE_VENDOR_DEPLOY,
            timeout=120,
            max_retries=3,
        )
    except Exception as exc:
        logger.warning("NetSuite Vendor fetch: failure %s", exc)
        return []

    if not data.get("success"):
        logger.warning(
            "NetSuite Vendor fetch: success flag false payload_keys=%s",
            list(data.keys()),
        )
        return []

    raw = data.get("data")
    if not isinstance(raw, list):
        logger.warning("NetSuite Vendor fetch: data is not a list")
        return []

    out: List[Dict[str, str]] = []
    seen: set[str] = set()
    for item in raw:
        if not isinstance(item, dict):
            continue
        iid = item.get("internalId")
        if iid is None:
            continue
        iid_s = str(iid)
        if iid_s in seen:
            continue
        seen.add(iid_s)
        raw_type = item.get("type")
        is_person = raw_type is True or str(raw_type).lower() in ("true", "1", "t")
        out.append(
            {
                "internalId": iid_s,
                "vendorCode": str(item.get("CustomerID") or ""),
                "displayName": _vendor_display_name(item),
                "email": str(item.get("email") or ""),
                "phone": str(item.get("phone") or ""),
                "subsidiary": str(item.get("subsidiary") or ""),
                "address": str(item.get("address") or ""),
                "currency": str(item.get("currency") or item.get("currencyId") or ""),
                "terms": str(item.get("terms") or item.get("termsId") or ""),
                "isPerson": "true" if is_person else "false",
                "companyName": str(item.get("companyname") or item.get("companyName") or ""),
                "firstName": str(item.get("firstname") or item.get("firstName") or ""),
                "lastName": str(item.get("lastname") or item.get("lastName") or ""),
            }
        )

    logger.info(
        "NetSuite Vendor fetch: success response_count=%s normalized=%s",
        data.get("count"),
        len(out),
    )
    return out


async def fetch_tax_nature_from_netsuite() -> List[Dict[str, str]]:
    """
    Fetch India Tax Nature options from NetSuite RESTlet (OAuth1 HMAC-SHA256).
    Returns normalized rows with a single `name` field (value = label).
    """
    logger.info(
        "NetSuite Tax Nature fetch: request start script=%s deploy=%s",
        settings.NETSUITE_TAX_NATURE_SCRIPT,
        settings.NETSUITE_TAX_NATURE_DEPLOY,
    )
    try:
        data = await restlet_get_with_retry(
            settings.NETSUITE_TAX_NATURE_SCRIPT,
            settings.NETSUITE_TAX_NATURE_DEPLOY,
            timeout=60,
            max_retries=3,
        )
    except Exception as exc:
        logger.error("NetSuite Tax Nature fetch: failure %s", exc)
        return []

    if not data.get("success"):
        logger.warning(
            "NetSuite Tax Nature fetch: success flag false payload_keys=%s",
            list(data.keys()),
        )
        return []

    raw = data.get("data")
    if not isinstance(raw, list):
        logger.warning("NetSuite Tax Nature fetch: data is not a list")
        return []

    out: List[Dict[str, str]] = []
    seen: set[str] = set()
    for item in raw:
        if not isinstance(item, dict):
            continue
        name = str(item.get("name") or "").strip()
        if not name or name in seen:
            continue
        seen.add(name)
        out.append({"name": name})

    logger.info(
        "NetSuite Tax Nature fetch: success response_count=%s normalized=%s",
        data.get("count"),
        len(out),
    )
    return out
