"""add 1994 fields: departamento static info + indicador econ/mortality

Revision ID: 9c1f4d2a8e3b
Revises: 5b2e08f4a1c3
Create Date: 2026-06-23 08:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "9c1f4d2a8e3b"
down_revision: Union[str, None] = "5b2e08f4a1c3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("departamento", sa.Column("feria_titular", sa.String(length=200), nullable=True))
    op.add_column("departamento", sa.Column("distancia_capital_km", sa.Integer(), nullable=True))
    op.add_column("departamento", sa.Column("idiomas_predominantes", sa.Text(), nullable=True))

    op.add_column("indicador", sa.Column("mortalidad_general", sa.Numeric(precision=5, scale=2), nullable=True))
    op.add_column("indicador", sa.Column("mortalidad_materna", sa.Numeric(precision=5, scale=2), nullable=True))
    op.add_column("indicador", sa.Column("poblacion_activa", sa.Integer(), nullable=True))
    op.add_column("indicador", sa.Column("poblacion_ocupada", sa.Integer(), nullable=True))
    op.add_column("indicador", sa.Column("poblacion_desocupada", sa.Integer(), nullable=True))
    op.add_column("indicador", sa.Column("ingreso_medio_anual", sa.Numeric(precision=12, scale=2), nullable=True))


def downgrade() -> None:
    op.drop_column("indicador", "ingreso_medio_anual")
    op.drop_column("indicador", "poblacion_desocupada")
    op.drop_column("indicador", "poblacion_ocupada")
    op.drop_column("indicador", "poblacion_activa")
    op.drop_column("indicador", "mortalidad_materna")
    op.drop_column("indicador", "mortalidad_general")

    op.drop_column("departamento", "idiomas_predominantes")
    op.drop_column("departamento", "distancia_capital_km")
    op.drop_column("departamento", "feria_titular")
