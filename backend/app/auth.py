from dataclasses import dataclass
from typing import Optional

from fastapi import Depends, Header, HTTPException


@dataclass
class User:
    role: str
    student_id: Optional[str]


def get_user(
    x_user_role: Optional[str] = Header(None),
    x_student_id: Optional[str] = Header(None),
) -> User:
    if x_user_role not in {"teacher", "student"}:
        raise HTTPException(status_code=401, detail="Unauthorized")
    if x_user_role == "student" and not x_student_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
    return User(role=x_user_role, student_id=x_student_id)


def require_teacher(user: User = Depends(get_user)) -> User:
    if user.role != "teacher":
        raise HTTPException(status_code=403, detail="Forbidden")
    return user


def ensure_student_access(user: User, student_id: str) -> None:
    if user.role == "student" and user.student_id != student_id:
        raise HTTPException(status_code=403, detail="Forbidden")
