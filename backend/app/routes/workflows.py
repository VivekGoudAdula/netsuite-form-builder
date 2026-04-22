from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from ..schemas.workflow import CreateWorkflowRequest, WorkflowResponse
from ..services.workflow_service import create_or_update_workflow, get_workflow_by_company
from ..utils.deps import get_admin_user

router = APIRouter(prefix="/workflows", tags=["Workflows"])

@router.post("", response_model=WorkflowResponse)
async def upsert_workflow(
    data: CreateWorkflowRequest,
    current_admin: dict = Depends(get_admin_user)
):
    """
    Create or update a workflow for a specific company.
    Only accessible by Admin.
    """
    return await create_or_update_workflow(data, current_admin)

@router.get("/{companyId}", response_model=Optional[WorkflowResponse])
async def get_company_workflow(
    companyId: str,
    current_admin: dict = Depends(get_admin_user)
):
    """
    Get the workflow configuration for a specific company.
    """
    workflow = await get_workflow_by_company(companyId)
    if not workflow:
        return None
    return workflow
