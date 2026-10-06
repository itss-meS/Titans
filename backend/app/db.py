from datetime import datetime
from pathlib import Path
from typing import Any, Optional

from sqlalchemy import JSON, Boolean, DateTime, ForeignKey, Integer, String, Text, create_engine
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, sessionmaker

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)
DB_PATH = DATA_DIR / "app.db"

engine = create_engine(
    "sqlite:///" + DB_PATH.as_posix(),
    connect_args={"check_same_thread": False},
)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


class Base(DeclarativeBase):
    pass


class ClassRoom(Base):
    __tablename__ = "classes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String)


class Student(Base):
    __tablename__ = "students"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    name: Mapped[str] = mapped_column(String)
    class_id: Mapped[int] = mapped_column(Integer, ForeignKey("classes.id"))


class Question(Base):
    __tablename__ = "questions"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    stem: Mapped[str] = mapped_column(Text)
    type: Mapped[str] = mapped_column(String)
    correct_answer: Mapped[Any] = mapped_column(JSON)
    options: Mapped[Any] = mapped_column(JSON)
    topics: Mapped[Any] = mapped_column(JSON)
    difficulty: Mapped[int] = mapped_column(Integer, default=3)
    rubric: Mapped[Any] = mapped_column(JSON)


class Response(Base):
    __tablename__ = "responses"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    student_id: Mapped[str] = mapped_column(String, ForeignKey("students.id"), index=True)
    question_id: Mapped[str] = mapped_column(String, ForeignKey("questions.id"), index=True)
    answer: Mapped[Any] = mapped_column(JSON)
    time_spent: Mapped[int] = mapped_column(Integer, default=60)
    hints_used: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class PracticeSet(Base):
    __tablename__ = "practice_sets"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    student_id: Mapped[str] = mapped_column(String)
    questions: Mapped[Any] = mapped_column(JSON)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class PracticeAttempt(Base):
    __tablename__ = "practice_attempts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    set_id: Mapped[str] = mapped_column(String)
    student_id: Mapped[str] = mapped_column(String)
    question_id: Mapped[str] = mapped_column(String)
    answer: Mapped[Any] = mapped_column(JSON)
    correct: Mapped[bool] = mapped_column(Boolean)
    time_spent: Mapped[Optional[int]] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    Base.metadata.create_all(engine)
