import { createHash } from "node:crypto";
import type {
  Pool,
  PoolConnection,
  ResultSetHeader,
  RowDataPacket,
} from "mysql2/promise";

const FROM_BATCH_ID = "math1-final-2025-v2";
const TO_BATCH_ID = "math1-final-2025-v3";
const TARGET_STABLE_ID = "math1-2025-q04";
const EXPECTED_QUESTION_COUNT = 22;
const EXPECTED_PUBLISHED_MATH1_COUNT = 852;

export const EXPECTED_OLD_EXPLANATION_SHA256 =
  "42dae7485648ab274c3c70a021c21e10cf8eab36f41eb0ad01608375318b9e3e";
export const EXPECTED_NEW_EXPLANATION = String.raw`【解析】原积分区域为

$$
D=\left\{(x,y)\mid -2\le x\le 2,\ 4-x^2\le y\le 4\right\}.
$$

交换积分次序。对固定的 $y$，有 $0\le y\le 4$，且 $4-x^2\le y$ 等价于 $x^2\ge 4-y$。

因此，$-2\le x\le-\sqrt{4-y}$ 或 $\sqrt{4-y}\le x\le 2$。

所以原积分等于

$$
\int_0^4\left[\int_{-2}^{-\sqrt{4-y}}f(x,y)\,\mathrm{d}x+\int_{\sqrt{4-y}}^2f(x,y)\,\mathrm{d}x\right]\mathrm{d}y.
$$

故选 A。`;
export const EXPECTED_NEW_EXPLANATION_SHA256 =
  "2719d31048cb6d50f7ecd779d5a68384e569ddaa01ba860dc3b32cd64960cd3b";

interface ContentOption {
  label: string;
  value: string;
}

interface BatchRow extends RowDataPacket {
  id: string;
  status: string;
}

interface QuestionRow extends RowDataPacket {
  stem: string;
  options_json: string | ContentOption[];
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
  total: number;
  unique_ids: number;
}

interface PublishedCountRow extends RowDataPacket {
  total: number;
}

type CorrectionPool = Pick<Pool, "getConnection">;
type CorrectionConnection = Pick<
  PoolConnection,
  "beginTransaction" | "commit" | "rollback" | "execute" | "query" | "release"
>;

export interface Math1Q04ExplanationCorrectionInput {
  sourceCommit: string;
  sourceFiles: Array<{
    relativePath: string;
    gitState: "tracked";
    sha256: string;
  }>;
  contentHash: string;
  stem: string;
  options: ContentOption[];
  answer: string | null;
  answerStatus: string;
  explanation: string;
  explanationStatus: string;
  knowledgePoints: string[];
  anomalies: Array<Record<string, unknown>>;
}

const parseJson = <T>(value: string | T): T =>
  typeof value === "string" ? (JSON.parse(value) as T) : value;
const digest = (value: unknown) =>
  createHash("sha256").update(JSON.stringify(value)).digest("hex");
const textDigest = (value: string) =>
  createHash("sha256").update(value).digest("hex");

function validateInput(input: Math1Q04ExplanationCorrectionInput) {
  if (!/^[0-9a-f]{40}$/i.test(input.sourceCommit)) {
    throw new Error("sourceCommit must be a 40-character Git commit");
  }
  if (!/^[0-9a-f]{64}$/i.test(input.contentHash)) {
    throw new Error("contentHash must be a SHA-256 digest");
  }
  const expectedSourcePaths = new Set([
    "content/final/math1/question-bank.json",
    "docs/requirements/REQ-023-math1-2025-q04-explanation.md",
  ]);
  if (
    input.sourceFiles.length !== expectedSourcePaths.size ||
    input.sourceFiles.some(
      (file) =>
        !expectedSourcePaths.delete(file.relativePath) ||
        file.gitState !== "tracked" ||
        !/^[0-9a-f]{64}$/i.test(file.sha256),
    ) ||
    expectedSourcePaths.size !== 0
  ) {
    throw new Error("canonical bank and REQ-023 must be tracked with SHA-256 hashes");
  }
  if (input.options.map((option) => option.label).join(",") !== "A,B,C,D") {
    throw new Error("canonical Q04 options must be ordered A-D");
  }
  if (
    textDigest(input.explanation) !== EXPECTED_NEW_EXPLANATION_SHA256 ||
    input.explanation !== EXPECTED_NEW_EXPLANATION
  ) {
    throw new Error("canonical Q04 explanation does not match REQ-023");
  }
  if (input.explanationStatus !== "candidate_from_solutions") {
    throw new Error("Q04 explanation status must preserve source provenance");
  }
  if (
    input.explanation.includes("![](images/") ||
    input.explanation.includes("f ~ o ~ r") ||
    input.explanation.includes("\\mathbb { M }") ||
    input.explanation.includes("\\mathbf { \\Pi }")
  ) {
    throw new Error("Q04 explanation still contains audited OCR artifacts");
  }
  if (input.answer !== "A" || input.anomalies.length !== 0) {
    throw new Error("Q04 answer or anomaly state changed unexpectedly");
  }
}

