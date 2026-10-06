from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth import User, require_teacher
from app.db import Student, get_db
from app.schemas import StudentListItem

router = APIRouter(prefix="/api")


@router.get("/students", response_model=List[StudentListItem])
def list_students(db: Session = Depends(get_db), user: User = Depends(require_teacher)):
    rows = db.scalars(select(Student).order_by(Student.id)).all()
    return [StudentListItem(id=row.id, name=row.name, class_id=row.class_id) for row in rows]
