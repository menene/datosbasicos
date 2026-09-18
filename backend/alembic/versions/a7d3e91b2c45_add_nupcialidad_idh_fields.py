"""add nupcialidad indicators and IDH value

Revision ID: a7d3e91b2c45
Revises: 9c1f4d2a8e3b
Create Date: 2026-08-27 13:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "a7d3e91b2c45"
down_revision: Union[str, None] = "9c1f4d2a8e3b"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("indicador", sa.Column("matrimonios_por_1000", sa.Numeric(precision=4, scale=2), nullable=True))
    op.add_column("indicador", sa.Column("pct_uniones_consensuales", sa.Numeric(precision=5, scale=2), nullable=True))
    op.add_column("indicador", sa.Column("edad_primera_union", sa.Numeric(precision=4, scale=1), nullable=True))
    op.add_column("indicador", sa.Column("idh", sa.Numeric(precision=4, scale=3), nullable=True))


def downgrade() -> None:
    op.drop_column("indicador", "idh")
    op.drop_column("indicador", "edad_primera_union")
    op.drop_column("indicador", "pct_uniones_consensuales")
    op.drop_column("indicador", "matrimonios_por_1000")
