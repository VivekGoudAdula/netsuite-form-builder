from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Literal
from datetime import datetime

UserRole = Literal["super_admin", "client_admin", "manager", "user"]

class UserBase(BaseModel):
    name: str
    email: EmailStr
    role: UserRole = "user"
    companyId: Optional[str] = None
    empId: Optional[str] = None
    jobTitle: Optional[str] = None
    isActive: bool = True

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[UserRole] = None
    companyId: Optional[str] = None
    empId: Optional[str] = None
    jobTitle: Optional[str] = None
    isActive: Optional[bool] = None

class PasswordChange(BaseModel):
    oldPassword: str
    newPassword: str

class ForgotPassword(BaseModel):
    email: EmailStr

class ResetPassword(BaseModel):
    token: str
    newPassword: str

class UserOut(UserBase):
    id: str
    createdAt: datetime
    lastLogin: Optional[datetime] = None

    class Config:
        from_attributes = True
