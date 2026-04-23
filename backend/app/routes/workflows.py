from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from ..schemas.workflow import CreateWorkflowRequest, WorkflowResponse
from ..services.workflow_service import create_or_update_workflow, get_workflow_by_company
from ..services.workflow_engine import approve_submission, reject_submission
from ..utils.deps import get_current_user, get_client_admin
from ..services.token_service import decode_token
from bson import ObjectId
from fastapi.responses import HTMLResponse
from ..database import get_database

router = APIRouter(prefix="/workflows", tags=["Workflows"])

@router.post("", response_model=dict)
async def save_workflow(
    data: CreateWorkflowRequest,
    current_admin: dict = Depends(get_client_admin)
):
    # If client admin, must be for their company
    if current_admin["role"] == "client_admin" and data.companyId != current_admin["companyId"]:
        raise HTTPException(status_code=403, detail="Not authorized for this company")
        
    try:
        workflow_id = await create_or_update_workflow(data, current_admin)
        return {"id": workflow_id, "message": "Workflow saved successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/action", response_class=HTMLResponse)
async def workflow_action(token: str):
    try:
        data = decode_token(token)
        
        submission_id = data["submissionId"]
        user_id = data["userId"]
        action = data["action"]
        
        db = get_database()
        user = await db.users.find_one({"_id": ObjectId(user_id)})
        
        if not user:
            return HTMLResponse("<h2>Error: User not found</h2>", status_code=404)
        
        user_dict = {
            "id": str(user["_id"]),
            "email": user["email"],
            "name": user.get("name", "Approver"),
            "role": user["role"]
        }
        
        if action == "approve":
            await approve_submission(submission_id, user_dict)
            return HTMLResponse(
                "<h2 style='color:green;text-align:center;font-family:Arial;padding-top:50px;'>✅ Approved Successfully</h2>"
            )

        elif action == "reject":
            await reject_submission(submission_id, user_dict)
            return HTMLResponse(
                "<h2 style='color:red;text-align:center;font-family:Arial;padding-top:50px;'>❌ Rejected Successfully</h2>"
            )
            
    except Exception as e:
        return HTMLResponse(f"<h2 style='color:red;text-align:center;font-family:Arial;padding-top:50px;'>⚠️ Error processing action: {str(e)}</h2>", status_code=400)

@router.post("/{submissionId}/approve")
async def approve(
    submissionId: str,
    current_user: dict = Depends(get_current_user)
):
    try:
        await approve_submission(submissionId, current_user)
        return {"message": "Approved successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{submissionId}/reject")
async def reject(
    submissionId: str,
    current_user: dict = Depends(get_current_user)
):
    try:
        await reject_submission(submissionId, current_user)
        return {"message": "Rejected successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{companyId}", response_model=WorkflowResponse)
async def get_workflow(
    companyId: str,
    current_user: dict = Depends(get_current_user)
):
    # Permission check: client admin or user must belong to company, super admin global
    if current_user["role"] != "super_admin":
        if current_user.get("companyId") != companyId:
            raise HTTPException(status_code=403, detail="Not authorized for this company")
            
    workflow = await get_workflow_by_company(companyId)
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found for this company")
    return workflow
