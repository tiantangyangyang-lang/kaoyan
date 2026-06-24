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

export interface ContentStore {
  listPublishedQuestions(input: {
    subjectCode: "math2";
    year?: number;
    type?: "multiple_choice" | "fill_in_blank" | "solution";
    page: number;
    pageSize: number;
  }): Promise<ContentQuestionPage>;
  getPublishedQuestion(
    subjectCode: "math2",
    stableId: string,
  ): Promise<ContentQuestionDetail | null>;
}
