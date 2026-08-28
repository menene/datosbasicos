"""add IDH components and electoral participation

Revision ID: b8e5c02f7d19
Revises: a7d3e91b2c45
Create Date: 2026-08-27 15:10:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "b8e5c02f7d19"
down_revision: Union[str, None] = "a7d3e91b2c45"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("indicador", sa.Column("idh_salud", sa.Numeric(precision=4, scale=3), nullable=True))
    op.add_column("indicador", sa.Column("idh_educacion", sa.Numeric(precision=4, scale=3), nullable=True))
    op.add_column("indicador", sa.Column("idh_ingresos", sa.Numeric(precision=4, scale=3), nullable=True))

    op.add_column("indicador", sa.Column("padron_electoral", sa.Integer(), nullable=True))
    op.add_column("indicador", sa.Column("votos_emitidos", sa.Integer(), nullable=True))
    op.add_column("indicador", sa.Column("abstencionismo_pct", sa.Numeric(precision=5, scale=2), nullable=True))
    op.add_column("indicador", sa.Column("participacion_pct", sa.Numeric(precision=5, scale=2), nullable=True))


def downgrade() -> None:
    op.drop_column("indicador", "participacion_pct")
    op.drop_column("indicador", "abstencionismo_pct")
    op.drop_column("indicador", "votos_emitidos")
    op.drop_column("indicador", "padron_electoral")

    op.drop_column("indicador", "idh_ingresos")
    op.drop_column("indicador", "idh_educacion")
    op.drop_column("indicador", "idh_salud")
