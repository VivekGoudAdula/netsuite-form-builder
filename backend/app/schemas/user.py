from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    name: str
    email: EmailStr
    role: str = "customer"
    companyId: Optional[str] = None
    empId: Optional[str] = None
    jobTitle: Optional[str] = None
    isActive: bool = True

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[str] = None
    companyId: Optional[str] = None
    empId: Optional[str] = None
    jobTitle: Optional[str] = None
    isActive: Optional[bool] = None

class UserOut(UserBase):
    id: str
    createdAt: datetime
    lastLogin: Optional[datetime] = None

    class Config:
        from_attributes = True
