from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from bson import ObjectId
from ..config import settings
from ..database import get_database
from typing import Dict, Any

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

async def get_current_user(token: str = Depends(oauth2_scheme)) -> Dict[str, Any]:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=["HS256"])
        user_id: str = payload.get("userId")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    db = get_database()
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if user is None:
        raise credentials_exception
        
    user["id"] = str(user["_id"])
    return user

async def get_super_admin(current_user: Dict[str, Any] = Depends(get_current_user)):
    if current_user["role"] != "super_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Requires Super Admin role"
        )
    return current_user

async def get_client_admin(current_user: Dict[str, Any] = Depends(get_current_user)):
    if current_user["role"] not in ["super_admin", "client_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Requires Client Admin or Super Admin role"
        )
    return current_user

async def get_manager(current_user: Dict[str, Any] = Depends(get_current_user)):
    if current_user["role"] not in ["super_admin", "client_admin", "manager"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Requires Manager, Client Admin or Super Admin role"
        )
    return current_user

async def get_user(current_user: Dict[str, Any] = Depends(get_current_user)):
    # All authenticated users can access user-level endpoints
    return current_user
