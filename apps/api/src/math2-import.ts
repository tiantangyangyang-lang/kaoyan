import { createHash } from "node:crypto";
import type { Pool, PoolConnection, RowDataPacket } from "mysql2/promise";
import { z } from "zod";

const optionSchema = z
  .object({
    label: z.enum(["A", "B", "C", "D"]),
    value: z.string().min(1),
  })
  .strict();

const questionSchema = z
  .object({
    stableId: z.string().regex(/^math2-\d{4}-q\d{2}$/),
    sourceYear: z.number().int(),
    subjectCode: z.literal("math2"),
    type: z.enum(["multiple_choice", "fill_in_blank", "solution"]),
    questionNumber: z.number().int().positive(),
    stem: z.string().min(1),
    options: z.array(optionSchema),
    answer: z.string().nullable(),
    answerStatus: z.string().min(1),
    explanation: z.string().nullable(),
    explanationStatus: z.string().min(1),
    reviewStatus: z.string().min(1),
    finalizationStatus: z.string().min(1),
    knowledgePoints: z.array(z.string()),
    anomalies: z.array(z.record(z.string(), z.unknown())),
    sourceEvidence: z
      .array(
        z
          .object({
            relativePath: z.string().min(1),
            role: z.string().min(1),
            gitState: z.enum(["tracked", "modified", "untracked"]),
            sha256: z.string().regex(/^[0-9a-f]{64}$/i),
            lineStart: z.number().int().positive(),
            lineEnd: z.number().int().positive(),
          })
          .strict(),
      )
      .min(1),
  })
  .strict();

const importPayloadSchema = z
  .object({
    schemaVersion: z.literal("math2-question-staging-v2"),
    batchId: z.string().min(1).max(128),
    subjectCode: z.literal("math2"),
    sourceYear: z.number().int(),
    sourceRepository: z.object({
      name: z.string().min(1),
      commit: z.string().regex(/^[0-9a-f]{40}$/i),
      branch: z.string(),
      dirty: z.boolean(),
    }),
    sourceFiles: z
      .array(
        z
          .object({
            relativePath: z.string().min(1),
            gitState: z.enum(["tracked", "modified", "untracked"]),
            sha256: z.string().regex(/^[0-9a-f]{64}$/i),
          })
          .passthrough(),
      )
      .min(1),
    questions: z.array(questionSchema).min(1),
    validation: z.object({
      questionCounts: z.record(z.string(), z.number().int().nonnegative()),
      expectedCounts: z.record(z.string(), z.number().int().nonnegative()),
      countsMatch: z.literal(true),
      stableIdsUnique: z.literal(true),
      schemaValid: z.literal(true),
    }).passthrough(),
  })
  .passthrough();

export type Math2ImportPayload = z.infer<typeof importPayloadSchema>;

export function validateMath2ImportPayload(input: unknown): Math2ImportPayload {
  const payload = importPayloadSchema.parse(input);
  const numbers = payload.questions.map((question) => question.questionNumber);
  const stableIds = payload.questions.map((question) => question.stableId);
  if (new Set(numbers).size !== numbers.length) {
    throw new Error("duplicate question numbers in import payload");
  }
  if (new Set(stableIds).size !== stableIds.length) {
    throw new Error("duplicate stable IDs in import payload");
  }
  const sortedNumbers = [...numbers].sort((left, right) => left - right);
  const expectedNumbers = Array.from(
    { length: payload.questions.length },
    (_value, index) => index + 1,
  );
  if (sortedNumbers.join(",") !== expectedNumbers.join(",")) {
    throw new Error("question numbers must be contiguous from 1");
  }
  const actualCounts = payload.questions.reduce<Record<string, number>>(
    (counts, question) => {
      counts[question.type] = (counts[question.type] ?? 0) + 1;
      return counts;
    },
    {},
  );
  for (const [type, expected] of Object.entries(
    payload.validation.expectedCounts,
  )) {
    if (
      (actualCounts[type] ?? 0) !== expected ||
      payload.validation.questionCounts[type] !== expected
    ) {
      throw new Error(`question count mismatch for ${type}`);
    }
  }
  for (const question of payload.questions) {
    if (
      question.sourceYear !== payload.sourceYear ||
      !question.stableId.startsWith(`math2-${payload.sourceYear}-`)
    ) {
      throw new Error(`year mismatch for ${question.stableId}`);
    }
    const labels = question.options.map((option) => option.label);
    if (
      question.type === "multiple_choice" &&
      labels.join(",") !== "A,B,C,D"
    ) {
      throw new Error(`${question.stableId} must have canonical A-D options`);
    }
    if (question.type !== "multiple_choice" && question.options.length > 0) {
      throw new Error(`${question.stableId} must not have options`);
    }
  }
  return payload;
}

