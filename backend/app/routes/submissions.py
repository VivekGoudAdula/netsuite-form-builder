from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from datetime import datetime
from ..utils.deps import get_current_user, get_client_admin, get_super_admin
from ..services.form_service import FormService

router = APIRouter(prefix="/submissions", tags=["Submissions"])

@router.get("")
async def get_submissions(
    status: Optional[str] = Query(None),
    companyId: Optional[str] = Query(None),
    current_user: dict = Depends(get_client_admin)
):
    """Retrieve all form submissions with optional filtering (Client Admin or Super Admin)."""
    # Scoping: Client admin can only see their company submissions
    if current_user["role"] == "client_admin":
        companyId = current_user["companyId"]
    # super_admin can use the provided companyId or see all if None
    
    return await FormService.get_all_submissions(status=status, company_id=companyId)

@router.get("/pending-approvals")
async def get_pending_approvals(
    current_user: dict = Depends(get_current_user)
):
    """Retrieve submissions waiting for the current user's approval."""
    return await FormService.get_pending_approvals(current_user["id"])

@router.get("/my")
async def get_my_submissions(
    transactionType: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user)
):
    """Retrieve current user's form submissions."""
    return await FormService.get_submissions_for_user(current_user["id"], transactionType)

@router.get("/my/stats")
async def get_my_submission_stats(
    transactionType: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user)
):
    """Retrieve current user's submission statistics."""
    return await FormService.get_submission_stats_for_user(current_user["id"], transactionType)

@router.post("/{id}/retry")
async def retry_submission(
    id: str,
    current_admin: dict = Depends(get_client_admin)
):
    """Manually retry a failed NetSuite submission."""
    # Note: We might want to check if the submission belongs to the client admin's company
    # But FormService.retry_submission doesn't currently do that check.
    # For now, we trust the admin role but we should ideally verify.
    return await FormService.retry_submission(id, str(current_admin["_id"]))
