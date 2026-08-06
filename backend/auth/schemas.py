from uuid import UUID

from pydantic import BaseModel


class LoginIn(BaseModel):
    email: str
    password: str


class TokenPairOut(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshIn(BaseModel):
    refresh_token: str


class ChangePasswordIn(BaseModel):
    old_password: str
    new_password: str


class UserOut(BaseModel):
    id: UUID
    email: str
    role: str
    title: str = ""              # "Dr." / "Prof."
    chaired_programme: str = ""  # e.g. "B.Tech AI&DS" — set for Programme Chairpersons

    model_config = {"from_attributes": True}
