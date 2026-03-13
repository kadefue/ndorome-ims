from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.auth import get_current_user, require_owner
from app.crud.audit import get_audits
from app.schemas.audit import AuditResponse
from app.models.user import User

router = APIRouter(prefix="/audits", tags=["Audit Log"])


@router.get("", response_model=list[AuditResponse], summary="List audit log entries")
def list_audits(
    q: Optional[str] = None,
    skip: int = 0,
    limit: int = 200,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_owner),
):
    return get_audits(db, skip=skip, limit=limit, q=q)
