from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List

from .netsuite_service import send_to_netsuite

# Maps submission body / line keys → NetSuite-oriented payload keys (extend when API spec arrives).
_BODY_FIELD_MAP = {
    "entity": "vendor",
    "account": "account",
    "usertotal": "amount",
    "currency": "currency",
    "exchangerate": "exchangeRate",
    "terms": "terms",
    "duedate": "dueDate",
    "trandate": "tranDate",
    "memo": "memo",
    "subsidiary": "subsidiary",
    "tranid": "invoiceNumber",
    "customform": "customForm",
    "approvalstatus": "approvalStatus",
    "class": "class",
    "location": "location",
    "custbody_in_gst_pos": "placeOfSupply",
    "postingperiod": "postingPeriod",
}

_ITEM_LINE_MAP = {
    "item": "item",
    "description": "description",
    "quantity": "quantity",
    "rate": "rate",
    "amount": "amount",
    "department": "department",
    "class": "class",
    "location": "location",
}

_EXPENSE_LINE_MAP = {
    "account": "account",
    "amount": "amount",
    "department": "department",
    "class": "class",
    "location": "location",
    "memo": "memo",
    "isbillable": "billable",
    "customer": "customer",
}


def _map_dict(source: Dict[str, Any], mapping: Dict[str, str]) -> Dict[str, Any]:
    out: Dict[str, Any] = {}
    for src_key, dest_key in mapping.items():
        if src_key in source and source[src_key] is not None and source[src_key] != "":
            out[dest_key] = source[src_key]
    return out


def _map_lines(lines: List[Any], mapping: Dict[str, str]) -> List[Dict[str, Any]]:
    if not isinstance(lines, list):
        return []
    mapped: List[Dict[str, Any]] = []
    for row in lines:
        if isinstance(row, dict) and row:
            line = _map_dict(row, mapping)
            if line:
                mapped.append(line)
    return mapped


def build_vendor_bill_payload(submission: Dict[str, Any]) -> Dict[str, Any]:
    """
    Build a configurable Vendor Bill payload from a workflow submission.
    Mapping is isolated so NetSuite REST/SOAP changes do not touch the workflow engine.
    """
    body_fields = submission.get("bodyFields") or {}
    if not isinstance(body_fields, dict):
        body_fields = {}

    values = submission.get("values") or {}
    line_items = submission.get("lineItems")
    if not isinstance(line_items, list):
        line_items = values.get("lineItems") if isinstance(values.get("lineItems"), list) else []

    expense_lines = submission.get("expenseLines")
    if not isinstance(expense_lines, list):
        expense_lines = values.get("expenseLines") if isinstance(values.get("expenseLines"), list) else []

    payload = _map_dict(body_fields, _BODY_FIELD_MAP)
    payload["items"] = _map_lines(line_items, _ITEM_LINE_MAP)
    payload["expenses"] = _map_lines(expense_lines, _EXPENSE_LINE_MAP)
    payload["transactionType"] = "vendor_bill"
    payload["submissionId"] = str(submission.get("_id") or submission.get("id") or "")
    return payload


def send_vendor_bill_to_netsuite(submission: Dict[str, Any]) -> Dict[str, Any]:
    payload = build_vendor_bill_payload(submission)
    result = send_to_netsuite(payload)
    if isinstance(result, dict):
        result.setdefault("sentAt", datetime.utcnow().isoformat())
        result.setdefault("payloadPreview", payload)
    return result
