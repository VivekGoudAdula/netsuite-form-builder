"""
Reusable MongoDB bulk upsert helpers for NetSuite master-data sync jobs.
"""
from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Tuple

from pymongo import UpdateOne
from pymongo.collection import Collection

logger = logging.getLogger(__name__)


async def bulk_upsert_by_internal_id(
    collection: Collection,
    rows: List[Dict[str, Any]],
    *,
    build_set: Dict[str, Any],
    set_on_insert: Dict[str, Any],
    internal_id_key: str = "internalId",
    batch_size: int = 500,
) -> Tuple[int, int]:
    """
    Upsert rows keyed by internalId using unordered bulk_write for throughput.

    Returns (upserted_count, modified_count) summed across batches.
    """
    total_upserted = 0
    total_modified = 0
    now = datetime.now(timezone.utc)

    for i in range(0, len(rows), batch_size):
        batch = rows[i : i + batch_size]
        ops: List[UpdateOne] = []
        for row in batch:
            iid = str(row.get(internal_id_key, "")).strip()
            if not iid:
                continue
            set_doc = {**build_set, "lastSyncedAt": now, "updatedAt": now}
            for k, v in row.items():
                if k != internal_id_key and v is not None:
                    set_doc[k] = v
            set_doc[internal_id_key] = iid
            ops.append(
                UpdateOne(
                    {internal_id_key: iid},
                    {"$set": set_doc, "$setOnInsert": {**set_on_insert, "createdAt": now}},
                    upsert=True,
                )
            )
        if not ops:
            continue
        res = await collection.bulk_write(ops, ordered=False)
        total_upserted += res.upserted_count
        total_modified += res.modified_count
        logger.debug(
            "bulk_upsert batch=%s ops=%s upserted=%s modified=%s",
            i // batch_size,
            len(ops),
            res.upserted_count,
            res.modified_count,
        )

    return total_upserted, total_modified
