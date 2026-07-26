export type SubjectCode = "math1" | "math2" | "math3";

export type QuestionType =
  | "multiple_choice"
  | "fill_in_blank"
  | "solution"
  | "proof"
  | "unknown";

export type FinalizationStatus =
  | "ready_for_approval"
  | "ready_with_info"
  | "blocked"
  | "published";

export type Mastery = "unmarked" | "mastered" | "fuzzy" | "unknown";
export type Correctness = "correct" | "incorrect" | "unknown";

export interface QuestionOption {
  label: string;
  value?: string;
  text?: string;
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
  reviewStatus: string;
  finalizationStatus: FinalizationStatus;
  knowledgePoints: string[];
  anomalies: Array<Record<string, unknown>>;
  detailLoaded?: boolean;
}

export interface QuestionBank {
  schemaVersion: string;
  subjectCode: SubjectCode;
  totalYears: number;
  totalQuestions: number;
  questions: Question[];
}

export interface SubjectCatalogItem {
  code: SubjectCode;
  name: string;
  questionBankUrl?: string;
  enabled: boolean;
  questionCount: number;
  statusLabel?: string;
  reviewNote?: string;
  feedbackEmail?: string;
}

export interface SubjectCatalog {
  schemaVersion: "kaoyan-subject-catalog-v1";
  subjects: SubjectCatalogItem[];
}

export interface PublishedContentOption {
  label: string;
  value: string;
}

export interface PublishedQuestionListItem {
  stableId: string;
  sourceYear: number;
  type: QuestionType;
  questionNumber: number;
  stem: string;
  options: PublishedContentOption[];
  finalizationStatus: FinalizationStatus;
}

export interface PublishedQuestionDetail extends PublishedQuestionListItem {
  answer: string | null;
  answerStatus: string;
  explanation: string | null;
  explanationStatus: string;
  reviewStatus: string;
  knowledgePoints: string[];
}

export interface PublishedQuestionPage {
  items: PublishedQuestionListItem[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
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

export type MathAnimationKind =
  | "asymptote"
  | "tangent-plane"
  | "tangent-intercept"
  | "cylindrical-solid"
  | "integral-region"
  | "radial-density";

export interface MathAnimationStep {
  title: string;
  body: string;
}

export interface MathAnimationSpec {
  version: 1;
  kind: MathAnimationKind;
  title: string;
  summary: string;
  accent: string;
  steps: MathAnimationStep[];
}

export interface QuestionAnimation {
  questionId: string;
  subjectCode: SubjectCode;
  payload: MathAnimationSpec;
  updatedAt: string;
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
