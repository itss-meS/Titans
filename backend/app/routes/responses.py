from typing import List

from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth import User, ensure_student_access, get_user
from app.db import Question, Response, Student, get_db
from app.schemas import ResponseIn

router = APIRouter(prefix="/api")


@router.post("/responses")
def create_responses(
    body: List[ResponseIn],
    db: Session = Depends(get_db),
    user: User = Depends(get_user),
):
    for item in body:
        ensure_student_access(user, item.student_id)

    student_ids = {item.student_id for item in body}
    question_ids = {item.question_id for item in body}

    known_students = set(db.scalars(select(Student.id).where(Student.id.in_(student_ids))).all())
    known_questions = set(db.scalars(select(Question.id).where(Question.id.in_(question_ids))).all())

    unknown = sorted((student_ids - known_students) | (question_ids - known_questions))
    if unknown:
        return JSONResponse(
            status_code=422,
            content={"detail": "Unknown student or question id", "unknown": unknown},
        )

    for item in body:
        db.add(
            Response(
                student_id=item.student_id,
                question_id=item.question_id,
                answer=item.answer,
                time_spent=item.time_spent,
                hints_used=item.hints_used,
            )
        )
    db.commit()
    return {"received": len(body)}
