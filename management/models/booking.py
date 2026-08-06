from sqlalchemy.orm import  Mapped, mapped_column
from sqlalchemy import String, ForeignKey
from database.database import engine
from datetime import time, date
from database.base import Base

#setting up the models

#creating the Booking table
class Booking(Base):
    __tablename__ = "bookings" #the name of our table
    #define our columns
    id: Mapped[int] = mapped_column(primary_key=True)
    service_id: Mapped[int] = mapped_column()
    availability_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    learner_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    tutor_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    status: Mapped[str] = mapped_column(String(50))
    notes: Mapped[str | None] = mapped_column(String(250), nullable=True)
    start_time: Mapped[time] = mapped_column()
    end_time: Mapped[time] = mapped_column()
    booking_date: Mapped[date] = mapped_column()
    
    
#create the table 
Base.metadata.create_all(bind=engine)
