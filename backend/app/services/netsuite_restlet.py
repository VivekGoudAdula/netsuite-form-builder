"""
Reusable NetSuite RESTlet GET client for master data and other signed REST calls.
Extend with POST helpers when needed for additional entity types.
"""
from __future__ import annotations

import asyncio
import logging
import threading
import time
from typing import Any, Dict, Optional

import requests
from requests_oauthlib import OAuth1

from app.config import settings

logger = logging.getLogger(__name__)

# NetSuite governance: only one RESTlet in flight; minimum gap between calls.
_restlet_mutex = threading.Lock()
_last_restlet_finished_at = 0.0
RESTLET_MIN_GAP_SEC = 1.25


class NetSuiteRateLimitError(requests.HTTPError):
    """NetSuite governance limit (e.g. SSS_REQUEST_LIMIT_EXCEEDED)."""


def _netsuite_error_code(body: Any) -> Optional[str]:
    if not isinstance(body, dict):
        return None
    err = body.get("error")
    if isinstance(err, dict):
        code = str(err.get("code") or "").strip()
        return code or None
    return None


def _is_rate_limited(status_code: int, body: Any) -> bool:
    return status_code == 400 and _netsuite_error_code(body) == "SSS_REQUEST_LIMIT_EXCEEDED"


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

    global _last_restlet_finished_at

    with _restlet_mutex:
        gap = RESTLET_MIN_GAP_SEC - (time.time() - _last_restlet_finished_at)
        if gap > 0:
            logger.debug(
                "NetSuite RESTlet throttle sleep %.2fs before script=%s",
                gap,
                script,
            )
            time.sleep(gap)

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

            if _is_rate_limited(resp.status_code, body):
                msg = _netsuite_error_code(body) or "SSS_REQUEST_LIMIT_EXCEEDED"
                logger.warning(
                    "NetSuite RESTlet rate limited script=%s deploy=%s code=%s",
                    script,
                    deploy,
                    msg,
                )
                raise NetSuiteRateLimitError(
                    f"NetSuite request limit exceeded ({msg})",
                    response=resp,
                )

            if not resp.ok:
                logger.warning(
                    "NetSuite RESTlet GET HTTP %s script=%s deploy=%s body=%s",
                    resp.status_code,
                    script,
                    deploy,
                    str(body)[:300],
                )

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
        finally:
            _last_restlet_finished_at = time.time()


def restlet_get_sync_with_retry(
    script: str,
    deploy: str,
    *,
    timeout: int = 60,
    extra_params: Optional[Dict[str, str]] = None,
    max_retries: int = 3,
) -> Dict[str, Any]:
    """GET with backoff; uses longer waits when NetSuite returns governance rate limits."""
    last_exc: Optional[BaseException] = None
    for attempt in range(max_retries):
        try:
            return restlet_get_sync(
                script, deploy, timeout=timeout, extra_params=extra_params
            )
        except NetSuiteRateLimitError as exc:
            last_exc = exc
            wait_s = 25.0 + 20.0 * attempt
            logger.warning(
                "NetSuite rate limit — retry in %.0fs (attempt %s/%s) script=%s deploy=%s",
                wait_s,
                attempt + 1,
                max_retries,
                script,
                deploy,
            )
            if attempt < max_retries - 1:
                time.sleep(wait_s)
        except (requests.Timeout, requests.RequestException) as exc:
            if isinstance(exc, NetSuiteRateLimitError):
                raise
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


