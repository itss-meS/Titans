from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field, StrictInt, StrictStr


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
    id: str
    stem: str
    type: QType
    correct_answer: Any
    options: List[str] = []
    topics: List[str]
    difficulty: int = 3
    rubric: Dict[str, float] = {}


class ResponseItem(BaseModel):
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


class DetectRequest(BaseModel):
    student_id: str
    responses: List[ResponseItem]
    questions: List[QuestionIn]


class DetectResponse(BaseModel):
    gaps: List[GapOut]
    strengths: List[str]
    mastery_by_concept: List[ConceptMastery]
    overall_mastery: float
    status: str
    message: str


class RecommendRequest(BaseModel):
    gaps: List[GapOut]


class PracticeRequest(BaseModel):
    gaps: List[GapOut]
    count: int = 5


class GenerateQuestionsRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    subject: StrictStr = Field(min_length=1, max_length=100)
    concept: StrictStr = Field(min_length=1, max_length=100)
    count: StrictInt = Field(default=5, ge=1, le=10)
    difficulty: StrictInt = Field(default=3, ge=1, le=5)


class GeneratedQuestionOut(BaseModel):
    id: str
    stem: str
    type: QType
    options: List[str]
    correct_answer: Any
    topics: List[str]
    difficulty: int
    rubric: Dict[str, float]
