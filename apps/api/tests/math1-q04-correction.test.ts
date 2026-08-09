import assert from "node:assert/strict";
import { test } from "node:test";
import type { Pool } from "mysql2/promise";
import {
  EXPECTED_NEW_OPTION_C,
  EXPECTED_NEW_OPTION_D,
  EXPECTED_NEW_STEM,
  EXPECTED_OLD_OPTION_C,
  EXPECTED_OLD_OPTION_D,
  replacePublishedMath1Q04,
  type Math1Q04CorrectionInput,
} from "../src/math1-q04-correction.js";

const newOptions = [
  { label: "A", value: "option-a" },
  { label: "B", value: "option-b" },
  { label: "C", value: EXPECTED_NEW_OPTION_C },
  { label: "D", value: EXPECTED_NEW_OPTION_D },
];

const input: Math1Q04CorrectionInput = {
  sourceCommit: "a".repeat(40),
  sourceFiles: [
    {
      relativePath: "content/final/math1/question-bank.json",
      gitState: "tracked",
      sha256: "b".repeat(64),
    },
    {
      relativePath:
        "content/reports/req-022-math1-2025-q04-correction/source-evidence.json",
      gitState: "tracked",
      sha256: "c".repeat(64),
    },
  ],
  contentHash: "d".repeat(64),
  stem: EXPECTED_NEW_STEM,
  options: newOptions,
  anomalies: [],
};

class FakeCorrectionConnection {
  events: string[] = [];
  oldOptionD = EXPECTED_OLD_OPTION_D;
  oldStem = `${EXPECTED_NEW_STEM}\n\nA/B duplicated\nC．damaged\nD．damaged\n\n【答案】A`;

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
    if (sql.includes("WHERE id IN")) {
      return [[{ id: "math1-final-2025-v1", status: "published" }]];
    }
    if (sql.includes("stable_id = ?")) {
      return [[{
        stem: this.oldStem,
        options_json: [
          { label: "A", value: "option-a" },
          { label: "B", value: "option-b" },
          { label: "C", value: EXPECTED_OLD_OPTION_C },
          { label: "D", value: this.oldOptionD },
        ],
        anomalies: [{ type: "partial_options_ocr_damaged" }],
        review_status: "approved",
        finalization_status: "approved_with_known_risks",
      }]];
    }
    if (sql.includes("COUNT(DISTINCT stable_id)")) {
      return [[{ total: 22, unique_ids: 22 }]];
    }
    if (sql.includes("JOIN kaoyan_content_batches")) {
      return [[{ total: 852 }]];
    }
    throw new Error(`Unexpected query: ${sql}`);
  }
  async execute(sql: string) {
    if (sql.includes("INSERT INTO kaoyan_content_batches")) {
      this.events.push("insert-batch");
    } else if (sql.includes("INSERT INTO kaoyan_questions")) {
      this.events.push("copy-questions");
    } else if (sql.includes("UPDATE kaoyan_questions")) {
      this.events.push("correct-q04");
    } else if (sql.includes("status = 'superseded'")) {
      this.events.push("supersede-v1");
    } else if (sql.includes("status = 'published'")) {
      this.events.push("publish-v2");
    }
    return [{
      affectedRows: sql.includes("INSERT INTO kaoyan_questions") ? 22 : 1,
    }];
  }
}

const fakePool = (connection: FakeCorrectionConnection) =>
  ({
    async getConnection() {
      return connection;
    },
  }) as unknown as Pick<Pool, "getConnection">;

test("Q04 correction versions the published batch and rolls back by default", async () => {
  const connection = new FakeCorrectionConnection();
  const result = await replacePublishedMath1Q04(
    fakePool(connection),
    input,
    { dryRun: true },
  );
  assert.equal(result.questions, 22);
  assert.equal(result.publishedMath1Questions, 852);
  assert.equal(result.transaction, "rolled_back");
  assert.deepEqual(connection.events, [
    "begin",
    "insert-batch",
    "copy-questions",
    "correct-q04",
    "supersede-v1",
    "publish-v2",
    "rollback",
    "release",
  ]);
});

test("Q04 correction rejects a database value that no longer matches the audited old option", async () => {
  const connection = new FakeCorrectionConnection();
  connection.oldOptionD = "unexpected-value";
  await assert.rejects(
    replacePublishedMath1Q04(fakePool(connection), input, { dryRun: false }),
    /old C\/D precondition failed/,
  );
  assert.deepEqual(connection.events, ["begin", "rollback", "release"]);
});

test("Q04 correction rejects a source stem without the audited duplicate block", async () => {
  const connection = new FakeCorrectionConnection();
  connection.oldStem = EXPECTED_NEW_STEM;
  await assert.rejects(
    replacePublishedMath1Q04(fakePool(connection), input, { dryRun: false }),
    /old stem structure precondition failed/,
  );
  assert.deepEqual(connection.events, ["begin", "rollback", "release"]);
});
