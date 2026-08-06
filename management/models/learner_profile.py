# ============================================================================
# LEARNER PROFILE MODEL
# ----------------------------------------------------------------------------
# Separate profile table for learners linked to the users table.
# Every new user gets a learner profile automatically at registration.
# ============================================================================

from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String, ForeignKey, func, text
from database.database import engine
from datetime import datetime
from database.base import Base


class LearnerProfile(Base):
    __tablename__ = "learner_profiles"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True, index=True)
    bio: Mapped[str | None] = mapped_column(String(500), nullable=True)
    learning_goals: Mapped[str | None] = mapped_column(String(500), nullable=True)
    preferred_language: Mapped[str | None] = mapped_column(String(50), nullable=True)
    profile_picture_url: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())


Base.metadata.create_all(bind=engine)

# add profile_picture_url column to existing tables if missing
with engine.connect() as conn:
    conn.execute(text("""
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'learner_profiles' AND column_name = 'profile_picture_url'
            ) THEN
                ALTER TABLE learner_profiles ADD COLUMN profile_picture_url VARCHAR(1000);
            END IF;
        END $$;
    """))
    conn.commit()
