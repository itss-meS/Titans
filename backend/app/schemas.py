from enum import Enum
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field, StrictInt, StrictStr, field_validator


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
    model_config = ConfigDict(extra="forbid")

    id: Optional[str] = None
    stem: str = Field(min_length=1, max_length=4000)
    type: QType
    correct_answer: Any
    options: List[str] = Field(default_factory=list)
    topics: List[str] = Field(min_length=1)
    difficulty: int = Field(default=3, ge=1, le=5)
    rubric: Dict[str, float] = Field(default_factory=dict)


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


class SubjectOut(BaseModel):
    id: str
    name: str
    class_id: int
    concepts: List[str]


class StudentCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: StrictStr = Field(min_length=2, max_length=60)
    class_id: StrictInt = Field(ge=1)

    @field_validator("name")
    @classmethod
    def name_must_contain_text(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Name must contain non-whitespace characters")
        return value


class GenerateQuestionsIn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    subject: StrictStr = Field(min_length=1, max_length=100)
    concept: StrictStr = Field(min_length=1, max_length=100)
    count: StrictInt = Field(default=5, ge=1, le=10)
    difficulty: StrictInt = Field(default=3, ge=1, le=3)

    @field_validator("subject", "concept")
    @classmethod
    def value_must_contain_text(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Value must contain non-whitespace characters")
        return value


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
