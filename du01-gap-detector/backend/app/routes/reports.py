from fastapi import APIRouter
from app.db import read_json
from app.services.analysis import analyze_student

router = APIRouter(prefix="/api/reports", tags=["reports"])

@router.get("/students/{student_id}")
def get_report_by_student_id(student_id: str):
    students = read_json("students.json")
    student = next((s for s in students if str(s.get("id")) == str(student_id)), None)
    analysis = analyze_student(student_id)
    return {
        "student": student or {"id": student_id, "name": f"Student {student_id}", "class_id": 1},
        **analysis
    }
