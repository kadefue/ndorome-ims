from sqlalchemy.orm import Session
from typing import Optional, List
import json

from app.models.audit import Audit


def create_audit(db: Session, action: str, data: Optional[dict] = None, user_id: Optional[int] = None, username: Optional[str] = None, ip_address: Optional[str] = None) -> Audit:
    a = Audit(action=action, data=json.dumps(data) if data is not None else None, user_id=user_id, username=username, ip_address=ip_address)
    db.add(a)
    db.commit()
    db.refresh(a)
    return a


def get_audits(db: Session, skip: int = 0, limit: int = 200, q: Optional[str] = None) -> List[Audit]:
    query = db.query(Audit)
    if q:
        term = f"%{q}%"
        # search action, username or data text
        query = query.filter((Audit.action.ilike(term)) | (Audit.username.ilike(term)) | (Audit.data.ilike(term)))
    return query.order_by(Audit.created_at.desc()).offset(skip).limit(limit).all()
