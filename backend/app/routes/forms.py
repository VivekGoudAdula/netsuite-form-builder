from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from ..schemas.form import FormCreate, FormUpdate, FormResponse, CloneFormRequest, MyFormResponse, AssignUsersRequest, FormSubmissionRequest
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

@router.get("/my", response_model=List[MyFormResponse])
async def get_my_forms(current_user: dict = Depends(get_current_user)):
    """Fetch forms assigned to the current employee/customer."""
    return await FormService.get_forms_for_user(str(current_user.get("_id")))

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

@router.put("/{formId}/assign")
async def assign_users_to_form(
    formId: str,
    request: AssignUsersRequest,
    current_admin: dict = Depends(get_admin_user)
):
    """Assign specific users to a form configuration (Admin only)."""
    return await FormService.assign_users_to_form(
        formId,
        request.userIds,
        str(current_admin.get("_id", "admin"))
    )

@router.get("/{formId}/my", response_model=FormResponse)
async def get_my_form_details(
    formId: str,
    current_user: dict = Depends(get_current_user)
):
    """Fetch detailed structure of an assigned form."""
    return await FormService.get_form_for_user(formId, str(current_user.get("_id")))

@router.get("/{formId}/assigned-users", response_model=List[str])
async def get_assigned_users(
    formId: str,
    current_admin: dict = Depends(get_admin_user)
):
    """List all users assigned to a specific form (Admin only)."""
    return await FormService.get_assigned_users(formId)

@router.post("/{formId}/submit")
async def submit_form(
    formId: str,
    submission: FormSubmissionRequest,
    current_user: dict = Depends(get_current_user)
):
    """Submit form data, validate mandatory fields, and log metadata (No values stored)."""
    if current_user["role"] == "admin":
        raise HTTPException(
            status_code=403, 
            detail="Admin users cannot submit forms."
        )
    return await FormService.submit_form(formId, current_user, submission.values)
