# User schemas - defines how authentication data should look like

from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional
from enums.enums import UserRole

# schema for user registration — role is always set to learner by the backend
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: UserRole


# schema for user login
class UserLogin(BaseModel):
    email: EmailStr
    password: str


# schema for user response (never includes password)
class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    role: UserRole
    auth_provider: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


# schema for token response
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


# schema used when a learner requests to become a tutor
class BecomeTutorRequest(BaseModel):
    bio: Optional[str] = None
    specialization: Optional[str] = None
    years_of_experience: Optional[int] = None
    hourly_rate: Optional[float] = None


# schema for forgot password request
class ForgotPasswordRequest(BaseModel):
    email: EmailStr


# schema for reset password request
class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


# schema for changing password while logged in (learner or tutor)
class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str
