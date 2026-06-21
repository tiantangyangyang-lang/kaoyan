export type SubjectCode = "math1" | "math2";

export type QuestionType =
  | "multiple_choice"
  | "fill_in_blank"
  | "solution"
  | "proof"
  | "unknown";

export type FinalizationStatus =
  | "ready_for_approval"
  | "ready_with_info"
  | "blocked";

export type Mastery = "unmarked" | "mastered" | "fuzzy" | "unknown";
export type Correctness = "correct" | "incorrect" | "unknown";

export interface QuestionOption {
  label: string;
  value: string;
}

export interface Question {
  stableId: string;
  sourceYear: number;
  subjectCode: SubjectCode;
  type: QuestionType;
  questionNumber: number | null;
  stem: string;
  options: QuestionOption[];
  answer: string | null;
  answerStatus: string;
  explanation: string;
  explanationStatus: string;
  reviewStatus: "needs_human_review";
  finalizationStatus: FinalizationStatus;
  knowledgePoints: string[];
  anomalies: Array<Record<string, unknown>>;
}

export interface QuestionBank {
  schemaVersion: string;
  subjectCode: SubjectCode;
  totalYears: number;
  totalQuestions: number;
  questions: Question[];
}

export interface QuestionState {
  mastery: Mastery;
  inWrongBook: boolean;
  attempts: number;
  correctAttempts: number;
  lastCorrectness: Correctness;
  lastAnswer: string;
  lastAttemptAt: string | null;
  note: string;
}

export type QuestionStateMap = Record<string, QuestionState>;

export interface PaperQuestionResult {
  answer: string;
  correctness: Correctness;
}

export interface PaperSession {
  id: string;
  sourceYear: number;
  startedAt: string;
  submittedAt: string | null;
  status: "in_progress" | "submitted";
  currentIndex: number;
  results: Record<string, PaperQuestionResult>;
}

export type PaperSessionMap = Record<string, PaperSession>;

export interface LearningDataBundle {
  schemaVersion: "kaoyan-learning-export-v2";
  exportedAt: string;
  subjectCode: SubjectCode;
  questionStates: QuestionStateMap;
  paperSessions: PaperSessionMap;
}

export interface AuthUser {
  id: string;
  email: string;
  emailVerified: boolean;
}

export type AppView =
  | "dashboard"
  | "bank"
  | "practice"
  | "papers"
  | "paper-session"
  | "review"
  | "wrong"
  | "stats"
  | "data"
  | "account";
