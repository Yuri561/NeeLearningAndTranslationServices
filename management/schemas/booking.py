
#booking schema
from pydantic import BaseModel
from enums.enums import Status
from datetime import time, date
from typing import Optional


class BookingCreate(BaseModel):
    learner_id : int
    service_id : int
    tutor_id : int
    availability_id : int
    booking_date : date
    start_time : time
    end_time : time
    status : Status = Status.PENDING
    notes : Optional[str] = None
    
class BookingResponse(BookingCreate):
    id : int
    
    class Config:
        from_attributes = True
    