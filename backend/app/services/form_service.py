from bson import ObjectId
from datetime import datetime
from typing import List, Optional, Dict, Any
from fastapi import HTTPException, status
from ..database import get_database
from ..schemas.form import FormCreate, FormUpdate, CloneFormRequest, AssignUsersRequest, FormSubmissionRequest
from .activity import log_activity
from .mock_netsuite_service import send_to_netsuite_mock
from .workflow_engine import trigger_workflow_level

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
        
        # Ensure a default structure exists if none provided
        if not new_form.get("structure") or not new_form["structure"].get("tabs"):
            new_form["structure"] = {
                "tabs": [{
                    "name": "General",
                    "visible": True,
                    "fieldGroups": [{
                        "id": "group_main_" + datetime.utcnow().strftime("%Y%m%d%H%M%S"),
                        "name": "Primary Information",
                        "fields": []
                    }]
                }]
            }
            
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
        user_object_ids = []
        for uid in unique_user_ids:
            try:
                user_object_ids.append(ObjectId(uid))
            except:
                print(f"DEBUG: Skipping syntactically invalid ID: {uid}")
                continue

        valid_users = await db.users.find({
            "_id": {"$in": user_object_ids},
            "companyId": company_id
        }).to_list(length=len(unique_user_ids))
        
        valid_user_ids = [str(u["_id"]) for u in valid_users]
        discarded_ids = [uid for uid in unique_user_ids if uid not in valid_user_ids]
        
        if discarded_ids:
            print(f"DEBUG: Discarding invalid/mismatch IDs: {discarded_ids}")
            
        await db.forms.update_one(
            {"_id": ObjectId(form_id)},
            {"$set": {"assignedTo": valid_user_ids, "updatedAt": datetime.utcnow()}}
        )
        
        await log_activity(
            admin_id, 
            "ASSIGN_FORM", 
            entity_id=form_id, 
            entity_type="FORM",
            metadata={"assignedUserCount": len(valid_user_ids), "discardedCount": len(discarded_ids)}
        )
        
        return {"message": f"Successfully assigned {len(valid_user_ids)} users to form"}

    @staticmethod
    async def get_all_forms_for_admin(company_id: Optional[str] = None, transaction_type: Optional[str] = None) -> List[Dict[str, Any]]:
        db = get_database()
        query = {}
        if company_id:
            query["companyId"] = company_id
        if transaction_type:
            query["transactionType"] = transaction_type

        forms = []
        async for form in db.forms.find(query):
            form_id = str(form["_id"])
            forms.append({
                "id": form_id,
                "name": f"{form['name']} (Admin View)",
                "transactionType": form["transactionType"],
                "lastUsed": "N/A",
                "updatedAt": form.get("updatedAt", form.get("createdAt")).strftime("%Y-%m-%d %H:%M:%S") if isinstance(form.get("updatedAt", form.get("createdAt")), datetime) else "N/A"
            })
        return forms

    @staticmethod
    async def get_forms_for_user(user_id: str, transaction_type: Optional[str] = None) -> List[Dict[str, Any]]:
        db = get_database()
        
        # Find forms where assignedTo contains user_id
        query = {"assignedTo": user_id}
        if transaction_type:
            query["transactionType"] = transaction_type

        forms = []
        async for form in db.forms.find(query):
            form_id = str(form["_id"])
            
            # Find the last submission for this form by this user
            last_submission = await db.submissions.find_one(
                {"formId": form_id, "userId": user_id},
                sort=[("submittedAt", -1)]
            )
            
            last_used = "Never"
            if last_submission:
                last_used = last_submission.get("submittedAt").strftime("%Y-%m-%d %H:%M:%S") if isinstance(last_submission.get("submittedAt"), datetime) else "N/A"
            
            forms.append({
                "id": form_id,
                "name": form["name"],
                "transactionType": form["transactionType"],
                "lastUsed": last_used,
                "updatedAt": form.get("updatedAt", form.get("createdAt")).strftime("%Y-%m-%d %H:%M:%S") if isinstance(form.get("updatedAt", form.get("createdAt")), datetime) else "N/A"
            })
            
        await log_activity(
            user_id, 
            "FETCH_MY_FORMS", 
            entity_type="FORM",
            metadata={"transactionType": transaction_type}
        )
            
        return forms

    @staticmethod
    async def get_form_for_user(form_id: str, user: Dict[str, Any]) -> Dict[str, Any]:
        db = get_database()
        user_id = user["id"]
        role = user.get("role")
        
        query = {"_id": ObjectId(form_id)}
        if role != "super_admin":
            query["assignedTo"] = user_id
            
        form = await db.forms.find_one(query)
        
        if not form:
            raise HTTPException(
                status_code=403, 
                detail="Access denied. You are not assigned to this form."
            )
            
        form["id"] = str(form["_id"])
        
        # Inject submission status if exists
        submission = await db.submissions.find_one({"formId": form_id, "userId": user_id})
        if submission:
            form["status"] = submission.get("status", "pending")
            form["currentLevel"] = submission.get("currentLevel")
        else:
            form["status"] = "Not Started"

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
        company_id = user["companyId"]
        
        # STEP 1: Validate form + assignment
        form = await db.forms.find_one({"_id": ObjectId(form_id)})
        if not form:
            raise HTTPException(status_code=404, detail="Form not found")
            
        # Bypass assignment check for Super Admin
        if user.get("role") != "super_admin" and user_id not in form.get("assignedTo", []):
            raise HTTPException(
                status_code=403, 
                detail="Access denied. You are not assigned to this form."
            )
            
        # Use form's companyId as context for Super Admins or missing companyId
        effective_company_id = form.get("companyId") if user.get("role") == "super_admin" or not company_id else company_id

        # STEP 2: Fetch workflow
        workflow = await db.workflows.find_one({
            "companyId": effective_company_id
        })

        if not workflow:
            raise HTTPException(
                status_code=400,
                detail="Workflow not configured for this company. Please contact admin."
            )

        if not workflow.get("levels") or len(workflow["levels"]) == 0:
            raise HTTPException(
                status_code=400,
                detail="Workflow must have at least 1 level defined."
            )

        # STEP 3: Build approvals structure
        approvals = []
        for level in workflow["levels"]:
            if not level.get("approvers"):
                raise HTTPException(
                    status_code=400,
                    detail=f"Workflow level {level.get('level')} has no approvers."
                )
                
            approvals.append({
                "level": level["level"],
                "status": "pending",
                "approvers": [
                    {
                        "userId": u["userId"],
                        "name": u["name"],
                        "status": "pending",
                        "actionAt": None
                    }
                    for u in level["approvers"]
                ]
            })

        # STEP 4: Create submission
        submission = {
            "formId": form_id,
            "formName": form["name"],

            "userId": user["id"],
            "userName": user["name"],

            "companyId": form["companyId"],
            "transactionType": form["transactionType"],

            "status": "pending",
            "currentLevel": 1,

            "workflowId": str(workflow["_id"]),

            "approvals": approvals,

            "submittedAt": datetime.utcnow()
        }

        # STEP 5: Save
        result = await db.submissions.insert_one(submission)
        submission["_id"] = result.inserted_id

        # STEP 6: Activity Log
        await log_activity(
            user["id"],
            "SUBMIT_FORM_WORKFLOW",
            entity_id=str(result.inserted_id),
            entity_type="SUBMISSION",
            metadata={
                "formName": form["name"],
                "companyId": form["companyId"]
            }
        )

        # STEP 7: Trigger Level 1
        await trigger_workflow_level(submission)

        return {
            "message": "Submitted for approval",
            "status": "pending",
            "currentLevel": 1
        }

    @staticmethod
    async def get_submissions_for_user(user_id: str, transaction_type: Optional[str] = None) -> List[Dict[str, Any]]:
        db = get_database()
        query = {"userId": user_id}
        if transaction_type:
            query["transactionType"] = transaction_type
            
        submissions = []
        async for sub in db.submissions.find(query).sort("submittedAt", -1):
            sub["id"] = str(sub["_id"])
            del sub["_id"]
            submissions.append(sub)
            
        return submissions

    @staticmethod
    async def get_submission_stats_for_user(user_id: str, transaction_type: Optional[str] = None) -> Dict[str, Any]:
        db = get_database()
        query = {"userId": user_id}
        if transaction_type:
            query["transactionType"] = transaction_type
            
        total = await db.submissions.count_documents(query)
        approved = await db.submissions.count_documents({**query, "status": "approved"})
        pending = await db.submissions.count_documents({**query, "status": "pending"})
        rejected = await db.submissions.count_documents({**query, "status": "rejected"})
        completed = await db.submissions.count_documents({**query, "status": "submitted"}) # "submitted" means sent to NetSuite/Completed

        return {
            "total": total,
            "approved": approved + completed, # Completed is also approved
            "pending": pending,
            "rejected": rejected
        }

    @staticmethod
    async def get_all_submissions(
        status: Optional[str] = None, 
        company_id: Optional[str] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None
    ) -> List[Dict[str, Any]]:
        db = get_database()
        query = {}
        
        if status:
            query["status"] = status
        if company_id:
            query["companyId"] = company_id
        if date_from or date_to:
            query["submittedAt"] = {}
            if date_from:
                query["submittedAt"]["$gte"] = date_from
            if date_to:
                query["submittedAt"]["$lte"] = date_to
                
        submissions = []
        async for sub in db.submissions.find(query).sort("submittedAt", -1):
            sub["id"] = str(sub["_id"])
            del sub["_id"]
            submissions.append(sub)
            
        return submissions

    @staticmethod
    async def retry_submission(submission_id: str, user_id: str) -> Dict[str, Any]:
        db = get_database()
        submission = await db.submissions.find_one({"_id": ObjectId(submission_id)})
        
        if not submission:
            raise HTTPException(status_code=404, detail="Submission not found")
            
        if submission["status"] == "submitted":
            raise HTTPException(status_code=400, detail="Submission already successfully processed")
            
        ns_response = await send_to_netsuite_mock({}) # Payload is empty as we don't store values
        
        update_data = {
            "status": "submitted" if ns_response["success"] else "failed",
            "updatedAt": datetime.utcnow()
        }
        
        if ns_response["success"]:
            update_data["netsuiteId"] = ns_response["netsuiteId"]
            update_data["errorMessage"] = None
            activity_action = "RETRY_SUBMISSION_SUCCESS"
        else:
            update_data["errorMessage"] = ns_response["error"]
            activity_action = "RETRY_SUBMISSION_FAILED"
            
        await db.submissions.update_one(
            {"_id": ObjectId(submission_id)},
            {"$set": update_data}
        )
        
        await log_activity(
            user_id, 
            activity_action, 
            entity_id=submission_id, 
            entity_type="SUBMISSION"
        )
        
        return {
            "message": "Retry processed",
            "status": update_data["status"],
            "netsuiteId": update_data.get("netsuiteId")
        }

    @staticmethod
    async def get_pending_approvals(user_id: str) -> List[Dict[str, Any]]:
        db = get_database()
        
        # Find submissions where status is pending
        query = {
            "status": "pending"
        }
        
        submissions = []
        async for sub in db.submissions.find(query):
            # Check if user is an approver in the CURRENT level
            current_level = sub.get("currentLevel")
            level_data = next((l for l in sub["approvals"] if l["level"] == current_level), None)
            
            if not level_data:
                continue
                
            is_current_approver = any(
                a["userId"] == user_id and a["status"] == "pending"
                for a in level_data["approvers"]
            )
            
            if is_current_approver:
                sub["id"] = str(sub["_id"])
                del sub["_id"]
                submissions.append(sub)
                
        return submissions
