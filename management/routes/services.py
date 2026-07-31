#the function that will handles creating services 

from fastapi import APIRouter, HTTPException
from schemas.service import ServiceCreate, TutorMiniResponse, ServiceWithTutorResponse, ServiceResponse
from database.database import get_db
from sqlalchemy.orm import Session
from sqlalchemy import select
from fastapi import Depends
from models.service import Service
from models.user import User
from models.tutor_profile import TeacherProfile
from auth.dependencies import get_current_user
router = APIRouter()


#route for creating a new service
@router.post("/", response_model=ServiceResponse)
def create_service(service: ServiceCreate, current_user: User = Depends(get_current_user), db:Session = Depends(get_db)):
    if current_user.role not in ["tutor", "admin"]:
        raise HTTPException(
            status_code=403,
            detail="Only tutors and admins can create services."
        )

    new_service = Service(
       name=service.name,
       description=service.description,
       category=service.category,
       price=service.price,
       duration_minutes=service.duration_minutes,
       is_active=service.is_active,
       language=service.language,
       teacher_id = current_user.id
        )
    db.add(new_service)
    db.commit()
    db.refresh(new_service)
    return new_service


#bulk creation 
@router.post("/bulk", response_model=list[ServiceResponse])
def create_bulk_services(services: list[ServiceCreate], current_user: User = Depends(get_current_user), db:Session = Depends(get_db)):
    
    if current_user.role not in ["tutor", "admin"]:
        raise HTTPException(status_code=403, detail="Only tutors and admins can create services.")
    new_services = []
    for item in services:
        
       new_service_obj = Service(
       name=item.name,
       tutor_id = current_user.id,
       description=item.description,
       category=item.category,
       price=item.price,
       duration_minutes=item.duration_minutes,
       is_active=item.is_active,
       language=item.language
        )
       new_services.append(new_service_obj)
    db.add_all(new_services)
    db.commit()
    for service_obj in new_services:
        
        db.refresh(service_obj)
    return new_services

#route to get services
@router.get("/", response_model=list[ServiceResponse])
def get_services(db:Session = Depends(get_db)):
    query = select(Service)
    result = db.execute(query)
    services = result.scalars().all()

    return services

#route to get services with tutors info
@router.get("/with-tutors", response_model=list[ServiceWithTutorResponse])
def get_services_with_tutors(db:Session = Depends(get_db)):
    
    list_tutors = []
    query_tutors_info = select(Service, User, TeacherProfile).join(User, Service.teacher_id == User.id).outerjoin(TeacherProfile, TeacherProfile.user_id == User.id)
    results = db.execute(query_tutors_info).all()
    for service, tutor, profile in results:
        new_list = ServiceWithTutorResponse(
            id = service.id,
            name= service.name,
            category = service.category,
            description = service.description,
            price = service.price,
            language = service.language,
            is_active= service.is_active,
            duration_minutes = service.duration_minutes, 
            tutor = TutorMiniResponse(
                id = tutor.id,
                full_name = tutor.full_name,
                email = tutor.email,
                bio = profile.bio if profile else None,
                specialization=profile.specialization if profile else None,
                years_of_experience=profile.years_of_experience if profile else None,
                hourly_rate=profile.hourly_rate if profile else None,
                meeting_platform=profile.meeting_platform if profile else None,
                is_verified=profile.is_verified if profile else None,
                
            )
        )
        list_tutors.append(new_list)
    return list_tutors
#route to get service bu teacher_ids
@router.get("/teacher/{teacher_id}", response_model=list[ServiceResponse])
def get_service_by_teacher_id(teacher_id: int, db:Session = Depends(get_db)):
    services = select(Service).where(Service.teacher_id == teacher_id)
    results = db.scalars(services).all()
    return results

    



#route to get service ids
@router.get("/{service_id}", response_model=ServiceResponse)
def get_service_by_id(service_id: int, db:Session = Depends(get_db)):
    service = db.get(Service, service_id)
    if not service:
        raise HTTPException(status_code=404, detail="Service ID not found")
    return service


    

   
   # update by id 
   
@router.put("/{service_id}", response_model=ServiceResponse)
def update_service(
    service_id: int,
    updated_service: ServiceCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)):
    # first we get the table and the id 
    db_service = db.get(Service, service_id)
    # if we cant find it return none or error code
    if not db_service:
        raise HTTPException(status_code=404, detail="unable to retrieve service")
    #then we convert the object db_service to a dictionary to loop and to update
    if current_user.role != "admin" and db_service.teacher_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only update your own services.")

    updated_dict = updated_service.model_dump()
    #then we loop through it
    for key, value in updated_dict.items():
        setattr(db_service, key, value)
    db.commit() #commiting our change to our db
    db.refresh(db_service) #refreshing to show our changes 
    return db_service


#build for version 2
# #bulk update 
# @router.put("/teacher/{teacher_id}", response_model=list[ServiceResponse])
# def update_all_services(teacher_id:int, db:Session = Depends(get_db)):
    

#deleting a service by id 
@router.delete("/{service_id}")
def delete_service(service_id:int, current_user: User = Depends(get_current_user), db:Session = Depends(get_db)):
    
    #first we find the table and the obj we want to delete by its id
    query_obj = db.get(Service, service_id) #Service here is our Service table 
    if not query_obj:
        raise HTTPException(status_code=404, detail="unable to find service please try again")
    if current_user.role != "admin" and query_obj.tutor_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only delete your own services.")
    #if we find the table and the id we can now delete it 
    db.delete(query_obj)
    db.commit() #commit our changes 
    return {"message": "service successfully deleted!!"} 

