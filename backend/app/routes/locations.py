from __future__ import annotations

from typing import Any, Dict

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.services import location_service
from app.utils.deps import get_client_admin, get_current_user

router = APIRouter(prefix="/locations", tags=["Locations"])


@router.post("/sync", status_code=status.HTTP_200_OK)
async def refresh_locations_cache(
    current_user: dict = Depends(get_client_admin),
) -> Dict[str, Any]:
    """
    Refresh the in-memory NetSuite location cache (no MongoDB persistence).
    Kept as /sync for backward compatibility with the admin UI.
    """
    del current_user
    return await location_service.refresh_locations_from_netsuite()


@router.get("/search", status_code=status.HTTP_200_OK)
async def search_locations_endpoint(
    q: str = Query(..., min_length=1, max_length=200),
    limit: int = Query(50, ge=1, le=100),
    subsidiary: str | None = Query(None, max_length=200),
    current_user: dict = Depends(get_current_user),
) -> Dict[str, Any]:
    del current_user
    return await location_service.search_locations(
        None,
        q=q,
        limit=limit,
        subsidiary=subsidiary,
    )


@router.get("/lookup/by-internal/{internal_id}", status_code=status.HTTP_200_OK)
async def lookup_location_by_internal_id(
    internal_id: str,
    current_user: dict = Depends(get_current_user),
) -> Dict[str, Any]:
    del current_user
    doc = await location_service.get_location_by_internal_id(None, internal_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Location not found in NetSuite")
    return doc


@router.get("", status_code=status.HTTP_200_OK)
@router.get("/", status_code=status.HTTP_200_OK)
async def list_locations(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    search: str | None = Query(None, max_length=200),
    subsidiary: str | None = Query(None, max_length=200),
    current_user: dict = Depends(get_current_user),
) -> Dict[str, Any]:
    del current_user
    return await location_service.get_locations_page(
        None,
        page=page,
        limit=limit,
        search=search,
        subsidiary=subsidiary,
    )


@router.get("/{location_id}", status_code=status.HTTP_200_OK)
async def get_location(
    location_id: str,
    current_user: dict = Depends(get_current_user),
) -> Dict[str, Any]:
    del current_user
    doc = await location_service.get_location_by_id(None, location_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Location not found in NetSuite")
    return doc
