from typing import Optional
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String, Boolean, DateTime, text
from datetime import datetime, timezone
from database.base import Base
from database.database import engine
from enums.enums import UserRole

# creating the users table
class User(Base):
    __tablename__ = "users"

    # define our columns
    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    hashed_password: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    auth_provider: Mapped[str] = mapped_column(String(20), default="local", server_default="local")
    full_name: Mapped[str] = mapped_column(String(100))
    role: Mapped[UserRole] = mapped_column(String(20), default="user")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(
    DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )


# create the table
Base.metadata.create_all(bind=engine)

# add new columns to existing users table if they don't exist yet
with engine.connect() as conn:
    # add auth_provider column if missing
    conn.execute(text("""
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'users' AND column_name = 'auth_provider'
            ) THEN
                ALTER TABLE users ADD COLUMN auth_provider VARCHAR(20) DEFAULT 'local' NOT NULL;
            END IF;
        END $$;
    """))
    # make hashed_password nullable if it isn't already
    conn.execute(text("""
        ALTER TABLE users ALTER COLUMN hashed_password DROP NOT NULL;
    """))
    conn.commit()
