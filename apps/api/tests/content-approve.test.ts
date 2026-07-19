import assert from "node:assert/strict";
import { test } from "node:test";
import type { Pool } from "mysql2/promise";
import {
  approveAuthorizedStagingContent,
  AUTHORIZED_PROMOTION_COUNTS,
} from "../src/content-approve.js";

class FakeApprovalConnection {
  events: string[] = [];
  batchRows = Object.entries(AUTHORIZED_PROMOTION_COUNTS).flatMap(
    ([subjectCode, expected]) =>
      Array.from({ length: expected.batches }, (_, index) => ({
        id: `${subjectCode}-batch-${index + 1}`,
        subject_code: subjectCode,
        source_year: 1987 + index,
      })),
  );
  questionCounts = new Map(
    Object.entries(AUTHORIZED_PROMOTION_COUNTS).flatMap(
      ([subjectCode, expected]) => {
        const base = Math.floor(expected.questions / expected.batches);
        const remainder = expected.questions % expected.batches;
        return Array.from({ length: expected.batches }, (_, index) => [
          `${subjectCode}-batch-${index + 1}`,
          base + (index < remainder ? 1 : 0),
        ] as const);
      },
    ),
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
  async query(sql: string, parameters?: unknown[]) {
    if (sql.includes("FROM kaoyan_content_batches")) {
      return [this.batchRows];
    }
    if (sql.includes("duplicate_stable_ids")) {
      return [[{ duplicate_stable_ids: 0 }]];
    }
    const batchId = String(parameters?.[0]);
    const total = this.questionCounts.get(batchId) ?? 0;
    return [[{
      total,
      unique_ids: total,
      not_approved: total,
      blocked: total,
    }]];
  }
  async execute(_sql: string, parameters?: unknown[]) {
    const batchId = String(parameters?.[0]);
    this.events.push(`approve:${batchId}`);
    return [{ affectedRows: this.questionCounts.get(batchId) ?? 0 }];
  }
}

const fakePool = (connection: FakeApprovalConnection) =>
  ({
    async getConnection() {
      return connection;
    },
  }) as unknown as Pick<Pool, "getConnection">;

test("authorized approval dry-run validates exact scope and rolls back", async () => {
  const connection = new FakeApprovalConnection();
  const result = await approveAuthorizedStagingContent(fakePool(connection), {
    dryRun: true,
  });
  assert.equal(result.questions, 1552);
  assert.equal(result.batches.length, 74);
  assert.equal(result.transaction, "rolled_back");
  assert.equal(
    connection.events.filter((event) => event.startsWith("approve:")).length,
    74,
  );
  assert.deepEqual(connection.events.slice(-2), ["rollback", "release"]);
});

test("authorized approval rejects incomplete staging scope before updates", async () => {
  const connection = new FakeApprovalConnection();
  connection.batchRows.pop();
  await assert.rejects(
    approveAuthorizedStagingContent(fakePool(connection), { dryRun: false }),
    /authorized staging batch count mismatch/,
  );
  assert.deepEqual(connection.events, ["begin", "rollback", "release"]);
});
