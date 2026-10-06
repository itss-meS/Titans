import uuid
from typing import Dict, Any, List
from fastapi import APIRouter, HTTPException
from app.db import read_json, write_json

router = APIRouter(prefix="/api/practice", tags=["practice"])

@router.post("/generate")
def create_practice_set(payload: Dict[str, Any]):
    student_id = payload.get("student_id")
    concept = payload.get("target_concept")
    count = payload.get("count", 5)

    questions_all = read_json("questions.json")
    matching = [q for q in questions_all if concept in q.get("topics", [])]
    if not matching:
        matching = questions_all[:count]
    else:
        matching = matching[:count]

    set_id = f"pset_{uuid.uuid4().hex[:8]}"
    practice_set = {
        "id": set_id,
        "student_id": student_id,
        "target_concept": concept,
        "questions": matching
    }

    sets_all = read_json("practice_sets.json")
    sets_all.append(practice_set)
    write_json("practice_sets.json", sets_all)

    return practice_set

@router.get("/{set_id}")
def get_practice_set(set_id: str):
    sets_all = read_json("practice_sets.json")
    pset = next((s for s in sets_all if str(s.get("id")) == str(set_id)), None)
    if not pset:
        raise HTTPException(status_code=404, detail="Practice set not found")
    return pset

@router.post("/{set_id}/submit")
def submit_practice_set(set_id: str, payload: Dict[str, Any]):
    sets_all = read_json("practice_sets.json")
    pset = next((s for s in sets_all if str(s.get("id")) == str(set_id)), None)
    if not pset:
        raise HTTPException(status_code=404, detail="Practice set not found")

    answers = payload.get("answers", {})
    questions = pset.get("questions", [])
    correct_count = 0

    for q in questions:
        qid = q.get("id")
        user_ans = str(answers.get(qid, "")).strip().lower()
        corr_ans = str(q.get("correct_answer", "")).strip().lower()
        if user_ans and user_ans == corr_ans:
            correct_count += 1

    total = len(questions)
    score_pct = round((correct_count / total) * 100, 1) if total > 0 else 0.0

    return {
        "set_id": set_id,
        "total": total,
        "correct": correct_count,
        "score_percentage": score_pct
    }
