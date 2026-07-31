# Student profile schemas

from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class StudentProfileCreate(BaseModel):
    bio: Optional[str] = None
    learning_goals: Optional[str] = None
    preferred_language: Optional[str] = None


class StudentProfileUpdate(StudentProfileCreate):
    pass


class StudentProfileResponse(StudentProfileCreate):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True
