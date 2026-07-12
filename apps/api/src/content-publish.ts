import type { Pool, PoolConnection, RowDataPacket } from "mysql2/promise";

type PublishPool = Pick<Pool, "getConnection">;
type PublishConnection = Pick<
  PoolConnection,
  "beginTransaction" | "commit" | "rollback" | "execute" | "query" | "release"
>;

interface BatchRow extends RowDataPacket {
  id: string;
  subject_code: string;
  source_year: number;
  status: string;
}

interface ReadinessRow extends RowDataPacket {
  total: number;
  review_blocked: number;
  finalization_blocked: number;
}

export async function publishContentBatch(
  pool: PublishPool,
  batchId: string,
  options: { dryRun: boolean },
): Promise<{
  batchId: string;
  subjectCode: string;
  sourceYear: number;
  questions: number;
  dryRun: boolean;
  transaction: "rolled_back" | "committed";
}> {
  if (!batchId.trim()) throw new Error("batchId is required");
  const connection = (await pool.getConnection()) as PublishConnection;
  let transactionOpen = false;
  try {
    await connection.beginTransaction();
    transactionOpen = true;
    const [batchRows] = await connection.query<BatchRow[]>(
      `SELECT id, subject_code, source_year, status
       FROM kaoyan_content_batches
       WHERE id = ?
       FOR UPDATE`,
      [batchId],
    );
    const batch = batchRows[0];
    if (!batch) throw new Error(`batch ${batchId} was not found`);
    if (batch.status !== "staging") {
      throw new Error(`batch ${batchId} must be staging, got ${batch.status}`);
    }

    const [readinessRows] = await connection.query<ReadinessRow[]>(
      `SELECT COUNT(*) AS total,
              SUM(review_status <> 'approved') AS review_blocked,
              SUM(finalization_status = 'blocked') AS finalization_blocked
       FROM kaoyan_questions
       WHERE batch_id = ?`,
      [batchId],
    );
    const readiness = readinessRows[0];
    const questions = Number(readiness?.total ?? 0);
    const reviewBlocked = Number(readiness?.review_blocked ?? 0);
    const finalizationBlocked = Number(readiness?.finalization_blocked ?? 0);
    if (questions === 0) throw new Error(`batch ${batchId} has no questions`);
    if (reviewBlocked > 0 || finalizationBlocked > 0) {
      throw new Error(
        `batch ${batchId} is not publishable: ${reviewBlocked} questions are not approved, ${finalizationBlocked} are blocked`,
      );
    }

    await connection.execute(
      `UPDATE kaoyan_content_batches
       SET status = 'superseded'
       WHERE subject_code = ? AND source_year = ? AND status = 'published'`,
      [batch.subject_code, batch.source_year],
    );
    await connection.execute(
      `UPDATE kaoyan_content_batches
       SET status = 'published', published_at = CURRENT_TIMESTAMP(3)
       WHERE id = ?`,
      [batchId],
    );

    if (options.dryRun) {
      await connection.rollback();
      transactionOpen = false;
      return {
        batchId,
        subjectCode: batch.subject_code,
        sourceYear: Number(batch.source_year),
        questions,
        dryRun: true,
        transaction: "rolled_back",
      };
    }
    await connection.commit();
    transactionOpen = false;
    return {
      batchId,
      subjectCode: batch.subject_code,
      sourceYear: Number(batch.source_year),
      questions,
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
