

# ============================================================================
# AVAILABILITY MANAGEMENT API
# ----------------------------------------------------------------------------
# Administrative endpoints for managing teacher availability schedules.
#
# Features:
# - Create availability slots
# - View all availability records
# - View availability by ID
# - Update availability schedules
# - Delete availability schedules
#
# Endpoints:
# - GET    /availability
# - POST   /availability
# - GET    /availability/{availability_id}
# - PUT    /availability/{availability_id}
# - DELETE /availability/{availability_id}
# ============================================================================


from fastapi import APIRouter, HTTPException
from schemas.availability import AvailabilityCreate, AvailabilityResponse
from models.availability import Availability
from models.user import User
from database.database import get_db
from sqlalchemy.orm import Session
from sqlalchemy import select
from fastapi import Depends
from auth.dependencies import get_current_user

router = APIRouter()

#get all availability
@router.get("/", response_model=list[AvailabilityResponse])

def get_all_availability( db:Session=Depends(get_db)):
    query = select(Availability) #select availability table
    result = db.execute(query)
    availability_service = result.scalars().all()
    return availability_service
    
# ============================================================================
# CREATE AVAILABILITY SLOTS (BULK)
# ----------------------------------------------------------------------------
# Creates one or more availability records for a teacher.
# Used when a teacher/admin wants to add multiple available time slots at once.
# ============================================================================
    
#create availability by list
@router.post("/bulk", response_model=list[AvailabilityResponse])
def create_availability(availability: list[AvailabilityCreate], current_user: User = Depends(get_current_user), db:Session=Depends(get_db)):
    
    if current_user.role not in ["tutor", "admin"]:
        raise HTTPException(status_code=403, detail="Only tutors and admins can create availability.")
    avail_lst = []
    
    for avail in availability:
        new_avail = Availability(
            tutor_id = current_user.id,
            start_time = avail.start_time,
            end_time = avail.end_time,
            day = avail.day,
            is_active = avail.is_active
        )
    
        avail_lst.append(new_avail)
    db.add_all(avail_lst)
    db.commit()
    for a in avail_lst:
        db.refresh(a)
    return avail_lst


# ============================================================================
# TEACHER AVAILABILITY DASHBOARD API
# ----------------------------------------------------------------------------
# Retrieves all available time slots for a specific teacher.
# Used by students during booking and by teachers managing their schedule.
# ============================================================================

@router.get("/teacher/{tutor_id}", response_model=list[AvailabilityResponse])
def get_teacher_avail(tutor_id:int, db:Session = Depends(get_db)):
    teacher_avail = select(Availability).where(Availability.tutor_id == tutor_id)
    results = db.scalars(teacher_avail).all()
    return results




#get availability by ID
@router.get("/{availability_id}", response_model=AvailabilityResponse)
def get_availability_by_id(availability_id: int, db:Session = Depends(get_db)):
    search = db.get(Availability, availability_id)
    if not search:
        raise HTTPException(status_code=404, detail="unable to locate availability id")
    return search
    
    
    
#update availability 
@router.put("/{availability_id}", response_model=AvailabilityResponse)
def update_availabilty(availability_id:int, updated_availability:AvailabilityCreate, current_user: User = Depends(get_current_user), db:Session = Depends(get_db)):
    
    avail_service = db.get(Availability, availability_id)
    if not avail_service:
        raise HTTPException(status_code= 404, detail="unable to find availability id please try again")
    if current_user.role != "admin" and avail_service.tutor_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only update your own availability.")
    avail_dict = updated_availability.model_dump()
    for key, value in avail_dict.items():
        setattr(avail_service, key, value)
    db.commit()
    db.refresh(avail_service)
    return avail_service


# ============================================================================
# AVAILABILITY RECORD MANAGEMENT
# ----------------------------------------------------------------------------
# Retrieves, updates, and deletes individual availability records by ID.
# These endpoints are used for admin/teacher schedule management.
# ============================================================================

#delete availability by ID
@router.delete("/{availability_id}")
def delete_availability(availability_id:int, current_user: User = Depends(get_current_user), db:Session = Depends(get_db)):
    
    
    search_avail = db.get(Availability, availability_id)
    if not search_avail:
        raise HTTPException(status_code= 404, detail="unable to delete availability id please try again")
    if current_user.role != "admin" and search_avail.tutor_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only delete your own availability.")
    db.delete(search_avail)
    db.commit()
    return {"message": "Availability successfully deleted. "}


