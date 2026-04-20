from fastapi import APIRouter, HTTPException, Depends, Query, status
from typing import List, Optional
from datetime import datetime
from bson import ObjectId
from ..database import get_database
from ..schemas.catalogue import CatalogueFieldCreate, CatalogueFieldUpdate, CatalogueFieldResponse

router = APIRouter(prefix="/catalogue", tags=["Field Catalogue"])

def serialize_doc(doc):
    if not doc:
        return None
    doc["_id"] = str(doc["_id"])
    return doc

@router.get("/", response_model=List[CatalogueFieldResponse])
async def get_catalogue(type: Optional[str] = Query(None)):
    db = get_database()
    query = {}
    if type:
        query["transactionType"] = type
    
    cursor = db.field_catalogue.find(query)
    fields = await cursor.to_list(length=1000)
    return [serialize_doc(f) for f in fields]

@router.post("/", response_model=CatalogueFieldResponse, status_code=status.HTTP_201_CREATED)
async def create_catalogue_field(field_data: CatalogueFieldCreate):
    db = get_database()
    
    # Validation: internalId must be unique per transactionType
    existing = await db.field_catalogue.find_one({
        "internalId": field_data.internalId,
        "transactionType": field_data.transactionType
    })
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"Field with internalId '{field_data.internalId}' already exists for {field_data.transactionType}"
        )
    
    new_field = field_data.dict()
    new_field["createdAt"] = datetime.utcnow()
    new_field["updatedAt"] = datetime.utcnow()
    # If added via API, it's a custom field unless specified
    if "isSystemField" not in new_field:
        new_field["isSystemField"] = False
        
    result = await db.field_catalogue.insert_one(new_field)
    created_field = await db.field_catalogue.find_one({"_id": result.inserted_id})
    return serialize_doc(created_field)

@router.put("/{id}", response_model=CatalogueFieldResponse)
async def update_catalogue_field(id: str, field_data: CatalogueFieldUpdate):
    db = get_database()
    
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid field ID")
    
    update_dict = {k: v for k, v in field_data.dict().items() if v is not None}
    if not update_dict:
        raise HTTPException(status_code=400, detail="No fields provided for update")
    
    update_dict["updatedAt"] = datetime.utcnow()
    
    # Check if internalId is changing and if it conflicts
    if "internalId" in update_dict or "transactionType" in update_dict:
        current = await db.field_catalogue.find_one({"_id": ObjectId(id)})
        if not current:
             raise HTTPException(status_code=404, detail="Field not found")
        
        new_internal_id = update_dict.get("internalId", current["internalId"])
        new_type = update_dict.get("transactionType", current["transactionType"])
        
        if new_internal_id != current["internalId"] or new_type != current["transactionType"]:
            existing = await db.field_catalogue.find_one({
                "internalId": new_internal_id,
                "transactionType": new_type,
                "_id": {"$ne": ObjectId(id)}
            })
            if existing:
                raise HTTPException(
                    status_code=400,
                    detail=f"Field with internalId '{new_internal_id}' already exists for {new_type}"
                )

    result = await db.field_catalogue.update_one(
        {"_id": ObjectId(id)},
        {"$set": update_dict}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Field not found")
        
    updated_field = await db.field_catalogue.find_one({"_id": ObjectId(id)})
    return serialize_doc(updated_field)

@router.delete("/{id}")
async def delete_catalogue_field(id: str):
    db = get_database()
    
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid field ID")
        
    result = await db.field_catalogue.delete_one({"_id": ObjectId(id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Field not found")
        
    return {"message": "Field deleted successfully"}
