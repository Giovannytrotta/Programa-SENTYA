
from sqlalchemy import String, Boolean, Integer, DateTime, Date, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import List,Optional
from datetime import datetime,timezone
from app.extensions import db 

    
class User(db.Model):
    __tablename__="users"
    id: Mapped[int] = mapped_column(Integer(),primary_key=True)
    dni: Mapped[str] = mapped_column(String(20), unique=True, nullable=False, comment='DNI único en el sistema')
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    prueba: Mapped[str] = mapped_column(String(100), nullable=False)
    LastName: Mapped[str] = mapped_column(String(150), nullable=False)
    email: Mapped[Optional[str]] = mapped_column(String(255), unique=True)
    phone: Mapped[Optional[str]] = mapped_column(String(20))
    date_of_birth: Mapped[Optional[Date]] = mapped_column(Date)
    address: Mapped[Optional[str]] = mapped_column(Text)
    observations: Mapped[Optional[str]] = mapped_column(Text)
    password: Mapped[str] = mapped_column(String(150),nullable= False)
    is_active: Mapped[bool] = mapped_column(Boolean(),default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(),default=lambda: datetime.now(timezone.utc))#AGREGADO
    updated_at: Mapped[datetime] = mapped_column(DateTime(), default=lambda: datetime.now(timezone.utc))

    
    
    def serialize(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "is_active": self.is_active
        }