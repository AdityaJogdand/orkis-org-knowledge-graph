"""add faculty_members, venues, timetable_slots; add code to subjects

Revision ID: 0007
Revises: 0006
Create Date: 2026-08-06
"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "0007"
down_revision = "0006"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. Add code column to subjects
    op.add_column("subjects", sa.Column("code", sa.String(32), nullable=True))
    op.create_index("ix_subjects_code", "subjects", ["code"])

    # 2. faculty_members — one row per person in the timetable
    op.create_table(
        "faculty_members",
        sa.Column(
            "id", postgresql.UUID(as_uuid=True), nullable=False,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column("code", sa.String(16), nullable=False),
        sa.Column("full_name", sa.String(120), nullable=False),
        sa.Column("faculty_type", sa.String(16), nullable=False, server_default="Core"),
        sa.Column("weekly_hours_total", sa.SmallInteger(), nullable=True),
        sa.Column("user_login_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.ForeignKeyConstraint(["user_login_id"], ["user_login.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("code"),
    )
    op.create_index("ix_faculty_members_code", "faculty_members", ["code"])

    # 3. venues — classrooms and labs
    op.create_table(
        "venues",
        sa.Column(
            "id", postgresql.UUID(as_uuid=True), nullable=False,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column("code", sa.String(16), nullable=False),  # e.g. C101, L205
        sa.Column("label", sa.String(32), nullable=False),  # e.g. C-101, L-205
        sa.Column("venue_type", sa.String(16), nullable=False),  # classroom / lab
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("code"),
    )
    op.create_index("ix_venues_code", "venues", ["code"])

    # 4. timetable_slots — individual slot entries
    op.create_table(
        "timetable_slots",
        sa.Column(
            "id", postgresql.UUID(as_uuid=True), nullable=False,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column("academic_year", sa.String(16), nullable=False, server_default="2026-27"),
        sa.Column("programme_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("semester_number", sa.SmallInteger(), nullable=False),
        sa.Column("division", sa.String(4), nullable=True),
        sa.Column("day_of_week", sa.String(16), nullable=False),
        sa.Column("slot_start", sa.Time(), nullable=False),
        sa.Column("slot_end", sa.Time(), nullable=False),
        sa.Column("subject_code", sa.String(32), nullable=True),
        sa.Column("subject_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("faculty_code", sa.String(16), nullable=True),
        sa.Column("faculty_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("venue_label", sa.String(32), nullable=True),
        sa.Column("venue_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("batch", sa.String(8), nullable=True),
        sa.Column("slot_type", sa.String(16), nullable=False, server_default="Lecture"),
        sa.ForeignKeyConstraint(["programme_id"], ["programmes.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["subject_id"], ["subjects.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["faculty_id"], ["faculty_members.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["venue_id"], ["venues.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_slots_programme_sem", "timetable_slots",
        ["programme_id", "semester_number", "day_of_week"],
    )
    op.create_index("ix_slots_faculty", "timetable_slots", ["faculty_id"])
    op.create_index("ix_slots_venue", "timetable_slots", ["venue_id"])


def downgrade() -> None:
    op.drop_index("ix_slots_venue", table_name="timetable_slots")
    op.drop_index("ix_slots_faculty", table_name="timetable_slots")
    op.drop_index("ix_slots_programme_sem", table_name="timetable_slots")
    op.drop_table("timetable_slots")
    op.drop_index("ix_venues_code", table_name="venues")
    op.drop_table("venues")
    op.drop_index("ix_faculty_members_code", table_name="faculty_members")
    op.drop_table("faculty_members")
    op.drop_index("ix_subjects_code", table_name="subjects")
    op.drop_column("subjects", "code")
