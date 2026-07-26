export interface ContentOption {
  label: string;
  value: string;
}

export interface ContentQuestionListItem {
  stableId: string;
  sourceYear: number;
  type: string;
  questionNumber: number;
  stem: string;
  options: ContentOption[];
  finalizationStatus: string;
}

export interface ContentQuestionDetail extends ContentQuestionListItem {
  answer: string | null;
  answerStatus: string;
  explanation: string | null;
  explanationStatus: string;
  reviewStatus: string;
  knowledgePoints: string[];
}

export interface ContentQuestionPage {
  items: ContentQuestionListItem[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export type ContentSubjectCode = "math1" | "math2" | "math3";

export interface ContentStore {
  listPublishedQuestions(input: {
    subjectCode: ContentSubjectCode;
    year?: number;
    minYear?: number;
    maxYear?: number;
    type?: "multiple_choice" | "fill_in_blank" | "solution" | "proof" | "unknown";
    page: number;
    pageSize: number;
  }): Promise<ContentQuestionPage>;
  getPublishedQuestion(
    subjectCode: ContentSubjectCode,
    stableId: string,
  ): Promise<ContentQuestionDetail | null>;
}
