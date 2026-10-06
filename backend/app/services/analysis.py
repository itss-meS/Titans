from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import Question, Response
from app.services import ai_client


def analyze_student(db: Session, student_id: str) -> dict:
    rows = db.scalars(
        select(Response)
        .where(Response.student_id == student_id)
        .order_by(Response.created_at, Response.id)
    ).all()

    question_ids = []
    for row in rows:
        if row.question_id not in question_ids:
            question_ids.append(row.question_id)

    question_rows = []
    if question_ids:
        question_rows = db.scalars(
            select(Question).where(Question.id.in_(question_ids)).order_by(Question.id)
        ).all()

    payload = {
        "student_id": student_id,
        "responses": [
            {
                "question_id": row.question_id,
                "answer": row.answer,
                "time_spent": row.time_spent,
                "hints_used": row.hints_used,
            }
            for row in rows
        ],
        "questions": [
            {
                "id": q.id,
                "stem": q.stem,
                "type": q.type,
                "correct_answer": q.correct_answer,
                "options": q.options or [],
                "topics": q.topics or [],
                "difficulty": q.difficulty,
                "rubric": q.rubric or {},
            }
            for q in question_rows
        ],
    }
    return ai_client.detect_gaps(payload)
