import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const PUBLIC_MATH1_MIN_YEAR = 2018;
const PUBLIC_MATH1_MAX_YEAR = 2025;
const PROMOTED_COUNTS = { math1: 852, math2: 522, math3: 178 };

const currentDir = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(currentDir, "..");
const repoRoot = resolve(appRoot, "..", "..");
const math1Source = resolve(repoRoot, "content", "final", "math1", "question-bank.json");
const dataDir = resolve(appRoot, "public", "data");
const math1Destination = resolve(dataDir, "math1.json");
const math2Destination = resolve(dataDir, "math2.json");
const math3Destination = resolve(dataDir, "math3.json");
const catalogDestination = resolve(dataDir, "subjects.json");
const protectedArtifact = (subjectCode) => ({
  schemaVersion: "kaoyan-protected-content-v1",
  subjectCode,
  error: "authentication_required",
});

const bank = JSON.parse(await readFile(math1Source, "utf8"));
if (!Array.isArray(bank.questions) || bank.questions.length !== PROMOTED_COUNTS.math1) {
  throw new Error(`Unexpected Math1 question count: ${bank.questions?.length ?? "missing"}`);
}

const publicQuestions = bank.questions.filter(
  (question) =>
    question.subjectCode === "math1" &&
    question.sourceYear >= PUBLIC_MATH1_MIN_YEAR &&
    question.sourceYear <= PUBLIC_MATH1_MAX_YEAR,
);
if (
  publicQuestions.length === 0 ||
  publicQuestions.some(
    (question) =>
      question.sourceYear < PUBLIC_MATH1_MIN_YEAR ||
      question.sourceYear > PUBLIC_MATH1_MAX_YEAR,
  )
) {
  throw new Error("Public Math1 bank is empty or contains a protected year");
}

const publicYears = [...new Set(publicQuestions.map((question) => question.sourceYear))].sort(
  (a, b) => b - a,
);
const publicBank = {
  ...bank,
  schemaVersion: "math1-public-question-bank-v1",
  totalYears: publicYears.length,
  includedYears: publicYears,
  totalQuestions: publicQuestions.length,
  questions: publicQuestions,
};

await mkdir(dataDir, { recursive: true });
await writeFile(math1Destination, `${JSON.stringify(publicBank, null, 2)}\n`, "utf8");
await writeFile(
  math2Destination,
  `${JSON.stringify(protectedArtifact("math2"), null, 2)}\n`,
  "utf8",
);
await writeFile(
  math3Destination,
  `${JSON.stringify(protectedArtifact("math3"), null, 2)}\n`,
  "utf8",
);
await writeFile(
  catalogDestination,
  `${JSON.stringify(
    {
      schemaVersion: "kaoyan-subject-catalog-v1",
      subjects: [
        {
          code: "math1",
          name: "数学一",
          questionBankUrl: "/data/math1.json",
          enabled: true,
          questionCount: PROMOTED_COUNTS.math1,
          statusLabel: "2018—2025 免登录",
          reviewNote: `免登录可查看 2018—2025 年 ${publicQuestions.length} 题；登录后可查看全部 ${PROMOTED_COUNTS.math1} 题。`,
        },
        {
          code: "math2",
          name: "数学二",
          enabled: true,
          questionCount: PROMOTED_COUNTS.math2,
          statusLabel: "登录后可用",
          reviewNote: `登录后可查看全部 ${PROMOTED_COUNTS.math2} 题。`,
        },
        {
          code: "math3",
          name: "数学三",
          enabled: true,
          questionCount: PROMOTED_COUNTS.math3,
          statusLabel: "登录后可用",
          reviewNote: `登录后可查看全部 ${PROMOTED_COUNTS.math3} 题。`,
        },
      ],
    },
    null,
    2,
  )}\n`,
  "utf8",
);

console.log(
  `Synced ${publicQuestions.length} public Math1 questions (${PUBLIC_MATH1_MIN_YEAR}-${PUBLIC_MATH1_MAX_YEAR}) to ${math1Destination}`,
);
console.log("Replaced legacy Math2 and Math3 artifact paths with denial payloads");
