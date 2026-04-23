from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from bson import ObjectId
from datetime import datetime
from ..schemas.company import CompanyCreate, CompanyUpdate, CompanyOut
from ..database import get_database
from ..utils.deps import get_super_admin
from ..services.activity import log_activity

router = APIRouter(prefix="/companies", tags=["Companies"])

@router.post("", response_model=CompanyOut)
async def create_company(
    company: CompanyCreate, 
    current_admin: dict = Depends(get_super_admin)
):
    db = get_database()
    new_company = {
        "name": company.name,
        "createdAt": datetime.utcnow(),
        "createdBy": current_admin["email"]
    }
    result = await db.companies.insert_one(new_company)
    new_company["id"] = str(result.inserted_id)
    
    await log_activity(
        str(current_admin["_id"]), 
        "CREATE_COMPANY", 
        role=current_admin["role"],
        entity_id=new_company["id"], 
        entity_type="COMPANY"
    )
    
    return new_company

@router.get("", response_model=List[CompanyOut])
async def list_companies(current_admin: dict = Depends(get_super_admin)):
    db = get_database()
    companies = []
    async for company in db.companies.find():
        company["id"] = str(company["_id"])
        companies.append(company)
    return companies

@router.put("/{id}", response_model=CompanyOut)
async def update_company(
    id: str, 
    company_update: CompanyUpdate, 
    current_admin: dict = Depends(get_super_admin)
):
    db = get_database()
    update_data = {k: v for k, v in company_update.dict().items() if v is not None}
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No data provided for update")
        
    result = await db.companies.update_one(
        {"_id": ObjectId(id)}, 
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Company not found")
        
    updated_company = await db.companies.find_one({"_id": ObjectId(id)})
    updated_company["id"] = str(updated_company["_id"])
    
    await log_activity(
        str(current_admin["_id"]), 
        "UPDATE_COMPANY", 
        role=current_admin["role"],
        entity_id=id, 
        entity_type="COMPANY"
    )
    
    return updated_company

@router.delete("/{id}")
async def delete_company(id: str, current_admin: dict = Depends(get_super_admin)):
    db = get_database()
    result = await db.companies.delete_one({"_id": ObjectId(id)})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Company not found")
        
    await log_activity(
        str(current_admin["_id"]), 
        "DELETE_COMPANY", 
        role=current_admin["role"],
        entity_id=id, 
        entity_type="COMPANY"
    )
    
    return {"message": "Company deleted successfully"}
