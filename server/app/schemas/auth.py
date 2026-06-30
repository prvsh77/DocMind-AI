from pydantic import BaseModel, EmailStr, Field
from typing import Optional
import uuid

class UserResponse(BaseModel):
    id: uuid.UUID
    name: str
    email: EmailStr
    company: Optional[str] = None
    role: Optional[str] = "user"

    class Config:
        from_attributes = True

class RegisterRequest(BaseModel):
    fullName: str = Field(..., min_length=2)
    company: str = Field(..., min_length=2)
    email: EmailStr
    password: str = Field(..., min_length=8)

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class AuthSession(BaseModel):
    user: UserResponse
    accessToken: str
    refreshToken: Optional[str] = None
    expiresAt: Optional[str] = None

class RefreshRequest(BaseModel):
    refreshToken: str

class RefreshResponse(BaseModel):
    accessToken: str
    refreshToken: Optional[str] = None
    expiresAt: Optional[str] = None
