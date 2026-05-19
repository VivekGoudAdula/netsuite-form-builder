from __future__ import annotations

import re
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from bson import ObjectId
from fastapi import HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.schemas.netsuite_datasource import (
    NetSuiteDatasourceCreate,
    NetSuiteDatasourceRegister,
    NetSuiteDatasourceResponse,
    NetSuiteDatasourceUpdate,
)

DEFAULT_DEPLOY_ID = "1"

COLLECTION = "netsuite_datasources"
_KEY_PATTERN = re.compile(r"^[a-z][a-z0-9_-]*$")


def _doc_to_response(doc: Dict[str, Any]) -> NetSuiteDatasourceResponse:
    return NetSuiteDatasourceResponse(
        id=str(doc["_id"]),
        name=doc["name"],
        key=doc["key"],
        type=doc.get("type", "netsuite_restlet"),
        scriptId=doc["scriptId"],
        deployId=doc["deployId"],
        method=doc.get("method", "GET"),
        labelKey=doc["labelKey"],
        valueKey=doc["valueKey"],
        responseDataPath=doc.get("responseDataPath", "data"),
        searchFields=list(doc.get("searchFields") or []),
        authType=doc.get("authType", "oauth1"),
        isActive=bool(doc.get("isActive", True)),
        createdBy=doc.get("createdBy", ""),
        createdAt=doc.get("createdAt", datetime.now(timezone.utc)),
        updatedAt=doc.get("updatedAt", datetime.now(timezone.utc)),
    )


async def list_datasources(
    db: AsyncIOMotorDatabase,
    *,
    active_only: bool = False,
) -> List[NetSuiteDatasourceResponse]:
    query: Dict[str, Any] = {}
    if active_only:
        query["isActive"] = True
    cursor = db[COLLECTION].find(query).sort("name", 1)
    docs = await cursor.to_list(length=500)
    return [_doc_to_response(d) for d in docs]


async def get_datasource_by_key(
    db: AsyncIOMotorDatabase, key: str
) -> Optional[Dict[str, Any]]:
    k = key.strip().lower()
    return await db[COLLECTION].find_one({"key": k, "isActive": True})


async def get_datasource_response_by_key(
    db: AsyncIOMotorDatabase, key: str
) -> Optional[NetSuiteDatasourceResponse]:
    doc = await db[COLLECTION].find_one({"key": key.strip().lower()})
    return _doc_to_response(doc) if doc else None


async def get_datasource_by_id(
    db: AsyncIOMotorDatabase, datasource_id: str
) -> Optional[Dict[str, Any]]:
    try:
        oid = ObjectId(datasource_id)
    except Exception:
        return None
    return await db[COLLECTION].find_one({"_id": oid})


def _key_from_script(script_id: str) -> str:
    """e.g. customscript_rg_restapi_tax_nature_fetch → tax-nature"""
    s = script_id.strip().lower()
    for prefix in ("customscript_", "customscript"):
        if s.startswith(prefix):
            s = s[len(prefix) :]
            break
    for suffix in ("_fetch", "_get", "_restapi"):
        if s.endswith(suffix):
            s = s[: -len(suffix)]
            break
    s = s.replace("_restapi_", "_").replace("restapi_", "")
    s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")
    return (s[:64] if s else "connector") or "connector"


def _resolve_register_key(payload: NetSuiteDatasourceRegister) -> str:
    raw = (payload.key or payload.fieldId or "").strip().lower()
    if raw:
        k = re.sub(r"[^a-z0-9_-]+", "-", raw).strip("-")
        if k and _KEY_PATTERN.match(k):
            return k[:64]
    return _key_from_script(payload.scriptId)


async def register_datasource_from_script(
    db: AsyncIOMotorDatabase,
    payload: NetSuiteDatasourceRegister,
    *,
    user_id: str,
) -> NetSuiteDatasourceResponse:
    """Upsert vault entry by key — deploy always 1, credentials only in .env."""
    script_id = payload.scriptId.strip()
    if not script_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="scriptId is required",
        )

    key = _resolve_register_key(payload)
    name = (payload.name or "").strip() or script_id.replace("customscript_", "").replace("_", " ").title()

    now = datetime.now(timezone.utc)
    set_fields: Dict[str, Any] = {
        "name": name,
        "key": key,
        "type": "netsuite_restlet",
        "scriptId": script_id,
        "deployId": DEFAULT_DEPLOY_ID,
        "method": "GET",
        "labelKey": (payload.labelKey or "displayName").strip() or "displayName",
        "valueKey": (payload.valueKey or "internalId").strip() or "internalId",
        "responseDataPath": (payload.responseDataPath or "data").strip() or "data",
        "searchFields": list(payload.searchFields or []),
        "authType": "oauth1",
        "isActive": True,
        "updatedAt": now,
    }
    if payload.fieldId:
        set_fields["fieldId"] = payload.fieldId.strip()

    existing = await db[COLLECTION].find_one({"key": key})
    if existing:
        await db[COLLECTION].update_one({"_id": existing["_id"]}, {"$set": set_fields})
        doc = await db[COLLECTION].find_one({"_id": existing["_id"]})
    else:
        doc = {
            **set_fields,
            "createdBy": user_id,
            "createdAt": now,
        }
        result = await db[COLLECTION].insert_one(doc)
        doc["_id"] = result.inserted_id

    from app.services.netsuite_dynamic_service import invalidate_cache

    invalidate_cache(key)
    return _doc_to_response(doc)


async def create_datasource(
    db: AsyncIOMotorDatabase,
    payload: NetSuiteDatasourceCreate,
    *,
    user_id: str,
) -> NetSuiteDatasourceResponse:
    key = payload.key.strip().lower()
    if not _KEY_PATTERN.match(key):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid datasource key format",
        )
    existing = await db[COLLECTION].find_one({"key": key})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Datasource key '{key}' already exists",
        )

    now = datetime.now(timezone.utc)
    doc = {
        **payload.model_dump(),
        "key": key,
        "deployId": payload.deployId.strip() or DEFAULT_DEPLOY_ID,
        "createdBy": user_id,
        "createdAt": now,
        "updatedAt": now,
    }
    result = await db[COLLECTION].insert_one(doc)
    doc["_id"] = result.inserted_id
    return _doc_to_response(doc)


async def update_datasource(
    db: AsyncIOMotorDatabase,
    datasource_id: str,
    payload: NetSuiteDatasourceUpdate,
) -> NetSuiteDatasourceResponse:
    doc = await get_datasource_by_id(db, datasource_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Datasource not found")

    updates = {k: v for k, v in payload.model_dump(exclude_unset=True).items()}
    if not updates:
        return _doc_to_response(doc)

    updates["updatedAt"] = datetime.now(timezone.utc)
    await db[COLLECTION].update_one({"_id": doc["_id"]}, {"$set": updates})
    updated = await db[COLLECTION].find_one({"_id": doc["_id"]})
    return _doc_to_response(updated)


async def delete_datasource(db: AsyncIOMotorDatabase, datasource_id: str) -> None:
    doc = await get_datasource_by_id(db, datasource_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Datasource not found")
    await db[COLLECTION].delete_one({"_id": doc["_id"]})
