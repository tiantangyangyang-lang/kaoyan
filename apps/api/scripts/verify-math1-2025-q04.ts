import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { RowDataPacket } from "mysql2/promise";
import { loadConfig } from "../src/config.js";
import { createDatabasePool } from "../src/db.js";
import {
  EXPECTED_NEW_OPTION_C,
  EXPECTED_NEW_OPTION_D,
  EXPECTED_NEW_STEM,
} from "../src/math1-q04-correction.js";

interface BatchRow extends RowDataPacket {
  id: string;
  status: string;
  source_files: string | SourceFile[];
}

interface SourceFile {
  relativePath: string;
  gitState: string;
  sha256: string;
}

interface QuestionRow extends RowDataPacket {
  stem: string;
  options_json: string | Array<{ label: string; value: string }>;
  anomalies: string | Array<Record<string, unknown>>;
  review_status: string;
  finalization_status: string;
}

interface CountRow extends RowDataPacket {
  batches: number;
  questions: number;
  unique_ids: number;
}

const parseJson = <T>(value: string | T): T =>
  typeof value === "string" ? (JSON.parse(value) as T) : value;
const sha256 = (value: string) =>
  createHash("sha256").update(value).digest("hex");
const repoRoot = resolve(process.cwd(), "..", "..");
const bankPath = resolve(repoRoot, "content/final/math1/question-bank.json");
const evidencePath = resolve(
  repoRoot,
  "content/reports/req-022-math1-2025-q04-correction/source-evidence.json",
);
const publicPath = resolve(repoRoot, "apps/web/public/data/math1.json");
const [bankRaw, evidenceRaw, publicRaw] = await Promise.all([
  readFile(bankPath, "utf8"),
  readFile(evidencePath, "utf8"),
  readFile(publicPath, "utf8"),
]);

const pool = createDatabasePool(loadConfig());
try {
  const [batchRows] = await pool.query<BatchRow[]>(
    `SELECT id, status, source_files
     FROM kaoyan_content_batches
     WHERE id IN (?, ?)
     ORDER BY id`,
    ["math1-final-2025-v1", "math1-final-2025-v2"],
  );
  const v1 = batchRows.find((row) => row.id === "math1-final-2025-v1");
  const v2 = batchRows.find((row) => row.id === "math1-final-2025-v2");
  if (v1?.status !== "superseded" || v2?.status !== "published") {
    throw new Error("Math1 2025 batch version state is not v1=superseded/v2=published");
  }
  const sourceFiles = parseJson<SourceFile[]>(v2.source_files);
  const expectedSourceHashes = new Map([
    ["content/final/math1/question-bank.json", sha256(bankRaw)],
    [
      "content/reports/req-022-math1-2025-q04-correction/source-evidence.json",
      sha256(evidenceRaw),
    ],
  ]);
  if (
    sourceFiles.length !== expectedSourceHashes.size ||
    sourceFiles.some(
      (file) => expectedSourceHashes.get(file.relativePath) !== file.sha256,
    )
  ) {
    throw new Error("published v2 source hashes do not match the checked-out evidence");
  }

  const [questionRows] = await pool.query<QuestionRow[]>(
    `SELECT q.stem, q.options_json, q.anomalies, q.review_status, q.finalization_status
     FROM kaoyan_questions q
     JOIN kaoyan_content_batches b ON b.id = q.batch_id
     WHERE b.status = 'published' AND q.stable_id = ?`,
    ["math1-2025-q04"],
  );
  const question = questionRows[0];
  if (!question) throw new Error("published math1-2025-q04 was not found");
  const options = parseJson<Array<{ label: string; value: string }>>(
    question.options_json,
  );
  const anomalies = parseJson<Array<Record<string, unknown>>>(question.anomalies);
  if (
    question.stem !== EXPECTED_NEW_STEM ||
    options[2]?.value !== EXPECTED_NEW_OPTION_C ||
    options[3]?.value !== EXPECTED_NEW_OPTION_D ||
    anomalies.length !== 0 ||
    question.review_status !== "approved" ||
    question.finalization_status !== "approved_with_known_risks"
  ) {
    throw new Error("published Q04 content or lifecycle state is incorrect");
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

  const publicBank = JSON.parse(publicRaw) as {
    totalQuestions: number;
    questions: Array<{
      stableId: string;
      stem: string;
      options: Array<{ label: string; value: string }>;
    }>;
  };
  const publicQuestion = publicBank.questions.find(
    (candidate) => candidate.stableId === "math1-2025-q04",
  );
  if (
    publicBank.totalQuestions !== 179 ||
    publicQuestion?.stem !== EXPECTED_NEW_STEM ||
    publicQuestion?.options[2]?.value !== EXPECTED_NEW_OPTION_C ||
    publicQuestion?.options[3]?.value !== EXPECTED_NEW_OPTION_D
  ) {
    throw new Error("generated public Math1 artifact does not contain corrected Q04");
  }

  console.log(
    JSON.stringify(
      {
        batches: { v1: v1.status, v2: v2.status },
        publishedMath1: { batches: 38, questions: 852, uniqueStableIds: 852 },
        publicMath1: { questions: 179, stableId: "math1-2025-q04" },
        q04: {
          optionLabels: options.map((option) => option.label),
          activeAnomalies: anomalies.length,
          reviewStatus: question.review_status,
          finalizationStatus: question.finalization_status,
        },
      },
      null,
      2,
    ),
  );
} finally {
  await pool.end();
}
