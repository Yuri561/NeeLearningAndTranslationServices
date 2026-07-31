# Lesson history schemas

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime, date, time
from enums.enums import LessonStatus


class LessonHistoryCreate(BaseModel):
    booking_id: int
    learner_id: int
    tutor_id: int
    service_id: int
    lesson_date: date
    start_time: time
    end_time: time
    duration_minutes: int
    status: LessonStatus
    learner_notes: Optional[str] = None
    tutor_notes: Optional[str] = None
    learner_rating: Optional[int] = Field(default=None, ge=1, le=5)


class LessonHistoryUpdate(BaseModel):
    status: Optional[LessonStatus] = None
    learner_notes: Optional[str] = None
    tutor_notes: Optional[str] = None
    learner_rating: Optional[int] = Field(default=None, ge=1, le=5)


class LessonHistoryResponse(LessonHistoryCreate):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
