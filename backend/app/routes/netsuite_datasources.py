from __future__ import annotations

from typing import Any, Dict, List

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.database import get_database
from app.schemas.netsuite_datasource import (
    NetSuiteDatasourceCreate,
    NetSuiteDatasourceRegister,
    NetSuiteDatasourceResponse,
    NetSuiteDatasourceUpdate,
)
from app.services import netsuite_datasource_store as store
from app.services.activity import log_activity
from app.services.netsuite_dynamic_service import (
    fetch_dynamic_netsuite_data,
    get_fetch_page,
    get_sync_status,
    invalidate_cache,
    lookup_dynamic,
    search_dynamic,
    test_connection,
)
from app.utils.deps import get_client_admin, get_current_user

router = APIRouter(prefix="/netsuite", tags=["NetSuite Dynamic"])


# ─── Datasource CRUD ─────────────────────────────────────────────────────────


@router.post("/datasources/register", status_code=status.HTTP_200_OK)
async def register_datasource_script(
    payload: NetSuiteDatasourceRegister,
    current_user: dict = Depends(get_client_admin),
) -> Dict[str, Any]:
    """Save script to vault (deploy=1, OAuth from .env). Upserts by field/key."""
    db = get_database()
    result = await store.register_datasource_from_script(
        db, payload, user_id=current_user.get("id", "")
    )
    test = await test_connection(result.key, db=db)
    if test.get("suggestedLabelKey") and test.get("responseCount", 0) > 0:
        await db.netsuite_datasources.update_one(
            {"key": result.key},
            {
                "$set": {
                    "labelKey": test["suggestedLabelKey"],
                    "valueKey": test["suggestedValueKey"],
                }
            },
        )
        invalidate_cache(result.key)
        refreshed = await store.get_datasource_response_by_key(db, result.key)
        if refreshed:
            result = refreshed
        await fetch_dynamic_netsuite_data(result.key, force_refresh=True, db=db)
    await log_activity(
        user_id=current_user["id"],
        action="UPDATE_DATASOURCE" if payload.key or payload.fieldId else "CREATE_DATASOURCE",
        role=current_user.get("role"),
        entity_id=result.id,
        entity_type="netsuite_datasource",
        metadata={"key": result.key, "scriptId": result.scriptId, "register": True},
    )
    return {
        "datasource": result.model_dump(mode="json"),
        "test": test,
    }


@router.post("/datasources", status_code=status.HTTP_201_CREATED)
async def create_datasource(
    payload: NetSuiteDatasourceCreate,
    current_user: dict = Depends(get_client_admin),
) -> NetSuiteDatasourceResponse:
    db = get_database()
    result = await store.create_datasource(
        db, payload, user_id=current_user.get("id", "")
    )
    await log_activity(
        user_id=current_user["id"],
        action="CREATE_DATASOURCE",
        role=current_user.get("role"),
        entity_id=result.id,
        entity_type="netsuite_datasource",
        metadata={"key": result.key, "name": result.name},
    )
    return result


@router.get("/datasources", status_code=status.HTTP_200_OK)
async def list_datasources(
    active_only: bool = Query(False),
    current_user: dict = Depends(get_current_user),
) -> List[NetSuiteDatasourceResponse]:
    del current_user
    db = get_database()
    return await store.list_datasources(db, active_only=active_only)


@router.put("/datasources/{datasource_id}", status_code=status.HTTP_200_OK)
async def update_datasource(
    datasource_id: str,
    payload: NetSuiteDatasourceUpdate,
    current_user: dict = Depends(get_client_admin),
) -> NetSuiteDatasourceResponse:
    db = get_database()
    result = await store.update_datasource(db, datasource_id, payload)
    invalidate_cache(result.key)
    await log_activity(
        user_id=current_user["id"],
        action="UPDATE_DATASOURCE",
        role=current_user.get("role"),
        entity_id=result.id,
        entity_type="netsuite_datasource",
        metadata={"key": result.key},
    )
    return result


@router.delete("/datasources/{datasource_id}", status_code=status.HTTP_200_OK)
async def delete_datasource(
    datasource_id: str,
    current_user: dict = Depends(get_client_admin),
) -> Dict[str, bool]:
    db = get_database()
    doc = await store.get_datasource_by_id(db, datasource_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Datasource not found")
    key = doc.get("key", "")
    await store.delete_datasource(db, datasource_id)
    invalidate_cache(key)
    return {"success": True}


# ─── Universal fetch / search / lookup ───────────────────────────────────────


@router.get("/fetch/{datasource_key}", status_code=status.HTTP_200_OK)
async def fetch_datasource(
    datasource_key: str,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    search: str | None = Query(None, max_length=200),
    refresh: bool = Query(False),
    current_user: dict = Depends(get_current_user),
) -> Dict[str, Any]:
    db = get_database()
    result = await get_fetch_page(
        datasource_key,
        page=page,
        limit=limit,
        search=search,
        force_refresh=refresh,
        db=db,
    )
    await log_activity(
        user_id=current_user["id"],
        action="FETCH_DYNAMIC_DATASOURCE",
        role=current_user.get("role"),
        entity_id=datasource_key,
        entity_type="netsuite_datasource",
        metadata={"count": result.get("count", 0), "page": page},
    )
    return result


@router.get("/search/{datasource_key}", status_code=status.HTTP_200_OK)
async def search_datasource(
    datasource_key: str,
    query: str = Query("", max_length=200),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    current_user: dict = Depends(get_current_user),
) -> Dict[str, Any]:
    del current_user
    db = get_database()
    return await search_dynamic(
        datasource_key, query=query, page=page, limit=limit, db=db
    )


@router.get("/lookup/{datasource_key}/{internal_id}", status_code=status.HTTP_200_OK)
async def lookup_datasource_record(
    datasource_key: str,
    internal_id: str,
    current_user: dict = Depends(get_current_user),
) -> Dict[str, Any]:
    del current_user
    db = get_database()
    doc = await lookup_dynamic(datasource_key, internal_id, db=db)
    if not doc:
        raise HTTPException(
            status_code=404,
            detail=f"Record not found for datasource '{datasource_key}'",
        )
    return doc


# ─── Admin utilities ─────────────────────────────────────────────────────────


@router.post("/datasources/{datasource_id}/test", status_code=status.HTTP_200_OK)
async def test_datasource_connection(
    datasource_id: str,
    current_user: dict = Depends(get_client_admin),
) -> Dict[str, Any]:
    del current_user
    db = get_database()
    doc = await store.get_datasource_by_id(db, datasource_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Datasource not found")
    return await test_connection(str(doc["key"]), db=db)


@router.get("/datasources/{datasource_key}/sync-status", status_code=status.HTTP_200_OK)
async def datasource_sync_status(
    datasource_key: str,
    current_user: dict = Depends(get_current_user),
) -> Dict[str, Any]:
    del current_user
    return get_sync_status(datasource_key)


@router.post("/datasources/{datasource_key}/refresh-cache", status_code=status.HTTP_200_OK)
async def refresh_datasource_cache(
    datasource_key: str,
    current_user: dict = Depends(get_client_admin),
) -> Dict[str, Any]:
    del current_user
    invalidate_cache(datasource_key)
    rows = await fetch_dynamic_netsuite_data(datasource_key, force_refresh=True)
    return {
        "success": True,
        "fetched": len(rows),
        "datasourceKey": datasource_key,
    }
