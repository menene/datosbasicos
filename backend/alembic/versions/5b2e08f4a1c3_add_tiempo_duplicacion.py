"""add tiempo_duplicacion_anios to indicador

Revision ID: 5b2e08f4a1c3
Revises: 4a8c76366651
Create Date: 2026-06-17 14:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "5b2e08f4a1c3"
down_revision: Union[str, None] = "4a8c76366651"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "indicador",
        sa.Column("tiempo_duplicacion_anios", sa.Numeric(precision=5, scale=2), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("indicador", "tiempo_duplicacion_anios")
