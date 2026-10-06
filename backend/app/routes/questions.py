from typing import List
from uuid import uuid4

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth import User, get_user, require_teacher
from app.db import Question, get_db
from app.schemas import QuestionIn, QuestionOut

router = APIRouter(prefix="/api")


@router.post("/questions")
def create_questions(
    body: List[QuestionIn],
    db: Session = Depends(get_db),
    user: User = Depends(require_teacher),
):
    count = 0
    for item in body:
        qid = item.id or str(uuid4())
        db.merge(
            Question(
                id=qid,
                stem=item.stem,
                type=item.type.value,
                correct_answer=item.correct_answer,
                options=item.options,
                topics=item.topics,
                difficulty=item.difficulty,
                rubric=item.rubric,
            )
        )
        count += 1
    db.commit()
    return {"inserted": count}


@router.get("/questions", response_model=List[QuestionOut])
def list_questions(db: Session = Depends(get_db), user: User = Depends(get_user)):
    rows = db.scalars(select(Question).order_by(Question.id)).all()
    return [
        QuestionOut(
            id=row.id,
            stem=row.stem,
            type=row.type,
            correct_answer=row.correct_answer,
            options=row.options or [],
            topics=row.topics or [],
            difficulty=row.difficulty,
            rubric=row.rubric or {},
        )
        for row in rows
    ]
