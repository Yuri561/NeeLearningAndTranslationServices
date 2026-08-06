#######################################################################
#                                                                     #
#                    ADMIN BOOKING MANAGEMENT API                     #
#                                                                     #
#        Full CRUD operations for booking administration              #
#        - Get All Bookings                                           #
#        - Get Booking By ID                                          #
#        - Create Booking                                             #
#        - Update Booking                                             #
#        - Update Booking Status                                      #
#        - Delete Booking                                             #
#                                                                     #
#######################################################################


from fastapi import APIRouter, HTTPException
from schemas.booking import BookingCreate, BookingResponse
from schemas.booking_status import BookingStatusUpdate
from database.database import get_db
from sqlalchemy.orm import Session
from sqlalchemy import select
from fastapi import Depends
from models.booking import Booking


router = APIRouter()

#get all bookings 
@router.get("/", response_model=list[BookingResponse])
def get_all_booking(db: Session = Depends(get_db)):
    query = select(Booking)
    result = db.execute(query)
    bookings = result.scalars().all()
    return bookings

#create booking
@router.post("/", response_model=BookingResponse)
def create_booking(booking: BookingCreate, db: Session = Depends(get_db)): 
    new_booking = Booking(
        learner_id=booking.learner_id,
        availability_id=booking.availability_id,
        booking_date=booking.booking_date,
        start_time=booking.start_time,
        end_time=booking.end_time,
        status=booking.status,
        notes=booking.notes,
        service_id=booking.service_id,
        tutor_id=booking.tutor_id,
    )
    db.add(new_booking)
    db.commit()
    db.refresh(new_booking)
    return new_booking


# ============================================================================
# BOOKING DASHBOARD API
# ----------------------------------------------------------------------------
# Booking endpoints used by the Learner and Tutor dashboards.
#
# Purpose:
# - Retrieve bookings for a specific learner
# - Retrieve bookings for a specific tutor
# - Support dashboard views, schedules, and booking history
#
# Endpoints:
# - GET /bookings/learner/{learner_id}
# - GET /bookings/tutor/{tutor_id}
# ============================================================================

@router.get("/learner/{learner_id}", response_model=list[BookingResponse])
def get_learner_bookings(learner_id: int, db: Session = Depends(get_db)):
    booking_list = select(Booking).where(Booking.learner_id == learner_id)
    result = db.scalars(booking_list).all()
    return result


@router.get("/tutor/{tutor_id}", response_model=list[BookingResponse])
def get_tutor_bookings(tutor_id: int, db: Session = Depends(get_db)):
    booking_list = select(Booking).where(Booking.tutor_id == tutor_id)
    result = db.scalars(booking_list).all()
    return result


#get booking by ID
@router.get("/{booking_id}", response_model=BookingResponse)
def get_booking_by_id(booking_id: int, db: Session = Depends(get_db)):
    booking = db.get(Booking, booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="unable to retrieve booking id")
    return booking

#update all booking
@router.put("/{booking_id}", response_model=BookingResponse)
def update_booking(booking_id: int, updated_booking: BookingCreate, db: Session = Depends(get_db)):
    booking = db.get(Booking, booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="unable to retrieve booking id")
    update_dict = updated_booking.model_dump()
    for key, value in update_dict.items():
        setattr(booking, key, value)
    db.commit()
    db.refresh(booking)
    return booking

#update status of booking
@router.patch("/{booking_id}/status", response_model=BookingResponse)
def update_status(booking_id: int, update_status: BookingStatusUpdate, db: Session = Depends(get_db)):
    booking = db.get(Booking, booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="unable to find booking id")
    booking.status = update_status.status
    db.commit()
    db.refresh(booking)
    return booking


#delete booking
@router.delete("/{booking_id}")
def delete_booking(booking_id: int, db: Session = Depends(get_db)):
    booking_to_delete = db.get(Booking, booking_id)
    if not booking_to_delete:
        raise HTTPException(status_code=404, detail="Cannot delete booking")
    db.delete(booking_to_delete)
    db.commit()
    return {"message": "Booking successfully deleted"}
