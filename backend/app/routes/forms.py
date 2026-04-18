from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from ..schemas.form import FormCreate, FormUpdate, FormResponse, CloneFormRequest
from ..services.form_service import FormService
from ..utils.deps import get_current_user, get_admin_user

router = APIRouter(prefix="/forms", tags=["Forms"])

@router.post("", response_model=FormResponse, status_code=201)
async def create_form(
    form_data: FormCreate, 
    current_admin: dict = Depends(get_admin_user)
):
    """Initialize a new form configuration for a company (Admin only)."""
    return await FormService.create_form(
        form_data, 
        current_admin["email"], 
        str(current_admin.get("_id", "admin"))
    )

@router.get("", response_model=List[FormResponse])
async def get_forms(
    companyId: Optional[str] = Query(None),
    transactionType: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user)
):
    """Retrieve all forms with optional client or transaction type filtering."""
    # Note: Logic for customer scoping can be added in service layer if needed
    return await FormService.get_forms(companyId, transactionType)

@router.get("/{formId}", response_model=FormResponse)
async def get_form_by_id(formId: str, current_user: dict = Depends(get_current_user)):
    """Fetch a single form configuration by its unique ID."""
    return await FormService.get_form_by_id(formId)

@router.put("/{formId}", response_model=FormResponse)
async def update_form(
    formId: str, 
    form_updates: FormUpdate, 
    current_admin: dict = Depends(get_admin_user)
):
    """Modify an existing form structure or metadata (Admin only)."""
    return await FormService.update_form(
        formId, 
        form_updates, 
        str(current_admin.get("_id", "admin"))
    )

@router.delete("/{formId}")
async def delete_form(formId: str, current_admin: dict = Depends(get_admin_user)):
    """Permanently remove a form configuration (Admin only)."""
    return await FormService.delete_form(formId, str(current_admin.get("_id", "admin")))

@router.post("/{formId}/clone", response_model=FormResponse)
async def clone_form(
    formId: str, 
    clone_data: CloneFormRequest, 
    current_admin: dict = Depends(get_admin_user)
):
    """Clone an existing form to the same or a different company (Admin only)."""
    return await FormService.clone_form(
        formId, 
        clone_data, 
        current_admin["email"], 
        str(current_admin.get("_id", "admin"))
    )
