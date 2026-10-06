import re
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth import User, require_teacher
from app.db import ClassRoom, Student, get_db
from app.schemas import StudentCreate, StudentListItem

router = APIRouter(prefix="/api")


@router.get("/students", response_model=List[StudentListItem])
def list_students(db: Session = Depends(get_db), user: User = Depends(require_teacher)):
    rows = db.scalars(select(Student).order_by(Student.id)).all()
    return [StudentListItem(id=row.id, name=row.name, class_id=row.class_id) for row in rows]


@router.post("/students", response_model=StudentListItem, status_code=201)
def create_student(
    body: StudentCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_teacher),
):
    if db.get(ClassRoom, body.class_id) is None:
        raise HTTPException(status_code=404, detail="Class not found")

    cleaned_name = " ".join(body.name.split())
    if not 2 <= len(cleaned_name) <= 60:
        raise HTTPException(status_code=422, detail="Name must be between 2 and 60 characters")
    normalized_name = cleaned_name.casefold()
    existing = db.scalars(select(Student).where(Student.class_id == body.class_id)).all()
    if any(" ".join(student.name.split()).casefold() == normalized_name for student in existing):
        raise HTTPException(status_code=409, detail="Student already exists")

    numbers = [
        int(match.group(1))
        for student in db.scalars(select(Student)).all()
        if (match := re.fullmatch(r"stu_(\d+)", student.id))
    ]
    next_number = max(numbers, default=0) + 1
    student_id = "stu_{}".format(next_number)
    student = Student(id=student_id, name=cleaned_name, class_id=body.class_id)
    db.add(student)
    db.commit()
    return StudentListItem(id=student.id, name=student.name, class_id=student.class_id)
