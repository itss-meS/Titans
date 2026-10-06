from typing import List
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from logic.gap_detector import detect_gaps
from logic.question_gen import generate, generate_questions
from logic.recommender import recommend
from schemas import (
    DetectRequest,
    DetectResponse,
    PracticeQOut,
    PracticeRequest,
    GenerateQuestionsRequest,
    GeneratedQuestionOut,
    RecommendationOut,
    RecommendRequest,
)

load_dotenv(Path(__file__).resolve().parents[2] / ".env")

app = FastAPI(title="DU-01 AI Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/detect-gaps", response_model=DetectResponse)
def detect_gaps_route(req: DetectRequest):
    return detect_gaps(
        req.student_id,
        [r.model_dump(mode="json") for r in req.responses],
        [q.model_dump(mode="json") for q in req.questions],
    )


@app.post("/recommend", response_model=List[RecommendationOut])
def recommend_route(req: RecommendRequest):
    return recommend([g.model_dump(mode="json") for g in req.gaps])


@app.post("/generate-practice", response_model=List[PracticeQOut])
def generate_practice_route(req: PracticeRequest):
    return generate([g.model_dump(mode="json") for g in req.gaps], req.count)


@app.post("/generate-questions", response_model=List[GeneratedQuestionOut])
def generate_questions_route(req: GenerateQuestionsRequest):
    try:
        return generate_questions(req.subject, req.concept, req.count, req.difficulty)
    except RuntimeError:
        raise HTTPException(status_code=503, detail="AI service unavailable")
