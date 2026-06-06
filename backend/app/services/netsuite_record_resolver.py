from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional, Tuple

from app.services import (
    class_service,
    department_service,
    hsn_service,
    item_service,
    location_service,
    subsidiary_service,
    vendor_service,
)

logger = logging.getLogger(__name__)


def _looks_like_internal_id(value: Any) -> bool:
    s = str(value or "").strip()
    return bool(s) and s.isdigit()


async def _resolve_from_name_rows(
    value: Any,
    rows: List[Dict[str, str]],
    *,
    id_key: str = "internalId",
    name_keys: Tuple[str, ...] = ("name", "displayName"),
) -> Tuple[str, Optional[str]]:
    raw = str(value or "").strip()
    if not raw:
        return "", None
    if _looks_like_internal_id(raw):
        return raw, None

    lower = raw.lower()
    for row in rows:
        iid = str(row.get(id_key) or "").strip()
        if not iid:
            continue
        if iid == raw:
            return iid, None
        for nk in name_keys:
            name = str(row.get(nk) or "").strip()
            if not name:
                continue
            if lower == name.lower():
                return iid, name
            if lower in name.lower() or name.lower() in lower:
                return iid, name

    return raw, None


async def resolve_record_ref_value(
    field_kind: str,
    value: Any,
) -> Tuple[str, Optional[str]]:
    """
    Coerce a select/master-data value to NetSuite internalId when a label was stored.
    Returns (resolvedValue, displayLabelIfResolvedFromName).
    """
    if value is None or value == "":
        return "", None

    kind = field_kind.lower()
    if kind == "subsidiary":
        return await subsidiary_service.resolve_subsidiary_internal_id(value)

    loaders = {
        "location": location_service._load_locations,
        "department": department_service._load_departments,
        "class": class_service.fetch_classes_live,
        "vendor": vendor_service.fetch_vendors_live,
        "item": item_service.fetch_items_live,
        "hsn": hsn_service._load_hsn,
        "taxcode": hsn_service._load_hsn,
    }
    name_keys = {
        "location": ("name",),
        "department": ("name",),
        "class": ("name",),
        "vendor": ("displayName", "companyName"),
        "item": ("displayName",),
        "hsn": ("name", "hsncode"),
        "taxcode": ("name", "hsncode"),
    }

    loader = loaders.get(kind)
    if not loader:
        raw = str(value).strip()
        return raw, None

    rows = await loader()
    resolved, label = await _resolve_from_name_rows(
        value,
        rows,
        name_keys=name_keys.get(kind, ("name",)),
    )
    if not _looks_like_internal_id(resolved):
        logger.warning(
            "Could not resolve %s value to internalId: %s",
            kind,
            str(value)[:120],
        )
    return resolved, label
