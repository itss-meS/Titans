from fastapi import APIRouter, HTTPException, Header
from app.db import read_json, write_json
from app.schemas import StudentCreate, StudentOut
from app.services.analysis import analyze_student

router = APIRouter(prefix="/api/students", tags=["students"])

@router.get("", response_model=list)
def list_students():
    return read_json("students.json")

@router.get("/{id}")
def get_student(id: str):
    students = read_json("students.json")
    for s in students:
        if str(s.get("id")) == str(id):
            return s
    raise HTTPException(status_code=404, detail="Student not found")

@router.post("", status_code=201, response_model=StudentOut)
def create_student(
    payload: StudentCreate,
    x_user_role: str = Header(None, alias="X-User-Role")
):
    if x_user_role and x_user_role != "teacher":
        raise HTTPException(status_code=403, detail="Teacher role required")

    name = payload.name.strip()
    if len(name) < 2 or len(name) > 60:
        raise HTTPException(status_code=422, detail="Name must be between 2 and 60 characters")

    classes = read_json("classes.json")
    class_exists = any(c.get("id") == payload.class_id for c in classes)
    if not class_exists and payload.class_id != 1:
        raise HTTPException(status_code=404, detail="Class not found")

    students = read_json("students.json")
    for s in students:
        if s.get("class_id") == payload.class_id and s.get("name", "").strip().lower() == name.lower():
            raise HTTPException(status_code=409, detail="Student with this name already exists in the class")

    max_num = 0
    for s in students:
        sid = str(s.get("id", ""))
        if sid.startswith("stu_"):
            try:
                num = int(sid.split("_")[1])
                if num > max_num:
                    max_num = num
            except ValueError:
                pass

    new_id = f"stu_{max_num + 1}"
    new_student = {
        "id": new_id,
        "name": name,
        "class_id": payload.class_id
    }
    students.append(new_student)
    write_json("students.json", students)
    return new_student

@router.get("/{id}/report")
def get_student_report(id: str):
    students = read_json("students.json")
    student = next((s for s in students if str(s.get("id")) == str(id)), None)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    analysis = analyze_student(id)
    return {
        "student": student,
        **analysis
    }
