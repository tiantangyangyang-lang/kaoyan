import type { Mastery, QuestionState } from "./types";

export const EMPTY_QUESTION_STATE: QuestionState = {
  mastery: "unmarked",
  inWrongBook: false,
  attempts: 0,
  correctAttempts: 0,
  lastCorrectness: "unknown",
  lastAnswer: "",
  lastAttemptAt: null,
  note: "",
};

export const MASTERY_LABELS: Record<Mastery, string> = {
  unmarked: "未标记",
  mastered: "掌握",
  fuzzy: "不熟",
  unknown: "不会",
};

export const TYPE_LABELS: Record<string, string> = {
  multiple_choice: "选择题",
  fill_in_blank: "填空题",
  solution: "解答题",
  proof: "证明题",
  unknown: "其他",
};

export const STATUS_LABELS: Record<string, string> = {
  ready_for_approval: "内容完整",
  ready_with_info: "有提示项",
  blocked: "待核对",
};

export const FEEDBACK_EMAIL = import.meta.env.VITE_FEEDBACK_EMAIL?.trim() ?? "";
