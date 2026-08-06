from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String, ForeignKey
from database.database import engine
from datetime import time, date
from schemas.availability import Day
from database.base import Base
#setting up the models

#creating the Availabililty table
class Availability(Base):
    __tablename__ = "availabilities" #the name of our table
    #define our columns
    id: Mapped[int] = mapped_column(primary_key=True)
    tutor_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    start_time: Mapped[time] = mapped_column()
    end_time: Mapped[time] = mapped_column()
    day: Mapped[Day] = mapped_column()
    is_active: Mapped[bool] = mapped_column()
    
    
#create the table 
Base.metadata.create_all(bind=engine)
