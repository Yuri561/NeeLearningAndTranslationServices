#######################################################################
#                                                                     #
#                    LESSON HISTORY API                               #
#                                                                     #
#        Tracks all completed, cancelled, or no-show lessons.        #
#        One record per lesson that has ended.                       #
#                                                                     #
#        - GET    /lesson-history/                   → all records   #
#        - POST   /lesson-history/                   → create record #
#        - GET    /lesson-history/student/{id}       → by student    #
#        - GET    /lesson-history/teacher/{id}       → by teacher    #
#        - GET    /lesson-history/{id}               → by record id  #
#        - PATCH  /lesson-history/{id}               → update record #
#        - DELETE /lesson-history/{id}               → delete record #
#                                                                     #
#######################################################################


from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy import select

from database.database import get_db
from models.lesson_history import LessonHistory
from models.user import User
from schemas.lesson_history import LessonHistoryCreate, LessonHistoryUpdate, LessonHistoryResponse
from auth.dependencies import get_current_user
from enums.enums import UserRole

router = APIRouter()


# ─── Get all lesson history records (admin only) ─────────────────────
@router.get("/", response_model=list[LessonHistoryResponse])
def get_all_lesson_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Only admins can view all lesson history")
    records = db.execute(select(LessonHistory)).scalars().all()
    return records


# ─── Create a lesson history record ─────────────────────────────────
@router.post("/", response_model=LessonHistoryResponse, status_code=201)
def create_lesson_history(
    lesson: LessonHistoryCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role not in [UserRole.TUTOR, UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Only tutors and admins can log lesson history")

    new_record = LessonHistory(
        booking_id=lesson.booking_id,
        student_id=lesson.student_id,
        teacher_id=lesson.teacher_id,
        service_id=lesson.service_id,
        lesson_date=lesson.lesson_date,
        start_time=lesson.start_time,
        end_time=lesson.end_time,
        duration_minutes=lesson.duration_minutes,
        status=lesson.status,
        student_notes=lesson.student_notes,
        teacher_notes=lesson.teacher_notes,
        student_rating=lesson.student_rating,
    )
    db.add(new_record)
    db.commit()
    db.refresh(new_record)
    return new_record


# ─── Get lesson history for a specific student ───────────────────────
@router.get("/student/{student_id}", response_model=list[LessonHistoryResponse])
def get_lesson_history_by_student(
    student_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # students can only view their own history; tutors and admins can view anyone's
    if current_user.role == UserRole.LEARNER and current_user.id != student_id:
        raise HTTPException(status_code=403, detail="You can only view your own lesson history")

    records = db.execute(
        select(LessonHistory).where(LessonHistory.student_id == student_id)
    ).scalars().all()
    return records


# ─── Get lesson history for a specific tutor ───────────────────────
@router.get("/tutor/{tutor_id}", response_model=list[LessonHistoryResponse])
def get_lesson_history_by_teacher(
    tutor_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # tutors can only view their own history; admins can view anyone's
    if current_user.role == UserRole.TUTOR and current_user.id != tutor_id:
        raise HTTPException(status_code=403, detail="You can only view your own lesson history")

    records = db.execute(
        select(LessonHistory).where(LessonHistory.tutor_id == tutor_id)
    ).scalars().all()
    return records


# ─── Get a single lesson history record by ID ───────────────────────
@router.get("/{lesson_id}", response_model=LessonHistoryResponse)
def get_lesson_history_by_id(
    lesson_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    record = db.get(LessonHistory, lesson_id)
    if not record:
        raise HTTPException(status_code=404, detail="Lesson history record not found")

    # learners can only see their own records
    if current_user.role == UserRole.LEARNER and record.student_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    # tutors can only see records they are part of
    if current_user.role == UserRole.TUTOR and record.tutor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    return record


# ─── Update a lesson history record ─────────────────────────────────
@router.patch("/{lesson_id}", response_model=LessonHistoryResponse)
def update_lesson_history(
    lesson_id: int,
    updates: LessonHistoryUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    record = db.get(LessonHistory, lesson_id)
    if not record:
        raise HTTPException(status_code=404, detail="Lesson history record not found")

    # learners can only update their own rating/notes
    if current_user.role == UserRole.LEARNER:
        if record.student_id != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied")
        allowed = {"student_notes", "student_rating"}
        update_data = {k: v for k, v in updates.model_dump(exclude_unset=True).items() if k in allowed}
    elif current_user.role == UserRole.TUTOR:
        if record.tutor_id != current_user.id:
            raise HTTPException(status_code=403, detail="You can only update your own lesson records")
        update_data = updates.model_dump(exclude_unset=True)
    else:
        # admin can update everything
        update_data = updates.model_dump(exclude_unset=True)

    for key, value in update_data.items():
        setattr(record, key, value)

    db.commit()
    db.refresh(record)
    return record


# ─── Delete a lesson history record (admin only) ─────────────────────
@router.delete("/{lesson_id}")
def delete_lesson_history(
    lesson_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Only admins can delete lesson history records")

    record = db.get(LessonHistory, lesson_id)
    if not record:
        raise HTTPException(status_code=404, detail="Lesson history record not found")

    db.delete(record)
    db.commit()
    return {"message": "Lesson history record successfully deleted"}
