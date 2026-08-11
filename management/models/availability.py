from datetime import time

from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from database.base import Base
from database.database import engine
from schemas.availability import Day


class Availability(Base):
    __tablename__ = "availabilities"

    id: Mapped[int] = mapped_column(
        primary_key=True
    )

    tutor_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        nullable=False
    )

    start_time: Mapped[time] = mapped_column(
        nullable=False
    )

    end_time: Mapped[time] = mapped_column(
        nullable=False
    )

    day: Mapped[Day] = mapped_column(
        nullable=False
    )

    is_active: Mapped[bool] = mapped_column(
        nullable=False,
        default=True
    )


Base.metadata.create_all(bind=engine)