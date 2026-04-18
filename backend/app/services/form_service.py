from bson import ObjectId
from datetime import datetime
from typing import List, Optional, Dict, Any
from fastapi import HTTPException, status
from ..database import get_database
from ..schemas.form import FormCreate, FormUpdate, CloneFormRequest
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
