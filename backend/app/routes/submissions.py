from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from datetime import datetime
from ..utils.deps import get_current_user, get_admin_user
from ..services.form_service import FormService

router = APIRouter(prefix="/submissions", tags=["Submissions"])

@router.get("")
async def get_submissions(
    status: Optional[str] = Query(None),
    companyId: Optional[str] = Query(None),
    current_admin: dict = Depends(get_admin_user)
):
    """Retrieve all form submissions with optional filtering (Admin only)."""
    return await FormService.get_all_submissions(status=status, company_id=companyId)

@router.get("/pending-approvals")
async def get_pending_approvals(
    current_user: dict = Depends(get_current_user)
):
    """Retrieve submissions waiting for the current user's approval."""
    return await FormService.get_pending_approvals(current_user["id"])

@router.post("/{id}/retry")
async def retry_submission(
    id: str,
    current_admin: dict = Depends(get_admin_user)
):
    """Manually retry a failed NetSuite submission (Admin only)."""
    return await FormService.retry_submission(id, str(current_admin.get("_id", "admin")))
