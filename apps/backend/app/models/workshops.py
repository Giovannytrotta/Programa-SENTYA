from sqlalchemy import String, Boolean, Integer, DateTime, Date, Text, Enum,ForeignKey, Time
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import List,Optional,TYPE_CHECKING
from datetime import datetime,timezone,time
from app.extensions import db 
import enum

if TYPE_CHECKING:
    from .thematic_areas import ThematicArea
    from .css import Css
    from .user import SystemUser
    from .workshop_users import WorkshopUser
    from .sessions import Session

class WorkshopStatus(enum.Enum):
    PENDING = "pending"
    ACTIVE = "active"
    PAUSED = "paused"
    FINISHED = "finished"
    
class Workshop(db.Model):
    __tablename__ = "workshops"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)
    # Relaciones
    thematic_area_id: Mapped[int] = mapped_column(Integer, ForeignKey('thematic_areas.id'))
    css_id: Mapped[int] = mapped_column(Integer, ForeignKey('css.id'), nullable=False)
    professional_id: Mapped[int] = mapped_column(Integer, ForeignKey('system_users.id'))
    # Capacidad
    max_capacity: Mapped[int] = mapped_column(Integer, nullable=False, default=30)
    current_capacity: Mapped[int] = mapped_column(Integer, default=0)
    # Cronograma
    start_time: Mapped[time] = mapped_column(Time, nullable=False)
    end_time: Mapped[time] = mapped_column(Time, nullable=False)
    week_days: Mapped[str] = mapped_column(String(20), nullable=False)  # "L,M,X,J,V,S,D"
    start_date: Mapped[Date] = mapped_column(Date, nullable=False)
    end_date: Mapped[Optional[Date]] = mapped_column(Date)
    # informacion adicional
    location: Mapped[Optional[str]] = mapped_column(String(200))
    session_duration: Mapped[Optional[int]] = mapped_column(Integer)  # in minutes
    status: Mapped[WorkshopStatus] = mapped_column(db.Enum(WorkshopStatus), default=WorkshopStatus.PENDING)
    observations: Mapped[Optional[str]] = mapped_column(Text)
    # Marcas de tiempo
    created_at: Mapped[datetime] = mapped_column(DateTime(),default=lambda: datetime.now(timezone.utc))#AGREGADO
    updated_at: Mapped[datetime] = mapped_column(DateTime(), default=lambda: datetime.now(timezone.utc))
    created_by: Mapped[int] = mapped_column(Integer, ForeignKey('system_users.id'))
    # Relaciones
    thematic_area = relationship("ThematicArea", back_populates="workshops")
    css = relationship("Css", back_populates="workshops")
    professional = relationship("SystemUser", back_populates="assigned_workshops",foreign_keys="[Workshop.professional_id]" )
    creator = relationship("SystemUser", foreign_keys="[Workshop.created_by]", back_populates="created_workshops")
    user_assignments = relationship("WorkshopUser", back_populates="workshop", foreign_keys="WorkshopUser.workshop_id")
    sessions = relationship("Session", back_populates="workshop")