from sqlalchemy import String, Boolean, Integer, DateTime, Date, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import List,Optional, TYPE_CHECKING
from datetime import datetime,timezone
from app.extensions import db

if TYPE_CHECKING:
    from .user import SystemUser
    from .workshops import Workshop

class Css(db.Model):
    __tablename__="css"
    id: Mapped[int] = mapped_column(Integer(),primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)#Centro de Servicios Sociales
    code: Mapped[str] = mapped_column(String(10), nullable=False)#Código único del centro
    address: Mapped[Optional[str]] = mapped_column(Text)
    phone: Mapped[Optional[str]] = mapped_column(String(20))
    email: Mapped[Optional[str]] = mapped_column(String(255))
    manager: Mapped[Optional[str]] = mapped_column(String(200))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime(),default=lambda: datetime.now(timezone.utc))#AGREGADO
    updated_at: Mapped[datetime] = mapped_column(DateTime(), default=lambda: datetime.now(timezone.utc))
    #relacion
    system_users = relationship("SystemUser", back_populates="css")
    workshops = relationship("Workshop", back_populates="css")