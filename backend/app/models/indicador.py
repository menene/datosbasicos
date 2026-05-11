from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Integer, SmallInteger, Numeric, ForeignKey, TIMESTAMP, UniqueConstraint, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.database import Base

if TYPE_CHECKING:
    from app.models.departamento import Departamento


class Indicador(Base):
    __tablename__ = "indicador"
    __table_args__ = (
        UniqueConstraint("departamento_id", "anio", name="uq_indicador_depto_anio"),
        Index("idx_indicador_depto", "departamento_id"),
        Index("idx_indicador_anio", "anio"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    departamento_id: Mapped[int] = mapped_column(Integer, ForeignKey("departamento.id"), nullable=False)
    anio: Mapped[int] = mapped_column(SmallInteger, nullable=False, default=2025)

    # Población
    poblacion_total: Mapped[int | None] = mapped_column(Integer)
    poblacion_2005: Mapped[int | None] = mapped_column(Integer)
    densidad_hab_km2: Mapped[float | None] = mapped_column(Numeric(8, 2))
    pct_hombres: Mapped[float | None] = mapped_column(Numeric(5, 2))
    pct_mujeres: Mapped[float | None] = mapped_column(Numeric(5, 2))
    pct_urbana: Mapped[float | None] = mapped_column(Numeric(5, 2))
    pct_rural: Mapped[float | None] = mapped_column(Numeric(5, 2))
    pct_indigena: Mapped[float | None] = mapped_column(Numeric(5, 2))

    # Salud / Educación
    esperanza_vida: Mapped[float | None] = mapped_column(Numeric(4, 1))
    analfabetismo_pct: Mapped[float | None] = mapped_column(Numeric(5, 2))
    acceso_agua_pct: Mapped[float | None] = mapped_column(Numeric(5, 2))
    acceso_saneamiento_pct: Mapped[float | None] = mapped_column(Numeric(5, 2))

    # Familia
    fecundidad: Mapped[float | None] = mapped_column(Numeric(4, 2))
    crecimiento_anual_pct: Mapped[float | None] = mapped_column(Numeric(4, 2))

    # Desarrollo
    idh_ranking: Mapped[int | None] = mapped_column(SmallInteger)

    created_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now())

    departamento: Mapped["Departamento"] = relationship("Departamento", back_populates="indicadores")
