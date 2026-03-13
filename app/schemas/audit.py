from pydantic import BaseModel
from typing import Optional, Any
from datetime import datetime


class AuditResponse(BaseModel):
    id: int
    action: str
    data: Optional[Any] = None
    user_id: Optional[int] = None
    username: Optional[str] = None
    ip_address: Optional[str] = None
    created_at: datetime

    class Config:
        orm_mode = True


class AuditEventCreate(BaseModel):
    action: str
    data: Optional[Any] = None
    site_url: Optional[str] = None


class AuditEventResponse(BaseModel):
    id: int
    ip_address: Optional[str] = None
    site_url: Optional[str] = None
    created_at: datetime
