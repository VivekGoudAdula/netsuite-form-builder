from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from ..schemas.form import FormCreate, FormUpdate, FormResponse, CloneFormRequest, MyFormResponse, AssignUsersRequest, FormSubmissionRequest
from ..services.form_service import FormService
from ..utils.deps import get_current_user, get_super_admin, get_client_admin

router = APIRouter(prefix="/forms", tags=["Forms"])

@router.post("", response_model=FormResponse, status_code=201)
async def create_form(
    form_data: FormCreate, 
    current_admin: dict = Depends(get_super_admin)
):
    """Initialize a new form configuration for a company (Super Admin only)."""
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
    # Scoping: Client admin can only see their company forms
    if current_user["role"] == "client_admin":
        companyId = current_user["companyId"]
    elif current_user["role"] == "user":
        # Regular users shouldn't really use this endpoint, but if they do, scope to their company
        companyId = current_user["companyId"]
        
    return await FormService.get_forms(companyId, transactionType)

@router.get("/my", response_model=List[MyFormResponse])
async def get_my_forms(
    transactionType: Optional[str] = Query(None),
    companyId: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user)
):
    """Fetch forms assigned to the current employee/customer. Super Admins see all forms."""
    if current_user["role"] == "super_admin":
        # Super admin can see all forms or filtered by company
        return await FormService.get_all_forms_for_admin(companyId, transactionType)
    
    return await FormService.get_forms_for_user(current_user["id"], transactionType)

@router.get("/{formId}", response_model=FormResponse)
async def get_form_by_id(formId: str, current_user: dict = Depends(get_current_user)):
    """Fetch a single form configuration by its unique ID."""
    form = await FormService.get_form_by_id(formId)
    
    # Permission check
    if current_user["role"] != "super_admin":
        if form["companyId"] != current_user.get("companyId"):
            raise HTTPException(status_code=403, detail="Not authorized for this company's forms")
            
    return form

@router.put("/{formId}", response_model=FormResponse)
async def update_form(
    formId: str, 
    form_updates: FormUpdate, 
    current_admin: dict = Depends(get_super_admin)
):
    """Modify an existing form structure or metadata (Super Admin only)."""
    return await FormService.update_form(
        formId, 
        form_updates, 
        str(current_admin.get("_id", "admin"))
    )

@router.delete("/{formId}")
async def delete_form(formId: str, current_admin: dict = Depends(get_super_admin)):
    """Permanently remove a form configuration (Super Admin only)."""
    return await FormService.delete_form(formId, str(current_admin.get("_id", "admin")))

@router.post("/{formId}/clone", response_model=FormResponse)
async def clone_form(
    formId: str, 
    clone_data: CloneFormRequest, 
    current_admin: dict = Depends(get_super_admin)
):
    """Clone an existing form to the same or a different company (Super Admin only)."""
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
    current_admin: dict = Depends(get_client_admin)
):
    """Assign specific users to a form configuration (Client Admin only)."""
    form = await FormService.get_form_by_id(formId)
    
    if current_admin["role"] == "client_admin" and form["companyId"] != current_admin["companyId"]:
        raise HTTPException(status_code=403, detail="Not authorized for this company's forms")

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
    return await FormService.get_form_for_user(formId, current_user)

@router.get("/{formId}/assigned-users", response_model=List[str])
async def get_assigned_users(
    formId: str,
    current_admin: dict = Depends(get_client_admin)
):
    """List all users assigned to a specific form (Client Admin only)."""
    form = await FormService.get_form_by_id(formId)
    
    if current_admin["role"] == "client_admin" and form["companyId"] != current_admin["companyId"]:
        raise HTTPException(status_code=403, detail="Not authorized for this company's forms")
        
    return await FormService.get_assigned_users(formId)

@router.post("/{formId}/submit")
async def submit_form(
    formId: str,
    submission: FormSubmissionRequest,
    current_user: dict = Depends(get_current_user)
):
    """Submit form data, validate mandatory fields, and log metadata."""
    if current_user["role"] in ["super_admin", "client_admin"]:
        # Admins can fill forms for testing if needed, but the prompt says 
        # SUPER ADMIN: ❌ Cannot assign forms, ❌ Cannot configure workflow
        # USER: Fill forms
        pass
        
    return await FormService.submit_form(formId, current_user, submission.values)
