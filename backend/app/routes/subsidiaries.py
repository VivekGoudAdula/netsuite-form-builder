from typing import Any, Dict, List

from fastapi import APIRouter, Depends, Query, status

from app.services import subsidiary_service
from app.utils.deps import get_client_admin, get_current_user

router = APIRouter(prefix="/subsidiaries", tags=["Subsidiaries"])


@router.post("/sync", status_code=status.HTTP_200_OK)
async def refresh_subsidiaries_cache(
    current_user: dict = Depends(get_client_admin),
) -> Dict[str, Any]:
    del current_user
    return await subsidiary_service.refresh_subsidiaries_from_netsuite()


@router.get("", response_model=List[Dict[str, Any]])
@router.get("/", response_model=List[Dict[str, Any]])
async def list_subsidiaries(
    search: str | None = Query(None, max_length=200),
    current_user: dict = Depends(get_current_user),
) -> List[Dict[str, Any]]:
    del current_user
    return await subsidiary_service.get_all_subsidiaries(search=search)
