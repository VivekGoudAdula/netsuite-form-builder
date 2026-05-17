"""
Reusable NetSuite RESTlet GET client for master data and other signed REST calls.
Extend with POST helpers when needed for additional entity types.
"""
from __future__ import annotations

import asyncio
import logging
import time
from typing import Any, Dict, Optional

import requests
from requests_oauthlib import OAuth1

from app.config import settings

logger = logging.getLogger(__name__)


def _oauth1() -> OAuth1:
    token = (settings.NETSUITE_ACCESS_TOKEN or settings.NETSUITE_TOKEN or "").strip()
    return OAuth1(
        settings.NETSUITE_CONSUMER_KEY,
        settings.NETSUITE_CONSUMER_SECRET,
        token,
        settings.NETSUITE_TOKEN_SECRET,
        realm=settings.NETSUITE_REALM,
        signature_method="HMAC-SHA256",
    )


def restlet_get_sync(
    script: str,
    deploy: str,
    *,
    timeout: int = 60,
    extra_params: Optional[Dict[str, str]] = None,
) -> Dict[str, Any]:
    """
    Perform a synchronous signed GET to a NetSuite RESTlet.
    Returns parsed JSON (may be empty dict on parse failure).
    """
    url = f"{settings.NETSUITE_BASE_URL.rstrip('/')}/app/site/hosting/restlet.nl"
    params: Dict[str, str] = {"script": script, "deploy": str(deploy)}
    if extra_params:
        params.update(extra_params)

    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
    }

    logger.info(
        "NetSuite RESTlet GET start script=%s deploy=%s",
        script,
        deploy,
    )
    try:
        resp = requests.get(
            url,
            auth=_oauth1(),
            params=params,
            headers=headers,
            timeout=timeout,
        )
        try:
            body = resp.json()
        except ValueError:
            logger.error(
                "NetSuite RESTlet GET invalid JSON script=%s status=%s text=%s",
                script,
                resp.status_code,
                resp.text[:500],
            )
            body = {}

        resp.raise_for_status()
        logger.info(
            "NetSuite RESTlet GET success script=%s deploy=%s status=%s",
            script,
            deploy,
            resp.status_code,
        )
        return body if isinstance(body, dict) else {"_raw": body}
    except requests.Timeout:
        logger.error("NetSuite RESTlet GET timeout script=%s deploy=%s", script, deploy)
        raise
    except requests.RequestException as exc:
        logger.error(
            "NetSuite RESTlet GET failure script=%s deploy=%s: %s",
            script,
            deploy,
            exc,
        )
        raise


def restlet_get_sync_with_retry(
    script: str,
    deploy: str,
    *,
    timeout: int = 60,
    extra_params: Optional[Dict[str, str]] = None,
    max_retries: int = 3,
) -> Dict[str, Any]:
    """Same as restlet_get_sync with exponential backoff on timeout / transport errors."""
    last_exc: Optional[BaseException] = None
    for attempt in range(max_retries):
        try:
            return restlet_get_sync(
                script, deploy, timeout=timeout, extra_params=extra_params
            )
        except (requests.Timeout, requests.RequestException) as exc:
            last_exc = exc
            wait_s = min(8.0, 2.0**attempt)
            logger.warning(
                "NetSuite RESTlet GET retry in %.1fs (attempt %s/%s) script=%s deploy=%s: %s",
                wait_s,
                attempt + 1,
                max_retries,
                script,
                deploy,
                exc,
            )
            if attempt < max_retries - 1:
                time.sleep(wait_s)
    assert last_exc is not None
    raise last_exc


async def restlet_get(
    script: str,
    deploy: str,
    *,
    timeout: int = 60,
    extra_params: Optional[Dict[str, str]] = None,
) -> Dict[str, Any]:
    """Async wrapper so FastAPI handlers do not block the event loop."""
    return await asyncio.to_thread(
        restlet_get_sync, script, deploy, timeout=timeout, extra_params=extra_params
    )


async def restlet_get_with_retry(
    script: str,
    deploy: str,
    *,
    timeout: int = 60,
    extra_params: Optional[Dict[str, str]] = None,
    max_retries: int = 3,
) -> Dict[str, Any]:
    """Async NetSuite RESTlet GET with retries (does not block the event loop)."""
    return await asyncio.to_thread(
        restlet_get_sync_with_retry,
        script,
        deploy,
        timeout=timeout,
        extra_params=extra_params,
        max_retries=max_retries,
    )
