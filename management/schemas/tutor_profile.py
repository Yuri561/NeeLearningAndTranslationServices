# Teacher profile schemas

from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class TeacherProfileCreate(BaseModel):
    bio: Optional[str] = None
    specialization: Optional[list[str]] = None
    years_of_experience: Optional[int] = None
    hourly_rate: Optional[float] = None
    meeting_platform: Optional[list[str]] = None


class TeacherProfileUpdate(TeacherProfileCreate):
    pass


class TeacherProfileResponse(TeacherProfileCreate):
    id: int
    user_id: int
    is_verified: bool
    created_at: datetime

    class Config:
        from_attributes = True
