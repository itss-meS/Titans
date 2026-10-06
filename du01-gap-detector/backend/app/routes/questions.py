from typing import List, Union, Dict, Any
from fastapi import APIRouter, HTTPException, Header
from app.db import read_json, write_json
from app.schemas import QuestionGenerateReq, GenerateOut, Question
from app.services.ai_client import generate_questions_llm
from app.services.analysis import CONCEPTS

router = APIRouter(prefix="/api/questions", tags=["questions"])

@router.get("", response_model=List[Dict[str, Any]])
def list_questions():
    return read_json("questions.json")

@router.post("/generate", response_model=GenerateOut)
def generate_questions_route(
    payload: QuestionGenerateReq,
    x_user_role: str = Header(None, alias="X-User-Role")
):
    if x_user_role and x_user_role != "teacher":
        raise HTTPException(status_code=403, detail="Teacher role required")

    if payload.concept not in CONCEPTS:
        raise HTTPException(status_code=422, detail="Invalid concept for subject")

    items = generate_questions_llm(payload.concept, payload.count, payload.difficulty)
    return {"questions": items}

@router.post("")
def save_questions(
    payload: Union[List[Dict[str, Any]], Dict[str, Any]],
    x_user_role: str = Header(None, alias="X-User-Role")
):
    if x_user_role and x_user_role != "teacher":
        raise HTTPException(status_code=403, detail="Teacher role required")

    existing = read_json("questions.json")
    items_to_add = payload if isinstance(payload, list) else [payload]

    existing_ids = {q.get("id") for q in existing}
    added_count = 0

    for q in items_to_add:
        qid = q.get("id")
        if qid not in existing_ids:
            existing.append(q)
            existing_ids.add(qid)
            added_count += 1

    write_json("questions.json", existing)
    return {"saved": added_count, "total": len(existing)}
