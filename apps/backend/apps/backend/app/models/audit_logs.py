from sqlalchemy import String, Boolean, Integer, DateTime, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import Optional,TYPE_CHECKING
from datetime import datetime,timezone
from app.extensions import db

if TYPE_CHECKING:
    from .user import SystemUser

class AuditLog(db.Model):
    __tablename__ = "audit_logs"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    table_name: Mapped[str] = mapped_column(String(50), nullable=False)
    record_id: Mapped[int] = mapped_column(Integer, nullable=False)
    action: Mapped[str] = mapped_column(String(20), nullable=False)
    old_data: Mapped[Optional[str]] = mapped_column(Text)
    new_data: Mapped[Optional[str]] = mapped_column(Text)
    user_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey('system_users.id'))
    ip_address: Mapped[Optional[str]] = mapped_column(String(45))
    user_agent: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(),default=lambda: datetime.now(timezone.utc))#AGREGADO
    role_assigned_by: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    role_assignment_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    two_factor_last_used: Mapped[Optional[datetime]] = mapped_column(DateTime)#"Última vez que usó 2FA"

    
    # Relationships
    user = relationship("SystemUser", back_populates="audit_logs")