from __future__ import annotations

import uuid
from datetime import datetime, time, timezone

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, SmallInteger, String, Text, Time
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


class UserLogin(Base):
    __tablename__ = "user_login"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(254), unique=True, nullable=False)
    password: Mapped[str] = mapped_column(Text, nullable=False)
    role: Mapped[str] = mapped_column(String(120), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    refresh_tokens: Mapped[list[RefreshToken]] = relationship("RefreshToken", back_populates="user")
    workloads: Mapped[list[FacultyWorkload]] = relationship("FacultyWorkload", back_populates="user")


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("user_login.id", ondelete="CASCADE"), nullable=False
    )
    token_hash: Mapped[str] = mapped_column(Text, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    revoked: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    user: Mapped[UserLogin] = relationship("UserLogin", back_populates="refresh_tokens")


class Programme(Base):
    __tablename__ = "programmes"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    code: Mapped[str] = mapped_column(String(32), unique=True, nullable=False)

    subjects: Mapped[list[Subject]] = relationship("Subject", back_populates="programme")


class Subject(Base):
    __tablename__ = "subjects"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    programme_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("programmes.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    code: Mapped[str | None] = mapped_column(String(32), nullable=True)
    semester_number: Mapped[int] = mapped_column(Integer, nullable=False)
    category: Mapped[str] = mapped_column(String(32), nullable=False, default="Core")

    programme: Mapped[Programme] = relationship("Programme", back_populates="subjects")
    workloads: Mapped[list[FacultyWorkload]] = relationship("FacultyWorkload", back_populates="subject")


class FacultyWorkload(Base):
    __tablename__ = "faculty_workload"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    subject_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False
    )
    user_login_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("user_login.id", ondelete="SET NULL"), nullable=True
    )
    faculty_name: Mapped[str] = mapped_column(String(120), nullable=False)
    faculty_type: Mapped[str] = mapped_column(String(32), nullable=False, default="Core")
    division: Mapped[str | None] = mapped_column(String(8), nullable=True)
    academic_year: Mapped[str] = mapped_column(String(16), nullable=False, default="2024-25")

    subject: Mapped[Subject] = relationship("Subject", back_populates="workloads")
    user: Mapped[UserLogin | None] = relationship("UserLogin", back_populates="workloads")


class FacultyMember(Base):
    __tablename__ = "faculty_members"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code: Mapped[str] = mapped_column(String(16), unique=True, nullable=False)
    full_name: Mapped[str] = mapped_column(String(120), nullable=False)
    faculty_type: Mapped[str] = mapped_column(String(16), nullable=False, default="Core")
    weekly_hours_total: Mapped[int | None] = mapped_column(SmallInteger, nullable=True)
    user_login_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("user_login.id", ondelete="SET NULL"), nullable=True
    )
    chaired_programme_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("programmes.id", ondelete="SET NULL"), nullable=True
    )


class Venue(Base):
    __tablename__ = "venues"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code: Mapped[str] = mapped_column(String(16), unique=True, nullable=False)
    label: Mapped[str] = mapped_column(String(32), nullable=False)
    venue_type: Mapped[str] = mapped_column(String(16), nullable=False)


class TimetableSlot(Base):
    __tablename__ = "timetable_slots"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    academic_year: Mapped[str] = mapped_column(String(16), nullable=False, default="2026-27")
    programme_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("programmes.id", ondelete="SET NULL"), nullable=True
    )
    semester_number: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    division: Mapped[str | None] = mapped_column(String(4), nullable=True)
    day_of_week: Mapped[str] = mapped_column(String(16), nullable=False)
    slot_start: Mapped[time] = mapped_column(Time, nullable=False)
    slot_end: Mapped[time] = mapped_column(Time, nullable=False)
    subject_code: Mapped[str | None] = mapped_column(String(32), nullable=True)
    subject_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("subjects.id", ondelete="SET NULL"), nullable=True
    )
    faculty_code: Mapped[str | None] = mapped_column(String(16), nullable=True)
    faculty_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("faculty_members.id", ondelete="SET NULL"), nullable=True
    )
    venue_label: Mapped[str | None] = mapped_column(String(32), nullable=True)
    venue_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("venues.id", ondelete="SET NULL"), nullable=True
    )
    batch: Mapped[str | None] = mapped_column(String(8), nullable=True)
    slot_type: Mapped[str] = mapped_column(String(16), nullable=False, default="Lecture")
