import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(currentDir, "..");
const repoRoot = resolve(appRoot, "..", "..");
const math1Source = resolve(repoRoot, "content", "final", "math1", "question-bank.json");
const math1Destination = resolve(appRoot, "public", "data", "math1.json");
const math2Destination = resolve(appRoot, "public", "data", "math2.json");
const math3Destination = resolve(appRoot, "public", "data", "math3.json");
const catalogDestination = resolve(appRoot, "public", "data", "subjects.json");
const math2Years = [
  { year: 2020, expectedCount: 23 },
  { year: 2023, expectedCount: 22 },
  { year: 2024, expectedCount: 22 },
];
const math3Years = [
  { year: 1987, expectedCount: 18 },
  { year: 1988, expectedCount: 18 },
  { year: 1989, expectedCount: 17 },
  { year: 1990, expectedCount: 20 },
  { year: 1991, expectedCount: 20 },
  { year: 1992, expectedCount: 16 },
  { year: 1993, expectedCount: 16 },
  { year: 1994, expectedCount: 20 },
  { year: 1995, expectedCount: 21 },
  { year: 1996, expectedCount: 12 },
];

const raw = await readFile(math1Source, "utf8");
const bank = JSON.parse(raw);

if (!Array.isArray(bank.questions) || bank.questions.length !== 852) {
  throw new Error(`Unexpected Math1 question count: ${bank.questions?.length ?? "missing"}`);
}

function assertMath2Question(question, year) {
  if (question.subjectCode !== "math2") {
    throw new Error(`${question.stableId ?? year} has unexpected subjectCode`);
  }
  if (question.sourceYear !== year) {
    throw new Error(`${question.stableId ?? year} has unexpected sourceYear`);
  }
  if (question.reviewStatus !== "needs_human_review") {
    throw new Error(`${question.stableId} must remain needs_human_review`);
  }
  if (question.finalizationStatus !== "blocked") {
    throw new Error(`${question.stableId} must remain blocked`);
  }
  if (question.answer !== null || question.answerStatus !== "missing") {
    throw new Error(`${question.stableId} must not publish an answer`);
  }
  if (question.explanation !== null || question.explanationStatus !== "missing") {
    throw new Error(`${question.stableId} must not publish an explanation`);
  }
  if (!Array.isArray(question.options)) {
    throw new Error(`${question.stableId} has invalid options`);
  }
  for (const option of question.options) {
    if (
      !option ||
      typeof option.label !== "string" ||
      typeof option.value !== "string" ||
      Object.hasOwn(option, "text")
    ) {
      throw new Error(`${question.stableId} has invalid option shape`);
    }
  }
}

function assertMath3Question(question, year) {
  if (question.subjectCode !== "math3") {
    throw new Error(`${question.stableId ?? year} has unexpected subjectCode`);
  }
  if (question.sourceYear !== year) {
    throw new Error(`${question.stableId ?? year} has unexpected sourceYear`);
  }
  if (question.reviewStatus !== "needs_human_review") {
    throw new Error(`${question.stableId} must remain needs_human_review`);
  }
  if (question.finalizationStatus !== "blocked") {
    throw new Error(`${question.stableId} must remain blocked`);
  }
  if (!Array.isArray(question.options)) {
    throw new Error(`${question.stableId} has invalid options`);
  }
  for (const option of question.options) {
    if (
      !option ||
      typeof option.label !== "string" ||
      typeof option.value !== "string" ||
      Object.hasOwn(option, "text")
    ) {
      throw new Error(`${question.stableId} has invalid option shape`);
    }
  }
}

