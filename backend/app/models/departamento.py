from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import String, Text, Numeric, ForeignKey, Integer, TIMESTAMP
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.database import Base

if TYPE_CHECKING:
    from app.models.region import Region
    from app.models.indicador import Indicador


class Departamento(Base):
    __tablename__ = "departamento"

    id: Mapped[int] = mapped_column(primary_key=True)
    slug: Mapped[str] = mapped_column(String(60), unique=True, nullable=False)
    nombre: Mapped[str] = mapped_column(String(100), nullable=False)
    region_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("region.id"))
    superficie_km2: Mapped[float | None] = mapped_column(Numeric(10, 2))
    descripcion: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now())

    region_obj: Mapped["Region | None"] = relationship("Region", back_populates="departamentos")
    indicadores: Mapped[list["Indicador"]] = relationship("Indicador", back_populates="departamento")
