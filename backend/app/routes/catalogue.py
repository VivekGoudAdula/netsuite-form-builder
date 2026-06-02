from fastapi import APIRouter, HTTPException, Depends, Query, status
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from bson import ObjectId
from ..database import get_database
from ..schemas.catalogue import CatalogueFieldCreate, CatalogueFieldUpdate, CatalogueFieldResponse
from ..services.catalogue_service import CatalogueService
from ..utils.deps import get_current_user, get_super_admin

router = APIRouter(prefix="/catalogue", tags=["Field Catalogue"])

def serialize_doc(doc):
    if not doc:
        return None
    # Fallback catalogue rows (generated in-memory) may not have Mongo _id yet.
    if "_id" in doc and doc["_id"] is not None:
        doc["_id"] = str(doc["_id"])
    else:
        # Include section/subSection to disambiguate duplicates like department on expense vs item.
        section = doc.get("section", "body")
        sub = doc.get("subSection") if section == "sublist" else None
        sub_part = sub if sub is not None else "none"
        fallback_id = f'{doc.get("transactionType", "catalogue")}:{section}:{sub_part}:{doc.get("internalId", "field")}'
        doc["_id"] = fallback_id
    return doc

@router.get("/", response_model=List[CatalogueFieldResponse])
async def get_catalogue(
    type: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user)
):
    db = get_database()
    fields = await CatalogueService.get_fields(db, type)
    return [serialize_doc(f) for f in fields]

@router.get("/{transaction_type}/grouped")
async def get_grouped_catalogue(
    transaction_type: str,
    current_user: dict = Depends(get_current_user)
):
    db = get_database()
    return await CatalogueService.get_grouped_catalogue(db, transaction_type)

@router.post("/", response_model=CatalogueFieldResponse, status_code=status.HTTP_201_CREATED)
async def create_catalogue_field(
    field_data: CatalogueFieldCreate,
    current_admin: dict = Depends(get_super_admin)
):
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
    new_field["createdAt"] = datetime.now(timezone.utc)
    new_field["updatedAt"] = datetime.now(timezone.utc)
    
    # If added via API, it's a custom field unless specified
    if "isSystemField" not in new_field:
        new_field["isSystemField"] = False
        
    inserted_id = await CatalogueService.add_field(db, new_field)
    created_field = await db.field_catalogue.find_one({"_id": ObjectId(inserted_id)})
    return serialize_doc(created_field)

@router.post("/bulk-import")
async def bulk_import(
    fields: List[Dict[str, Any]],
    current_admin: dict = Depends(get_super_admin)
):
    db = get_database()
    # Basic mapping/validation
    processed_fields = []
    for f in fields:
        f["createdAt"] = datetime.now(timezone.utc)
        f["updatedAt"] = datetime.now(timezone.utc)
        processed_fields.append(f)
    
    await CatalogueService.bulk_import(db, processed_fields)
    return {"message": f"Successfully imported {len(processed_fields)} fields"}

@router.put("/{id}", response_model=CatalogueFieldResponse)
async def update_catalogue_field(
    id: str, 
    field_data: CatalogueFieldUpdate,
    current_admin: dict = Depends(get_super_admin)
):
    db = get_database()
    
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid field ID")
    
    update_dict = {k: v for k, v in field_data.dict().items() if v is not None}
    if not update_dict:
        raise HTTPException(status_code=400, detail="No fields provided for update")
    
    update_dict["updatedAt"] = datetime.now(timezone.utc)
    
    await CatalogueService.update_field(db, id, update_dict)
    
    updated_field = await db.field_catalogue.find_one({"_id": ObjectId(id)})
    if not updated_field:
        raise HTTPException(status_code=404, detail="Field not found")
        
    return serialize_doc(updated_field)

@router.delete("/{id}")
async def delete_catalogue_field(
    id: str,
    current_admin: dict = Depends(get_super_admin)
):
    db = get_database()
    
    # Support both Mongo ObjectIds and synthetic ids for in-memory/system rows.
    if ObjectId.is_valid(id):
        result = await db.field_catalogue.delete_one({"_id": ObjectId(id)})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Field not found")
        return {"message": "Field deleted successfully"}

    # Synthetic id format: {transactionType}:{section}:{subSection|none}:{internalId}
    parts = id.split(":")
    if len(parts) != 4:
        raise HTTPException(status_code=400, detail="Invalid field ID")

    transaction_type, section, sub_part, internal_id = parts
    query: Dict[str, Any] = {"transactionType": transaction_type, "internalId": internal_id}
    if section:
        query["section"] = section
    if section == "sublist":
        query["subSection"] = None if sub_part == "none" else sub_part

    result = await db.field_catalogue.delete_many(query)
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Field not found")
        
    return {"message": "Field deleted successfully"}
