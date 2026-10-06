from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel


class Severity(str, Enum):
    critical = "critical"
    high = "high"
    medium = "medium"
    low = "low"


class QType(str, Enum):
    mcq = "mcq"
    code = "code"
    short_answer = "short_answer"


class QuestionIn(BaseModel):
    id: Optional[str] = None
    stem: str
    type: QType
    correct_answer: Any
    options: List[str] = []
    topics: List[str]
    difficulty: int = 3
    rubric: Dict[str, float] = {}


class QuestionOut(QuestionIn):
    id: str


class ResponseIn(BaseModel):
    student_id: str
    question_id: str
    answer: Any
    time_spent: int = 60
    hints_used: int = 0


class GapOut(BaseModel):
    concept: str
    severity: Severity
    confidence: float
    mastery: float
    evidence: List[str]
    trend: str = "stable"
    prerequisite_gaps: List[str] = []


class ConceptMastery(BaseModel):
    concept: str
    mastery: float
    severity: Severity


class RecommendationOut(BaseModel):
    priority: int
    type: str
    title: str
    description: str
    target_concept: str
    estimated_time_min: int


class PracticeQOut(BaseModel):
    id: str
    stem: str
    type: QType
    options: List[str] = []
    correct_answer: Any
    explanation: str
    target_concept: str


class ReportOut(BaseModel):
    student_id: str
    student_name: str
    overall_mastery: float
    status: str
    message: str
    gaps: List[GapOut]
    strengths: List[str]
    mastery_by_concept: List[ConceptMastery]
    recommendations: List[RecommendationOut]
    practice_set_id: Optional[str] = None
    practice_set: List[PracticeQOut]


class DashboardCell(BaseModel):
    concept: str
    severity: str
    mastery: Optional[float] = None


class DashboardStudent(BaseModel):
    student_id: str
    name: str
    overall_mastery: float
    cells: List[DashboardCell]


class TopGap(BaseModel):
    concept: str
    affected_students: int
    avg_mastery: float


class DashboardOut(BaseModel):
    class_id: int
    class_name: str
    concepts: List[str]
    students: List[DashboardStudent]
    top_gaps: List[TopGap]


class StudentListItem(BaseModel):
    id: str
    name: str
    class_id: int


class SubmitIn(BaseModel):
    question_id: str
    answer: Any
    time_spent: int = 0


class SubmitOut(BaseModel):
    correct: bool
    correct_answer: Any
    explanation: str
