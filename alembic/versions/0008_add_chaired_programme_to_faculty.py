"""add chaired_programme_id to faculty_members

Revision ID: 0008
Revises: 0007
Create Date: 2026-08-06
"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "0008"
down_revision = "0007"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "faculty_members",
        sa.Column(
            "chaired_programme_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("programmes.id", ondelete="SET NULL"),
            nullable=True,
        ),
    )


def downgrade() -> None:
    op.drop_column("faculty_members", "chaired_programme_id")
