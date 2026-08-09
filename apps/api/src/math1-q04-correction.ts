import { createHash } from "node:crypto";
import type {
  Pool,
  PoolConnection,
  ResultSetHeader,
  RowDataPacket,
} from "mysql2/promise";

const FROM_BATCH_ID = "math1-final-2025-v1";
const TO_BATCH_ID = "math1-final-2025-v2";
const TARGET_STABLE_ID = "math1-2025-q04";
const EXPECTED_QUESTION_COUNT = 22;
const EXPECTED_PUBLISHED_MATH1_COUNT = 852;

export const EXPECTED_OLD_OPTION_C =
  "[OCR-damaged in source:    4 4 40 2 2, d , d dy yf x y x f x y x y        ]";
export const EXPECTED_OLD_OPTION_D =
  "[OCR-damaged in source:  4 20 42 d , dyy f x y x  ]";
export const EXPECTED_NEW_OPTION_C =
  "$\\int_{0}^{4}\\left[\\int_{-2}^{-\\sqrt{4-y}} f(x,y)\\,\\mathrm{d}x+\\int_{2}^{\\sqrt{4-y}} f(x,y)\\,\\mathrm{d}x\\right]\\mathrm{d}y$";
export const EXPECTED_NEW_OPTION_D =
  "$2\\int_{0}^{4}\\mathrm{d}y\\int_{\\sqrt{4-y}}^{2} f(x,y)\\,\\mathrm{d}x$";
export const EXPECTED_NEW_STEM =
  "4．设函数 $f ( x , y )$ 连续，则 $\\int _ { - 2 } ^ { 2 } \\mathrm { d } x \\int _ { 4 - x ^ { 2 } } ^ { 4 } f \\big ( x , y \\big ) \\mathrm { d } y =$";

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

export interface Math1Q04CorrectionInput {
  sourceCommit: string;
  sourceFiles: Array<{
    relativePath: string;
    gitState: "tracked";
    sha256: string;
  }>;
  contentHash: string;
  stem: string;
  options: ContentOption[];
  anomalies: Array<Record<string, unknown>>;
}

const parseJson = <T>(value: string | T): T =>
  typeof value === "string" ? (JSON.parse(value) as T) : value;

const digest = (value: unknown) =>
  createHash("sha256").update(JSON.stringify(value)).digest("hex");
const textDigest = (value: string) =>
  createHash("sha256").update(value).digest("hex");

function validateInput(input: Math1Q04CorrectionInput) {
  if (!/^[0-9a-f]{40}$/i.test(input.sourceCommit)) {
    throw new Error("sourceCommit must be a 40-character Git commit");
  }
  if (!/^[0-9a-f]{64}$/i.test(input.contentHash)) {
    throw new Error("contentHash must be a SHA-256 digest");
  }
  if (
    input.sourceFiles.length !== 2 ||
    input.sourceFiles.some(
      (file) =>
        !file.relativePath ||
        file.gitState !== "tracked" ||
        !/^[0-9a-f]{64}$/i.test(file.sha256),
    )
  ) {
    throw new Error("exactly two tracked, SHA-256-addressed source files are required");
  }
  if (input.options.map((option) => option.label).join(",") !== "A,B,C,D") {
    throw new Error("canonical Q04 options must be ordered A-D");
  }
  if (
    input.options[2]?.value !== EXPECTED_NEW_OPTION_C ||
    input.options[3]?.value !== EXPECTED_NEW_OPTION_D
  ) {
    throw new Error("canonical Q04 C/D do not match the REQ-022 transcription");
  }
  if (input.anomalies.length !== 0) {
    throw new Error("corrected Q04 must not retain active anomalies");
  }
  if (input.stem !== EXPECTED_NEW_STEM) {
    throw new Error("canonical Q04 stem does not match the REQ-022 structure");
  }
}

