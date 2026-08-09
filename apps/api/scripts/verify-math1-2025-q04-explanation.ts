import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { RowDataPacket } from "mysql2/promise";
import { loadConfig } from "../src/config.js";
import { createDatabasePool } from "../src/db.js";
import {
  EXPECTED_NEW_EXPLANATION,
  EXPECTED_NEW_EXPLANATION_SHA256,
} from "../src/math1-q04-explanation-correction.js";

interface SourceFile {
  relativePath: string;
  gitState: string;
  sha256: string;
}

interface BatchRow extends RowDataPacket {
  id: string;
  status: string;
  source_files: string | SourceFile[];
}

interface QuestionRow extends RowDataPacket {
  stem: string;
  options_json: string | Array<{ label: string; value: string }>;
  answer_text: string | null;
  answer_status: string;
  explanation_text: string | null;
  explanation_status: string;
  knowledge_points: string | string[];
  anomalies: string | Array<Record<string, unknown>>;
  review_status: string;
  finalization_status: string;
}

interface CountRow extends RowDataPacket {
  batches: number;
  questions: number;
  unique_ids: number;
}

interface DiffRow extends RowDataPacket {
  paired_questions: number;
  non_explanation_changes: number;
  explanation_changes: number;
}

const parseJson = <T>(value: string | T): T =>
  typeof value === "string" ? (JSON.parse(value) as T) : value;
const sha256 = (value: string) =>
  createHash("sha256").update(value).digest("hex");
const assertCleanExplanation = (value: string, label: string) => {
  if (
    value !== EXPECTED_NEW_EXPLANATION ||
    sha256(value) !== EXPECTED_NEW_EXPLANATION_SHA256 ||
    value.includes("![](images/") ||
    value.includes("f ~ o ~ r") ||
    value.includes("\\mathbb { M }") ||
    value.includes("\\mathbf { \\Pi }")
  ) {
    throw new Error(`${label} does not contain the clean REQ-023 explanation`);
  }
};

const repoRoot = resolve(process.cwd(), "..", "..");
const bankPath = resolve(repoRoot, "content/final/math1/question-bank.json");
const reviewPath = resolve(
  repoRoot,
  "content/review/math1/2025/questions-reviewed.json",
);
const requirementPath = resolve(
  repoRoot,
  "docs/requirements/REQ-023-math1-2025-q04-explanation.md",
);
const publicPath = resolve(repoRoot, "apps/web/public/data/math1.json");
const [bankRaw, reviewRaw, requirementRaw, publicRaw] = await Promise.all([
  readFile(bankPath, "utf8"),
  readFile(reviewPath, "utf8"),
  readFile(requirementPath, "utf8"),
  readFile(publicPath, "utf8"),
]);
const bank = JSON.parse(bankRaw) as {
  questions: Array<{
    stableId: string;
    stem: string;
    options: Array<{ label: string; value: string }>;
    answer: string | null;
    answerStatus: string;
    explanation: string;
    explanationCandidate: string;
    explanationStatus: string;
    knowledgePoints: string[];
    anomalies: Array<Record<string, unknown>>;
  }>;
};
const canonical = bank.questions.find(
  (question) => question.stableId === "math1-2025-q04",
);
if (!canonical) throw new Error("canonical math1-2025-q04 is missing");
assertCleanExplanation(canonical.explanation, "canonical explanation");
assertCleanExplanation(
  canonical.explanationCandidate,
  "canonical explanationCandidate",
);

const review = JSON.parse(reviewRaw) as {
  reviews: Array<{
    stableId: string;
    candidateResult: { explanationCandidate: string };
  }>;
};
const reviewed = review.reviews.find(
  (item) => item.stableId === "math1-2025-q04",
);
if (!reviewed) throw new Error("reviewed math1-2025-q04 is missing");
assertCleanExplanation(
  reviewed.candidateResult.explanationCandidate,
  "review explanationCandidate",
);

const publicBank = JSON.parse(publicRaw) as {
  totalQuestions: number;
  questions: Array<{ stableId: string; explanation: string }>;
};
const publicQuestion = publicBank.questions.find(
  (question) => question.stableId === "math1-2025-q04",
);
if (publicBank.totalQuestions !== 179 || !publicQuestion) {
  throw new Error("generated public Math1 artifact has unexpected Q04/count state");
}
assertCleanExplanation(publicQuestion.explanation, "public explanation");