export async function replacePublishedMath1Q04Explanation(
  pool: CorrectionPool,
  input: Math1Q04ExplanationCorrectionInput,
  options: { dryRun: boolean },
): Promise<{
  fromBatchId: string;
  toBatchId: string;
  stableId: string;
  questions: number;
  publishedMath1Questions: number;
  beforeExplanationHash: string;
  afterExplanationHash: string;
  dryRun: boolean;
  transaction: "rolled_back" | "committed";
}> {
  validateInput(input);
  const connection = (await pool.getConnection()) as CorrectionConnection;
  let transactionOpen = false;
  try {
    await connection.beginTransaction();
    transactionOpen = true;

    const [batchRows] = await connection.query<BatchRow[]>(
      `SELECT id, status
       FROM kaoyan_content_batches
       WHERE id IN (?, ?)
       FOR UPDATE`,
      [FROM_BATCH_ID, TO_BATCH_ID],
    );
    const sourceBatch = batchRows.find((row) => row.id === FROM_BATCH_ID);
    const targetBatch = batchRows.find((row) => row.id === TO_BATCH_ID);
    if (!sourceBatch || sourceBatch.status !== "published") {
      throw new Error(`${FROM_BATCH_ID} must be the published source batch`);
    }
    if (targetBatch) {
      throw new Error(`${TO_BATCH_ID} already exists; refusing to overwrite history`);
    }

    const [questionRows] = await connection.query<QuestionRow[]>(
      `SELECT stem, options_json, answer_text, answer_status,
              explanation_text, explanation_status, knowledge_points,
              anomalies, review_status, finalization_status
       FROM kaoyan_questions
       WHERE batch_id = ? AND stable_id = ?
       FOR UPDATE`,
      [FROM_BATCH_ID, TARGET_STABLE_ID],
    );
    const question = questionRows[0];
    if (!question || question.explanation_text === null) {
      throw new Error(`${TARGET_STABLE_ID} or its explanation was not found`);
    }
    if (
      question.review_status !== "approved" ||
      question.finalization_status !== "approved_with_known_risks"
    ) {
      throw new Error(`${TARGET_STABLE_ID} approval state changed unexpectedly`);
    }
    if (
      textDigest(question.explanation_text) !== EXPECTED_OLD_EXPLANATION_SHA256 ||
      question.explanation_status !== input.explanationStatus
    ) {
      throw new Error("Q04 old explanation precondition failed");
    }
    if (
      question.stem !== input.stem ||
      digest(parseJson<ContentOption[]>(question.options_json)) !==
        digest(input.options) ||
      question.answer_text !== input.answer ||
      question.answer_status !== input.answerStatus ||
      digest(parseJson<string[]>(question.knowledge_points)) !==
        digest(input.knowledgePoints) ||
      digest(parseJson<Array<Record<string, unknown>>>(question.anomalies)) !==
        digest(input.anomalies)
    ) {
      throw new Error("Q04 non-explanation content differs from canonical content");
    }

    const [countRows] = await connection.query<CountRow[]>(
      `SELECT COUNT(*) AS total, COUNT(DISTINCT stable_id) AS unique_ids
       FROM kaoyan_questions
       WHERE batch_id = ?`,
      [FROM_BATCH_ID],
    );
    const sourceCount = Number(countRows[0]?.total ?? 0);
    const sourceUniqueIds = Number(countRows[0]?.unique_ids ?? 0);
    if (
      sourceCount !== EXPECTED_QUESTION_COUNT ||
      sourceUniqueIds !== EXPECTED_QUESTION_COUNT
    ) {
      throw new Error(
        `2025 source batch count mismatch: total=${sourceCount}, unique=${sourceUniqueIds}`,
      );
    }

    const [batchInsertResult] = await connection.execute<ResultSetHeader>(
      `INSERT INTO kaoyan_content_batches
         (id, subject_code, source_year, schema_version, source_repo,
          source_commit, source_dirty, source_files, expected_counts,
          actual_counts, content_hash, status)
       SELECT ?, subject_code, source_year, 'math1-explanation-correction-v1',
              source_repo, ?, FALSE, ?, expected_counts, actual_counts, ?, 'staging'
       FROM kaoyan_content_batches
       WHERE id = ?`,
      [
        TO_BATCH_ID,
        input.sourceCommit,
        JSON.stringify(input.sourceFiles),
        input.contentHash,
        FROM_BATCH_ID,
      ],
    );
    if (batchInsertResult.affectedRows !== 1) {
      throw new Error(
        `2025 explanation batch insert affected ${batchInsertResult.affectedRows} rows`,
      );
    }

    const [questionCopyResult] = await connection.execute<ResultSetHeader>(
      `INSERT INTO kaoyan_questions
         (batch_id, stable_id, subject_code, source_year, question_number,
          question_type, stem, options_json, answer_text, answer_status,
          explanation_text, explanation_status, source_traceability,
          review_status, finalization_status, knowledge_points, anomalies)
       SELECT ?, stable_id, subject_code, source_year, question_number,
              question_type, stem, options_json, answer_text, answer_status,
              explanation_text, explanation_status, source_traceability,
              review_status, finalization_status, knowledge_points, anomalies
       FROM kaoyan_questions
       WHERE batch_id = ?`,
      [TO_BATCH_ID, FROM_BATCH_ID],
    );
    if (questionCopyResult.affectedRows !== EXPECTED_QUESTION_COUNT) {
      throw new Error(
        `2025 question copy affected ${questionCopyResult.affectedRows} rows`,
      );
    }

    const [updateResult] = await connection.execute<ResultSetHeader>(
      `UPDATE kaoyan_questions
       SET explanation_text = ?, explanation_status = ?
       WHERE batch_id = ? AND stable_id = ?`,
      [
        input.explanation,
        input.explanationStatus,
        TO_BATCH_ID,
        TARGET_STABLE_ID,
      ],
    );
    if (updateResult.affectedRows !== 1) {
      throw new Error(
        `Q04 explanation correction affected ${updateResult.affectedRows} rows`,
      );
    }

    const [targetCountRows] = await connection.query<CountRow[]>(
      `SELECT COUNT(*) AS total, COUNT(DISTINCT stable_id) AS unique_ids
       FROM kaoyan_questions
       WHERE batch_id = ?`,
      [TO_BATCH_ID],
    );
    const targetCount = Number(targetCountRows[0]?.total ?? 0);
    const targetUniqueIds = Number(targetCountRows[0]?.unique_ids ?? 0);
    if (
      targetCount !== EXPECTED_QUESTION_COUNT ||
      targetUniqueIds !== EXPECTED_QUESTION_COUNT
    ) {
      throw new Error(
        `2025 target batch count mismatch: total=${targetCount}, unique=${targetUniqueIds}`,
      );
    }

    const [supersedeResult] = await connection.execute<ResultSetHeader>(
      `UPDATE kaoyan_content_batches
       SET status = 'superseded'
       WHERE id = ? AND status = 'published'`,
      [FROM_BATCH_ID],
    );
    if (supersedeResult.affectedRows !== 1) {
      throw new Error(
        `source batch supersede affected ${supersedeResult.affectedRows} rows`,
      );
    }
    const [publishResult] = await connection.execute<ResultSetHeader>(
      `UPDATE kaoyan_content_batches
       SET status = 'published', published_at = CURRENT_TIMESTAMP(3)
       WHERE id = ? AND status = 'staging'`,
      [TO_BATCH_ID],
    );
    if (publishResult.affectedRows !== 1) {
      throw new Error(`target batch publish affected ${publishResult.affectedRows} rows`);
    }

    const [publishedRows] = await connection.query<PublishedCountRow[]>(
      `SELECT COUNT(*) AS total
       FROM kaoyan_questions q
       JOIN kaoyan_content_batches b ON b.id = q.batch_id
       WHERE b.status = 'published' AND q.subject_code = 'math1'`,
    );
    const publishedMath1Questions = Number(publishedRows[0]?.total ?? 0);
    if (publishedMath1Questions !== EXPECTED_PUBLISHED_MATH1_COUNT) {
      throw new Error(
        `published Math1 count mismatch: expected ${EXPECTED_PUBLISHED_MATH1_COUNT}, got ${publishedMath1Questions}`,
      );
    }

    const result = {
      fromBatchId: FROM_BATCH_ID,
      toBatchId: TO_BATCH_ID,
      stableId: TARGET_STABLE_ID,
      questions: targetCount,
      publishedMath1Questions,
      beforeExplanationHash: textDigest(question.explanation_text),
      afterExplanationHash: textDigest(input.explanation),
      dryRun: options.dryRun,
      transaction: options.dryRun
        ? ("rolled_back" as const)
        : ("committed" as const),
    };
    if (options.dryRun) await connection.rollback();
    else await connection.commit();
    transactionOpen = false;
    return result;
  } catch (error) {
    if (transactionOpen) await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
