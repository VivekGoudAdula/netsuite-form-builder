from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from ..schemas.auth import LoginRequest, Token, UserInfo
from ..utils.security import verify_password, create_access_token
from ..utils.deps import get_current_user
from ..config import settings
from ..database import get_database
from ..services.activity import log_activity
from datetime import datetime
from bson import ObjectId

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    # 1. Check Fixed Admin
    if form_data.username == settings.ADMIN_EMAIL and form_data.password == settings.ADMIN_PASSWORD:
        access_token = create_access_token(data={"userId": "admin", "role": "admin"})
        await log_activity("admin", "LOGIN", metadata={"email": settings.ADMIN_EMAIL})
        return {"access_token": access_token, "token_type": "bearer", "role": "admin"}
    
    # 2. Check DB users
    db = get_database()
    user = await db.users.find_one({"email": form_data.username})
    
    if not user or not verify_password(form_data.password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.get("isActive", True):
        raise HTTPException(status_code=400, detail="User is inactive")

    # Update last login
    await db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {"lastLogin": datetime.utcnow()}}
    )
    
    user_id_str = str(user["_id"])
    access_token = create_access_token(data={
        "userId": user_id_str, 
        "role": user["role"],
        "companyId": user.get("companyId")
    })
    
    await log_activity(user_id_str, "LOGIN", metadata={"email": user["email"]})
    
    return {"access_token": access_token, "token_type": "bearer", "role": user["role"]}

@router.get("/me", response_model=UserInfo)
async def get_me(current_user: dict = Depends(get_current_user)):
    return {
        "id": str(current_user.get("_id", current_user.get("id"))),
        "name": current_user["name"],
        "email": current_user["email"],
        "role": current_user["role"],
        "companyId": current_user.get("companyId"),
        "jobTitle": current_user.get("jobTitle")
    }
