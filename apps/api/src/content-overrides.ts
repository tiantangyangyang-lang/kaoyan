import { createHash } from "node:crypto";
import type {
  Pool,
  PoolConnection,
  ResultSetHeader,
  RowDataPacket,
} from "mysql2/promise";
import { z } from "zod";

const stableIdSchema = z.string().regex(
  /^(?:math[23]-\d{4}-q\d{2,3}|math1-\d{4}-(?:q\d{2,3}|s\d{2}(?:-q\d{2,3})?))$/,
);
const optionSchema = z
  .object({
    label: z.enum(["A", "B", "C", "D"]),
    value: z.string().min(1).max(20_000),
  })
  .strict();

export const contentOverrideChangesSchema = z
  .object({
    stem: z.string().min(1).max(100_000).optional(),
    options: z
      .array(optionSchema)
      .length(4)
      .refine(
        (options) =>
          new Set(options.map((option) => option.label)).size === options.length &&
          options.every(
            (option, index) => option.label.charCodeAt(0) === 65 + index,
          ),
        "options must contain exactly A, B, C, D in order",
      )
      .optional(),
    answer: z.string().max(100_000).nullable().optional(),
    answerStatus: z.string().min(1).max(64).optional(),
    explanation: z.string().max(500_000).nullable().optional(),
    explanationStatus: z.string().min(1).max(64).optional(),
  })
  .strict()
  .refine((changes) => Object.keys(changes).length > 0, {
    message: "at least one content field must be provided",
  });

const commonPatchFields = {
  schemaVersion: z.literal("kaoyan-content-override-v1"),
  stableId: stableIdSchema,
  expectedRevision: z.number().int().nonnegative(),
  editor: z.string().trim().min(1).max(128),
  reason: z.string().trim().min(3).max(500),
};

export const contentOverrideCommandSchema = z.discriminatedUnion("action", [
  z
    .object({
      ...commonPatchFields,
      action: z.literal("upsert"),
      changes: contentOverrideChangesSchema,
    })
    .strict(),
  z
    .object({
      ...commonPatchFields,
      action: z.literal("revert"),
      targetRevision: z.number().int().nonnegative(),
    })
    .strict(),
]);

export type ContentOverrideChanges = z.infer<
  typeof contentOverrideChangesSchema
>;
export type ContentOverrideCommand = z.infer<
  typeof contentOverrideCommandSchema
>;

interface BaseQuestionRow extends RowDataPacket {
  stable_id: string;
  subject_code: "math1" | "math2" | "math3";
  source_year: number;
  question_type: string;
  question_number: number;
  stem: string;
  options_json: string | Array<{ label: string; value: string }>;
  answer_text: string | null;
  answer_status: string;
  explanation_text: string | null;
  explanation_status: string;
}

interface OverrideRow extends RowDataPacket {
  revision: number;
  patch_json: string | ContentOverrideChanges;
  base_snapshot_hash: string;
  is_active: number | boolean;
}

interface RevisionRow extends RowDataPacket {
  after_patch_json: string | ContentOverrideChanges | null;
  base_snapshot_hash: string;
}

type OverridePool = Pick<Pool, "getConnection">;
type OverrideConnection = Pick<
  PoolConnection,
  "beginTransaction" | "commit" | "rollback" | "execute" | "query" | "release"
>;

const parseJson = <T>(value: string | T): T =>
  typeof value === "string" ? (JSON.parse(value) as T) : value;
const sha256 = (value: unknown) =>
  createHash("sha256").update(JSON.stringify(value)).digest("hex");
const patchHash = (patch: ContentOverrideChanges | null) =>
  patch === null ? null : sha256(patch);

function baseSnapshotHash(row: BaseQuestionRow) {
  return sha256({
    stableId: row.stable_id,
    subjectCode: row.subject_code,
    sourceYear: row.source_year,
    type: row.question_type,
    questionNumber: row.question_number,
    stem: row.stem,
    options: parseJson(row.options_json),
    answer: row.answer_text,
    answerStatus: row.answer_status,
    explanation: row.explanation_text,
    explanationStatus: row.explanation_status,
  });
}

export function applyContentOverride<T extends {
  stem: string;
  options: Array<{ label: string; value: string }>;
  answer?: string | null;
  answerStatus?: string;
  explanation?: string | null;
  explanationStatus?: string;
}>(base: T, changes: ContentOverrideChanges): T {
  const parsed = contentOverrideChangesSchema.parse(changes);
  return {
    ...base,
    ...(parsed.stem !== undefined ? { stem: parsed.stem } : {}),
    ...(parsed.options !== undefined ? { options: parsed.options } : {}),
    ...(Object.hasOwn(parsed, "answer") ? { answer: parsed.answer } : {}),
    ...(parsed.answerStatus !== undefined
      ? { answerStatus: parsed.answerStatus }
      : {}),
    ...(Object.hasOwn(parsed, "explanation")
      ? { explanation: parsed.explanation }
      : {}),
    ...(parsed.explanationStatus !== undefined
      ? { explanationStatus: parsed.explanationStatus }
      : {}),
  };
}

