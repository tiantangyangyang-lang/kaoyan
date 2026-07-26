import {
  loadPublishedQuestionDetail,
  loadPublishedQuestionPage,
} from "./api";
import type {
  PublishedQuestionDetail,
  PublishedQuestionListItem,
  Question,
  QuestionBank,
  SubjectCatalog,
  SubjectCode,
} from "./types";

const API_PAGE_SIZE = 50;
const PAGE_CONCURRENCY = 4;

export async function loadSubjectCatalog(): Promise<SubjectCatalog> {
  const response = await fetch("/data/subjects.json");
  if (!response.ok) throw new Error("无法加载科目目录");
  return (await response.json()) as SubjectCatalog;
}

export async function loadQuestionBank(url: string): Promise<QuestionBank> {
  const response = await fetch(url);
  if (!response.ok) throw new Error("无法加载题库");
  const bank = (await response.json()) as QuestionBank;
  if (!Array.isArray(bank.questions)) throw new Error("题库格式不正确");
  return bank;
}

function listItemToQuestion(
  subject: SubjectCode,
  item: PublishedQuestionListItem,
): Question {
  return {
    ...item,
    subjectCode: subject,
    answer: null,
    answerStatus: "not_loaded",
    explanation: "",
    explanationStatus: "not_loaded",
    reviewStatus: "published",
    knowledgePoints: [],
    anomalies: [],
    detailLoaded: false,
  };
}

function detailToQuestion(
  subject: SubjectCode,
  detail: PublishedQuestionDetail,
): Question {
  return {
    ...detail,
    subjectCode: subject,
    explanation: detail.explanation ?? "",
    anomalies: [],
    detailLoaded: true,
  };
}

export async function loadAuthenticatedQuestionBank(
  subject: SubjectCode,
): Promise<QuestionBank> {
  const firstPage = await loadPublishedQuestionPage(subject, {
    page: 1,
    pageSize: API_PAGE_SIZE,
  });
  const items = [...firstPage.items];

  for (let start = 2; start <= firstPage.totalPages; start += PAGE_CONCURRENCY) {
    const end = Math.min(start + PAGE_CONCURRENCY - 1, firstPage.totalPages);
    const pages = await Promise.all(
      Array.from({ length: end - start + 1 }, (_, index) =>
        loadPublishedQuestionPage(subject, {
          page: start + index,
          pageSize: API_PAGE_SIZE,
        }),
      ),
    );
    for (const page of pages) items.push(...page.items);
  }

  if (items.length !== firstPage.totalItems) {
    throw new Error(
      `题库分页不完整：预期 ${firstPage.totalItems} 题，实际 ${items.length} 题`,
    );
  }

  return {
    schemaVersion: "kaoyan-authenticated-question-bank-v1",
    subjectCode: subject,
    totalYears: new Set(items.map((item) => item.sourceYear)).size,
    totalQuestions: items.length,
    questions: items.map((item) => listItemToQuestion(subject, item)),
  };
}

export async function loadAuthenticatedQuestionDetail(
  subject: SubjectCode,
  stableId: string,
): Promise<Question> {
  return detailToQuestion(
    subject,
    await loadPublishedQuestionDetail(subject, stableId),
  );
}
