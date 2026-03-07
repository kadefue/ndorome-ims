# app/schemas/user.py
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

# Using a regex-validated str instead of EmailStr to avoid the
# optional `email-validator` dependency that EmailStr requires.


class UserCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: str = Field(..., pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$", max_length=150)
    password: str = Field(..., min_length=6)
    role: str = Field(default="employee", pattern="^(owner|manager|employee)$")


class UserUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    role: Optional[str] = Field(None, pattern="^(owner|manager|employee)$")
    active: Optional[bool] = None


class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str
    active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class UserListResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str
    active: bool

    model_config = {"from_attributes": True}


class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse


class TokenData(BaseModel):
    email: Optional[str] = None
