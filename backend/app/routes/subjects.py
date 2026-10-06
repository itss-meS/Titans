from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth import User, get_user
from app.db import ClassRoom, Question, get_db
from app.schemas import SubjectOut

router = APIRouter(prefix="/api")

DEFAULT_SUBJECT_ID = "programming"
DEFAULT_SUBJECT_NAME = "Programming (CS101)"


def subjects_from_questions(db: Session) -> List[SubjectOut]:
    questions = db.scalars(select(Question).order_by(Question.id)).all()
    class_id = db.scalar(select(ClassRoom.id).order_by(ClassRoom.id)) or 1
    concepts: List[str] = []
    for question in questions:
        for topic in question.topics or []:
            if topic not in concepts:
                concepts.append(topic)
    return [
        SubjectOut(
            id=DEFAULT_SUBJECT_ID,
            name=DEFAULT_SUBJECT_NAME,
            class_id=class_id,
            concepts=concepts,
        )
    ]


def get_subject(db: Session, subject_id: str | None) -> SubjectOut:
    subjects = subjects_from_questions(db)
    selected = subject_id or subjects[0].id
    return next(subject for subject in subjects if subject.id == selected)


@router.get("/subjects", response_model=List[SubjectOut])
def list_subjects(db: Session = Depends(get_db), user: User = Depends(get_user)):
    return subjects_from_questions(db)
