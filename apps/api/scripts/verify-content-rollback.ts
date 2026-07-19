import request from "supertest";
import type { RowDataPacket } from "mysql2/promise";
import { createApp } from "../src/app.js";
import {
  AUTHORIZED_BATCH_IDS,
  AUTHORIZED_PROMOTION_COUNTS,
} from "../src/content-approve.js";
import { loadConfig } from "../src/config.js";
import { createDatabasePool, MySqlAuthStore } from "../src/db.js";

type SubjectCode = keyof typeof AUTHORIZED_PROMOTION_COUNTS;

interface SummaryRow extends RowDataPacket {
  subjectCode: SubjectCode;
  batches: number;
  stagingBatches: number;
  publishedBatches: number;
  questions: number;
  approved: number;
  knownRiskApprovals: number;
}

interface CountRow extends RowDataPacket {
  count: number;
}

const config = loadConfig();
const pool = createDatabasePool(config);

try {
  const placeholders = AUTHORIZED_BATCH_IDS.map(() => "?").join(",");
  const parameters = [...AUTHORIZED_BATCH_IDS];
  const [summaryRows] = await pool.query<SummaryRow[]>(
    `SELECT b.subject_code AS subjectCode,
            COUNT(DISTINCT b.id) AS batches,
            COUNT(DISTINCT CASE WHEN b.status = 'staging' THEN b.id END) AS stagingBatches,
            COUNT(DISTINCT CASE WHEN b.status = 'published' THEN b.id END) AS publishedBatches,
            COUNT(q.stable_id) AS questions,
            SUM(q.review_status = 'approved') AS approved,
            SUM(q.finalization_status = 'approved_with_known_risks') AS knownRiskApprovals
     FROM kaoyan_content_batches b
     JOIN kaoyan_questions q ON q.batch_id = b.id
     WHERE b.id IN (${placeholders})
     GROUP BY b.subject_code
     ORDER BY b.subject_code`,
    parameters,
  );
  const [duplicateRows] = await pool.query<CountRow[]>(
    `SELECT COUNT(*) AS count
     FROM (
       SELECT stable_id
       FROM kaoyan_questions
       WHERE batch_id IN (${placeholders})
       GROUP BY stable_id
       HAVING COUNT(*) > 1
     ) duplicates`,
    parameters,
  );

  const summaryBySubject = new Map(
    summaryRows.map((row) => [row.subjectCode, row]),
  );
  for (const [subjectCode, expected] of Object.entries(
    AUTHORIZED_PROMOTION_COUNTS,
  )) {
    const row = summaryBySubject.get(subjectCode as SubjectCode);
    if (
      !row ||
      Number(row.batches) !== expected.batches ||
      Number(row.stagingBatches) !== expected.batches ||
      Number(row.publishedBatches) !== 0 ||
      Number(row.questions) !== expected.questions ||
      Number(row.approved) !== expected.questions ||
      Number(row.knownRiskApprovals) !== expected.questions
    ) {
      throw new Error(`${subjectCode} rollback database summary mismatch`);
    }
  }
  if (Number(duplicateRows[0]?.count ?? -1) !== 0) {
    throw new Error("authorized content has duplicate stable IDs");
  }

  const liveStore = new MySqlAuthStore(pool);
  const store = new Proxy(liveStore, {
    get(target, property, receiver) {
      if (property === "findUserBySession") {
        return async () => ({
          id: "rollback-verification",
          email: "rollback-verification@example.invalid",
          emailVerified: true,
        });
      }
      const value = Reflect.get(target, property, receiver) as unknown;
      return typeof value === "function" ? value.bind(target) : value;
    },
  });
  const app = createApp({
    config: { ...config, NODE_ENV: "test" },
    store,
    mailer: { async sendVerification() {} },
  });
  const apiChecks = [];
  for (const subjectCode of Object.keys(
    AUTHORIZED_PROMOTION_COUNTS,
  ) as SubjectCode[]) {
    await request(app)
      .get(`/api/content/${subjectCode}/questions?page=1&pageSize=1`)
      .expect(401, { error: "authentication_required" });
    const authenticated = await request(app)
      .get(`/api/content/${subjectCode}/questions?page=1&pageSize=1`)
      .set("Cookie", "kaoyan_session=rollback-verification")
      .expect(200)
      .expect("Cache-Control", "private, no-store");
    if (Number(authenticated.body.data.totalItems) !== 0) {
      throw new Error(
        `${subjectCode} still exposes ${authenticated.body.data.totalItems} published questions`,
      );
    }
    apiChecks.push({
      subjectCode,
      anonymousStatus: 401,
      authenticatedStatus: 200,
      publishedQuestions: 0,
    });
  }

  console.log(
    JSON.stringify(
      {
        database: summaryRows,
        duplicateStableIds: Number(duplicateRows[0]?.count ?? 0),
        apiChecks,
      },
      null,
      2,
    ),
  );
} finally {
  await pool.end();
}
