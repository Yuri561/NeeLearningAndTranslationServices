#######################################################################
#                                                                     #
#                    STUDENT PROFILE API                              #
#                                                                     #
#        Manage student profile data linked to a user account.       #
#        A profile is auto-created at registration.                  #
#                                                                     #
#        - GET  /learner-profiles/me                → own profile    #
#        - GET  /learner-profiles/{user_id}         → by user id     #
#        - PUT  /learner-profiles/me                → update own     #
#                                                                     #
#######################################################################


from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy import select

from database.database import get_db
from models.learner_profile import StudentProfile
from models.user import User
from schemas.learner_profile import StudentProfileUpdate, StudentProfileResponse
from auth.dependencies import get_current_user

router = APIRouter()


# ─── Get own student profile ────────────────────────────────────────
@router.get("/me", response_model=StudentProfileResponse)
def get_my_student_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile = db.execute(
        select(StudentProfile).where(StudentProfile.user_id == current_user.id)
    ).scalars().first()

    if not profile:
        raise HTTPException(status_code=404, detail="Student profile not found")
    return profile


# ─── Get student profile by user ID ─────────────────────────────────
@router.get("/{user_id}", response_model=StudentProfileResponse)
def get_student_profile_by_user_id(user_id: int, db: Session = Depends(get_db)):
    profile = db.execute(
        select(StudentProfile).where(StudentProfile.user_id == user_id)
    ).scalars().first()

    if not profile:
        raise HTTPException(status_code=404, detail="Student profile not found")
    return profile


# ─── Update own student profile ─────────────────────────────────────
@router.put("/me", response_model=StudentProfileResponse)
def update_my_student_profile(
    updates: StudentProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile = db.execute(
        select(StudentProfile).where(StudentProfile.user_id == current_user.id)
    ).scalars().first()

    if not profile:
        raise HTTPException(status_code=404, detail="Student profile not found")

    update_data = updates.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(profile, key, value)

    db.commit()
    db.refresh(profile)
    return profile