export async function executeContentOverride(
  pool: OverridePool,
  rawCommand: unknown,
  options: { dryRun: boolean },
): Promise<{
  stableId: string;
  subjectCode: string;
  action: "upsert" | "revert";
  previousRevision: number;
  revision: number;
  targetRevision: number | null;
  beforePatchHash: string | null;
  afterPatchHash: string | null;
  baseSnapshotHash: string;
  dryRun: boolean;
  transaction: "rolled_back" | "committed";
}> {
  const command = contentOverrideCommandSchema.parse(rawCommand);
  const connection = (await pool.getConnection()) as OverrideConnection;
  let transactionOpen = false;
  try {
    await connection.beginTransaction();
    transactionOpen = true;
    const [baseRows] = await connection.query<BaseQuestionRow[]>(
      `SELECT q.stable_id, q.subject_code, q.source_year, q.question_type,
              q.question_number, q.stem, q.options_json, q.answer_text,
              q.answer_status, q.explanation_text, q.explanation_status
       FROM kaoyan_questions q
       JOIN kaoyan_content_batches b ON b.id = q.batch_id
       WHERE b.status = 'published' AND q.stable_id = ?
       FOR UPDATE`,
      [command.stableId],
    );
    const base = baseRows[0];
    if (baseRows.length !== 1 || !base) {
      throw new Error(
        `published ${command.stableId} count must be 1, got ${baseRows.length}`,
      );
    }
    const currentBaseHash = baseSnapshotHash(base);
    if (
      command.action === "upsert" &&
      command.changes.options !== undefined &&
      base.question_type !== "multiple_choice"
    ) {
      throw new Error("options can only be overridden for multiple-choice questions");
    }
    const [overrideRows] = await connection.query<OverrideRow[]>(
      `SELECT revision, patch_json, base_snapshot_hash, is_active
       FROM kaoyan_question_overrides
       WHERE stable_id = ?
       FOR UPDATE`,
      [command.stableId],
    );
    const current = overrideRows[0];
    const previousRevision = Number(current?.revision ?? 0);
    if (command.expectedRevision !== previousRevision) {
      throw new Error(
        `expectedRevision ${command.expectedRevision} does not match current revision ${previousRevision}`,
      );
    }
    const currentPatch =
      current && Boolean(current.is_active)
        ? contentOverrideChangesSchema.parse(parseJson(current.patch_json))
        : null;
    const isDisablingStaleOverride =
      command.action === "revert" && command.targetRevision === 0;
    if (
      currentPatch !== null &&
      current?.base_snapshot_hash !== currentBaseHash &&
      !isDisablingStaleOverride
    ) {
      throw new Error(
        "published base content changed after the active override; revert to revision 0 and review before editing",
      );
    }

    let afterPatch: ContentOverrideChanges | null;
    let targetRevision: number | null = null;
    if (command.action === "upsert") {
      afterPatch = contentOverrideChangesSchema.parse({
        ...(currentPatch ?? {}),
        ...command.changes,
      });
    } else {
      targetRevision = command.targetRevision;
      if (targetRevision >= previousRevision) {
        throw new Error("targetRevision must be lower than the current revision");
      }
      if (targetRevision === 0) {
        afterPatch = null;
      } else {
        const [revisionRows] = await connection.query<RevisionRow[]>(
          `SELECT after_patch_json, base_snapshot_hash
           FROM kaoyan_question_override_revisions
           WHERE stable_id = ? AND revision = ?
           FOR UPDATE`,
          [command.stableId, targetRevision],
        );
        const target = revisionRows[0];
        if (!target) throw new Error(`target revision ${targetRevision} was not found`);
        if (target.base_snapshot_hash !== currentBaseHash) {
          throw new Error("target revision belongs to a different base snapshot");
        }
        afterPatch =
          target.after_patch_json === null
            ? null
            : contentOverrideChangesSchema.parse(
                parseJson(target.after_patch_json),
              );
      }
    }

    const revision = previousRevision + 1;
    const storedPatch = afterPatch ?? {};
    let overrideResult: ResultSetHeader;
    if (current) {
      [overrideResult] = await connection.execute<ResultSetHeader>(
        `UPDATE kaoyan_question_overrides
         SET subject_code = ?, revision = ?, patch_json = ?,
             base_snapshot_hash = ?, is_active = ?, editor = ?, reason = ?
         WHERE stable_id = ? AND revision = ?`,
        [
          base.subject_code,
          revision,
          JSON.stringify(storedPatch),
          currentBaseHash,
          afterPatch !== null,
          command.editor,
          command.reason,
          command.stableId,
          previousRevision,
        ],
      );
    } else {
      [overrideResult] = await connection.execute<ResultSetHeader>(
        `INSERT INTO kaoyan_question_overrides
           (stable_id, subject_code, revision, patch_json,
            base_snapshot_hash, is_active, editor, reason)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          command.stableId,
          base.subject_code,
          revision,
          JSON.stringify(storedPatch),
          currentBaseHash,
          afterPatch !== null,
          command.editor,
          command.reason,
        ],
      );
    }
    if (overrideResult.affectedRows !== 1) {
      throw new Error(`override write affected ${overrideResult.affectedRows} rows`);
    }

    const [auditResult] = await connection.execute<ResultSetHeader>(
      `INSERT INTO kaoyan_question_override_revisions
         (stable_id, revision, subject_code, action, target_revision,
          before_patch_json, after_patch_json, base_snapshot_hash,
          editor, reason)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        command.stableId,
        revision,
        base.subject_code,
        command.action,
        targetRevision,
        currentPatch === null ? null : JSON.stringify(currentPatch),
        afterPatch === null ? null : JSON.stringify(afterPatch),
        currentBaseHash,
        command.editor,
        command.reason,
      ],
    );
    if (auditResult.affectedRows !== 1) {
      throw new Error(`override audit insert affected ${auditResult.affectedRows} rows`);
    }

    const result = {
      stableId: command.stableId,
      subjectCode: base.subject_code,
      action: command.action,
      previousRevision,
      revision,
      targetRevision,
      beforePatchHash: patchHash(currentPatch),
      afterPatchHash: patchHash(afterPatch),
      baseSnapshotHash: currentBaseHash,
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
