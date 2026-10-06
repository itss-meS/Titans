export type Severity = "critical" | "high" | "medium" | "low";
export type CellSeverity = Severity | "none";
export type QType = "mcq" | "code" | "short_answer";
export type Role = "teacher" | "student";

export interface GapOut {
  concept: string;
  severity: Severity;
  confidence: number;
  mastery: number;
  evidence: string[];
  trend: string;
  prerequisite_gaps: string[];
}

export interface ConceptMastery {
  concept: string;
  mastery: number;
  severity: Severity;
}

export interface RecommendationOut {
  priority: number;
  type: string;
  title: string;
  description: string;
  target_concept: string;
  estimated_time_min: number;
}

export interface PracticeQOut {
  id: string;
  stem: string;
  type: QType;
  options: string[];
  correct_answer: unknown;
  explanation: string;
  target_concept: string;
}

export interface ReportOut {
  student_id: string;
  student_name: string;
  overall_mastery: number;
  status: string;
  message: string;
  gaps: GapOut[];
  strengths: string[];
  mastery_by_concept: ConceptMastery[];
  recommendations: RecommendationOut[];
  practice_set_id: string | null;
  practice_set: PracticeQOut[];
}

export interface DashboardCell {
  concept: string;
  severity: CellSeverity;
  mastery: number | null;
}

export interface DashboardStudent {
  student_id: string;
  name: string;
  overall_mastery: number;
  cells: DashboardCell[];
}

export interface TopGap {
  concept: string;
  affected_students: number;
  avg_mastery: number;
}

export interface DashboardOut {
  class_id: number;
  class_name: string;
  concepts: string[];
  students: DashboardStudent[];
  top_gaps: TopGap[];
}

export interface SubmitOut {
  correct: boolean;
  correct_answer: unknown;
  explanation: string;
}
