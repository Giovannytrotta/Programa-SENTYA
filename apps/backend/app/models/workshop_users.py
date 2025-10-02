from sqlalchemy import String, Boolean, Integer, DateTime, Date, Text, Enum,ForeignKey, Time
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import List,Optional, TYPE_CHECKING
from datetime import datetime,timezone,time
from app.extensions import db 
import enum

if TYPE_CHECKING:
    from .user import SystemUser
    from .workshops import Workshop

class WorkshopUser(db.Model):
    __tablename__ = "workshop_users"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey('system_users.id'), nullable=False)
    assigned_by: Mapped[int] = mapped_column(Integer, ForeignKey("system_users.id"), nullable=True)
    workshop_id: Mapped[int] = mapped_column(Integer, ForeignKey('workshops.id'), nullable=False)
    assignment_date: Mapped[datetime] = mapped_column(DateTime(), default=lambda: datetime.now(timezone.utc))
    unassignment_reason: Mapped[Optional[str]] = mapped_column(Text)
    unassignment_date: Mapped[datetime] = mapped_column(DateTime(), default=lambda: datetime.now(timezone.utc))
    waitlist_position: Mapped[Optional[int]] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(DateTime(),default=lambda: datetime.now(timezone.utc))
    created_by: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey('system_users.id'))
    #relaciones
    user = relationship("SystemUser", foreign_keys=[user_id], back_populates="workshop_assignments")
    assigned_by_user = relationship("SystemUser",foreign_keys=[assigned_by],)
        # si quisieras ver "asignaciones_hechas" desde SystemUser añade la relación simétrica con foreign_keys.)
    workshop = relationship("Workshop", back_populates="user_assignments", foreign_keys=[workshop_id],)
    creator = relationship("SystemUser", foreign_keys=[created_by])
    
    def serialize(self):
        """Serializar inscripción para JSON"""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "user_name": f"{self.user.name} {self.user.last_name}" if self.user else None,
            "workshop_id": self.workshop_id,
            "workshop_name": self.workshop.name if self.workshop else None,
            "assigned_by": self.assigned_by,
            "assigned_by_name": f"{self.assigned_by_user.name} {self.assigned_by_user.last_name}" if self.assigned_by_user else None,
            "assignment_date": self.assignment_date.isoformat() if self.assignment_date else None,
            "waitlist_position": self.waitlist_position,
            "in_waitlist": self.waitlist_position is not None,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }   

