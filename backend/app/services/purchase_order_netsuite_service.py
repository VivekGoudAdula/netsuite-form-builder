from __future__ import annotations

import logging
from datetime import datetime
from typing import Any, Dict, List, Optional

from app.config import settings
from app.services.netsuite_record_resolver import resolve_record_ref_value
from app.services.netsuite_restlet import restlet_post_sync_with_retry

logger = logging.getLogger(__name__)

_LINE_ITEM_KEYS = (
    "item",
    "quantity",
    "rate",
    "amount",
    "location",
    "department",
    "class",
    "description",
    "taxcode",
    "hsnsac",
)

_VENDOR_KEYS = ("entity", "vendor", "vendorId")
_PO_NUMBER_KEYS = ("tranid", "custbody_rg_po_number", "otherrefnum")


def _first_present(source: Dict[str, Any], keys: tuple[str, ...]) -> Any:
    for key in keys:
        value = source.get(key)
        if value is not None and value != "":
            return value
    return None


def _map_line_item(line: Dict[str, Any]) -> Dict[str, Any]:
    mapped: Dict[str, Any] = {}
    for key in _LINE_ITEM_KEYS:
        if key == "hsnsac":
            value = _first_present(
                line,
                ("hsnsac", "hsn_sac", "custcol_hsnsac", "hsncode", "hsn_code"),
            )
        else:
            value = line.get(key)
        if value is not None and value != "":
            mapped[key] = value
    return mapped


async def _resolve_field(
    kind: str,
    value: Any,
    display_values: Dict[str, str],
    field_key: str,
) -> Any:
    resolved, label = await resolve_record_ref_value(kind, value)
    if label:
        display_values[field_key] = label
    return resolved or value


async def build_purchase_order_payload(submission: Dict[str, Any]) -> Dict[str, Any]:
    """
    Map an approved workflow submission into the NetSuite Purchase Order RESTlet payload.
    """
    body_fields = submission.get("bodyFields") or {}
    if not isinstance(body_fields, dict):
        body_fields = {}

    values = submission.get("values") or {}
    if not isinstance(values, dict):
        values = {}

    merged_body = {**values, **body_fields}

    line_items = submission.get("lineItems")
    if not isinstance(line_items, list):
        line_items = values.get("lineItems") if isinstance(values.get("lineItems"), list) else []

    display_values: Dict[str, str] = dict(submission.get("displayValues") or {})

    vendor_raw = _first_present(merged_body, _VENDOR_KEYS)
    subsidiary_raw = merged_body.get("subsidiary")
    location_raw = merged_body.get("location")
    department_raw = merged_body.get("department")
    class_raw = merged_body.get("class")

    vendor_id = await _resolve_field("vendor", vendor_raw, display_values, "vendorId")
    subsidiary_id = await _resolve_field(
        "subsidiary", subsidiary_raw, display_values, "subsidiary"
    )
    location_id = await _resolve_field("location", location_raw, display_values, "location")
    department_id = await _resolve_field(
        "department", department_raw, display_values, "department"
    )
    class_id = await _resolve_field("class", class_raw, display_values, "class")

    items: List[Dict[str, Any]] = []
    for index, row in enumerate(line_items):
        if not isinstance(row, dict) or not row:
            continue
        line = _map_line_item(row)
        if not line:
            continue
        if line.get("item"):
            line["item"] = await _resolve_field(
                "item", line["item"], display_values, f"items.{index}.item"
            )
        if line.get("location"):
            line["location"] = await _resolve_field(
                "location", line["location"], display_values, f"items.{index}.location"
            )
        if line.get("department"):
            line["department"] = await _resolve_field(
                "department", line["department"], display_values, f"items.{index}.department"
            )
        if line.get("class"):
            line["class"] = await _resolve_field(
                "class", line["class"], display_values, f"items.{index}.class"
            )
        if line.get("taxcode"):
            line["taxcode"] = await _resolve_field(
                "taxcode", line["taxcode"], display_values, f"items.{index}.taxcode"
            )
        items.append(line)

    submission_id = str(submission.get("_id") or submission.get("id") or "")
    submission["displayValues"] = display_values

    payload: Dict[str, Any] = {
        "vendorId": vendor_id,
        "subsidiary": subsidiary_id,
        "location": location_id,
        "department": department_id,
        "class": class_id,
        "memo": merged_body.get("memo"),
        "trandate": merged_body.get("trandate"),
        "tranid": _first_present(merged_body, _PO_NUMBER_KEYS),
        "submissionId": submission_id,
        "items": items,
    }

    return {
        k: v
        for k, v in payload.items()
        if (v is not None and v != "") or k == "items"
    }