const pool = createDatabasePool(loadConfig());
try {
  const [batchRows] = await pool.query<BatchRow[]>(
    `SELECT id, status, source_files
     FROM kaoyan_content_batches
     WHERE id IN (?, ?)
     ORDER BY id`,
    ["math1-final-2025-v2", "math1-final-2025-v3"],
  );
  const v2 = batchRows.find((row) => row.id === "math1-final-2025-v2");
  const v3 = batchRows.find((row) => row.id === "math1-final-2025-v3");
  if (v2?.status !== "superseded" || v3?.status !== "published") {
    throw new Error("Math1 2025 batch state is not v2=superseded/v3=published");
  }
  const expectedSourceHashes = new Map([
    ["content/final/math1/question-bank.json", sha256(bankRaw)],
    [
      "docs/requirements/REQ-023-math1-2025-q04-explanation.md",
      sha256(requirementRaw),
    ],
  ]);
  const sourceFiles = parseJson<SourceFile[]>(v3.source_files);
  if (
    sourceFiles.length !== expectedSourceHashes.size ||
    sourceFiles.some(
      (file) => expectedSourceHashes.get(file.relativePath) !== file.sha256,
    )
  ) {
    throw new Error("published v3 source hashes do not match the checked-out files");
  }

  const [questionRows] = await pool.query<QuestionRow[]>(
    `SELECT q.stem, q.options_json, q.answer_text, q.answer_status,
            q.explanation_text, q.explanation_status, q.knowledge_points,
            q.anomalies, q.review_status, q.finalization_status
     FROM kaoyan_questions q
     JOIN kaoyan_content_batches b ON b.id = q.batch_id
     WHERE b.status = 'published' AND q.stable_id = ?`,
    ["math1-2025-q04"],
  );
  const question = questionRows[0];
  if (!question || question.explanation_text === null) {
    throw new Error("published math1-2025-q04 explanation is missing");
  }
  assertCleanExplanation(question.explanation_text, "database explanation");
  if (
    question.stem !== canonical.stem ||
    JSON.stringify(parseJson(question.options_json)) !==
      JSON.stringify(
        canonical.options.map(({ label, value }) => ({ label, value })),
      ) ||
    question.answer_text !== canonical.answer ||
    question.answer_status !== canonical.answerStatus ||
    question.explanation_status !== canonical.explanationStatus ||
    JSON.stringify(parseJson(question.knowledge_points)) !==
      JSON.stringify(canonical.knowledgePoints) ||
    JSON.stringify(parseJson(question.anomalies)) !==
      JSON.stringify(canonical.anomalies) ||
    question.review_status !== "approved" ||
    question.finalization_status !== "approved_with_known_risks"
  ) {
    throw new Error("published Q04 non-explanation content or lifecycle state changed");
  }

  const [diffRows] = await pool.query<DiffRow[]>(
    `SELECT COUNT(*) AS paired_questions,
            SUM(
              NOT (old_q.stem <=> new_q.stem) OR
              NOT (old_q.options_json <=> new_q.options_json) OR
              NOT (old_q.answer_text <=> new_q.answer_text) OR
              NOT (old_q.answer_status <=> new_q.answer_status) OR
              NOT (old_q.source_traceability <=> new_q.source_traceability) OR
              NOT (old_q.review_status <=> new_q.review_status) OR
              NOT (old_q.finalization_status <=> new_q.finalization_status) OR
              NOT (old_q.knowledge_points <=> new_q.knowledge_points) OR
              NOT (old_q.anomalies <=> new_q.anomalies)
            ) AS non_explanation_changes,
            SUM(
              NOT (old_q.explanation_text <=> new_q.explanation_text) OR
              NOT (old_q.explanation_status <=> new_q.explanation_status)
            ) AS explanation_changes
     FROM kaoyan_questions old_q
     JOIN kaoyan_questions new_q ON new_q.stable_id = old_q.stable_id
     WHERE old_q.batch_id = ? AND new_q.batch_id = ?`,
    ["math1-final-2025-v2", "math1-final-2025-v3"],
  );
  const diff = diffRows[0];
  if (
    Number(diff?.paired_questions ?? 0) !== 22 ||
    Number(diff?.non_explanation_changes ?? 0) !== 0 ||
    Number(diff?.explanation_changes ?? 0) !== 1
  ) {
    throw new Error("v2-to-v3 field comparison is not explanation-only");
  }

  const [countRows] = await pool.query<CountRow[]>(
    `SELECT COUNT(DISTINCT b.id) AS batches,
            COUNT(*) AS questions,
            COUNT(DISTINCT q.stable_id) AS unique_ids
     FROM kaoyan_questions q
     JOIN kaoyan_content_batches b ON b.id = q.batch_id
     WHERE b.status = 'published' AND q.subject_code = 'math1'`,
  );
  const counts = countRows[0];
  if (
    Number(counts?.batches ?? 0) !== 38 ||
    Number(counts?.questions ?? 0) !== 852 ||
    Number(counts?.unique_ids ?? 0) !== 852
  ) {
    throw new Error("published Math1 counts changed unexpectedly");
  }

  console.log(
    JSON.stringify(
      {
        batches: { v2: v2.status, v3: v3.status },
        publishedMath1: { batches: 38, questions: 852, uniqueStableIds: 852 },
        publicMath1: { questions: 179, stableId: "math1-2025-q04" },
        q04: {
          explanationHash: sha256(question.explanation_text),
          explanationStatus: question.explanation_status,
          nonExplanationChanges: 0,
        },
      },
      null,
      2,
    ),
  );
} finally {
  await pool.end();
}
