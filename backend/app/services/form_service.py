from bson import ObjectId
from datetime import datetime
from typing import List, Optional, Dict, Any
from fastapi import HTTPException, status
from ..database import get_database
from ..schemas.form import FormCreate, FormUpdate, CloneFormRequest, AssignUsersRequest, FormSubmissionRequest
from .activity import log_activity

class FormService:
    @staticmethod
    async def create_form(form_data: FormCreate, creator_email: str, creator_id: str) -> Dict[str, Any]:
        db = get_database()
        
        # Validate company exists
        company = await db.companies.find_one({"_id": ObjectId(form_data.companyId)})
        if not company:
            raise HTTPException(status_code=404, detail="Target company not found")
            
        # Validate unique name per company
        existing = await db.forms.find_one({"name": form_data.name, "companyId": form_data.companyId})
        if existing:
            raise HTTPException(status_code=400, detail="Form name must be unique per company")
            
        new_form = form_data.dict()
        new_form["createdBy"] = creator_email
        new_form["createdAt"] = datetime.utcnow()
        new_form["updatedAt"] = datetime.utcnow()
        
        result = await db.forms.insert_one(new_form)
        new_form["id"] = str(result.inserted_id)
        
        await log_activity(
            creator_id, 
            "CREATE_FORM", 
            entity_id=new_form["id"], 
            entity_type="FORM",
            metadata={"name": form_data.name}
        )
        
        return new_form

    @staticmethod
    async def get_forms(company_id: Optional[str] = None, transaction_type: Optional[str] = None) -> List[Dict[str, Any]]:
        db = get_database()
        query = {}
        if company_id:
            query["companyId"] = company_id
        if transaction_type:
            query["transactionType"] = transaction_type
            
        forms = []
        async for form in db.forms.find(query):
            form["id"] = str(form["_id"])
            forms.append(form)
        return forms

    @staticmethod
    async def get_form_by_id(form_id: str) -> Dict[str, Any]:
        db = get_database()
        form = await db.forms.find_one({"_id": ObjectId(form_id)})
        if not form:
            raise HTTPException(status_code=404, detail="Form configuration not found")
        form["id"] = str(form["_id"])
        return form

    @staticmethod
    async def update_form(form_id: str, updates: FormUpdate, user_id: str) -> Dict[str, Any]:
        db = get_database()
        update_data = {k: v for k, v in updates.dict().items() if v is not None}
        
        if not update_data:
            raise HTTPException(status_code=400, detail="No updates provided")
            
        update_data["updatedAt"] = datetime.utcnow()
        
        result = await db.forms.update_one(
            {"_id": ObjectId(form_id)},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Form not found")
            
        await log_activity(
            user_id, 
            "UPDATE_FORM", 
            entity_id=form_id, 
            entity_type="FORM"
        )
        
        return await FormService.get_form_by_id(form_id)

    @staticmethod
    async def delete_form(form_id: str, user_id: str):
        db = get_database()
        result = await db.forms.delete_one({"_id": ObjectId(form_id)})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Form not found")
            
        await log_activity(
            user_id, 
            "DELETE_FORM", 
            entity_id=form_id, 
            entity_type="FORM"
        )
        
        return {"message": "Form deleted successfully"}

    @staticmethod
    async def clone_form(form_id: str, clone_data: CloneFormRequest, creator_email: str, creator_id: str) -> Dict[str, Any]:
        db = get_database()
        source_form = await db.forms.find_one({"_id": ObjectId(form_id)})
        if not source_form:
            raise HTTPException(status_code=404, detail="Source form not found")
            
        company_id = clone_data.targetCompanyId or source_form["companyId"]
        
        # Validate unique name in target company
        existing = await db.forms.find_one({"name": clone_data.newName, "companyId": company_id})
        if existing:
            raise HTTPException(status_code=400, detail="Form name already exists in target company")
            
        cloned_form = source_form.copy()
        del cloned_form["_id"]
        
        cloned_form.update({
            "name": clone_data.newName,
            "companyId": company_id,
            "createdBy": creator_email,
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow(),
            "assignedTo": []
        })
        
        result = await db.forms.insert_one(cloned_form)
        cloned_form["id"] = str(result.inserted_id)
        
        await log_activity(
            creator_id, 
            "CLONE_FORM", 
            entity_id=cloned_form["id"], 
            entity_type="FORM",
            metadata={"sourceFormId": form_id}
        )
        
        return cloned_form

    @staticmethod
    async def assign_users_to_form(form_id: str, user_ids: List[str], admin_id: str) -> Dict[str, Any]:
        db = get_database()
        
        form = await FormService.get_form_by_id(form_id)
        company_id = form["companyId"]
        
        # Remove duplicates
        unique_user_ids = list(set(user_ids))
        
        # Validate users exist and belong to the same company
        user_object_ids = [ObjectId(uid) for uid in unique_user_ids]
        users = await db.users.find({
            "_id": {"$in": user_object_ids},
            "companyId": company_id
        }).to_list(length=len(unique_user_ids))
        
        if len(users) != len(unique_user_ids):
            raise HTTPException(
                status_code=400, 
                detail="One or more users are invalid or belong to a different company"
            )
            
        await db.forms.update_one(
            {"_id": ObjectId(form_id)},
            {"$set": {"assignedTo": unique_user_ids, "updatedAt": datetime.utcnow()}}
        )
        
        await log_activity(
            admin_id, 
            "ASSIGN_FORM", 
            entity_id=form_id, 
            entity_type="FORM",
            metadata={"assignedUserCount": len(unique_user_ids)}
        )
        
        return {"message": f"Successfully assigned {len(unique_user_ids)} users to form"}

    @staticmethod
    async def get_forms_for_user(user_id: str) -> List[Dict[str, Any]]:
        db = get_database()
        
        # Find forms where assignedTo contains user_id
        forms = []
        async for form in db.forms.find({"assignedTo": user_id}):
            form_id = str(form["_id"])
            
            # Check submission status
            submission = await db.submissions.find_one({"formId": form_id, "userId": user_id})
            status = "Submitted" if submission else "Not Started"
            
            forms.append({
                "id": form_id,
                "name": form["name"],
                "transactionType": form["transactionType"],
                "status": status
            })
            
        await log_activity(
            user_id, 
            "FETCH_MY_FORMS", 
            entity_type="FORM"
        )
            
        return forms

    @staticmethod
    async def get_form_for_user(form_id: str, user_id: str) -> Dict[str, Any]:
        db = get_database()
        
        form = await db.forms.find_one({
            "_id": ObjectId(form_id),
            "assignedTo": user_id
        })
        
        if not form:
            raise HTTPException(
                status_code=403, 
                detail="Access denied. You are not assigned to this form."
            )
            
        form["id"] = str(form["_id"])
        
        await log_activity(
            user_id, 
            "VIEW_FORM", 
            entity_id=form_id, 
            entity_type="FORM"
        )
        
        return form

    @staticmethod
    async def get_assigned_users(form_id: str) -> List[str]:
        form = await FormService.get_form_by_id(form_id)
        return form.get("assignedTo", [])

    @staticmethod
    async def check_user_access(form_id: str, user_id: str) -> bool:
        db = get_database()
        form = await db.forms.find_one({
            "_id": ObjectId(form_id),
            "assignedTo": user_id
        })
        return form is not None

    @staticmethod
    async def submit_form(form_id: str, user: Dict[str, Any], values: Dict[str, Any]) -> Dict[str, Any]:
        db = get_database()
        user_id = user["id"]
        
        # 1. Verify form exists and get its details
        form = await db.forms.find_one({"_id": ObjectId(form_id)})
        if not form:
            raise HTTPException(status_code=404, detail="Form not found")
            
        # 2. Verify user is assigned to the form
        if user_id not in form.get("assignedTo", []):
            raise HTTPException(
                status_code=403, 
                detail="Access denied. You are not assigned to this form."
            )
            
        # 3. Prevent duplicate submissions
        existing = await db.submissions.find_one({"formId": form_id, "userId": user_id})
        if existing:
            raise HTTPException(
                status_code=400, 
                detail="Form already submitted. Duplicate submissions are not allowed."
            )
            
        # 4. Validate mandatory fields
        # Iterate through tabs -> fieldGroups -> fields to find mandatory ones
        mandatory_fields = []
        for tab in form.get("structure", {}).get("tabs", []):
            for group in tab.get("fieldGroups", []):
                for field in group.get("fields", []):
                    if field.get("mandatory"):
                        mandatory_fields.append(field["fieldId"])
                        
        missing_fields = [fid for fid in mandatory_fields if fid not in values or not values[fid]]
        if missing_fields:
            raise HTTPException(
                status_code=400, 
                detail=f"Mandatory fields missing: {', '.join(missing_fields)}"
            )
            
        # 5. TODO: Future NetSuite Integration
        # send_to_netsuite(form_id, values, user)
        # Note: 'values' are NOT stored in our database as per security requirements.
        
        # 6. Store submission metadata
        submission = {
            "formId": form_id,
            "userId": user_id,
            "companyId": user.get("companyId") or form.get("companyId"),
            "transactionType": form.get("transactionType"),
            "status": "submitted",
            "submittedAt": datetime.utcnow()
        }
        
        result = await db.submissions.insert_one(submission)
        
        # 7. Log activity
        await log_activity(
            user_id, 
            "SUBMIT_FORM", 
            entity_id=form_id, 
            entity_type="FORM",
            metadata={"transactionType": form.get("transactionType")}
        )
        
        return {
            "message": "Form submitted successfully",
            "status": "submitted",
            "submissionId": str(result.inserted_id)
        }