async function loadStagingQuestions({ subjectCode, years, assertQuestion }) {
  const questions = [];
  const seen = new Set();
  for (const item of years) {
    const source = resolve(
      repoRoot,
      "content",
      "staging",
      subjectCode,
      String(item.year),
      "questions.json",
    );
    const yearBank = JSON.parse(await readFile(source, "utf8"));
    const yearQuestions = Array.isArray(yearBank) ? yearBank : yearBank.questions;
    if (!Array.isArray(yearQuestions) || yearQuestions.length !== item.expectedCount) {
      throw new Error(
        `Unexpected ${subjectCode} ${item.year} question count: ${yearQuestions?.length ?? "missing"}`,
      );
    }
    for (const question of yearQuestions) {
      assertQuestion(question, item.year);
      if (seen.has(question.stableId)) {
        throw new Error(`Duplicate ${subjectCode} stableId: ${question.stableId}`);
      }
      seen.add(question.stableId);
      questions.push({
        ...question,
        options: question.options.map((option) => ({
          label: option.label,
          value: option.value,
        })),
        answer: typeof question.answer === "string" ? question.answer : null,
        answerStatus: question.answerStatus,
        explanation: typeof question.explanation === "string" ? question.explanation : "",
        explanationStatus: question.explanationStatus,
        reviewStatus: "needs_human_review",
        finalizationStatus: "blocked",
      });
    }
  }
  return questions.sort(
    (a, b) =>
      b.sourceYear - a.sourceYear ||
      (a.questionNumber ?? Number.MAX_SAFE_INTEGER) -
        (b.questionNumber ?? Number.MAX_SAFE_INTEGER),
  );
}

const math2Questions = await loadStagingQuestions({
  subjectCode: "math2",
  years: math2Years,
  assertQuestion: assertMath2Question,
});
if (math2Questions.length !== 67) {
  throw new Error(`Unexpected Math2 total question count: ${math2Questions.length}`);
}
const math3Questions = await loadStagingQuestions({
  subjectCode: "math3",
  years: math3Years,
  assertQuestion: assertMath3Question,
});
if (math3Questions.length !== 178) {
  throw new Error(`Unexpected Math3 total question count: ${math3Questions.length}`);
}

const math2Bank = {
  schemaVersion: "math2-question-bank-v1",
  runId: "req-012-math2-reviewed-web-publication",
  subjectCode: "math2",
  totalYears: math2Years.length,
  includedYears: math2Years.map((item) => item.year),
  totalQuestions: math2Questions.length,
  reviewStatus: "needs_human_review",
  finalizationStatus: "blocked",
  feedbackEmail: "tiantangyangyang@gmail.com",
  questions: math2Questions,
};
const math3Bank = {
  schemaVersion: "math3-question-bank-v1",
  runId: "req-016-math3-1987-1996-staging-db-readiness",
  subjectCode: "math3",
  totalYears: math3Years.length,
  includedYears: math3Years.map((item) => item.year),
  totalQuestions: math3Questions.length,
  reviewStatus: "needs_human_review",
  finalizationStatus: "blocked",
  feedbackEmail: "tiantangyangyang@gmail.com",
  questions: math3Questions,
};

await mkdir(dirname(math1Destination), { recursive: true });
await copyFile(math1Source, math1Destination);
await writeFile(math2Destination, `${JSON.stringify(math2Bank, null, 2)}\n`, "utf8");
await writeFile(math3Destination, `${JSON.stringify(math3Bank, null, 2)}\n`, "utf8");
await writeFile(
  catalogDestination,
  JSON.stringify(
    {
      schemaVersion: "kaoyan-subject-catalog-v1",
      subjects: [
        {
          code: "math1",
          name: "数学一",
          questionBankUrl: "/data/math1.json",
          enabled: true,
          questionCount: bank.questions.length,
          statusLabel: "已接入",
        },
        {
          code: "math2",
          name: "数学二",
          questionBankUrl: "/data/math2.json",
          enabled: true,
          questionCount: math2Questions.length,
          statusLabel: "待复核",
          reviewNote: "2020、2023、2024 年题干已开放预览，答案解析整理中。",
          feedbackEmail: "tiantangyangyang@gmail.com",
        },
        {
          code: "math3",
          name: "数学三",
          questionBankUrl: "/data/math3.json",
          enabled: true,
          questionCount: math3Questions.length,
          statusLabel: "待复核",
          reviewNote: "1987—1996 年试卷三 aggregate 已开放预览，答案解析均需人工复核。",
          feedbackEmail: "tiantangyangyang@gmail.com",
        },
      ],
    },
    null,
    2,
  ),
  "utf8",
);

console.log(`Synced ${bank.questions.length} Math1 questions to ${math1Destination}`);
console.log(`Synced ${math2Questions.length} Math2 questions to ${math2Destination}`);
console.log(`Synced ${math3Questions.length} Math3 questions to ${math3Destination}`);
