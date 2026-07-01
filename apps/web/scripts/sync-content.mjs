import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(currentDir, "..");
const repoRoot = resolve(appRoot, "..", "..");
const math1Source = resolve(repoRoot, "content", "final", "math1", "question-bank.json");
const math1Destination = resolve(appRoot, "public", "data", "math1.json");
const math2Destination = resolve(appRoot, "public", "data", "math2.json");
const catalogDestination = resolve(appRoot, "public", "data", "subjects.json");
const math2Years = [
  { year: 2020, expectedCount: 23 },
  { year: 2023, expectedCount: 22 },
  { year: 2024, expectedCount: 22 },
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

async function loadMath2Questions() {
  const questions = [];
  const seen = new Set();
  for (const item of math2Years) {
    const source = resolve(
      repoRoot,
      "content",
      "staging",
      "math2",
      String(item.year),
      "questions.json",
    );
    const yearBank = JSON.parse(await readFile(source, "utf8"));
    const yearQuestions = Array.isArray(yearBank) ? yearBank : yearBank.questions;
    if (!Array.isArray(yearQuestions) || yearQuestions.length !== item.expectedCount) {
      throw new Error(
        `Unexpected Math2 ${item.year} question count: ${yearQuestions?.length ?? "missing"}`,
      );
    }
    for (const question of yearQuestions) {
      assertMath2Question(question, item.year);
      if (seen.has(question.stableId)) {
        throw new Error(`Duplicate Math2 stableId: ${question.stableId}`);
      }
      seen.add(question.stableId);
      questions.push({
        ...question,
        options: question.options.map((option) => ({
          label: option.label,
          value: option.value,
        })),
        answer: null,
        answerStatus: "missing",
        explanation: "",
        explanationStatus: "missing",
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

const math2Questions = await loadMath2Questions();
if (math2Questions.length !== 67) {
  throw new Error(`Unexpected Math2 total question count: ${math2Questions.length}`);
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

await mkdir(dirname(math1Destination), { recursive: true });
await copyFile(math1Source, math1Destination);
await writeFile(math2Destination, `${JSON.stringify(math2Bank, null, 2)}\n`, "utf8");
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
      ],
    },
    null,
    2,
  ),
  "utf8",
);

console.log(`Synced ${bank.questions.length} Math1 questions to ${math1Destination}`);
console.log(`Synced ${math2Questions.length} Math2 questions to ${math2Destination}`);
