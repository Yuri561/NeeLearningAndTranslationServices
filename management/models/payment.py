from decimal import Decimal

from sqlalchemy import ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column

from database.base import Base
from database.database import engine


class Payment(Base):
    __tablename__ = "payments"

    id: Mapped[int] = mapped_column(
        primary_key=True
    )

    booking_id: Mapped[int] = mapped_column(
        ForeignKey("bookings.id"),
        nullable=False
    )

    learner_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        nullable=False
    )

    tutor_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        nullable=False
    )

    paypal_order_id: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        unique=True
    )

    paypal_capture_id: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
        unique=True
    )

    amount: Mapped[Decimal] = mapped_column(
        Numeric(10, 2),
        nullable=False
    )

    currency: Mapped[str] = mapped_column(
        String(10),
        nullable=False,
        default="USD"
    )

    status: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="PENDING"
    )


Base.metadata.create_all(bind=engine)