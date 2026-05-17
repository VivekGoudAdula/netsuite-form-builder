from __future__ import annotations

from typing import Any, Dict

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.services import hsn_service
from app.utils.deps import get_client_admin, get_current_user

router = APIRouter(prefix="/hsn-codes", tags=["HSN Codes"])


@router.post("/sync", status_code=status.HTTP_200_OK)
async def refresh_hsn_cache(
    current_user: dict = Depends(get_client_admin),
) -> Dict[str, Any]:
    del current_user
    return await hsn_service.refresh_hsn_from_netsuite()


@router.post("/test-sync", status_code=status.HTTP_200_OK)
async def test_refresh_hsn(
    current_user: dict = Depends(get_client_admin),
) -> Dict[str, Any]:
    del current_user
    return await hsn_service.refresh_hsn_from_netsuite()


@router.get("/search", status_code=status.HTTP_200_OK)
async def search_hsn_codes_endpoint(
    q: str = Query("", max_length=200),
    limit: int = Query(50, ge=1, le=100),
    current_user: dict = Depends(get_current_user),
) -> Dict[str, Any]:
    del current_user
    return await hsn_service.search_hsn_codes(q=q, limit=limit)


@router.get("/lookup/by-internal/{internal_id}", status_code=status.HTTP_200_OK)
async def lookup_hsn_by_internal_id(
    internal_id: str,
    current_user: dict = Depends(get_current_user),
) -> Dict[str, Any]:
    del current_user
    doc = await hsn_service.get_hsn_by_internal_id(internal_id)
    if not doc:
        raise HTTPException(status_code=404, detail="HSN code not found in NetSuite")
    return doc


@router.get("", status_code=status.HTTP_200_OK)
@router.get("/", status_code=status.HTTP_200_OK)
async def list_hsn_codes(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    search: str | None = Query(None, max_length=200),
    current_user: dict = Depends(get_current_user),
) -> Dict[str, Any]:
    del current_user
    return await hsn_service.get_hsn_codes_page(
        page=page,
        limit=limit,
        search=search,
    )


@router.get("/{hsn_id}", status_code=status.HTTP_200_OK)
async def get_hsn_code(
    hsn_id: str,
    current_user: dict = Depends(get_current_user),
) -> Dict[str, Any]:
    del current_user
    doc = await hsn_service.get_hsn_by_id(hsn_id)
    if not doc:
        raise HTTPException(status_code=404, detail="HSN code not found in NetSuite")
    return doc
