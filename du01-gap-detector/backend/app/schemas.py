from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field

class SubjectOut(BaseModel):
    id: str
    name: str
    class_id: int
    concepts: List[str]

class StudentCreate(BaseModel):
    name: str
    class_id: int

class StudentOut(BaseModel):
    id: str
    name: str
    class_id: int

class QuestionGenerateReq(BaseModel):
    subject: str
    concept: str
    count: int = Field(5, ge=1, le=10)
    difficulty: int = Field(2, ge=1, le=3)

class Question(BaseModel):
    id: str
    stem: str
    type: str
    correct_answer: Any
    options: List[str] = []
    topics: List[str] = []
    difficulty: int = 1
    rubric: Dict[str, Any] = {}

class GenerateOut(BaseModel):
    questions: List[Question]
