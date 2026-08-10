import type { Pool, RowDataPacket } from "mysql2/promise";
import type {
  AdminOverrideRevision,
  AdminQuestionSnapshot,
} from "./admin-content.js";
import type { ContentOption, ContentQuestionDetail } from "./content-store.js";
import {
  applyContentOverride,
  contentOverrideChangesSchema,
  type ContentOverrideChanges,
} from "./content-overrides.js";
import {
  parseStoredContentOptions,
  parseStoredKnowledgePoints,
} from "./content-store-validation.js";

interface AdminQuestionRow extends RowDataPacket {
  stable_id: string;
  subject_code: "math1" | "math2" | "math3";
  source_year: number;
  question_type: string;
  question_number: number;
  stem: string;
  options_json: string | ContentOption[];
  answer_text: string | null;
  answer_status: string;
  explanation_text: string | null;
  explanation_status: string;
  review_status: string;
  finalization_status: string;
  knowledge_points: string | string[];
  override_patch_json: string | ContentOverrideChanges | null;
  override_subject_code: "math1" | "math2" | "math3" | null;
  override_revision: number | null;
  override_is_active: number | boolean | null;
  override_editor: string | null;
  override_reason: string | null;
  override_updated_at: Date | null;
}

interface AdminRevisionRow extends RowDataPacket {
  revision: number;
  action: "upsert" | "revert";
  target_revision: number | null;
  before_patch_json: string | ContentOverrideChanges | null;
  after_patch_json: string | ContentOverrideChanges | null;
  editor: string;
  reason: string;
  created_at: Date;
}

function parseStoredOverride(
  value: string | ContentOverrideChanges,
): ContentOverrideChanges {
  try {
    const parsed = typeof value === "string" ? JSON.parse(value) : value;
    return contentOverrideChangesSchema.parse(parsed);
  } catch {
    throw new Error("stored content override failed integrity validation");
  }
}

const parseNullableStoredOverride = (
  value: string | ContentOverrideChanges | null,
) => (value === null ? null : parseStoredOverride(value));

const toBaseDetail = (row: AdminQuestionRow): ContentQuestionDetail => ({
  stableId: row.stable_id,
  sourceYear: row.source_year,
  type: row.question_type,
  questionNumber: row.question_number,
  stem: row.stem,
  options: parseStoredContentOptions(row.question_type, row.options_json),
  finalizationStatus: row.finalization_status,
  answer: row.answer_text,
  answerStatus: row.answer_status,
  explanation: row.explanation_text,
  explanationStatus: row.explanation_status,
  reviewStatus: row.review_status,
  knowledgePoints: parseStoredKnowledgePoints(row.knowledge_points),
});

export async function getAdminQuestionSnapshot(
  pool: Pool,
  stableId: string,
): Promise<AdminQuestionSnapshot | null> {
  const [rows] = await pool.query<AdminQuestionRow[]>(
    `SELECT q.stable_id, q.subject_code, q.source_year, q.question_type,
            q.question_number, q.stem, q.options_json, q.answer_text,
            q.answer_status, q.explanation_text, q.explanation_status,
            q.review_status, q.finalization_status, q.knowledge_points,
            o.patch_json AS override_patch_json,
            o.subject_code AS override_subject_code,
            o.revision AS override_revision,
            o.is_active AS override_is_active,
            o.editor AS override_editor,
            o.reason AS override_reason,
            o.updated_at AS override_updated_at
     FROM kaoyan_questions q
     JOIN kaoyan_content_batches b ON b.id = q.batch_id
     LEFT JOIN kaoyan_question_overrides o ON o.stable_id = q.stable_id
     WHERE b.status = 'published' AND q.stable_id = ?`,
    [stableId],
  );
  if (rows.length > 1) {
    throw new Error("published stable ID is not unique");
  }
  const row = rows[0];
  if (!row) return null;
  const base = toBaseDetail(row);
  const activeChanges =
    row.override_revision !== null && Boolean(row.override_is_active)
      ? parseNullableStoredOverride(row.override_patch_json)
      : null;
  if (
    row.override_revision !== null &&
    (row.override_subject_code !== row.subject_code ||
      !row.override_editor ||
      !row.override_reason ||
      !row.override_updated_at)
  ) {
    throw new Error("stored content override metadata failed integrity validation");
  }
  const effective = activeChanges
    ? applyContentOverride(base, activeChanges)
    : base;
  const [revisionRows] = await pool.query<AdminRevisionRow[]>(
    `SELECT revision, action, target_revision, before_patch_json,
            after_patch_json, editor, reason, created_at
     FROM kaoyan_question_override_revisions
     WHERE stable_id = ?
     ORDER BY revision DESC
     LIMIT 51`,
    [stableId],
  );
  const historyHasMore = revisionRows.length > 50;
  const revisions: AdminOverrideRevision[] = revisionRows
    .slice(0, 50)
    .map((revision) => ({
      revision: Number(revision.revision),
      action: revision.action,
      targetRevision:
        revision.target_revision === null
          ? null
          : Number(revision.target_revision),
      beforePatch: parseNullableStoredOverride(revision.before_patch_json),
      afterPatch: parseNullableStoredOverride(revision.after_patch_json),
      editor: revision.editor,
      reason: revision.reason,
      createdAt: revision.created_at.toISOString(),
    }));
  return {
    stableId: row.stable_id,
    subjectCode: row.subject_code,
    base,
    effective,
    override:
      row.override_revision === null
        ? null
        : {
            revision: Number(row.override_revision),
            active: Boolean(row.override_is_active),
            changes: activeChanges,
            editor: row.override_editor!,
            reason: row.override_reason!,
            updatedAt: row.override_updated_at!.toISOString(),
          },
    revisions,
    historyHasMore,
  };
}
