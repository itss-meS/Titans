import json
from datetime import datetime
from pathlib import Path

from sqlalchemy import func, select

from app.db import (
    Base,
    ClassRoom,
    Question,
    Response,
    SessionLocal,
    Student,
    engine,
)

DATA_DIR = Path(__file__).resolve().parents[2] / "data"


def load_json(name: str) -> list[dict]:
    with (DATA_DIR / name).open(encoding="utf-8") as data_file:
        return json.load(data_file)


def seed(db) -> None:
    classes = load_json("classes.json")
    students = load_json("students.json")
    questions = load_json("questions.json")
    responses = load_json("responses.json")

    for item in classes:
        db.merge(ClassRoom(id=item["id"], name=item["name"]))
    for item in students:
        db.merge(Student(id=item["id"], name=item["name"], class_id=item["class_id"]))
    for item in questions:
        db.merge(
            Question(
                id=item["id"],
                stem=item["stem"],
                type=item["type"],
                correct_answer=item["correct_answer"],
                options=item.get("options", []),
                topics=item.get("topics", []),
                difficulty=item.get("difficulty", 3),
                rubric=item.get("rubric", {}),
            )
        )
    db.flush()
    for item in responses:
        response = Response(
            student_id=item["student_id"],
            question_id=item["question_id"],
            answer=item["answer"],
            time_spent=item.get("time_spent", 60),
            hints_used=item.get("hints_used", 0),
        )
        if item.get("submitted_at"):
            response.created_at = datetime.fromisoformat(item["submitted_at"])
        db.add(response)
    db.commit()


def reset_and_seed() -> None:
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    with SessionLocal() as db:
        seed(db)
        classes = db.scalar(select(func.count()).select_from(ClassRoom))
        students = db.scalar(select(func.count()).select_from(Student))
        questions = db.scalar(select(func.count()).select_from(Question))
        responses = db.scalar(select(func.count()).select_from(Response))
    print(f"Seeded {classes} class, {students} students, {questions} questions, {responses} responses")


if __name__ == "__main__":
    reset_and_seed()
