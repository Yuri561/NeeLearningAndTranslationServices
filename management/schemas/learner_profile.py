# Learner profile schemas

from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class LearnerProfileCreate(BaseModel):
    bio: Optional[str] = None
    learning_goals: Optional[str] = None
    preferred_language: Optional[str] = None
    profile_picture_url: Optional[str] = None


class LearnerProfileUpdate(LearnerProfileCreate):
    pass


class LearnerProfileResponse(LearnerProfileCreate):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True
