from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth import User, ensure_student_access, get_user
from app.db import PracticeSet, Student, get_db
from app.schemas import ReportOut
from app.services import ai_client
from app.services.analysis import analyze_student

router = APIRouter(prefix="/api")


@router.get("/students/{student_id}/report", response_model=ReportOut)
def student_report(
    student_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_user),
):
    ensure_student_access(user, student_id)
    student = db.get(Student, student_id)
    if student is None:
        raise HTTPException(status_code=404, detail="Student not found")

    det = analyze_student(db, student_id)
    gaps = det["gaps"]

    if gaps:
        recommendations = ai_client.recommend(gaps)
        practice = ai_client.generate_practice(gaps, 5)
    elif det["status"] == "no_data":
        recommendations = []
        practice = []
    else:
        strongest = sorted(
            det["mastery_by_concept"],
            key=lambda item: (-item["mastery"], item["concept"]),
        )[:3]
        recommendations = ai_client.recommend(
            [
                {
                    "concept": item["concept"],
                    "severity": "low",
                    "confidence": 1.0,
                    "mastery": item["mastery"],
                    "evidence": [],
                    "trend": "stable",
                    "prerequisite_gaps": [],
                }
                for item in strongest
            ]
        )
        practice = []

    practice_set_id = None
    if practice:
        practice_set_id = str(uuid4())
        db.add(PracticeSet(id=practice_set_id, student_id=student_id, questions=practice))
        db.commit()

    return ReportOut(
        student_id=student_id,
        student_name=student.name,
        overall_mastery=det["overall_mastery"],
        status=det["status"],
        message=det["message"],
        gaps=gaps,
        strengths=det["strengths"],
        mastery_by_concept=det["mastery_by_concept"],
        recommendations=recommendations,
        practice_set_id=practice_set_id,
        practice_set=practice,
    )
