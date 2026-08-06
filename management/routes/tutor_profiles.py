#######################################################################
#                                                                     #
#                    TUTOR PROFILE API                                #
#                                                                     #
#        Manage tutor profile data for tutor accounts.               #
#        Profile is created when a learner becomes a tutor via       #
#        POST /auth/become-tutor.                                     #
#                                                                     #
#        - GET  /tutor-profiles/me                     → own profile  #
#        - GET  /tutor-profiles/{user_id}              → by user id   #
#        - GET  /tutor-profiles/                       → all tutors   #
#        - PUT  /tutor-profiles/me                     → update own   #
#        - POST /tutor-profiles/me/profile-picture     → upload photo #
#        - DELETE /tutor-profiles/me/profile-picture   → remove photo #
#                                                                     #
#######################################################################


import os
import uuid
from urllib.parse import urlparse

from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import select

from config.supabase_config import supabase_config
from database.database import get_db
from models.tutor_profile import TutorProfile
from models.user import User
from schemas.tutor_profile import TutorProfileUpdate, TutorProfileResponse
from auth.dependencies import get_current_user
from enums.enums import UserRole

router = APIRouter()


# ─── Constants 
BUCKET_NAME = "uploads"
PROFILE_PIC_FOLDER = "profile_pictures/tutors"
ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}
MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB


def _storage_path_from_url(public_url: str) -> str | None:
    """Extract the storage path from a Supabase public URL."""
    try:
        parsed = urlparse(public_url)
        marker = f"/object/public/{BUCKET_NAME}/"
        idx = parsed.path.find(marker)
        if idx == -1:
            return None
        return parsed.path[idx + len(marker):]
    except Exception:
        return None


# ─── Get all tutor profiles 
@router.get("/", response_model=list[TutorProfileResponse])
def get_all_tutor_profiles(db: Session = Depends(get_db)):
    profiles = db.execute(select(TutorProfile)).scalars().all()
    return profiles


# ─── Get own tutor profile 
@router.get("/me", response_model=TutorProfileResponse)
def get_my_tutor_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role not in [UserRole.TUTOR, UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Only tutors can access a tutor profile")

    profile = db.execute(
        select(TutorProfile).where(TutorProfile.user_id == current_user.id)
    ).scalars().first()

    if not profile:
        raise HTTPException(status_code=404, detail="Tutor profile not found")
    return profile


# ─── Get tutor profile by user ID 
@router.get("/{user_id}", response_model=TutorProfileResponse)
def get_tutor_profile_by_user_id(user_id: int, db: Session = Depends(get_db)):
    profile = db.execute(
        select(TutorProfile).where(TutorProfile.user_id == user_id)
    ).scalars().first()

    if not profile:
        raise HTTPException(status_code=404, detail="Tutor profile not found")
    return profile


# ─── Update own tutor profile 
@router.put("/me", response_model=TutorProfileResponse)
def update_my_tutor_profile(
    updates: TutorProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role not in [UserRole.TUTOR, UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Only tutors can update a tutor profile")

    profile = db.execute(
        select(TutorProfile).where(TutorProfile.user_id == current_user.id)
    ).scalars().first()

    if not profile:
        raise HTTPException(status_code=404, detail="Tutor profile not found")

    update_data = updates.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(profile, key, value)

    db.commit()
    db.refresh(profile)
    return profile


# ─── Upload / replace own profile picture 
@router.post("/me/profile-picture", response_model=TutorProfileResponse)
async def upload_tutor_profile_picture(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Upload (or replace) the tutor's profile picture.
    Stores the image in Supabase Storage and saves the public URL on the profile.
    """
    if current_user.role not in [UserRole.TUTOR, UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Only tutors can upload a tutor profile picture")

    profile = db.execute(
        select(TutorProfile).where(TutorProfile.user_id == current_user.id)
    ).scalars().first()

    if not profile:
        raise HTTPException(status_code=404, detail="Tutor profile not found")

    # validate extension
    _, extension = os.path.splitext((file.filename or "").lower())
    if extension not in ALLOWED_IMAGE_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid image type. Allowed: {sorted(ALLOWED_IMAGE_EXTENSIONS)}",
        )

    # read + size check
    file_content = await file.read()
    if len(file_content) > MAX_IMAGE_SIZE_BYTES:
        raise HTTPException(status_code=400, detail="Image is too large (max 5 MB).")

    # upload to Supabase
    storage_filename = f"{uuid.uuid4().hex}{extension}"
    storage_path = f"{PROFILE_PIC_FOLDER}/{current_user.id}/{storage_filename}"

    try:
        supabase_config.storage.from_(BUCKET_NAME).upload(
            path=storage_path,
            file=file_content,
            file_options={"content-type": file.content_type or "image/jpeg"},
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Upload failed: {exc}")

    public_url = supabase_config.storage.from_(BUCKET_NAME).get_public_url(storage_path)

    # remove the old picture from storage 
    old_url = profile.profile_picture_url
    if old_url:
        old_path = _storage_path_from_url(old_url)
        if old_path:
            try:
                supabase_config.storage.from_(BUCKET_NAME).remove([old_path])
            except Exception:
                pass  # best-effort cleanup

    profile.profile_picture_url = str(public_url)
    db.commit()
    db.refresh(profile)
    return profile


# ─── Delete own profile picture
@router.delete("/me/profile-picture", response_model=TutorProfileResponse)
def delete_tutor_profile_picture(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role not in [UserRole.TUTOR, UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Only tutors can delete a tutor profile picture")

    profile = db.execute(
        select(TutorProfile).where(TutorProfile.user_id == current_user.id)
    ).scalars().first()

    if not profile:
        raise HTTPException(status_code=404, detail="Tutor profile not found")

    if profile.profile_picture_url:
        storage_path = _storage_path_from_url(profile.profile_picture_url)
        if storage_path:
            try:
                supabase_config.storage.from_(BUCKET_NAME).remove([storage_path])
            except Exception:
                pass  # best-effort cleanup

    profile.profile_picture_url = None
    db.commit()
    db.refresh(profile)
    return profile
