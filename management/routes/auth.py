#######################################################################
#                                                                     #
#                    AUTHENTICATION API                               #
#                                                                     #
#        Role-based auth: every new account is a learner.            #
#        A student profile row is created at registration.           #
#        Tutors get a teacher profile via /become-teacher.           #
#                                                                     #
#        - POST /register        → create account (learner)          #
#        - POST /login           → return JWT                        #
#        - GET  /me              → current user info                 #
#        - POST /become-teacher  → upgrade learner → tutor           #
#                                                                     #
#######################################################################


from fastapi import APIRouter, HTTPException, Depends, status, Response
from sqlalchemy.orm import Session
from sqlalchemy import select

from database.database import get_db
from models.user import User
from models.learner_profile import StudentProfile
from models.tutor_profile import TeacherProfile
from schemas.user import UserCreate, UserLogin, UserResponse, Token, BecomeTeacherRequest
from schemas.tutor_profile import TeacherProfileResponse
from auth.hashing import hash_password, verify_password
from auth.token import create_access_token
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
    # if user.role == "admin": #admin validation
    #     raise HTTPException(
    #         status_code=403,
    #         detail="Admin accounts cannot be created through registration."
    # )

    # every new account is a learner — role is not user-selectable at registration
    new_user = User(
        email=user.email,
        hashed_password=hash_password(user.password),
        full_name=user.full_name,
        role=user.role,
    )
    db.add(new_user)
    db.flush()  # get new_user.id without committing yet

    # automatically create a blank student profile for every new user
    student_profile = StudentProfile(user_id=new_user.id)
    db.add(student_profile)
    db.commit()
    db.refresh(new_user)
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


# ─── Get current user ───────────────────────────────────────────────
@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


# ─── Become a tutor ───────────────────────────────────────────────
@router.post("/become-tutor", response_model=TeacherProfileResponse, status_code=status.HTTP_201_CREATED)
def become_tutor(
    payload: BecomeTeacherRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Allows a learner to upgrade their account to a tutor role.
    - Creates a tutor_profile row for the user.
    - Updates the user's role from learner → tutor.
    - The student_profile row is kept (history is preserved).
    """
    # only learners can request this upgrade
    if current_user.role != UserRole.LEARNER:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only learners can become teachers. You are already a tutor or admin.",
        )

    # guard against duplicate teacher profiles
    existing = db.execute(
        select(TeacherProfile).where(TeacherProfile.user_id == current_user.id)
    ).scalars().first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A teacher profile already exists for this account.",
        )

    # upgrade the role in the users table
    current_user.role = UserRole.TUTOR

    # create the teacher profile
    tutor_profile = TeacherProfile(
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


#logout endpoint 
@router.post("/logout", status_code=status.HTTP_200_OK)
async def logout(response: Response):
    response.delete_cookie(key="access_token", httponly=True, samesite="lax")
    return {"Successfully logged out"}