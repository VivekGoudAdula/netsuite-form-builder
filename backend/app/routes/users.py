from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from bson import ObjectId
from datetime import datetime
from ..schemas.user import UserCreate, UserUpdate, UserOut
from ..database import get_database
from ..utils.deps import get_admin_user
from ..utils.security import get_password_hash
from ..services.activity import log_activity

router = APIRouter(prefix="/users", tags=["Users"])

@router.post("", response_model=UserOut)
async def create_user(
    user: UserCreate, 
    current_admin: dict = Depends(get_admin_user)
):
    db = get_database()
    
    # Check if user already exists
    existing_user = await db.users.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="User with this email already exists")
    
    new_user = user.dict()
    new_user["password"] = get_password_hash(new_user["password"])
    new_user["createdAt"] = datetime.utcnow()
    new_user["lastLogin"] = None
    
    result = await db.users.insert_one(new_user)
    new_user["id"] = str(result.inserted_id)
    
    await log_activity(
        str(current_admin.get("_id", "admin")), 
        "CREATE_USER", 
        entity_id=new_user["id"], 
        entity_type="USER"
    )
    
    return new_user

@router.get("", response_model=List[UserOut])
async def list_users(current_admin: dict = Depends(get_admin_user)):
    db = get_database()
    users = []
    async for user in db.users.find():
        user["id"] = str(user["_id"])
        users.append(user)
    return users

@router.get("/{id}", response_model=UserOut)
async def get_user(id: str, current_admin: dict = Depends(get_admin_user)):
    db = get_database()
    user = await db.users.find_one({"_id": ObjectId(id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user["id"] = str(user["_id"])
    return user

@router.put("/{id}", response_model=UserOut)
async def update_user(
    id: str, 
    user_update: UserUpdate, 
    current_admin: dict = Depends(get_admin_user)
):
    db = get_database()
    update_data = {k: v for k, v in user_update.dict().items() if v is not None}
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No data provided for update")
        
    result = await db.users.update_one(
        {"_id": ObjectId(id)}, 
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
        
    updated_user = await db.users.find_one({"_id": ObjectId(id)})
    updated_user["id"] = str(updated_user["_id"])
    
    return updated_user

@router.delete("/{id}")
async def delete_user(id: str, current_admin: dict = Depends(get_admin_user)):
    db = get_database()
    result = await db.users.delete_one({"_id": ObjectId(id)})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
        
    await log_activity(
        str(current_admin.get("_id", "admin")), 
        "DELETE_USER", 
        entity_id=id, 
        entity_type="USER"
    )
    
    return {"message": "User deleted successfully"}