def create_purchase_order_in_netsuite(
    payload: Dict[str, Any],
    *,
    max_retries: int = 3,
) -> Dict[str, Any]:
    """
    POST a Purchase Order payload to the NetSuite PO RESTlet using OAuth 1.0 credentials.
    Retries transient and governance failures with exponential backoff.
    """
    logger.info(
        "NetSuite PO create: start submissionId=%s vendorId=%s lineCount=%s",
        payload.get("submissionId"),
        payload.get("vendorId"),
        len(payload.get("items") or []),
    )

    try:
        data = restlet_post_sync_with_retry(
            settings.NETSUITE_PO_SCRIPT,
            settings.NETSUITE_PO_DEPLOY,
            payload,
            timeout=120,
            max_retries=max_retries,
        )
        if isinstance(data, dict):
            data.setdefault("sentAt", datetime.utcnow().isoformat())
            logger.info(
                "NetSuite PO create: response submissionId=%s status=%s",
                payload.get("submissionId"),
                data.get("status") or data.get("success"),
            )
            return data
        return {"status": "error", "message": "Unexpected NetSuite response type"}
    except Exception as exc:
        logger.exception(
            "NetSuite PO create failed submissionId=%s: %s",
            payload.get("submissionId"),
            exc,
        )
        return {"status": "error", "message": str(exc)}


def is_netsuite_po_success(response: Dict[str, Any]) -> bool:
    if not isinstance(response, dict):
        return False
    status = str(response.get("status") or "").lower()
    if status in {"success", "ok"}:
        return True
    if response.get("success") is True:
        return True
    if response.get("poId") or response.get("internalId") or response.get("id"):
        return True
    return False


def extract_netsuite_error_message(response: Dict[str, Any]) -> str:
    if not isinstance(response, dict):
        return "Unknown NetSuite error"
    for key in ("message", "errorMessage", "error"):
        value = response.get(key)
        if isinstance(value, str) and value.strip():
            return value.strip()
        if isinstance(value, dict):
            nested = value.get("message") or value.get("code")
            if nested:
                return str(nested)
    return "NetSuite Purchase Order sync failed"


def extract_po_id(response: Dict[str, Any]) -> Optional[str]:
    for key in ("poId", "internalId", "id", "netsuiteId"):
        value = response.get(key)
        if value is not None and str(value).strip():
            return str(value)
    data = response.get("data")
    if isinstance(data, dict):
        for key in ("poId", "internalId", "id"):
            value = data.get(key)
            if value is not None and str(value).strip():
                return str(value)
    return None


def extract_document_number(response: Dict[str, Any]) -> Optional[str]:
    for key in ("documentNumber", "tranid", "document_number", "poNumber"):
        value = response.get(key)
        if value is not None and str(value).strip():
            return str(value)
    data = response.get("data")
    if isinstance(data, dict):
        for key in ("documentNumber", "tranid", "document_number", "poNumber"):
            value = data.get(key)
            if value is not None and str(value).strip():
                return str(value)
    return None


def build_purchase_order_sync_update(
    response: Dict[str, Any],
    submission_id: str,
) -> Dict[str, Any]:
    """
    Build the MongoDB fields to persist after a PO NetSuite sync attempt.
    Stores only: netsuiteResponse, poId, documentNumber, submissionId, status, and error on failure.
    """
    is_success = is_netsuite_po_success(response)
    update: Dict[str, Any] = {
        "submissionId": submission_id,
        "netsuiteResponse": response,
        "updatedAt": datetime.utcnow(),
    }

    if is_success:
        update["status"] = "SYNCED_TO_NETSUITE"
        po_id = extract_po_id(response)
        doc_number = extract_document_number(response)
        if po_id:
            update["poId"] = po_id
        if doc_number:
            update["documentNumber"] = doc_number
        update["netsuiteSyncError"] = None
    else:
        update["status"] = "NETSUITE_SYNC_FAILED"
        update["netsuiteSyncError"] = extract_netsuite_error_message(response)

    return update


async def send_purchase_order_to_netsuite(submission: Dict[str, Any]) -> Dict[str, Any]:
    payload = await build_purchase_order_payload(submission)
    return create_purchase_order_in_netsuite(payload)


def sample_purchase_order_payload() -> Dict[str, Any]:
    """Sample PO payload for the test endpoint."""
    return {
        "vendorId": "1",
        "subsidiary": "1",
        "location": "1",
        "department": "1",
        "class": "1",
        "memo": "Test Purchase Order from API",
        "trandate": datetime.utcnow().strftime("%Y-%m-%d"),
        "tranid": f"TEST-PO-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}",
        "submissionId": "test-submission",
        "items": [
            {
                "item": "1",
                "quantity": 1,
                "rate": 100,
                "amount": 100,
                "location": "1",
                "department": "1",
                "class": "1",
                "description": "Test line item",
                "taxcode": "1",
                "hsnsac": "1234",
            }
        ],
    }
