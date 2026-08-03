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
    full_name: str
    roles: list[str]
    is_active: bool

    model_config = {"from_attributes": True}


class OtpRequestIn(BaseModel):
    email: str


class OtpVerifyIn(BaseModel):
    email: str
    otp: str
