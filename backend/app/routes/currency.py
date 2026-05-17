from typing import Any, Dict, List

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.services import currency_service
from app.utils.deps import get_client_admin, get_current_user

router = APIRouter(prefix="/currencies", tags=["Currencies"])


@router.post("/sync", status_code=status.HTTP_200_OK)
async def refresh_currencies_cache(
    current_user: dict = Depends(get_client_admin),
) -> Dict[str, Any]:
    del current_user
    return await currency_service.refresh_currencies_from_netsuite()


@router.post("/test-sync", status_code=status.HTTP_200_OK)
async def test_refresh_currencies(
    current_user: dict = Depends(get_client_admin),
) -> Dict[str, Any]:
    del current_user
    return await currency_service.refresh_currencies_from_netsuite()


@router.get("", response_model=List[Dict[str, Any]])
@router.get("/", response_model=List[Dict[str, Any]])
async def list_currencies(
    include_inactive: bool = Query(False),
    search: str | None = Query(None, max_length=200),
    current_user: dict = Depends(get_current_user),
) -> List[Dict[str, Any]]:
    del current_user, include_inactive
    return await currency_service.get_all_currencies(search=search)


@router.get("/{currency_id}", response_model=Dict[str, Any])
async def get_currency(
    currency_id: str,
    current_user: dict = Depends(get_current_user),
) -> Dict[str, Any]:
    del current_user
    doc = await currency_service.get_currency_by_id(currency_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Currency not found in NetSuite")
    return doc
