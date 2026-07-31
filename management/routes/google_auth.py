#######################################################################
#                                                                     #
#                    GOOGLE OAUTH AUTHENTICATION                      #
#                                                                     #
#        OAuth 2.0 authorization code flow.                          #
#        New Google users are created as learners and get a          #
#        student profile row automatically.                          #
#                                                                     #
#        - GET /google/login    → return Google consent URL          #
#        - GET /google/callback → exchange code, return JWT          #
#                                                                     #
#######################################################################


from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
from sqlalchemy import select

from database.database import get_db
from models.user import User
from models.learner_profile import StudentProfile
from schemas.user import Token
from auth.google import get_google_auth_url, exchange_code_for_tokens, get_google_user_info
from auth.token import create_access_token
from enums.enums import UserRole

router = APIRouter()


# route that returns the Google consent URL for the frontend to redirect to
@router.get("/google/login")
def google_login():
    google_url = get_google_auth_url()
    return {"authorization_url": google_url}


# route that Google redirects to after the user signs in
@router.get("/google/callback", response_model=Token)
def google_callback(code: str, db: Session = Depends(get_db)):
    # step 1: exchange the authorization code for Google tokens
    try:
        token_data = exchange_code_for_tokens(code)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to exchange authorization code with Google",
        )

    access_token = token_data.get("access_token")
    if not access_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No access token received from Google",
        )

    # step 2: fetch the user's profile info from Google
    try:
        google_user = get_google_user_info(access_token)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to fetch user info from Google",
        )

    email = google_user.get("email")
    full_name = google_user.get("name", "")

    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google account does not have an email address",
        )

    # step 3: find or create the user in our database
    query = select(User).where(User.email == email)
    user = db.execute(query).scalars().first()

    if user is None:
        # new Google user — always starts as a learner
        user = User(
            email=email,
            hashed_password=None,
            full_name=full_name,
            auth_provider="google",
            role=UserRole.LEARNER,
        )
        db.add(user)
        db.flush()  # get user.id before committing

        # automatically create a blank student profile for the new user
        student_profile = StudentProfile(user_id=user.id)
        db.add(student_profile)
        db.commit()
        db.refresh(user)

    # check if the account is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated",
        )

    # step 4: issue our own JWT token (same as regular login)
    jwt_token = create_access_token(data={"user_id": user.id, "email": user.email})
    return {"access_token": jwt_token, "token_type": "bearer"}
