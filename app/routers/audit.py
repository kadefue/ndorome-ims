from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.auth import require_owner, require_any_role
from app.crud.audit import get_audits, create_audit
from app.schemas.audit import AuditResponse, AuditEventCreate, AuditEventResponse
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


@router.post("/event", response_model=AuditEventResponse, summary="Create an audit event entry")
def create_audit_event(
    payload: AuditEventCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_any_role),
):
    forwarded_for = request.headers.get("x-forwarded-for")
    if forwarded_for:
        ip = forwarded_for.split(",")[0].strip()
    else:
        ip = request.client.host if request.client else None

    site_url = payload.site_url or str(request.base_url).rstrip("/")
    entry = create_audit(
        db,
        action=payload.action,
        data={**(payload.data or {}), "site_url": site_url},
        user_id=current_user.id,
        username=current_user.name,
        ip_address=ip,
    )
    return AuditEventResponse(
        id=entry.id,
        ip_address=ip,
        site_url=site_url,
        created_at=entry.created_at,
    )
