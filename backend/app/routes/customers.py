from __future__ import annotations

from typing import Any, Dict

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.database import get_database
from app.services import customer_service
from app.utils.deps import get_client_admin, get_current_user

router = APIRouter(prefix="/customers", tags=["Customers"])


@router.post("/sync", status_code=status.HTTP_200_OK)
async def refresh_customers_cache(
    current_user: dict = Depends(get_client_admin),
) -> Dict[str, Any]:
    del current_user
    rows = await customer_service.fetch_customers_live(force_refresh=True)
    return {
        "success": True,
        "fetched": len(rows),
        "cached": True,
        "source": "netsuite",
    }


@router.get("/live", status_code=status.HTTP_200_OK)
async def customers_live(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    search: str | None = Query(None, max_length=200),
    current_user: dict = Depends(get_current_user),
) -> Dict[str, Any]:
    db = get_database()
    return await customer_service.get_customers_live(
        db,
        user_id=current_user.get("id"),
        search=search,
        page=page,
        limit=limit,
    )


@router.get("/search", status_code=status.HTTP_200_OK)
async def search_customers_endpoint(
    q: str = Query("", max_length=200),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    current_user: dict = Depends(get_current_user),
) -> Dict[str, Any]:
    del current_user
    return await customer_service.search_customers(None, q=q, page=page, limit=limit)


@router.get("/lookup/by-internal/{internal_id}", status_code=status.HTTP_200_OK)
async def lookup_customer_by_internal_id(
    internal_id: str,
    current_user: dict = Depends(get_current_user),
) -> Dict[str, Any]:
    del current_user
    doc = await customer_service.get_customer_by_internal_id(None, internal_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Customer not found in NetSuite")
    return doc


@router.get("", status_code=status.HTTP_200_OK)
@router.get("/", status_code=status.HTTP_200_OK)
async def list_customers(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    search: str | None = Query(None, max_length=200),
    current_user: dict = Depends(get_current_user),
) -> Dict[str, Any]:
    del current_user
    return await customer_service.get_customers_page(
        None,
        page=page,
        limit=limit,
        search=search,
    )


@router.get("/{customer_id}", status_code=status.HTTP_200_OK)
async def get_customer(
    customer_id: str,
    current_user: dict = Depends(get_current_user),
) -> Dict[str, Any]:
    del current_user
    doc = await customer_service.get_customer_by_internal_id(None, customer_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Customer not found in NetSuite")
    return doc
