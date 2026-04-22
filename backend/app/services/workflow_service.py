from datetime import datetime
from bson import ObjectId
from fastapi import HTTPException
from ..database import get_database
from ..schemas.workflow import CreateWorkflowRequest
from .activity import log_activity

async def create_or_update_workflow(data: CreateWorkflowRequest, admin_user: dict):
    db = get_database()
    
    # Check if company exists
    company = await db.companies.find_one({"_id": ObjectId(data.companyId)})
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
        
    # Check if workflow exists for this company
    existing_workflow = await db.workflows.find_one({"companyId": data.companyId})
    
    workflow_data = data.dict()
    workflow_data["updatedAt"] = datetime.utcnow()
    
    if existing_workflow:
        # Update
        await db.workflows.update_one(
            {"_id": existing_workflow["_id"]},
            {"$set": {
                "name": data.name,
                "levels": [level.dict() for level in data.levels],
                "updatedAt": datetime.utcnow()
            }}
        )
        workflow_id = str(existing_workflow["_id"])
        action = "UPDATE_WORKFLOW"
    else:
        # Create
        workflow_data["createdAt"] = datetime.utcnow()
        workflow_data["createdBy"] = admin_user.get("email")
        result = await db.workflows.insert_one(workflow_data)
        workflow_id = str(result.inserted_id)
        action = "CREATE_WORKFLOW"
        
    # Log activity
    await log_activity(
        user_id=str(admin_user.get("_id", "admin")),
        action=action,
        entity_id=workflow_id,
        entity_type="WORKFLOW",
        metadata={"companyId": data.companyId, "name": data.name}
    )
    
    # Return the updated/created workflow
    workflow = await db.workflows.find_one({"_id": ObjectId(workflow_id)})
    workflow["id"] = str(workflow["_id"])
    return workflow

async def get_workflow_by_company(company_id: str):
    db = get_database()
    workflow = await db.workflows.find_one({"companyId": company_id})
    if not workflow:
        return None
    
    workflow["id"] = str(workflow["_id"])
    return workflow
