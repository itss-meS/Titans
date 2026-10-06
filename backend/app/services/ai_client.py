import os

import httpx
from fastapi import HTTPException


def _base_url() -> str:
    return os.environ.get("AI_SERVICE_URL", "http://127.0.0.1:8001").rstrip("/")


def _post(path: str, payload: dict):
    try:
        with httpx.Client(timeout=10.0) as client:
            response = client.post(_base_url() + path, json=payload)
            response.raise_for_status()
            return response.json()
    except (httpx.HTTPError, ValueError):
        raise HTTPException(status_code=502, detail="AI service unavailable")


def detect_gaps(payload: dict) -> dict:
    return _post("/detect-gaps", payload)


def recommend(gaps: list) -> list:
    return _post("/recommend", {"gaps": gaps})


def generate_practice(gaps: list, count: int) -> list:
    return _post("/generate-practice", {"gaps": gaps, "count": count})


def ai_health() -> bool:
    try:
        with httpx.Client(timeout=10.0) as client:
            response = client.get(_base_url() + "/health")
            return response.is_success
    except httpx.HTTPError:
        return False
