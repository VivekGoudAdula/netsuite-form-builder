from __future__ import annotations

import logging
from typing import Any, Dict, List

import requests
from requests_oauthlib import OAuth1

from app.config import settings
from app.services.netsuite_restlet import restlet_get, restlet_get_with_retry

logger = logging.getLogger(__name__)


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


def get_employees():
    """
    Fetch employees from NetSuite to populate a dropdown.
    """
    url = f"{settings.NETSUITE_BASE_URL}/app/site/hosting/restlet.nl"

    params = {
        "script": settings.NETSUITE_GET_SCRIPT,
        "deploy": settings.NETSUITE_DEPLOY,
    }

    try:
        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json",
        }
        response = requests.get(
            url, auth=get_oauth(), params=params, headers=headers, timeout=60
        )

        try:
            data = response.json()
        except ValueError:
            logger.error("NetSuite GET employees: failed to parse JSON")
            data = {}

        response.raise_for_status()

        employees = data.get("employees", [])
        logger.info("NetSuite GET employees: success count=%s", len(employees))

        return [
            {
                "label": f"{emp.get('firstName', '')} {emp.get('lastName', '')}".strip(),
                "value": emp.get("id"),
                "email": emp.get("email"),
            }
            for emp in employees
        ]
    except Exception as e:
        logger.exception("NetSuite GET employees failed: %s", e)
        if "response" in locals() and hasattr(response, "text"):
            logger.error("NetSuite response text: %s", response.text[:2000])
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
        out.append({"internalId": str(iid), "name": str(name)})

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
        logger.error("NetSuite Location fetch: failure %s", exc)
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
