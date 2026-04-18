from fastapi import APIRouter, Depends, HTTPException
from typing import List
from bson import ObjectId
from datetime import datetime
from ..database import get_database
from ..utils.deps import get_current_user
from ..services.activity import log_activity

router = APIRouter(prefix="/submissions", tags=["Submissions"])

@router.post("/{form_id}")
async def submit_form(form_id: str, current_user: dict = Depends(get_current_user)):
    db = get_database()
    
    # Verify form exists and user is assigned
    form = await db.forms.find_one({"_id": ObjectId(form_id)})
    if not form:
        raise HTTPException(status_code=404, detail="Form not found")
    
    # Logic: Only assigned users can submit
    if current_user["role"] == "customer" and current_user["id"] not in form.get("assignedTo", []):
        raise HTTPException(status_code=403, detail="Not authorized to submit this form")

    submission = {
        "formId": form_id,
        "userId": current_user["id"],
        "companyId": current_user.get("companyId") or form.get("companyId"),
        "status": "submitted",
        "submittedAt": datetime.utcnow()
    }
    
    result = await db.submissions.insert_one(submission)
    
    await log_activity(
        current_user["id"], 
        "SUBMIT_FORM", 
        entity_id=str(result.inserted_id), 
        entity_type="SUBMISSION"
    )
    
    return {"message": "Form submission metadata recorded successfully", "id": str(result.inserted_id)}
