from sqlalchemy import String, Boolean, Integer, DateTime, Text,ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import List,Optional,TYPE_CHECKING
from datetime import datetime,timezone
from app.extensions import db 
import enum

if TYPE_CHECKING:
    from .sessions import Session
    from .user import SystemUser
    

class Attendance(db.Model):
    __tablename__ = "attendances"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    session_id: Mapped[int] = mapped_column(Integer, ForeignKey('sessions.id'), nullable=False)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey('system_users.id'), nullable=False)
    present: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    observations: Mapped[Optional[str]] = mapped_column(Text)
    recorded_by: Mapped[int] = mapped_column(Integer, ForeignKey('system_users.id'), nullable=False)
    recorded_at: Mapped[datetime] = mapped_column(DateTime(), default=lambda: datetime.now(timezone.utc))
    # Relacion
    session = relationship("Session", back_populates="attendances")
    user = relationship("SystemUser", foreign_keys=[user_id], back_populates="attendances")
    recorder = relationship("SystemUser", foreign_keys=[recorded_by], back_populates="attendances_recorded")