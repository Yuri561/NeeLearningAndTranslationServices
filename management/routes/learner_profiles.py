#######################################################################
#                                                                     #
#                    LEARNER PROFILE API                              #
#                                                                     #
#        Manage learner profile data linked to a user account.       #
#        A profile is auto-created at registration.                  #
#                                                                     #
#        - GET  /learner-profiles/me                → own profile    #
#        - GET  /learner-profiles/{user_id}         → by user id     #
#        - PUT  /learner-profiles/me                → update own     #
#        - POST /learner-profiles/me/profile-picture → upload photo  #
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
from models.learner_profile import LearnerProfile
from models.user import User
from schemas.learner_profile import (
    LearnerProfileUpdate,
    LearnerProfileResponse,
)
from auth.dependencies import get_current_user


router = APIRouter()


# ─── Constants ──────────────────────────────────────────────────────

BUCKET_NAME = "uploads"
PROFILE_PIC_FOLDER = "profile_pictures/learners"

ALLOWED_IMAGE_EXTENSIONS = {
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
    ".gif",
}

MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB


# ─── Helper functions ───────────────────────────────────────────────

def _storage_path_from_url(public_url: str) -> str | None:
    """
    Extract the file path inside the Supabase Storage bucket
    from a public Supabase URL.
    """
    try:
        parsed_url = urlparse(public_url)

        marker = f"/object/public/{BUCKET_NAME}/"
        marker_index = parsed_url.path.find(marker)

        if marker_index == -1:
            return None

        return parsed_url.path[marker_index + len(marker):]

    except Exception:
        return None


def _get_or_create_learner_profile(
    db: Session,
    current_user: User,
) -> LearnerProfile:
    """
    Return the authenticated user's learner profile.

    Older users may exist in the users table without a matching
    learner_profiles row. In that case, create the missing profile
    automatically.
    """
    profile = db.scalar(
        select(LearnerProfile).where(
            LearnerProfile.user_id == current_user.id
        )
    )

    if profile is not None:
        return profile

    profile = LearnerProfile(
        user_id=current_user.id
    )

    try:
        db.add(profile)
        db.commit()
        db.refresh(profile)

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Unable to create learner profile.",
        )

    return profile


# ─── Get own learner profile ────────────────────────────────────────

@router.get(
    "/me",
    response_model=LearnerProfileResponse,
)
def get_my_learner_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return _get_or_create_learner_profile(
        db=db,
        current_user=current_user,
    )


# ─── Update own learner profile ─────────────────────────────────────

@router.put(
    "/me",
    response_model=LearnerProfileResponse,
)
def update_my_learner_profile(
    updates: LearnerProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile = _get_or_create_learner_profile(
        db=db,
        current_user=current_user,
    )

    update_data = updates.model_dump(
        exclude_unset=True
    )

    for field_name, field_value in update_data.items():
        setattr(
            profile,
            field_name,
            field_value,
        )

    try:
        db.commit()
        db.refresh(profile)

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Unable to update learner profile.",
        )

    return profile


# ─── Upload / replace own profile picture ───────────────────────────

