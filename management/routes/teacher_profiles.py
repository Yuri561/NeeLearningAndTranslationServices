#######################################################################
#                                                                     #
#                    TEACHER PROFILE API                              #
#                                                                     #
#        Manage teacher profile data for tutor accounts.             #
#        Profile is created when a learner becomes a tutor via       #
#        POST /auth/become-teacher.                                   #
#                                                                     #
#        - GET  /teacher-profiles/me          → own profile          #
#        - GET  /teacher-profiles/{user_id}   → by user id           #
#        - GET  /teacher-profiles/            → all teachers         #
#        - PUT  /teacher-profiles/me          → update own           #
#                                                                     #
#######################################################################


from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy import select

from database.database import get_db
from models.tutor_profile import TeacherProfile
from models.user import User
from schemas.tutor_profile import TeacherProfileUpdate, TeacherProfileResponse
from auth.dependencies import get_current_user
from enums.enums import UserRole

router = APIRouter()


# ─── Get all tutor profiles ───────────────────────────────────────
@router.get("/", response_model=list[TeacherProfileResponse])
def get_all_tutor_profiles(db: Session = Depends(get_db)):
    profiles = db.execute(select(TeacherProfile)).scalars().all()
    return profiles


# ─── Get own tutor profile ────────────────────────────────────────
@router.get("/me", response_model=TeacherProfileResponse)
def get_my_tutor_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role not in [UserRole.TUTOR, UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Only tutors can access a teacher profile")

    profile = db.execute(
        select(TeacherProfile).where(TeacherProfile.user_id == current_user.id)
    ).scalars().first()

    if not profile:
        raise HTTPException(status_code=404, detail="Teacher profile not found")
    return profile


# ─── Get teacher profile by user ID ─────────────────────────────────
@router.get("/{user_id}", response_model=TeacherProfileResponse)
def get_teacher_profile_by_user_id(user_id: int, db: Session = Depends(get_db)):
    profile = db.execute(
        select(TeacherProfile).where(TeacherProfile.user_id == user_id)
    ).scalars().first()

    if not profile:
        raise HTTPException(status_code=404, detail="Teacher profile not found")
    return profile


# ─── Update own teacher profile ─────────────────────────────────────
@router.put("/me", response_model=TeacherProfileResponse)
def update_my_tutor_profile(
    updates: TeacherProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role not in [UserRole.TUTOR, UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Only tutors can update a teacher profile")

    profile = db.execute(
        select(TeacherProfile).where(TeacherProfile.user_id == current_user.id)
    ).scalars().first()

    if not profile:
        raise HTTPException(status_code=404, detail="Tutor profile not found")

    update_data = updates.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(profile, key, value)

    db.commit()
    db.refresh(profile)
    return profile
