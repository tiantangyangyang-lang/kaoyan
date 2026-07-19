import type {
  Pool,
  PoolConnection,
  ResultSetHeader,
  RowDataPacket,
} from "mysql2/promise";
import {
  AUTHORIZED_BATCH_IDS,
  AUTHORIZED_PROMOTION_COUNTS,
} from "./content-approve.js";

type UnpublishPool = Pick<Pool, "getConnection">;
type UnpublishConnection = Pick<
  PoolConnection,
  "beginTransaction" | "commit" | "rollback" | "execute" | "query" | "release"
>;
type AuthorizedSubjectCode = keyof typeof AUTHORIZED_PROMOTION_COUNTS;

interface BatchRow extends RowDataPacket {
  id: string;
  subject_code: AuthorizedSubjectCode;
  source_year: number;
  status: string;
}

interface SummaryRow extends RowDataPacket {
  subject_code: AuthorizedSubjectCode;
  batches: number;
  questions: number;
  approved: number;
  known_risk_approvals: number;
}

interface DuplicateRow extends RowDataPacket {
  duplicate_stable_ids: number;
}

export async function unpublishAuthorizedContent(
  pool: UnpublishPool,
  options: { dryRun: boolean },
): Promise<{
  subjects: Array<{
    subjectCode: AuthorizedSubjectCode;
    batches: number;
    questions: number;
    approved: number;
    knownRiskApprovals: number;
  }>;
  batches: number;
  questions: number;
  dryRun: boolean;
  transaction: "rolled_back" | "committed";
}> {
  const connection = (await pool.getConnection()) as UnpublishConnection;
  let transactionOpen = false;
  try {
    await connection.beginTransaction();
    transactionOpen = true;
    const placeholders = AUTHORIZED_BATCH_IDS.map(() => "?").join(",");
    const parameters = [...AUTHORIZED_BATCH_IDS];
    const [batchRows] = await connection.query<BatchRow[]>(
      `SELECT id, subject_code, source_year, status
       FROM kaoyan_content_batches
       WHERE id IN (${placeholders})
       ORDER BY subject_code, source_year
       FOR UPDATE`,
      parameters,
    );
    if (batchRows.length !== AUTHORIZED_BATCH_IDS.length) {
      throw new Error(
        `authorized batch count mismatch: expected ${AUTHORIZED_BATCH_IDS.length}, got ${batchRows.length}`,
      );
    }
    const nonPublished = batchRows.filter((batch) => batch.status !== "published");
    if (nonPublished.length > 0) {
      throw new Error(
        `authorized batches must all be published; ${nonPublished.length} have another status`,
      );
    }

    const [summaryRows] = await connection.query<SummaryRow[]>(
      `SELECT b.subject_code,
              COUNT(DISTINCT b.id) AS batches,
              COUNT(q.stable_id) AS questions,
              SUM(q.review_status = 'approved') AS approved,
              SUM(q.finalization_status = 'approved_with_known_risks') AS known_risk_approvals
       FROM kaoyan_content_batches b
       JOIN kaoyan_questions q ON q.batch_id = b.id
       WHERE b.id IN (${placeholders})
       GROUP BY b.subject_code
       ORDER BY b.subject_code`,
      parameters,
    );
    const summaryBySubject = new Map(
      summaryRows.map((row) => [row.subject_code, row]),
    );
    const subjects = (
      Object.keys(AUTHORIZED_PROMOTION_COUNTS) as AuthorizedSubjectCode[]
    ).map((subjectCode) => {
      const expected = AUTHORIZED_PROMOTION_COUNTS[subjectCode];
      const row = summaryBySubject.get(subjectCode);
      const actual = {
        subjectCode,
        batches: Number(row?.batches ?? 0),
        questions: Number(row?.questions ?? 0),
        approved: Number(row?.approved ?? 0),
        knownRiskApprovals: Number(row?.known_risk_approvals ?? 0),
      };
      if (
        actual.batches !== expected.batches ||
        actual.questions !== expected.questions ||
        actual.approved !== expected.questions ||
        actual.knownRiskApprovals !== expected.questions
      ) {
        throw new Error(
          `${subjectCode} rollback scope mismatch: expected ${expected.batches} batches/${expected.questions} approved questions, got ${actual.batches}/${actual.questions} (approved=${actual.approved}, knownRisk=${actual.knownRiskApprovals})`,
        );
      }
      return actual;
    });

    const [duplicateRows] = await connection.query<DuplicateRow[]>(
      `SELECT COUNT(*) AS duplicate_stable_ids
       FROM (
         SELECT stable_id
         FROM kaoyan_questions
         WHERE batch_id IN (${placeholders})
         GROUP BY stable_id
         HAVING COUNT(*) > 1
       ) duplicates`,
      parameters,
    );
    const duplicateStableIds = Number(
      duplicateRows[0]?.duplicate_stable_ids ?? 0,
    );
    if (duplicateStableIds !== 0) {
      throw new Error(
        `authorized content has ${duplicateStableIds} duplicate stable IDs`,
      );
    }

    for (const batch of batchRows) {
      const [updateResult] = await connection.execute<ResultSetHeader>(
        `UPDATE kaoyan_content_batches
         SET status = 'staging', published_at = NULL
         WHERE id = ? AND status = 'published'`,
        [batch.id],
      );
      if (updateResult.affectedRows !== 1) {
        throw new Error(
          `batch ${batch.id} rollback update mismatch: expected 1, got ${updateResult.affectedRows}`,
        );
      }
    }

    const questions = subjects.reduce(
      (total, subject) => total + subject.questions,
      0,
    );
    if (options.dryRun) {
      await connection.rollback();
    } else {
      await connection.commit();
    }
    transactionOpen = false;
    return {
      subjects,
      batches: batchRows.length,
      questions,
      dryRun: options.dryRun,
      transaction: options.dryRun ? "rolled_back" : "committed",
    };
  } catch (error) {
    if (transactionOpen) await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