const contentHash = (payload: Math2ImportPayload) =>
  createHash("sha256")
    .update(JSON.stringify(payload.questions))
    .digest("hex");

type ImportPool = Pick<Pool, "getConnection">;
type ImportConnection = Pick<
  PoolConnection,
  "beginTransaction" | "commit" | "rollback" | "execute" | "query" | "release"
>;

export async function importMath2Batch(
  pool: ImportPool,
  rawPayload: unknown,
  options: { dryRun: boolean },
): Promise<{
  batchId: string;
  questionsValidated: number;
  questionsInserted: number;
  dryRun: boolean;
  transaction: "rolled_back" | "committed";
}> {
  const payload = validateMath2ImportPayload(rawPayload);
  const connection = (await pool.getConnection()) as ImportConnection;
  let transactionOpen = false;
  try {
    await connection.beginTransaction();
    transactionOpen = true;
    const [existingRows] = await connection.query<
      Array<RowDataPacket & { status: string }>
    >(
      "SELECT status FROM kaoyan_content_batches WHERE id = ? FOR UPDATE",
      [payload.batchId],
    );
    const existingStatus = existingRows[0]?.status;
    if (existingStatus && existingStatus !== "staging") {
      throw new Error(
        `batch ${payload.batchId} cannot replace status ${existingStatus}`,
      );
    }
    if (existingStatus === "staging") {
      await connection.execute(
        "DELETE FROM kaoyan_content_batches WHERE id = ?",
        [payload.batchId],
      );
    }
    await connection.execute(
      `INSERT INTO kaoyan_content_batches
         (id, subject_code, source_year, schema_version, source_repo,
          source_commit, source_dirty, source_files, expected_counts,
          actual_counts, content_hash, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'staging')`,
      [
        payload.batchId,
        payload.subjectCode,
        payload.sourceYear,
        payload.schemaVersion,
        payload.sourceRepository.name,
        payload.sourceRepository.commit,
        payload.sourceRepository.dirty,
        JSON.stringify(payload.sourceFiles),
        JSON.stringify(payload.validation.expectedCounts),
        JSON.stringify(payload.validation.questionCounts),
        contentHash(payload),
      ],
    );
    for (const question of payload.questions) {
      await connection.execute(
        `INSERT INTO kaoyan_questions
           (batch_id, stable_id, subject_code, source_year, question_number,
            question_type, stem, options_json, answer_text, answer_status,
            explanation_text, explanation_status, source_traceability,
            review_status, finalization_status, knowledge_points, anomalies)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          payload.batchId,
          question.stableId,
          question.subjectCode,
          question.sourceYear,
          question.questionNumber,
          question.type,
          question.stem,
          JSON.stringify(question.options),
          question.answer,
          question.answerStatus,
          question.explanation,
          question.explanationStatus,
          JSON.stringify(question.sourceEvidence),
          question.reviewStatus,
          question.finalizationStatus,
          JSON.stringify(question.knowledgePoints),
          JSON.stringify(question.anomalies),
        ],
      );
    }
    const [countRows] = await connection.query<
      Array<RowDataPacket & { total: number }>
    >(
      "SELECT COUNT(*) AS total FROM kaoyan_questions WHERE batch_id = ?",
      [payload.batchId],
    );
    const questionsInserted = Number(countRows[0]?.total ?? 0);
    if (questionsInserted !== payload.questions.length) {
      throw new Error(
        `transactional count mismatch: expected ${payload.questions.length}, got ${questionsInserted}`,
      );
    }
    if (options.dryRun) {
      await connection.rollback();
      transactionOpen = false;
      return {
        batchId: payload.batchId,
        questionsValidated: payload.questions.length,
        questionsInserted,
        dryRun: true,
        transaction: "rolled_back",
      };
    }
    await connection.commit();
    transactionOpen = false;
    return {
      batchId: payload.batchId,
      questionsValidated: payload.questions.length,
      questionsInserted,
      dryRun: false,
      transaction: "committed",
    };
  } catch (error) {
    if (transactionOpen) await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
