import os
import json
import httpx
from fastapi import HTTPException
from pathlib import Path

AI_SERVICE_URL = os.getenv("AI_SERVICE_URL", "http://127.0.0.1:8001")

def load_env_vars():
    env_paths = [
        Path.cwd() / ".env",
        Path(__file__).resolve().parent.parent.parent.parent / ".env",
        Path(__file__).resolve().parent.parent.parent / ".env",
    ]
    for p in env_paths:
        if p.exists():
            with open(p, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith("#") and "=" in line:
                        k, v = line.split("=", 1)
                        os.environ.setdefault(k.strip(), v.strip())

load_env_vars()

def call_ai_detect_gaps(student_id: str, responses: list, questions: list):
    try:
        with httpx.Client(timeout=10.0) as client:
            resp = client.post(
                f"{AI_SERVICE_URL}/detect-gaps",
                json={
                    "student_id": student_id,
                    "responses": responses,
                    "questions": questions
                }
            )
            if resp.status_code == 200:
                return resp.json()
    except Exception:
        pass
    return None

def call_ai_recommend(gaps: list):
    try:
        with httpx.Client(timeout=10.0) as client:
            resp = client.post(
                f"{AI_SERVICE_URL}/recommend",
                json={"gaps": gaps}
            )
            if resp.status_code == 200:
                return resp.json()
    except Exception:
        pass
    return None

def generate_questions_llm(concept: str, count: int, difficulty: int) -> list:
    api_key = os.getenv("OPENAI_API_KEY")
    model = os.getenv("LLM_MODEL", "gpt-4o-mini")
    if not api_key:
        raise HTTPException(status_code=503, detail="AI service unavailable")

    prompt = f"""Generate {count} distinct educational questions for the concept '{concept}' at difficulty level {difficulty} (1=Easy, 2=Medium, 3=Hard).
Return ONLY a valid JSON array of objects, with no markdown code blocks or extra text.
Each object must have:
- type: "mcq" or "short_answer"
- stem: string question prompt
- options: array of 4 distinct string choices if type is "mcq", empty array if "short_answer"
- correct_answer: string answer (must match one of the options for mcq)
- difficulty: integer ({difficulty})
"""

    try:
        with httpx.Client(timeout=45.0) as client:
            res = client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": model,
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": 0.7
                }
            )
            if res.status_code != 200:
                raise HTTPException(status_code=503, detail="AI service unavailable")
            
            data = res.json()
            content = data["choices"][0]["message"]["content"].strip()
            if content.startswith("```"):
                lines = content.splitlines()
                if lines[0].startswith("```"):
                    lines = lines[1:]
                if lines and lines[-1].startswith("```"):
                    lines = lines[:-1]
                content = "\n".join(lines).strip()
            
            raw_items = json.loads(content)
            valid_items = []
            for idx, item in enumerate(raw_items):
                qtype = item.get("type", "mcq")
                stem = item.get("stem")
                options = item.get("options", [])
                correct = item.get("correct_answer")
                if not stem or not correct:
                    continue
                if qtype == "mcq":
                    if len(options) != 4 or len(set(options)) != 4 or correct not in options:
                        continue
                elif qtype == "short_answer":
                    options = []
                else:
                    continue

                valid_items.append({
                    "id": f"gen_{concept.lower().replace(' ', '_')}_{idx + 1}",
                    "stem": stem,
                    "type": qtype,
                    "options": options,
                    "correct_answer": str(correct),
                    "topics": [concept],
                    "difficulty": difficulty,
                    "rubric": {}
                })
            return valid_items
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=503, detail="AI service unavailable")