@router.post(
    "/me/profile-picture",
    response_model=LearnerProfileResponse,
)
async def upload_learner_profile_picture(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Upload or replace the authenticated learner's profile picture.

    The image is uploaded to Supabase Storage. The resulting public URL
    is saved in the learner_profiles table.
    """
    profile = _get_or_create_learner_profile(
        db=db,
        current_user=current_user,
    )

    # Validate filename extension
    filename = file.filename or ""
    _, extension = os.path.splitext(
        filename.lower()
    )

    if extension not in ALLOWED_IMAGE_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid image type. "
                f"Allowed extensions: "
                f"{sorted(ALLOWED_IMAGE_EXTENSIONS)}"
            ),
        )

    # Read file content
    file_content = await file.read()

    if not file_content:
        raise HTTPException(
            status_code=400,
            detail="The uploaded image is empty.",
        )

    # Validate file size
    if len(file_content) > MAX_IMAGE_SIZE_BYTES:
        raise HTTPException(
            status_code=400,
            detail="Image is too large. Maximum size is 5 MB.",
        )

    # Build a unique Supabase Storage path
    storage_filename = (
        f"{uuid.uuid4().hex}{extension}"
    )

    storage_path = (
        f"{PROFILE_PIC_FOLDER}/"
        f"{current_user.id}/"
        f"{storage_filename}"
    )

    # Upload the new image first
    try:
        supabase_config.storage.from_(
            BUCKET_NAME
        ).upload(
            path=storage_path,
            file=file_content,
            file_options={
                "content-type": (
                    file.content_type
                    or "image/jpeg"
                ),
            },
        )

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Profile picture upload failed: {exc}",
        )

    # Generate the public URL
    try:
        public_url = supabase_config.storage.from_(
            BUCKET_NAME
        ).get_public_url(
            storage_path
        )
        print("PUBLIC URL:", public_url)
        print("PUBLIC URL TYPE:", type(public_url))
    except Exception as exc:
        # Clean up the newly uploaded image if URL creation fails
        try:
            supabase_config.storage.from_(
                BUCKET_NAME
            ).remove(
                [storage_path]
            )
        except Exception:
            pass

        raise HTTPException(
            status_code=500,
            detail=f"Unable to generate public URL: {exc}",
        )

    old_profile_picture_url = (
        profile.profile_picture_url
    )

    profile.profile_picture_url = str(
        public_url
    )

    # Save the new URL before removing the old image
    try:
        db.commit()
        db.refresh(profile)

    except Exception:
        db.rollback()

        # Remove the newly uploaded image because DB save failed
        try:
            supabase_config.storage.from_(
                BUCKET_NAME
            ).remove(
                [storage_path]
            )
        except Exception:
            pass

        raise HTTPException(
            status_code=500,
            detail=(
                "The image was uploaded, but the profile "
                "could not be updated."
            ),
        )

    # Remove old image only after the new URL is safely stored
    if old_profile_picture_url:
        old_storage_path = _storage_path_from_url(
            old_profile_picture_url
        )

        if (
            old_storage_path
            and old_storage_path != storage_path
        ):
            try:
                supabase_config.storage.from_(
                    BUCKET_NAME
                ).remove(
                    [old_storage_path]
                )
            except Exception:
                # Best-effort cleanup. Do not fail the request
                # after the new picture was successfully saved.
                pass

    return profile


# ─── Delete own profile picture ─────────────────────────────────────

@router.delete(
    "/me/profile-picture",
    response_model=LearnerProfileResponse,
)
def delete_learner_profile_picture(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile = _get_or_create_learner_profile(
        db=db,
        current_user=current_user,
    )

    old_profile_picture_url = (
        profile.profile_picture_url
    )

    # Return the profile normally if there is no image
    if not old_profile_picture_url:
        return profile

    profile.profile_picture_url = None

    # Clear the URL from the database first
    try:
        db.commit()
        db.refresh(profile)

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Unable to remove profile picture.",
        )

    # Then remove the file from Supabase Storage
    storage_path = _storage_path_from_url(
        old_profile_picture_url
    )

    if storage_path:
        try:
            supabase_config.storage.from_(
                BUCKET_NAME
            ).remove(
                [storage_path]
            )
        except Exception:
            # Best-effort cleanup. The database was already updated.
            pass

    return profile


# ─── Get learner profile by user ID ─────────────────────────────────
#
# Keep this route below all fixed routes such as /me.
#
# Otherwise FastAPI could interpret "me" as the {user_id} parameter.
#

@router.get(
    "/{user_id}",
    response_model=LearnerProfileResponse,
)
def get_learner_profile_by_user_id(
    user_id: int,
    db: Session = Depends(get_db),
):
    profile = db.scalar(
        select(LearnerProfile).where(
            LearnerProfile.user_id == user_id
        )
    )

    if profile is None:
        raise HTTPException(
            status_code=404,
            detail="Learner profile not found.",
        )

    return profile