import type {
  Pool,
  PoolConnection,
  ResultSetHeader,
  RowDataPacket,
} from "mysql2/promise";

type ApprovalPool = Pick<Pool, "getConnection">;
type ApprovalConnection = Pick<
  PoolConnection,
  "beginTransaction" | "commit" | "rollback" | "execute" | "query" | "release"
>;

export const AUTHORIZED_PROMOTION_COUNTS = {
  math1: { batches: 38, questions: 852 },
  math2: { batches: 26, questions: 522 },
  math3: { batches: 10, questions: 178 },
} as const;

type AuthorizedSubjectCode = keyof typeof AUTHORIZED_PROMOTION_COUNTS;

const range = (start: number, end: number) =>
  Array.from({ length: end - start + 1 }, (_, index) => start + index);

export const AUTHORIZED_BATCH_IDS = [
  ...[
    ...range(1987, 1993),
    ...range(1995, 2025),
  ].map((year) => `math1-final-${year}-v${year === 2025 ? 2 : 1}`),
  ...range(1997, 2019).map(
    (year) => `REQ-017-math2-${year}-aggregate-staging`,
  ),
  "REQ-002-math2-2020-pilot",
  "REQ-008-math2-2023-comparison-primary-staging",
  "REQ-010-math2-2024-markdown-staging",
  ...range(1987, 1996).map(
    (year) => `REQ-016-math3-${year}-aggregate-staging`,
  ),
] as const;

interface BatchRow extends RowDataPacket {
  id: string;
  subject_code: AuthorizedSubjectCode;
  source_year: number;
}

interface ReadinessRow extends RowDataPacket {
  total: number;
  unique_ids: number;
  not_approved: number;
  blocked: number;
}

interface DuplicateRow extends RowDataPacket {
  duplicate_stable_ids: number;
}

export interface ApprovalSubjectResult {
  subjectCode: AuthorizedSubjectCode;
  batches: number;
  questions: number;
  previouslyNotApproved: number;
  previouslyBlocked: number;
}

export async function approveAuthorizedStagingContent(
  pool: ApprovalPool,
  options: { dryRun: boolean },
): Promise<{
  subjects: ApprovalSubjectResult[];
  batches: Array<{
    batchId: string;
    subjectCode: AuthorizedSubjectCode;
    sourceYear: number;
  }>;
  questions: number;
  dryRun: boolean;
  transaction: "rolled_back" | "committed";
}> {
  const connection = (await pool.getConnection()) as ApprovalConnection;
  let transactionOpen = false;
  try {
    await connection.beginTransaction();
    transactionOpen = true;
    const authorizedPlaceholders = AUTHORIZED_BATCH_IDS.map(() => "?").join(
      ",",
    );
    const [batchRows] = await connection.query<BatchRow[]>(
      `SELECT id, subject_code, source_year
       FROM kaoyan_content_batches
       WHERE id IN (${authorizedPlaceholders})
         AND status = 'staging'
       ORDER BY subject_code, source_year
       FOR UPDATE`,
      [...AUTHORIZED_BATCH_IDS],
    );
    const expectedBatchTotal = AUTHORIZED_BATCH_IDS.length;
    if (batchRows.length !== expectedBatchTotal) {
      throw new Error(
        `authorized staging batch count mismatch: expected ${expectedBatchTotal}, got ${batchRows.length}`,
      );
    }

    const subjectResults = new Map<
      AuthorizedSubjectCode,
      ApprovalSubjectResult
    >();
    const batchQuestionCounts = new Map<string, number>();
    for (const subjectCode of Object.keys(
      AUTHORIZED_PROMOTION_COUNTS,
    ) as AuthorizedSubjectCode[]) {
      subjectResults.set(subjectCode, {
        subjectCode,
        batches: 0,
        questions: 0,
        previouslyNotApproved: 0,
        previouslyBlocked: 0,
      });
    }

    for (const batch of batchRows) {
      const subject = subjectResults.get(batch.subject_code);
      if (!subject) {
        throw new Error(`unexpected subject ${batch.subject_code}`);
      }
      const [rows] = await connection.query<ReadinessRow[]>(
        `SELECT COUNT(*) AS total,
                COUNT(DISTINCT stable_id) AS unique_ids,
                SUM(review_status <> 'approved') AS not_approved,
                SUM(finalization_status = 'blocked') AS blocked
         FROM kaoyan_questions
         WHERE batch_id = ?`,
        [batch.id],
      );
      const readiness = rows[0];
      const total = Number(readiness?.total ?? 0);
      const uniqueIds = Number(readiness?.unique_ids ?? 0);
      if (total === 0 || uniqueIds !== total) {
        throw new Error(
          `batch ${batch.id} has invalid question counts: total=${total}, unique=${uniqueIds}`,
        );
      }
      subject.batches += 1;
      subject.questions += total;
      batchQuestionCounts.set(batch.id, total);
      subject.previouslyNotApproved += Number(readiness?.not_approved ?? 0);
      subject.previouslyBlocked += Number(readiness?.blocked ?? 0);
    }

    for (const subjectCode of Object.keys(
      AUTHORIZED_PROMOTION_COUNTS,
    ) as AuthorizedSubjectCode[]) {
      const expected = AUTHORIZED_PROMOTION_COUNTS[subjectCode];
      const actual = subjectResults.get(subjectCode);
      if (
        !actual ||
        actual.batches !== expected.batches ||
        actual.questions !== expected.questions
      ) {
        throw new Error(
          `${subjectCode} authorization mismatch: expected ${expected.batches} batches/${expected.questions} questions, got ${actual?.batches ?? 0}/${actual?.questions ?? 0}`,
        );
      }
    }

    const placeholders = batchRows.map(() => "?").join(",");
    const [duplicateRows] = await connection.query<DuplicateRow[]>(
      `SELECT COUNT(*) AS duplicate_stable_ids
       FROM (
         SELECT stable_id
         FROM kaoyan_questions
         WHERE batch_id IN (${placeholders})
         GROUP BY stable_id
         HAVING COUNT(*) > 1
       ) duplicates`,
      batchRows.map((batch) => batch.id),
    );
    const duplicateStableIds = Number(
      duplicateRows[0]?.duplicate_stable_ids ?? 0,
    );
    if (duplicateStableIds !== 0) {
      throw new Error(
        `authorized staging content has ${duplicateStableIds} duplicate stable IDs`,
      );
    }

    for (const batch of batchRows) {
      const [updateResult] = await connection.execute<ResultSetHeader>(
        `UPDATE kaoyan_questions
         SET review_status = 'approved',
             finalization_status = 'approved_with_known_risks'
         WHERE batch_id = ?`,
        [batch.id],
      );
      const expectedQuestions = batchQuestionCounts.get(batch.id) ?? 0;
      if (updateResult.affectedRows !== expectedQuestions) {
        throw new Error(
          `batch ${batch.id} approval update mismatch: expected ${expectedQuestions}, got ${updateResult.affectedRows}`,
        );
      }
    }

    const subjects = [...subjectResults.values()];
    const result = {
      subjects,
      batches: batchRows.map((batch) => ({
        batchId: batch.id,
        subjectCode: batch.subject_code,
        sourceYear: Number(batch.source_year),
      })),
      questions: subjects.reduce(
        (total, subject) => total + subject.questions,
        0,
      ),
      dryRun: options.dryRun,
      transaction: options.dryRun
        ? ("rolled_back" as const)
        : ("committed" as const),
    };
    if (options.dryRun) {
      await connection.rollback();
    } else {
      await connection.commit();
    }
    transactionOpen = false;
    return result;
  } catch (error) {
    if (transactionOpen) await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
