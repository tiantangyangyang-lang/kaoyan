import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { Pool } from "mysql2/promise";
import {
  importMath2Batch,
  validateMath2ImportPayload,
} from "../src/math2-import.js";

const question = {
  stableId: "math2-2020-q01",
  sourceYear: 2020,
  subjectCode: "math2",
  type: "multiple_choice",
  questionNumber: 1,
  stem: "Stem",
  options: [
    { label: "A", value: "A" },
    { label: "B", value: "B" },
    { label: "C", value: "C" },
    { label: "D", value: "D" },
  ],
  answer: null,
  answerStatus: "missing",
  explanation: null,
  explanationStatus: "missing",
  reviewStatus: "needs_human_review",
  finalizationStatus: "blocked",
  knowledgePoints: [],
  anomalies: [],
  sourceEvidence: [{
    relativePath: "papers/test.md",
    role: "primary",
    gitState: "tracked",
    sha256: "a".repeat(64),
    lineStart: 1,
    lineEnd: 2,
  }],
};

const payload = {
  schemaVersion: "math2-question-staging-v2",
  batchId: "REQ-002-test",
  subjectCode: "math2",
  sourceYear: 2020,
  sourceRepository: {
    name: "Kaoyan-Math2-Papers",
    commit: "a".repeat(40),
    branch: "main",
    dirty: true,
  },
  sourceFiles: [{
    relativePath: "papers/test.md",
    gitState: "tracked",
    sha256: "a".repeat(64),
  }],
  questions: [question],
  validation: {
    questionCounts: {
      multiple_choice: 1,
      fill_in_blank: 0,
      solution: 0,
    },
    expectedCounts: {
      multiple_choice: 1,
      fill_in_blank: 0,
      solution: 0,
    },
    countsMatch: true,
    stableIdsUnique: true,
    schemaValid: true,
  },
};

class FakeConnection {
  events: string[] = [];
  insertedQuestions = 0;
  failQuestionInsert = false;

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
    if (sql.startsWith("SELECT status")) return [[]];
    if (sql.startsWith("SELECT COUNT")) {
      return [[{ total: this.insertedQuestions }]];
    }
    return [[]];
  }
  async execute(sql: string) {
    if (sql.includes("INSERT INTO kaoyan_questions")) {
      if (this.failQuestionInsert) throw new Error("insert failed");
      this.insertedQuestions += 1;
    }
    return [{ affectedRows: 1 }];
  }
}

const fakePool = (connection: FakeConnection) =>
  ({
    async getConnection() {
      return connection;
    },
  }) as unknown as Pick<Pool, "getConnection">;

test("dry-run performs inserts and always rolls back", async () => {
  const connection = new FakeConnection();
  const result = await importMath2Batch(fakePool(connection), payload, {
    dryRun: true,
  });
  assert.equal(result.questionsInserted, 1);
  assert.equal(result.transaction, "rolled_back");
  assert.deepEqual(connection.events, ["begin", "rollback", "release"]);
});

test("partial insert failure rolls back the entire batch", async () => {
  const connection = new FakeConnection();
  connection.failQuestionInsert = true;
  await assert.rejects(
    importMath2Batch(fakePool(connection), payload, { dryRun: false }),
    /insert failed/,
  );
  assert.deepEqual(connection.events, ["begin", "rollback", "release"]);
});

test("canonical option shape rejects option.text", () => {
  const invalid = structuredClone(payload);
  invalid.questions[0].options[0] = {
    label: "A",
    text: "wrong",
  } as never;
  assert.throws(() => validateMath2ImportPayload(invalid));
});

test("gold pilot validates and dry-run rolls back all 23 inserts", async () => {
  const testDirectory = dirname(fileURLToPath(import.meta.url));
  const pilotPath = resolve(
    testDirectory,
    "../../../content/staging/math2/2020/questions.json",
  );
  const pilot = JSON.parse(await readFile(pilotPath, "utf8")) as unknown;
  const validated = validateMath2ImportPayload(pilot);
  assert.equal(validated.questions.length, 23);

  const connection = new FakeConnection();
  const result = await importMath2Batch(fakePool(connection), pilot, {
    dryRun: true,
  });
  assert.equal(result.questionsInserted, 23);
  assert.equal(result.transaction, "rolled_back");
  assert.deepEqual(connection.events, ["begin", "rollback", "release"]);
});
