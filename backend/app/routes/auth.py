from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from ..schemas.auth import LoginRequest, Token, UserInfo
from ..schemas.user import ForgotPassword, ResetPassword
from ..utils.security import verify_password, create_access_token, get_password_hash
from ..utils.deps import get_current_user
from ..config import settings
from ..database import get_database
from ..services.activity import log_activity
from datetime import datetime, timedelta
from bson import ObjectId
import secrets

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    # 1. Check DB users
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
    
    await log_activity(user_id_str, "LOGIN", role=user["role"], metadata={"email": user["email"]})
    
    company_id = user.get("companyId")
    company_name = None
    if company_id:
        company = await db.companies.find_one({"_id": ObjectId(company_id)})
        if company:
            company_name = company.get("name")

    user_info = {
        "id": user_id_str,
        "name": user["name"],
        "email": user["email"],
        "role": user["role"],
        "companyId": company_id,
        "companyName": company_name,
        "jobTitle": user.get("jobTitle")
    }
    
    return {
        "access_token": access_token, 
        "token_type": "bearer", 
        "role": user["role"],
        "user": user_info
    }

@router.post("/forgot-password")
async def forgot_password(data: ForgotPassword):
    db = get_database()
    user = await db.users.find_one({"email": data.email})
    
    if not user:
        # Don't reveal if user exists for security
        return {"message": "If an account exists with this email, a reset link has been sent."}
    
    token = secrets.token_urlsafe(32)
    expires = datetime.utcnow() + timedelta(hours=1)
    
    await db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {
            "resetToken": token,
            "resetExpires": expires
        }}
    )
    
    # Send actual email
    from ..services.email_service import send_email, generate_reset_password_html
    import os
    
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
    reset_url = f"{frontend_url}/reset-password?token={token}"
    
    html = generate_reset_password_html(reset_url)
    await send_email(data.email, "Personnel Account Security Reset", html)
    
    print(f"DEBUG: Password reset token for {data.email}: {token}")
    
    return {"message": "If an account exists with this email, a reset link has been sent."}

@router.post("/reset-password")
async def reset_password(data: ResetPassword):
    db = get_database()
    user = await db.users.find_one({
        "resetToken": data.token,
        "resetExpires": {"$gt": datetime.utcnow()}
    })
    
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
    
    await db.users.update_one(
        {"_id": user["_id"]},
        {
            "$set": {"password": get_password_hash(data.newPassword)},
            "$unset": {"resetToken": "", "resetExpires": ""}
        }
    )
    
    await log_activity(str(user["_id"]), "RESET_PASSWORD", role=user["role"])
    
    return {"message": "Password reset successfully"}

@router.get("/me", response_model=UserInfo)
async def get_me(current_user: dict = Depends(get_current_user)):
    db = get_database()
    company_id = current_user.get("companyId")
    company_name = None
    
    if company_id:
        company = await db.companies.find_one({"_id": ObjectId(company_id)})
        if company:
            company_name = company.get("name")

    return {
        "id": str(current_user.get("_id", current_user.get("id"))),
        "name": current_user["name"],
        "email": current_user["email"],
        "role": current_user["role"],
        "companyId": company_id,
        "companyName": company_name,
        "jobTitle": current_user.get("jobTitle")
    }
