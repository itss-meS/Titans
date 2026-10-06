from typing import List, Dict, Any
from fastapi import APIRouter
from app.db import read_json, write_json

router = APIRouter(prefix="/api/responses", tags=["responses"])

@router.get("", response_model=List[Dict[str, Any]])
def list_responses():
    return read_json("responses.json")

@router.post("")
def add_response(payload: Dict[str, Any]):
    responses = read_json("responses.json")
    responses.append(payload)
    write_json("responses.json", responses)
    return {"status": "ok", "total": len(responses)}
