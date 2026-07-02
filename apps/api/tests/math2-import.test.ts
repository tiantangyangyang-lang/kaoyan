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

test("staged Math2 years validate and dry-run rolls back inserts", async () => {
  const testDirectory = dirname(fileURLToPath(import.meta.url));
  const cases = [
    { year: 2020, expected: 23 },
    { year: 2023, expected: 22 },
    { year: 2024, expected: 22 },
  ];

  for (const item of cases) {
    const payloadPath = resolve(
      testDirectory,
      `../../../content/staging/math2/${item.year}/questions.json`,
    );
    const rawPayload = JSON.parse(await readFile(payloadPath, "utf8")) as unknown;
    const validated = validateMath2ImportPayload(rawPayload);
    assert.equal(validated.sourceYear, item.year);
    assert.equal(validated.questions.length, item.expected);

    const connection = new FakeConnection();
    const result = await importMath2Batch(fakePool(connection), rawPayload, {
      dryRun: true,
    });
    assert.equal(result.questionsInserted, item.expected);
    assert.equal(result.transaction, "rolled_back");
    assert.deepEqual(connection.events, ["begin", "rollback", "release"]);
  }
});
