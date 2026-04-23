from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from ..schemas.workflow import CreateWorkflowRequest, WorkflowResponse
from ..services.workflow_service import create_or_update_workflow, get_workflow_by_company
from ..utils.deps import get_admin_user

router = APIRouter(prefix="/workflows", tags=["Workflows"])

@router.post("", response_model=dict)
async def save_workflow(
    data: CreateWorkflowRequest,
    current_admin: dict = Depends(get_admin_user)
):
    try:
        workflow_id = await create_or_update_workflow(data, current_admin)
        return {"id": workflow_id, "message": "Workflow saved successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{companyId}", response_model=WorkflowResponse)
async def get_workflow(
    companyId: str,
    current_admin: dict = Depends(get_admin_user)
):
    workflow = await get_workflow_by_company(companyId)
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found for this company")
    return workflow
