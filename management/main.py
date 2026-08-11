from fastapi import FastAPI
from routes.payment_routes import router as payment_router
from fastapi.middleware.cors import CORSMiddleware

from routes import (
    auth,
    availability,
    bookings,
    files,
    google_auth,
    learner_profiles,
    lesson_history,
    services,
    translation_req,
    translation_requests,
    tutor_profiles,
)


app = FastAPI(
    title="Nee's Learning Management API",
    description="Internal management API for Haitian Creole tutoring and translation services",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(
    services.router,
    prefix="/api/v1/services",
    tags=["Services"],
)
app.include_router(
    availability.router,
    prefix="/api/v1/availability",
    tags=["Availability"],
)
app.include_router(
    bookings.router,
    prefix="/api/v1/bookings",
    tags=["Bookings"],
)
app.include_router(
    auth.router,
    prefix="/api/v1/auth",
    tags=["Authentication"],
)
app.include_router(
    google_auth.router,
    prefix="/api/v1/auth",
    tags=["Google Authentication"],
)
app.include_router(
    files.router,
    prefix="/api/v1/files",
    tags=["Files"],
)
app.include_router(
    translation_requests.router,
    prefix="/api/v1/translation-requests",
    tags=["Translation Requests"],
)
app.include_router(
    translation_req.router,
    prefix="/api/v1/translate",
    tags=["Translation"],
)
app.include_router(
    learner_profiles.router,
    prefix="/api/v1/learner-profiles",
    tags=["Learner Profiles"],
)
app.include_router(
    tutor_profiles.router,
    prefix="/api/v1/tutor-profiles",
    tags=["Tutor Profiles"],
)
app.include_router(
    lesson_history.router,
    prefix="/api/v1/lesson-history",
    tags=["Lesson History"],
)
app.include_router(payment_router)

@app.get("/")
def home():
    return {"message": "Nee's Learning Management API is running"}
