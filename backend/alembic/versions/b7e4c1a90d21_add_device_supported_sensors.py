"""add device supported_sensors

Revision ID: b7e4c1a90d21
Revises: 341d330d1b92
Create Date: 2026-09-29 16:40:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "b7e4c1a90d21"
down_revision: Union[str, None] = "341d330d1b92"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("devices", sa.Column("supported_sensors", sa.JSON(), nullable=True))


def downgrade() -> None:
    op.drop_column("devices", "supported_sensors")
