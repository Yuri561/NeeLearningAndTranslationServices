#######################################################################
#                                                                     #
#                    AUTHENTICATION API                               #
#                                                                     #
#        Role-based auth: every new account is a learner.            #
#        A learner profile row is created at registration.           #
#        Tutors get a tutor profile via /become-tutor.               #
#                                                                     #
#        - POST /register         → create account (learner)         #
#        - POST /login            → return JWT                       #
#        - POST /logout           → clear cookie                     #
#        - GET  /me               → current user info                #
#        - POST /become-tutor     → upgrade learner → tutor          #
#        - POST /forgot-password  → send reset link to email         #
#        - POST /reset-password   → reset password with token        #
#        - POST /change-password  → change password (auth'd users)   #
#                                                                     #
#######################################################################


from fastapi import APIRouter, HTTPException, Depends, status, Response
from sqlalchemy.orm import Session
from sqlalchemy import select
from jose import JWTError

from database.database import get_db
from models.user import User
from models.learner_profile import LearnerProfile
from models.tutor_profile import TutorProfile
from schemas.user import (
    UserCreate, UserLogin, UserResponse, Token,
    BecomeTutorRequest, ForgotPasswordRequest, ResetPasswordRequest,
    ChangePasswordRequest,
)
from schemas.tutor_profile import TutorProfileResponse
from auth.hashing import hash_password, verify_password
from auth.token import create_access_token, create_reset_token, verify_reset_token
from auth.email import send_password_reset_email, send_welcome_email
from auth.dependencies import get_current_user
from enums.enums import UserRole


router = APIRouter()


# ─── Register ───────────────────────────────────────────────────────
@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user: UserCreate, db: Session = Depends(get_db)):
    # check if a user with this email already exists
    query = select(User).where(User.email == user.email)
    existing_user = db.execute(query).scalars().first()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists",
        )

    # every new account is a learner — role is not user-selectable at registration
    new_user = User(
        email=user.email,
        hashed_password=hash_password(user.password),
        full_name=user.full_name,
        role=user.role,
    )
    db.add(new_user)
    db.flush()  # get new_user.id without committing yet

    # automatically create a blank learner profile for every new user
    learner_profile = LearnerProfile(user_id=new_user.id)
    db.add(learner_profile)
    db.commit()
    db.refresh(new_user)

    # send a welcome email — don't block registration if it fails
    try:
        send_welcome_email(to_email=new_user.email, full_name=new_user.full_name)
    except Exception as exc:
        print(f"[warn] failed to send welcome email to {new_user.email}: {exc}")

    return new_user


# ─── Login ──────────────────────────────────────────────────────────
@router.post("/login", response_model=Token)
def login(user_credentials: UserLogin, db: Session = Depends(get_db)):
    query = select(User).where(User.email == user_credentials.email)
    user = db.execute(query).scalars().first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not verify_password(user_credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated",
        )

    access_token = create_access_token(data={"user_id": user.id, "email": user.email})
    return {"access_token": access_token, "token_type": "bearer"}


# ─── Logout ─────────────────────────────────────────────────────────
@router.post("/logout", status_code=status.HTTP_200_OK)
async def logout(response: Response):
    response.delete_cookie(key="access_token", httponly=True, samesite="lax")
    return {"message": "Successfully logged out"}


# ─── Get current user ───────────────────────────────────────────────
@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


# ─── Become a tutor ─────────────────────────────────────────────────
@router.post("/become-tutor", response_model=TutorProfileResponse, status_code=status.HTTP_201_CREATED)
def become_tutor(
    payload: BecomeTutorRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Allows a learner to upgrade their account to a tutor role.
    - Creates a tutor_profile row for the user.
    - Updates the user's role from learner → tutor.
    - The learner_profile row is kept (history is preserved).
    """
    if current_user.role != UserRole.LEARNER:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only learners can become tutors. You are already a tutor or admin.",
        )

    existing = db.execute(
        select(TutorProfile).where(TutorProfile.user_id == current_user.id)
    ).scalars().first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A tutor profile already exists for this account.",
        )

    current_user.role = UserRole.TUTOR

    tutor_profile = TutorProfile(
        user_id=current_user.id,
        bio=payload.bio,
        specialization=payload.specialization,
        years_of_experience=payload.years_of_experience,
        hourly_rate=payload.hourly_rate,
    )
    db.add(tutor_profile)
    db.commit()
    db.refresh(tutor_profile)
    return tutor_profile


# ─── Forgot password ────────────────────────────────────────────────
@router.post("/forgot-password")
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """
    Sends a password reset link to the user's email.
    Always returns 200 even if the email doesn't exist (security best practice).
    """
    user = db.execute(
        select(User).where(User.email == payload.email)
    ).scalars().first()

    if user:
        # only allow reset for local auth users (Google users have no password)
        if user.auth_provider == "google":
            return {"message": "If an account with that email exists, a reset link has been sent."}

        reset_token = create_reset_token(email=user.email)
        try:
            send_password_reset_email(to_email=user.email, reset_token=reset_token)
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to send reset email. Please try again later.",
            )

    return {"message": "If an account with that email exists, a reset link has been sent."}


# ─── Reset password ─────────────────────────────────────────────────
@router.post("/reset-password")
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    """Resets the user's password using the token from the reset email."""
    try:
        email = verify_reset_token(payload.token)
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token.",
        )

    user = db.execute(
        select(User).where(User.email == email)
    ).scalars().first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )

    user.hashed_password = hash_password(payload.new_password)
    db.commit()
    return {"message": "Password has been reset successfully."}


# ─── Change password (for logged-in learners AND tutors) ────────────
@router.post("/change-password", status_code=status.HTTP_200_OK)
def change_password(
    payload: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Change the current user's password.
    Works for any authenticated user (learner or tutor).
    Google-auth accounts cannot change their password here.
    """
    if current_user.auth_provider == "google":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google-authenticated accounts cannot change their password here.",
        )

    if not current_user.hashed_password or not verify_password(
        payload.current_password, current_user.hashed_password
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Current password is incorrect.",
        )

    if len(payload.new_password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be at least 8 characters long.",
        )

    if payload.current_password == payload.new_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be different from the current password.",
        )

    current_user.hashed_password = hash_password(payload.new_password)
    db.commit()
    return {"message": "Password changed successfully."}
