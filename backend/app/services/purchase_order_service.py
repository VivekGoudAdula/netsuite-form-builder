from __future__ import annotations

from typing import Any, Dict, List, Optional

from bson import ObjectId

from ..database import get_database


def _extract_po_number(submission: Dict[str, Any]) -> str:
    values = submission.get("values") or {}
    body = submission.get("bodyFields") or {}
    return str(
        body.get("custbody_rg_po_number")
        or body.get("tranid")
        or body.get("otherrefnum")
        or values.get("custbody_rg_po_number")
        or values.get("tranid")
        or values.get("otherrefnum")
        or ""
    ).strip()


def _normalize_po_item(line: Dict[str, Any]) -> Dict[str, Any]:
    qty = line.get("quantity") or line.get("qty") or 0
    rate = line.get("rate") or 0
    amount = line.get("amount") or 0
    return {
        "item": line.get("item"),
        "description": line.get("description"),
        "quantity": qty,
        "rate": rate,
        "amount": amount,
        "location": line.get("location"),
        "department": line.get("department"),
        "class": line.get("class"),
        "poLineItem": line.get("poLineItem"),
    }


class PurchaseOrderService:
    @staticmethod
    async def search_purchase_orders(
        query: Optional[str] = None,
        company_id: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        db = get_database()
        mongo_query: Dict[str, Any] = {
            "transactionType": "purchase_order",
            "status": {"$in": ["approved", "submitted", "SYNCED_TO_NETSUITE"]},
        }
        if company_id:
            mongo_query["companyId"] = company_id

        rows: List[Dict[str, Any]] = []
        q = (query or "").strip().lower()
        async for sub in db.submissions.find(mongo_query).sort("submittedAt", -1):
            values = sub.get("values") or {}
            po_number = _extract_po_number(sub)
            vendor = values.get("entity")
            date = values.get("trandate")
            candidate = " ".join(
                [
                    po_number,
                    str(vendor or ""),
                    str(sub.get("_id") or ""),
                ]
            ).lower()
            if q and q not in candidate:
                continue
            rows.append(
                {
                    "id": str(sub["_id"]),
                    "poNumber": po_number,
                    "vendor": vendor,
                    "date": date,
                    "internalId": str(sub["_id"]),
                    "displayLabel": f"{po_number or 'PO'} | {vendor or 'Vendor'} | {date or 'Date'}",
                }
            )
            if len(rows) >= 50:
                break
        return rows

    @staticmethod
    async def get_purchase_order(po_id: str, company_id: Optional[str] = None) -> Dict[str, Any]:
        db = get_database()
        query: Dict[str, Any] = {"_id": ObjectId(po_id), "transactionType": "purchase_order"}
        if company_id:
            query["companyId"] = company_id
        sub = await db.submissions.find_one(query)
        if not sub:
            return {}

        values = sub.get("values") or {}
        line_items = values.get("lineItems") or []
        if not isinstance(line_items, list):
            line_items = []

        return {
            "id": str(sub["_id"]),
            "bodyFields": {
                "entity": values.get("entity"),
                "subsidiary": values.get("subsidiary"),
                "currency": values.get("currency"),
                "custbody_rg_po_number": _extract_po_number(sub),
                "custbody_podate": values.get("custbody_podate") or values.get("trandate"),
            },
            "lineItems": [_normalize_po_item(line) for line in line_items if isinstance(line, dict)],
        }

