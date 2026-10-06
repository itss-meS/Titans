from contextlib import asynccontextmanager
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func, select

from app.db import Question, SessionLocal, init_db
from app.routes import classes, practice, questions, reports, responses, students
from app.routes import subjects
from app.seed import seed
from app.services.ai_client import ai_health

load_dotenv(Path(__file__).resolve().parents[2] / ".env")


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    with SessionLocal() as db:
        count = db.scalar(select(func.count()).select_from(Question))
        if not count:
            seed(db)
    yield


app = FastAPI(title="DU-01 Gap Detector API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(questions.router)
app.include_router(responses.router)
app.include_router(students.router)
app.include_router(subjects.router)
app.include_router(reports.router)
app.include_router(classes.router)
app.include_router(practice.router)


@app.get("/api/health")
def health():
    return {"status": "ok", "ai": ai_health()}
