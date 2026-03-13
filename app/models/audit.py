from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey
from datetime import datetime
from sqlalchemy.orm import relationship
from app.database import Base


class Audit(Base):
    __tablename__ = 'audits'

    id = Column(Integer, primary_key=True, index=True)
    action = Column(String(100), nullable=False)
    data = Column(Text, nullable=True)  # JSON/stringified payload
    user_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    username = Column(String(150), nullable=True)
    ip_address = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship('User', backref='audits', viewonly=True)

    def __repr__(self):
        return f"<Audit id={self.id} action={self.action} user={self.username} ip={self.ip_address}>"
