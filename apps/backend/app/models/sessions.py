from sqlalchemy import String, Boolean, Integer, DateTime, Date, Text, Enum,ForeignKey,Time
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import List,Optional,TYPE_CHECKING
from datetime import datetime,timezone,time
from app.extensions import db 
import enum

if TYPE_CHECKING:
    from .workshops import Workshop
    from .user import SystemUser
    from .attendance import Attendance

class Session(db.Model):
    __tablename__ = "sessions"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    workshop_id: Mapped[int] = mapped_column(Integer, ForeignKey('workshops.id'), nullable=False)
    date: Mapped[Date] = mapped_column(Date, nullable=False)
    start_time: Mapped[time] = mapped_column(Time, nullable=False)
    end_time: Mapped[time] = mapped_column(Time, nullable=False)
    topic: Mapped[Optional[str]] = mapped_column(String(255))
    observations: Mapped[Optional[str]] = mapped_column(Text)
    professional_id: Mapped[int] = mapped_column(Integer, ForeignKey('system_users.id'))
    status: Mapped[str] = mapped_column(String(20), default='scheduled')
    created_at: Mapped[datetime] = mapped_column(DateTime(),default=lambda: datetime.now(timezone.utc))#AGREGADO
    updated_at: Mapped[datetime] = mapped_column(DateTime(), default=lambda: datetime.now(timezone.utc))
    
    #relaciones
    workshop = relationship("Workshop", back_populates="sessions")
    professional = relationship("SystemUser", foreign_keys=[professional_id], back_populates="sessions_taught")
    attendances = relationship("Attendance", back_populates="session")
    
    def serialize(self):
        """Serializar sesión para JSON"""
        return {
            "id": self.id,
            "workshop_id": self.workshop_id,
            "workshop_name": self.workshop.name,
            "date": self.date,
            "start_time": self.start_time,
            "end_time": self.end_time,
            "topic": self.topic,
            "observations": self.observations,
            "professional_id": self.professional_id,
            "professional_name": f"{self.professional.name} {self.professional.last_name}",
            "status": self.status,
            "created_at": self.created_at,
            "updated_at": self.updated_at
        }   
