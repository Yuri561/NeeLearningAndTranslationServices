from datetime import date, time
from decimal import Decimal

from sqlalchemy import ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column

from database.base import Base
from database.database import engine


class Booking(Base):
    __tablename__ = "bookings"

    id: Mapped[int] = mapped_column(
        primary_key=True
    )

    service_id: Mapped[int] = mapped_column(
        ForeignKey("services.id"),
        nullable=False
    )

    availability_id: Mapped[int] = mapped_column(
        ForeignKey("availabilities.id"),
        nullable=False
    )

    learner_id: Mapped[int] = mapped_column(ForeignKey("users.id"),  nullable=False)

    tutor_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        nullable=False
    )

    status: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="pending"
    )

    notes: Mapped[str | None] = mapped_column(
        String(250),
        nullable=True
    )

    total_price: Mapped[Decimal] = mapped_column(
        Numeric(10, 2),
        nullable=False
    )

    start_time: Mapped[time] = mapped_column(
        nullable=False
    )

    end_time: Mapped[time] = mapped_column(
        nullable=False
    )

    booking_date: Mapped[date] = mapped_column(
        nullable=False
    )


Base.metadata.create_all(bind=engine)