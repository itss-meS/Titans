from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.schemas import SubjectOut
from app.services.analysis import CONCEPTS
from app.routes.students import router as students_router
from app.routes.classes import router as classes_router
from app.routes.questions import router as questions_router
from app.routes.practice import router as practice_router
from app.routes.responses import router as responses_router
from app.routes.reports import router as reports_router

app = FastAPI(title="DU-01 Backend Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"status": "backend operational"}

@app.get("/api/subjects", response_model=list[SubjectOut])
def list_subjects():
    return [
        {
            "id": "programming",
            "name": "Programming (CS101)",
            "class_id": 1,
            "concepts": CONCEPTS
        }
    ]

app.include_router(students_router)
app.include_router(classes_router)
app.include_router(questions_router)
app.include_router(practice_router)
app.include_router(responses_router)
app.include_router(reports_router)
