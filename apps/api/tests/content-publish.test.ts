import assert from "node:assert/strict";
import { test } from "node:test";
import type { Pool } from "mysql2/promise";
import { publishContentBatch } from "../src/content-publish.js";

class FakePublishConnection {
  events: string[] = [];
  batchStatus = "staging";
  reviewBlocked = 0;
  finalizationBlocked = 0;

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
    if (sql.includes("FROM kaoyan_content_batches")) {
      return [[{
        id: "batch-1",
        subject_code: "math1",
        source_year: 2020,
        status: this.batchStatus,
      }]];
    }
    return [[{
      total: 23,
      review_blocked: this.reviewBlocked,
      finalization_blocked: this.finalizationBlocked,
    }]];
  }
  async execute(sql: string) {
    this.events.push(sql.includes("superseded") ? "supersede" : "publish");
    return [{ affectedRows: 1 }];
  }
}

const fakePool = (connection: FakePublishConnection) =>
  ({
    async getConnection() {
      return connection;
    },
  }) as unknown as Pick<Pool, "getConnection">;

test("publish dry-run validates and rolls back", async () => {
  const connection = new FakePublishConnection();
  const result = await publishContentBatch(fakePool(connection), "batch-1", {
    dryRun: true,
  });
  assert.equal(result.questions, 23);
  assert.equal(result.transaction, "rolled_back");
  assert.deepEqual(connection.events, [
    "begin",
    "supersede",
    "publish",
    "rollback",
    "release",
  ]);
});

test("publish rejects unapproved or blocked questions", async () => {
  const connection = new FakePublishConnection();
  connection.reviewBlocked = 2;
  connection.finalizationBlocked = 1;
  await assert.rejects(
    publishContentBatch(fakePool(connection), "batch-1", { dryRun: false }),
    /not publishable: 2 questions are not approved, 1 are blocked/,
  );
  assert.deepEqual(connection.events, ["begin", "rollback", "release"]);
});

test("publish rejects non-staging batches", async () => {
  const connection = new FakePublishConnection();
  connection.batchStatus = "published";
  await assert.rejects(
    publishContentBatch(fakePool(connection), "batch-1", { dryRun: false }),
    /must be staging/,
  );
  assert.deepEqual(connection.events, ["begin", "rollback", "release"]);
});
