from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from bson import ObjectId
from datetime import datetime
from ..schemas.user import UserCreate, UserUpdate, UserOut, PasswordChange
from ..database import get_database
from ..utils.deps import get_current_user, get_super_admin, get_client_admin
from ..utils.security import get_password_hash, verify_password
from ..services.activity import log_activity

router = APIRouter(prefix="/users", tags=["Users"])

@router.post("", response_model=UserOut)
async def create_user(
    user: UserCreate, 
    current_admin: dict = Depends(get_client_admin)
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
    new_user["isActive"] = True
    
    # Validation & Scoping
    if current_admin["role"] == "client_admin":
        # Client admin can only create users for their own company
        new_user["companyId"] = current_admin["companyId"]
        # Client admin cannot create super_admins
        if new_user["role"] == "super_admin":
            raise HTTPException(status_code=403, detail="Client Admin cannot create Super Admin")
    elif current_admin["role"] == "super_admin":
        # Super admin doesn't need companyId for themselves, but needs it for others
        if new_user["role"] != "super_admin" and not new_user.get("companyId"):
            raise HTTPException(status_code=400, detail="Company ID is required for this role")
    
    result = await db.users.insert_one(new_user)
    new_user["id"] = str(result.inserted_id)
    if "_id" in new_user:
        del new_user["_id"]
    
    await log_activity(
        str(current_admin.get("_id", "admin")), 
        "CREATE_USER", 
        role=current_admin["role"],
        entity_id=new_user["id"], 
        entity_type="USER"
    )
    
    return new_user

@router.get("", response_model=List[UserOut])
async def list_users(
    companyId: Optional[str] = None,
    current_user: dict = Depends(get_client_admin)
):
    db = get_database()
    query = {}
    
    # Super admin can see all or filter by company
    if current_user["role"] == "super_admin":
        if companyId:
            query["companyId"] = companyId
    else:
        # Client admin can only see their company
        query["companyId"] = current_user["companyId"]
        
    users = []
    async for user in db.users.find(query):
        user["id"] = str(user["_id"])
        users.append(user)
    return users

@router.get("/{id}", response_model=UserOut)
async def get_user_by_id(id: str, current_user: dict = Depends(get_current_user)):
    db = get_database()
    user = await db.users.find_one({"_id": ObjectId(id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Permission check
    if current_user["role"] != "super_admin":
        if current_user["role"] == "client_admin":
            if user.get("companyId") != current_user["companyId"]:
                raise HTTPException(status_code=403, detail="Not authorized to view users of other companies")
        elif str(current_user["_id"]) != id:
            raise HTTPException(status_code=403, detail="Not authorized to view other users")

    user["id"] = str(user["_id"])
    return user

@router.put("/change-password")
async def change_password(
    password_data: PasswordChange,
    current_user: dict = Depends(get_current_user)
):
    db = get_database()
    
    if not verify_password(password_data.oldPassword, current_user["password"]):
        raise HTTPException(status_code=400, detail="Incorrect old password")
        
    await db.users.update_one(
        {"_id": current_user["_id"]},
        {"$set": {"password": get_password_hash(password_data.newPassword)}}
    )
    
    await log_activity(
        str(current_user["_id"]),
        "CHANGE_PASSWORD",
        role=current_user["role"]
    )
    
    return {"message": "Password updated successfully"}

@router.put("/{id}/status")
async def update_user_status(
    id: str,
    status_data: dict, # {"isActive": bool}
    current_admin: dict = Depends(get_client_admin)
):
    db = get_database()
    user = await db.users.find_one({"_id": ObjectId(id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if current_admin["role"] == "client_admin" and user.get("companyId") != current_admin["companyId"]:
        raise HTTPException(status_code=403, detail="Not authorized for this company")

    is_active = status_data.get("isActive")
    if is_active is None:
        raise HTTPException(status_code=400, detail="isActive field required")

    await db.users.update_one(
        {"_id": ObjectId(id)},
        {"$set": {"isActive": is_active}}
    )
    
    await log_activity(
        str(current_admin["_id"]),
        "UPDATE_USER_STATUS",
        role=current_admin["role"],
        entity_id=id,
        entity_type="USER",
        metadata={"isActive": is_active}
    )
    
    return {"message": f"User {'enabled' if is_active else 'disabled'} successfully"}

@router.put("/{id}", response_model=UserOut)
async def update_user(
    id: str, 
    user_update: UserUpdate, 
    current_admin: dict = Depends(get_client_admin)
):
    db = get_database()
    user = await db.users.find_one({"_id": ObjectId(id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if current_admin["role"] == "client_admin" and user.get("companyId") != current_admin["companyId"]:
        raise HTTPException(status_code=403, detail="Not authorized for this company")

    update_data = {k: v for k, v in user_update.dict().items() if v is not None}
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No data provided for update")
        
    await db.users.update_one(
        {"_id": ObjectId(id)}, 
        {"$set": update_data}
    )
    
    updated_user = await db.users.find_one({"_id": ObjectId(id)})
    updated_user["id"] = str(updated_user["_id"])
    
    return updated_user

@router.delete("/{id}")
async def delete_user(id: str, current_admin: dict = Depends(get_super_admin)):
    db = get_database()
    result = await db.users.delete_one({"_id": ObjectId(id)})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
        
    await log_activity(
        str(current_admin["_id"]), 
        "DELETE_USER", 
        role=current_admin["role"],
        entity_id=id, 
        entity_type="USER"
    )
    
    return {"message": "User deleted successfully"}
