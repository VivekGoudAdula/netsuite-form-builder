from pydantic import BaseModel, EmailStr
from typing import Optional

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str

class UserInfo(BaseModel):
    id: str
    name: str
    email: str
    role: str
    companyId: Optional[str] = None
    jobTitle: Optional[str] = None
