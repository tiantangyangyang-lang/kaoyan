import { EMPTY_QUESTION_STATE } from "./constants";
import type {
  LearningDataBundle,
  PaperSessionMap,
  QuestionState,
  QuestionStateMap,
  SubjectCode,
} from "./types";

const storageKey = (subject: SubjectCode) => `kaoyan:${subject}:question-states:v1`;
const paperStorageKey = (subject: SubjectCode) =>
  `kaoyan:${subject}:paper-sessions:v1`;

export function loadQuestionStates(subject: SubjectCode): QuestionStateMap {
  try {
    const raw = localStorage.getItem(storageKey(subject));
    return raw ? (JSON.parse(raw) as QuestionStateMap) : {};
  } catch {
    return {};
  }
}

export function saveQuestionStates(
  subject: SubjectCode,
  states: QuestionStateMap,
): void {
  localStorage.setItem(storageKey(subject), JSON.stringify(states));
}

export function loadPaperSessions(subject: SubjectCode): PaperSessionMap {
  try {
    const raw = localStorage.getItem(paperStorageKey(subject));
    return raw ? (JSON.parse(raw) as PaperSessionMap) : {};
  } catch {
    return {};
  }
}

export function savePaperSessions(
  subject: SubjectCode,
  sessions: PaperSessionMap,
): void {
  localStorage.setItem(paperStorageKey(subject), JSON.stringify(sessions));
}

export function getQuestionState(
  states: QuestionStateMap,
  stableId: string,
): QuestionState {
  return states[stableId] ?? EMPTY_QUESTION_STATE;
}

export function exportLearningData(
  subject: SubjectCode,
  states: QuestionStateMap,
  paperSessions: PaperSessionMap,
): void {
  const payload: LearningDataBundle = {
    schemaVersion: "kaoyan-learning-export-v2",
    exportedAt: new Date().toISOString(),
    subjectCode: subject,
    questionStates: states,
    paperSessions,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${subject}-learning-data-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

export function parseLearningData(
  raw: string,
  expectedSubject: SubjectCode,
): LearningDataBundle {
  const parsed = JSON.parse(raw) as {
    schemaVersion?: string;
    exportedAt?: string;
    subjectCode?: SubjectCode;
    questionStates?: QuestionStateMap;
    paperSessions?: PaperSessionMap;
  };
  if (
    parsed.schemaVersion !== "kaoyan-learning-export-v2" &&
    parsed.schemaVersion !== "kaoyan-learning-export-v1"
  ) {
    throw new Error("仅支持本系统导出的 v1 或 v2 学习数据。");
  }
  if (parsed.subjectCode !== expectedSubject) {
    throw new Error(`导入文件属于 ${parsed.subjectCode ?? "未知科目"}，不是当前科目。`);
  }
  if (
    !parsed.questionStates ||
    typeof parsed.questionStates !== "object" ||
    Array.isArray(parsed.questionStates)
  ) {
    throw new Error("导入文件缺少有效的 questionStates。");
  }
  if (parsed.schemaVersion === "kaoyan-learning-export-v1") {
    return {
      schemaVersion: "kaoyan-learning-export-v2",
      exportedAt: parsed.exportedAt ?? new Date().toISOString(),
      subjectCode: expectedSubject,
      questionStates: parsed.questionStates,
      paperSessions: {},
    };
  }
  if (
    !parsed.paperSessions ||
    typeof parsed.paperSessions !== "object" ||
    Array.isArray(parsed.paperSessions)
  ) {
    throw new Error("导入文件缺少有效的 paperSessions。");
  }
  return parsed as LearningDataBundle;
}
