import assert from "node:assert/strict";
import { test } from "node:test";
import type { Pool } from "mysql2/promise";
import { AUTHORIZED_PROMOTION_COUNTS } from "../src/content-approve.js";
import { unpublishAuthorizedContent } from "../src/content-unpublish.js";

class FakeUnpublishConnection {
  events: string[] = [];
  batchRows = Object.entries(AUTHORIZED_PROMOTION_COUNTS).flatMap(
    ([subjectCode, expected]) =>
      Array.from({ length: expected.batches }, (_, index) => ({
        id: `${subjectCode}-batch-${index + 1}`,
        subject_code: subjectCode,
        source_year: 1987 + index,
        status: "published",
      })),
  );

  async beginTransaction() {
    this.events.push("begin");
  }
  async commit() {
    this.events.push("commit");
  }
  async rollback() {
    this.events.push("rollback");
  }
  release() {
    this.events.push("release");
  }
  async query(sql: string) {
    if (sql.includes("duplicate_stable_ids")) {
      return [[{ duplicate_stable_ids: 0 }]];
    }
    if (sql.includes("GROUP BY b.subject_code")) {
      return [Object.entries(AUTHORIZED_PROMOTION_COUNTS).map(
        ([subjectCode, expected]) => ({
          subject_code: subjectCode,
          batches: expected.batches,
          questions: expected.questions,
          approved: expected.questions,
          known_risk_approvals: expected.questions,
        }),
      )];
    }
    if (sql.includes("FROM kaoyan_content_batches")) {
      return [this.batchRows];
    }
    throw new Error("unexpected query");
  }
  async execute(_sql: string, parameters?: unknown[]) {
    this.events.push(`unpublish:${String(parameters?.[0])}`);
    return [{ affectedRows: 1 }];
  }
}

const fakePool = (connection: FakeUnpublishConnection) =>
  ({
    async getConnection() {
      return connection;
    },
  }) as unknown as Pick<Pool, "getConnection">;

test("authorized unpublish dry-run validates exact scope and rolls back", async () => {
  const connection = new FakeUnpublishConnection();
  const result = await unpublishAuthorizedContent(fakePool(connection), {
    dryRun: true,
  });
  assert.equal(result.batches, 74);
  assert.equal(result.questions, 1552);
  assert.equal(result.transaction, "rolled_back");
  assert.equal(
    connection.events.filter((event) => event.startsWith("unpublish:")).length,
    74,
  );
  assert.deepEqual(connection.events.slice(-2), ["rollback", "release"]);
});

test("authorized unpublish rejects a non-published batch before updates", async () => {
  const connection = new FakeUnpublishConnection();
  connection.batchRows[0].status = "staging";
  await assert.rejects(
    unpublishAuthorizedContent(fakePool(connection), { dryRun: false }),
    /must all be published/,
  );
  assert.deepEqual(connection.events, ["begin", "rollback", "release"]);
});
