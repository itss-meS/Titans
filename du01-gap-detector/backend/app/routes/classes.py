from typing import Optional
from fastapi import APIRouter, HTTPException, Query
from app.db import read_json
from app.services.analysis import analyze_student, CONCEPTS

router = APIRouter(prefix="/api/classes", tags=["classes"])

@router.get("/{class_id}/dashboard")
def get_class_dashboard(
    class_id: int,
    subject: Optional[str] = Query("programming")
):
    classes = read_json("classes.json")
    cls = next((c for c in classes if c.get("id") == class_id), None)
    if not cls and class_id != 1:
        raise HTTPException(status_code=404, detail="Class not found")
        
    students = [s for s in read_json("students.json") if s.get("class_id") == class_id]
    responses_all = read_json("responses.json")
    responded_ids = {str(r.get("student_id")) for r in responses_all}

    heatmap = []
    for s in students:
        sid = str(s.get("id"))
        if sid in responded_ids:
            analysis = analyze_student(sid)
            cells = analysis.get("mastery_by_concept", [])
        else:
            cells = [{"concept": c, "mastery": None, "severity": "none"} for c in CONCEPTS]
            
        heatmap.append({
            "student_id": sid,
            "student_name": s.get("name"),
            "cells": cells
        })

    return {
        "class_id": class_id,
        "class_name": cls.get("name") if cls else "CS101 - Intro to Programming (Section A)",
        "subject": subject or "programming",
        "concepts": CONCEPTS,
        "students_count": len(students),
        "heatmap": heatmap
    }
