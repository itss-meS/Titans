from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth import User, ensure_student_access, get_user
from app.db import PracticeAttempt, PracticeSet, get_db
from app.schemas import PracticeQOut, SubmitIn, SubmitOut
from app.services.text_utils import answers_match

router = APIRouter(prefix="/api")


def load_set(db: Session, set_id: str, user: User) -> PracticeSet:
    practice_set = db.get(PracticeSet, set_id)
    if practice_set is None:
        raise HTTPException(status_code=404, detail="Practice set not found")
    ensure_student_access(user, practice_set.student_id)
    return practice_set


@router.get("/practice/{set_id}", response_model=List[PracticeQOut])
def get_practice(
    set_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_user),
):
    practice_set = load_set(db, set_id, user)
    return [PracticeQOut(**item) for item in practice_set.questions]


@router.post("/practice/{set_id}/submit", response_model=SubmitOut)
def submit_practice(
    set_id: str,
    body: SubmitIn,
    db: Session = Depends(get_db),
    user: User = Depends(get_user),
):
    practice_set = load_set(db, set_id, user)
    question = next(
        (item for item in practice_set.questions if item["id"] == body.question_id),
        None,
    )
    if question is None:
        raise HTTPException(status_code=404, detail="Question not found")

    correct = answers_match(body.answer, question["correct_answer"])
    db.add(
        PracticeAttempt(
            set_id=set_id,
            student_id=practice_set.student_id,
            question_id=body.question_id,
            answer=body.answer,
            correct=correct,
            time_spent=body.time_spent,
        )
    )
    db.commit()
    return SubmitOut(
        correct=correct,
        correct_answer=question["correct_answer"],
        explanation=question.get("explanation", ""),
    )
