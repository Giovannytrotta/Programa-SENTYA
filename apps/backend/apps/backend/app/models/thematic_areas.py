from sqlalchemy import String, Boolean, Integer, DateTime, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from app.extensions import db
from typing import Optional,TYPE_CHECKING
from datetime import datetime,timezone

if TYPE_CHECKING:
    from .workshops import Workshop
    from .thematic_areas import ThematicArea

class ThematicArea(db.Model):
    __tablename__ = "thematic_areas"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)
    color: Mapped[Optional[str]] = mapped_column(String(7))  # Hex color
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(),default=lambda: datetime.now(timezone.utc))#AGREGADO
    # Relaciones
    workshops = relationship("Workshop", back_populates="thematic_area")