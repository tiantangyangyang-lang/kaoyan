import request from "supertest";
import type { RowDataPacket } from "mysql2/promise";
import { createApp } from "../src/app.js";
import { loadConfig } from "../src/config.js";
import { createDatabasePool, MySqlAuthStore } from "../src/db.js";

const expected = {
  math1: { batches: 38, questions: 852 },
  math2: { batches: 26, questions: 522 },
  math3: { batches: 10, questions: 178 },
} as const;
const publicMath1Questions = 179;

const config = loadConfig();
const pool = createDatabasePool(config);

interface SummaryRow extends RowDataPacket {
  subjectCode: keyof typeof expected;
  batches: number;
  questions: number;
  approved: number;
  knownRiskApprovals: number;
}

interface DuplicateRow extends RowDataPacket {
  duplicateStableIds: number;
}

interface StagingRow extends RowDataPacket {
  stagingBatches: number;
}

try {
  const liveStore = new MySqlAuthStore(pool);
  const store = new Proxy(liveStore, {
    get(target, property, receiver) {
      if (property === "findUserBySession") {
        return async () => ({
          id: "promotion-verification",
          email: "promotion-verification@example.invalid",
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

  const [summaryRows] = await pool.query<SummaryRow[]>(
    `SELECT b.subject_code AS subjectCode,
            COUNT(DISTINCT b.id) AS batches,
            COUNT(q.stable_id) AS questions,
            SUM(q.review_status = 'approved') AS approved,
            SUM(q.finalization_status = 'approved_with_known_risks') AS knownRiskApprovals
     FROM kaoyan_content_batches b
     JOIN kaoyan_questions q ON q.batch_id = b.id
     WHERE b.status = 'published'
     GROUP BY b.subject_code
     ORDER BY b.subject_code`,
  );
  const [duplicateRows] = await pool.query<DuplicateRow[]>(
    `SELECT COUNT(*) AS duplicateStableIds
     FROM (
       SELECT q.stable_id
       FROM kaoyan_questions q
       JOIN kaoyan_content_batches b ON b.id = q.batch_id
       WHERE b.status = 'published'
       GROUP BY q.stable_id
       HAVING COUNT(*) > 1
     ) duplicates`,
  );
  const [stagingRows] = await pool.query<StagingRow[]>(
    `SELECT COUNT(*) AS stagingBatches
     FROM kaoyan_content_batches
     WHERE status = 'staging'
       AND subject_code IN ('math1', 'math2', 'math3')`,
  );

  const summaryBySubject = new Map(
    summaryRows.map((row) => [row.subjectCode, row]),
  );
  for (const [subjectCode, subjectExpected] of Object.entries(expected)) {
    const row = summaryBySubject.get(subjectCode as keyof typeof expected);
    if (
      !row ||
      Number(row.batches) !== subjectExpected.batches ||
      Number(row.questions) !== subjectExpected.questions ||
      Number(row.approved) !== subjectExpected.questions ||
      Number(row.knownRiskApprovals) !== subjectExpected.questions
    ) {
      throw new Error(`${subjectCode} published database summary mismatch`);
    }
  }
  if (Number(duplicateRows[0]?.duplicateStableIds ?? -1) !== 0) {
    throw new Error("published content has duplicate stable IDs");
  }
  if (Number(stagingRows[0]?.stagingBatches ?? -1) !== 0) {
    throw new Error("authorized subjects still have staging batches");
  }

  const apiChecks = [];
  for (const [subjectCode, subjectExpected] of Object.entries(expected)) {
    let anonymousStatus = 401;
    if (subjectCode === "math1") {
      const publicList = await request(app)
        .get("/api/content/math1/questions?page=1&pageSize=1")
        .expect(200)
        .expect("Cache-Control", "private, no-store");
      if (
        publicList.body.data.totalItems !== publicMath1Questions ||
        Number(publicList.body.data.items[0]?.sourceYear ?? 0) < 2018
      ) {
        throw new Error("anonymous Math1 API did not enforce the 2018-2025 window");
      }
      const publicStableId = String(
        publicList.body.data.items[0]?.stableId ?? "",
      );
      await request(app)
        .get(`/api/content/math1/questions/${publicStableId}`)
        .expect(200)
        .expect("Cache-Control", "private, no-store");
      await request(app)
        .get("/api/content/math1/questions?page=1&pageSize=1&year=2017")
        .expect(401, { error: "authentication_required" });
      const protectedList = await request(app)
        .get("/api/content/math1/questions?page=1&pageSize=1&year=2017")
        .set("Cookie", "kaoyan_session=promotion-verification")
        .expect(200);
      const protectedStableId = String(
        protectedList.body.data.items[0]?.stableId ?? "",
      );
      if (!protectedStableId) {
        throw new Error("authenticated Math1 2017 API returned no question");
      }
      await request(app)
        .get(`/api/content/math1/questions/${protectedStableId}`)
        .expect(401, { error: "authentication_required" });
      anonymousStatus = 200;
    } else {
      await request(app)
        .get(`/api/content/${subjectCode}/questions?page=1&pageSize=1`)
        .expect(401, { error: "authentication_required" });
    }
    const list = await request(app)
      .get(`/api/content/${subjectCode}/questions?page=1&pageSize=1`)
      .set("Cookie", "kaoyan_session=promotion-verification")
      .expect(200)
      .expect("Cache-Control", "private, no-store");
    if (list.body.data.totalItems !== subjectExpected.questions) {
      throw new Error(
        `${subjectCode} API count mismatch: expected ${subjectExpected.questions}, got ${list.body.data.totalItems}`,
      );
    }
    const stableId = String(list.body.data.items[0]?.stableId ?? "");
    if (!stableId) {
      throw new Error(`${subjectCode} API returned no promoted question`);
    }
    await request(app)
      .get(`/api/content/${subjectCode}/questions/${stableId}`)
      .set("Cookie", "kaoyan_session=promotion-verification")
      .expect(200)
      .expect("Cache-Control", "private, no-store");
    apiChecks.push({
      subjectCode,
      anonymousStatus,
      anonymousQuestions:
        subjectCode === "math1" ? publicMath1Questions : 0,
      authenticatedStatus: 200,
      questions: list.body.data.totalItems,
      detailStableId: stableId,
    });
  }

  console.log(
    JSON.stringify(
      {
        expected,
        database: summaryRows,
        duplicates: duplicateRows,
        staging: stagingRows,
        apiChecks,
      },
      null,
      2,
    ),
  );
} finally {
  await pool.end();
}
