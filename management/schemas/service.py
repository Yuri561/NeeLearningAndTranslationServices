from typing import Optional

from pydantic import BaseModel
from enums.enums import LanguageCode

# ==========================
# Tutor Information
# ==========================

class TutorMiniResponse(BaseModel):
    tutor_id: int
    full_name: str
    email: str
    bio: str | None = None
    specialization: Optional[list[str]] | None = None
    years_of_experience: int | None = None
    hourly_rate: float | None = None
    meeting_platform: list[str] | None = None
    is_verified: bool | None = None

    class Config:
        from_attributes = True


# ==========================
# Service Request
# ==========================

class ServiceCreate(BaseModel):
    name: str
    description: str
    category: str
    price: float
    duration_minutes: int
    is_active: bool = True
    language: LanguageCode


# ==========================
# Basic Service Response
# ==========================

class ServiceResponse(ServiceCreate):
    id: int

    class Config:
        from_attributes = True


# ==========================
# Service + Tutor Response
# ==========================

class ServiceWithTutorResponse(ServiceResponse):
    tutor: TutorMiniResponse