export async function replacePublishedMath1Q04(
  pool: CorrectionPool,
  input: Math1Q04CorrectionInput,
  options: { dryRun: boolean },
): Promise<{
  fromBatchId: string;
  toBatchId: string;
  stableId: string;
  questions: number;
  publishedMath1Questions: number;
  beforeOptionsHash: string;
  afterOptionsHash: string;
  beforeStemHash: string;
  afterStemHash: string;
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
      `SELECT stem, options_json, anomalies, review_status, finalization_status
       FROM kaoyan_questions
       WHERE batch_id = ? AND stable_id = ?
       FOR UPDATE`,
      [FROM_BATCH_ID, TARGET_STABLE_ID],
    );
    const question = questionRows[0];
    if (!question) throw new Error(`${TARGET_STABLE_ID} was not found`);
    if (
      question.review_status !== "approved" ||
      question.finalization_status !== "approved_with_known_risks"
    ) {
      throw new Error(`${TARGET_STABLE_ID} approval state changed unexpectedly`);
    }
    if (
      !question.stem.startsWith(`${input.stem}\n\n`) ||
      !question.stem.includes("C．") ||
      !question.stem.includes("D．") ||
      !question.stem.includes("【答案】A")
    ) {
      throw new Error("Q04 old stem structure precondition failed");
    }

    const oldOptions = parseJson<ContentOption[]>(question.options_json);
    if (oldOptions.map((option) => option.label).join(",") !== "A,B,C,D") {
      throw new Error(`${TARGET_STABLE_ID} database options are not ordered A-D`);
    }
    if (
      oldOptions[0]?.value !== input.options[0]?.value ||
      oldOptions[1]?.value !== input.options[1]?.value
    ) {
      throw new Error("Q04 options A/B differ from canonical content");
    }
    if (
      oldOptions[2]?.value !== EXPECTED_OLD_OPTION_C ||
      oldOptions[3]?.value !== EXPECTED_OLD_OPTION_D
    ) {
      throw new Error("Q04 old C/D precondition failed");
    }
    const oldAnomalies = parseJson<Array<Record<string, unknown>>>(
      question.anomalies,
    );
    if (
      oldAnomalies.length !== 1 ||
      oldAnomalies[0]?.type !== "partial_options_ocr_damaged"
    ) {
      throw new Error("Q04 anomaly precondition failed");
    }

    const [countRows] = await connection.query<CountRow[]>(
      `SELECT COUNT(*) AS total, COUNT(DISTINCT stable_id) AS unique_ids
       FROM kaoyan_questions
       WHERE batch_id = ?`,
      [FROM_BATCH_ID],
    );
    const sourceCount = Number(countRows[0]?.total ?? 0);
    const uniqueIds = Number(countRows[0]?.unique_ids ?? 0);
    if (
      sourceCount !== EXPECTED_QUESTION_COUNT ||
      uniqueIds !== EXPECTED_QUESTION_COUNT
    ) {
      throw new Error(
        `2025 source batch count mismatch: total=${sourceCount}, unique=${uniqueIds}`,
      );
    }

    const [batchInsertResult] = await connection.execute<ResultSetHeader>(
      `INSERT INTO kaoyan_content_batches
         (id, subject_code, source_year, schema_version, source_repo,
          source_commit, source_dirty, source_files, expected_counts,
          actual_counts, content_hash, status)
       SELECT ?, subject_code, source_year, 'math1-content-correction-v1',
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
        `2025 correction batch insert affected ${batchInsertResult.affectedRows} rows`,
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
       SET stem = ?, options_json = ?, anomalies = ?
       WHERE batch_id = ? AND stable_id = ?`,
      [
        input.stem,
        JSON.stringify(input.options),
        JSON.stringify(input.anomalies),
        TO_BATCH_ID,
        TARGET_STABLE_ID,
      ],
    );
    if (updateResult.affectedRows !== 1) {
      throw new Error(`Q04 correction affected ${updateResult.affectedRows} rows`);
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
      throw new Error(
        `target batch publish affected ${publishResult.affectedRows} rows`,
      );
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
      beforeOptionsHash: digest(oldOptions),
      afterOptionsHash: digest(input.options),
      beforeStemHash: textDigest(question.stem),
      afterStemHash: textDigest(input.stem),
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
