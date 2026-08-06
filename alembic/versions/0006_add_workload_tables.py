"""add programmes, subjects, faculty_workload tables

Revision ID: 0006
Revises: 0005
Create Date: 2026-08-06
"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "0006"
down_revision = "0005"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. programmes
    op.create_table(
        "programmes",
        sa.Column(
            "id", postgresql.UUID(as_uuid=True), nullable=False,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column("name", sa.String(120), nullable=False),
        sa.Column("code", sa.String(32), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("code"),
    )

    # 2. subjects
    op.create_table(
        "subjects",
        sa.Column(
            "id", postgresql.UUID(as_uuid=True), nullable=False,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column("programme_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("semester_number", sa.Integer(), nullable=False),
        sa.Column("category", sa.String(32), nullable=False, server_default="Core"),
        sa.ForeignKeyConstraint(["programme_id"], ["programmes.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_subjects_programme_semester", "subjects", ["programme_id", "semester_number"])

    # 3. faculty_workload
    op.create_table(
        "faculty_workload",
        sa.Column(
            "id", postgresql.UUID(as_uuid=True), nullable=False,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column("subject_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_login_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("faculty_name", sa.String(120), nullable=False),
        sa.Column("faculty_type", sa.String(32), nullable=False, server_default="Core"),
        sa.Column("division", sa.String(8), nullable=True),
        sa.Column("academic_year", sa.String(16), nullable=False, server_default="2024-25"),
        sa.ForeignKeyConstraint(["subject_id"], ["subjects.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_login_id"], ["user_login.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_faculty_workload_user", "faculty_workload", ["user_login_id"])
    op.create_index("ix_faculty_workload_subject", "faculty_workload", ["subject_id"])


def downgrade() -> None:
    op.drop_index("ix_faculty_workload_subject", table_name="faculty_workload")
    op.drop_index("ix_faculty_workload_user", table_name="faculty_workload")
    op.drop_table("faculty_workload")
    op.drop_index("ix_subjects_programme_semester", table_name="subjects")
    op.drop_table("subjects")
    op.drop_table("programmes")
