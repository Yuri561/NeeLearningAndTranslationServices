# ============================================================================
# LESSON HISTORY MODEL
# ----------------------------------------------------------------------------
# Tracks completed, cancelled, or no-show lesson sessions.
# One record is created per lesson that has ended.
# Links to the learner, tutor, and the original booking.
# ============================================================================

from sqlalchemy.orm import  Mapped, mapped_column
from sqlalchemy import String, ForeignKey, DateTime, func, Text
from database.database import engine
from datetime import datetime, date, time
from enums.enums import LessonStatus
from database.base import Base




class LessonHistory(Base):
    __tablename__ = "lesson_history"

    id: Mapped[int] = mapped_column(primary_key=True)
    booking_id: Mapped[int] = mapped_column(ForeignKey("bookings.id"), index=True)
    learner_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    tutor_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    service_id: Mapped[int] = mapped_column(ForeignKey("services.id"))
    lesson_date: Mapped[date] = mapped_column()
    start_time: Mapped[time] = mapped_column()
    end_time: Mapped[time] = mapped_column()
    duration_minutes: Mapped[int] = mapped_column()
    status: Mapped[LessonStatus] = mapped_column(String(20))
    learner_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    tutor_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    learner_rating: Mapped[int | None] = mapped_column(nullable=True)  # 1–5
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())


Base.metadata.create_all(bind=engine)