def restlet_post_sync(
    script: str,
    deploy: str,
    payload: Dict[str, Any],
    *,
    timeout: int = 120,
) -> Dict[str, Any]:
    """
    Perform a synchronous signed POST to a NetSuite RESTlet.
    Returns parsed JSON (may include error details on parse failure).
    """
    url = f"{settings.NETSUITE_BASE_URL.rstrip('/')}/app/site/hosting/restlet.nl"
    params: Dict[str, str] = {"script": script, "deploy": str(deploy)}
    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
    }

    global _last_restlet_finished_at

    with _restlet_mutex:
        gap = RESTLET_MIN_GAP_SEC - (time.time() - _last_restlet_finished_at)
        if gap > 0:
            logger.debug(
                "NetSuite RESTlet throttle sleep %.2fs before POST script=%s",
                gap,
                script,
            )
            time.sleep(gap)

        logger.info(
            "NetSuite RESTlet POST start script=%s deploy=%s keys=%s",
            script,
            deploy,
            list(payload.keys()),
        )
        try:
            resp = requests.post(
                url,
                auth=_oauth1(),
                params=params,
                json=payload,
                headers=headers,
                timeout=timeout,
            )
            try:
                body = resp.json()
            except ValueError:
                logger.error(
                    "NetSuite RESTlet POST invalid JSON script=%s status=%s text=%s",
                    script,
                    resp.status_code,
                    resp.text[:500],
                )
                body = {
                    "status": "error",
                    "message": "Invalid JSON response from NetSuite",
                }

            if _is_rate_limited(resp.status_code, body):
                msg = _netsuite_error_code(body) or "SSS_REQUEST_LIMIT_EXCEEDED"
                logger.warning(
                    "NetSuite RESTlet POST rate limited script=%s deploy=%s code=%s",
                    script,
                    deploy,
                    msg,
                )
                raise NetSuiteRateLimitError(
                    f"NetSuite request limit exceeded ({msg})",
                    response=resp,
                )

            if not resp.ok:
                logger.warning(
                    "NetSuite RESTlet POST HTTP %s script=%s deploy=%s body=%s",
                    resp.status_code,
                    script,
                    deploy,
                    str(body)[:300],
                )
                if isinstance(body, dict):
                    body.setdefault("status", "error")
                    body.setdefault(
                        "message",
                        body.get("message") or f"NetSuite HTTP {resp.status_code}",
                    )
                    return body
                resp.raise_for_status()

            logger.info(
                "NetSuite RESTlet POST success script=%s deploy=%s status=%s",
                script,
                deploy,
                resp.status_code,
            )
            return body if isinstance(body, dict) else {"_raw": body}
        except requests.Timeout:
            logger.error("NetSuite RESTlet POST timeout script=%s deploy=%s", script, deploy)
            raise
        except requests.RequestException as exc:
            logger.error(
                "NetSuite RESTlet POST failure script=%s deploy=%s: %s",
                script,
                deploy,
                exc,
            )
            raise
        finally:
            _last_restlet_finished_at = time.time()


def restlet_post_sync_with_retry(
    script: str,
    deploy: str,
    payload: Dict[str, Any],
    *,
    timeout: int = 120,
    max_retries: int = 3,
) -> Dict[str, Any]:
    """POST with backoff; uses longer waits when NetSuite returns governance rate limits."""
    last_exc: Optional[BaseException] = None
    last_body: Optional[Dict[str, Any]] = None
    for attempt in range(max_retries):
        try:
            body = restlet_post_sync(script, deploy, payload, timeout=timeout)
            last_body = body if isinstance(body, dict) else None
            if isinstance(body, dict) and _is_rate_limited(400, body):
                raise NetSuiteRateLimitError("NetSuite request limit exceeded in POST body")
            return body
        except NetSuiteRateLimitError as exc:
            last_exc = exc
            wait_s = 25.0 + 20.0 * attempt
            logger.warning(
                "NetSuite POST rate limit — retry in %.0fs (attempt %s/%s) script=%s deploy=%s",
                wait_s,
                attempt + 1,
                max_retries,
                script,
                deploy,
            )
            if attempt < max_retries - 1:
                time.sleep(wait_s)
        except (requests.Timeout, requests.RequestException) as exc:
            if isinstance(exc, NetSuiteRateLimitError):
                raise
            last_exc = exc
            wait_s = min(8.0, 2.0**attempt)
            logger.warning(
                "NetSuite RESTlet POST retry in %.1fs (attempt %s/%s) script=%s deploy=%s: %s",
                wait_s,
                attempt + 1,
                max_retries,
                script,
                deploy,
                exc,
            )
            if attempt < max_retries - 1:
                time.sleep(wait_s)
    if last_body is not None:
        return last_body
    assert last_exc is not None
    raise last_exc
