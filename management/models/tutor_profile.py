# ============================================================================
# TUTOR PROFILE MODEL
# ----------------------------------------------------------------------------
# Separate profile table for tutors linked to the users table.
# A learner can request to become a tutor — this table is created then.
# ============================================================================

from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String, ARRAY, ForeignKey, func, text
from database.database import engine
from datetime import datetime
from database.base import Base


class TutorProfile(Base):
    __tablename__ = "tutor_profiles"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True, index=True)
    bio: Mapped[str | None] = mapped_column(String(500), nullable=True)
    specialization: Mapped[list[str] | None] = mapped_column(ARRAY(String), nullable=True)
    years_of_experience: Mapped[int | None] = mapped_column(nullable=True)
    hourly_rate: Mapped[float | None] = mapped_column(nullable=True)
    is_verified: Mapped[bool] = mapped_column(default=False)
    profile_picture_url: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    meeting_platform: Mapped[list[str] | None] = mapped_column(ARRAY(String), nullable=True)


Base.metadata.create_all(bind=engine)

# add profile_picture_url column to existing tables if missing
with engine.connect() as conn:
    conn.execute(text("""
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'tutor_profiles' AND column_name = 'profile_picture_url'
            ) THEN
                ALTER TABLE tutor_profiles ADD COLUMN profile_picture_url VARCHAR(1000);
            END IF;
        END $$;
    """))
    conn.commit()
