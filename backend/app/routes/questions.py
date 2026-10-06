from typing import List
from uuid import uuid4

from fastapi import APIRouter, Body, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth import User, get_user, require_teacher
from app.db import Question, get_db
from app.routes.subjects import subjects_from_questions
from app.schemas import GenerateQuestionsIn, QuestionIn, QuestionOut
from app.services import ai_client

router = APIRouter(prefix="/api")


@router.post("/questions")
def create_questions(
    body: List[QuestionIn] = Body(..., min_length=1),
    db: Session = Depends(get_db),
    user: User = Depends(require_teacher),
):
    explicit_ids = [item.id for item in body if item.id]
    if len(explicit_ids) != len(set(explicit_ids)):
        raise HTTPException(status_code=409, detail="Duplicate question id")

    existing_ids = set(
        db.scalars(select(Question.id).where(Question.id.in_(explicit_ids))).all()
    )
    if existing_ids:
        raise HTTPException(
            status_code=409,
            detail="Question already exists: {}".format(sorted(existing_ids)[0]),
        )

    count = 0
    for item in body:
        qid = item.id or str(uuid4())
        db.add(
            Question(
                id=qid,
                stem=item.stem.strip(),
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


@router.post("/questions/generate")
def generate_questions(
    body: GenerateQuestionsIn,
    db: Session = Depends(get_db),
    user: User = Depends(require_teacher),
):
    subjects = subjects_from_questions(db)
    selected = next((item for item in subjects if item.id == body.subject), None)
    if selected is None:
        raise HTTPException(status_code=422, detail="Unknown subject")
    if body.concept not in selected.concepts:
        raise HTTPException(status_code=422, detail="Unknown concept")
    questions = ai_client.generate_questions(
        body.subject,
        body.concept,
        body.count,
        body.difficulty,
    )
    existing_stems = {
        " ".join(row.stem.split()).casefold()
        for row in db.scalars(select(Question)).all()
    }
    valid = []
    seen_stems = set()
    seen_ids = set()
    for item in questions:
        stem = str(item.get("stem", "")).strip()
        qid = item.get("id")
        options = item.get("options")
        correct = item.get("correct_answer")
        if (
            not isinstance(qid, str)
            or not qid.startswith("gen_")
            or qid in seen_ids
            or item.get("type") not in {"mcq", "short_answer"}
            or not stem
            or " ".join(stem.split()).casefold() in existing_stems
            or " ".join(stem.split()).casefold() in seen_stems
            or item.get("topics") != [body.concept]
            or item.get("difficulty") != body.difficulty
            or item.get("rubric") != {}
        ):
            continue
        if item["type"] == "mcq":
            if (
                not isinstance(options, list)
                or len(options) != 4
                or len(set(options)) != 4
                or correct not in options
            ):
                continue
        elif (
            not isinstance(correct, str)
            or not correct.strip()
            or len(correct.strip()) > 200
            or options != []
        ):
            continue
        seen_ids.add(qid)
        seen_stems.add(" ".join(stem.split()).casefold())
        valid.append(
            {
                "id": qid,
                "stem": stem,
                "type": item["type"],
                "options": options,
                "correct_answer": correct,
                "topics": [body.concept],
                "difficulty": body.difficulty,
                "rubric": {},
            }
        )
    return {"questions": valid}


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
