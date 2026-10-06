import re
from typing import Dict, List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth import User, require_teacher
from app.db import ClassRoom, Question, Student, get_db
from app.schemas import DashboardCell, DashboardOut, DashboardStudent, TopGap
from app.services.analysis import analyze_student

router = APIRouter(prefix="/api")


def natural_key(value: str):
    return [int(part) if part.isdigit() else part.lower() for part in re.split(r"(\d+)", value)]


@router.get("/classes/{class_id}/dashboard", response_model=DashboardOut)
def class_dashboard(
    class_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_teacher),
):
    classroom = db.get(ClassRoom, class_id)
    if classroom is None:
        raise HTTPException(status_code=404, detail="Class not found")

    questions = sorted(db.scalars(select(Question)).all(), key=lambda q: natural_key(q.id))
    concepts: List[str] = []
    for question in questions:
        for topic in question.topics or []:
            if topic not in concepts:
                concepts.append(topic)

    students = db.scalars(
        select(Student).where(Student.class_id == class_id).order_by(Student.id)
    ).all()

    dashboard_students: List[DashboardStudent] = []
    severities: Dict[str, List[str]] = {concept: [] for concept in concepts}
    masteries: Dict[str, List[float]] = {concept: [] for concept in concepts}

    for student in students:
        det = analyze_student(db, student.id)
        by_concept = {item["concept"]: item for item in det["mastery_by_concept"]}
        cells: List[DashboardCell] = []
        for concept in concepts:
            item = by_concept.get(concept)
            if item is not None:
                severity = item["severity"]
                mastery = item["mastery"]
                severities[concept].append(severity)
                masteries[concept].append(mastery)
                cells.append(DashboardCell(concept=concept, severity=severity, mastery=mastery))
            else:
                cells.append(DashboardCell(concept=concept, severity="none", mastery=None))
        dashboard_students.append(
            DashboardStudent(
                student_id=student.id,
                name=student.name,
                overall_mastery=det["overall_mastery"],
                cells=cells,
            )
        )

    top_gaps: List[TopGap] = []
    for concept in concepts:
        affected = sum(1 for severity in severities[concept] if severity in ("critical", "high"))
        if affected > 0:
            values = masteries[concept]
            avg = round(sum(values) / len(values), 2)
            top_gaps.append(TopGap(concept=concept, affected_students=affected, avg_mastery=avg))

    top_gaps.sort(key=lambda gap: (-gap.affected_students, gap.avg_mastery))
    top_gaps = top_gaps[:5]

    return DashboardOut(
        class_id=class_id,
        class_name=classroom.name,
        concepts=concepts,
        students=dashboard_students,
        top_gaps=top_gaps,
    )
