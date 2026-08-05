"""expand role column to 120 chars

Revision ID: 0004
Revises: 0003
Create Date: 2026-08-05
"""

import sqlalchemy as sa
from alembic import op

revision = "0004"
down_revision = "0003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.alter_column(
        "user_login",
        "role",
        existing_type=sa.String(32),
        type_=sa.String(120),
        existing_nullable=False,
    )


def downgrade() -> None:
    op.alter_column(
        "user_login",
        "role",
        existing_type=sa.String(120),
        type_=sa.String(32),
        existing_nullable=False,
    )
