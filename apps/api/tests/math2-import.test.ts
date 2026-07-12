import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { Pool } from "mysql2/promise";
import {
  importQuestionBatch,
  importMath2Batch,
  validateQuestionImportPayload,
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

test("Math2 and Math3 staging payloads must keep source evidence arrays", () => {
  const invalid = structuredClone(payload) as typeof payload & {
    questions: Array<Record<string, unknown>>;
  };
  delete invalid.questions[0].sourceEvidence;
  invalid.questions[0].sourceTraceability = {
    sourceRepo: "kaoyan",
    sourceRelativePaths: ["content/final/math1/question-bank.json"],
    sourceCommit: "a".repeat(40),
    sourcePageRefs: [],
    sourceFileHashes: {
      "content/final/math1/question-bank.json": "b".repeat(64),
    },
    transformVersion: "test",
    originalQuestionNumber: 1,
  };

  assert.throws(
    () => validateQuestionImportPayload(invalid),
    /sourceEvidence/,
  );
});

test("generic importer accepts blocked Math3 staging payloads", async () => {
  const math3Payload = structuredClone(payload);
  math3Payload.batchId = "REQ-016-test";
  math3Payload.subjectCode = "math3";
  math3Payload.sourceYear = 1987;
  math3Payload.questions[0].stableId = "math3-1987-q01";
  math3Payload.questions[0].sourceYear = 1987;
  math3Payload.questions[0].subjectCode = "math3";

  const validated = validateQuestionImportPayload(math3Payload);
  assert.equal(validated.subjectCode, "math3");
  assert.throws(() => validateMath2ImportPayload(math3Payload), /math2/);

  const connection = new FakeConnection();
  const result = await importQuestionBatch(fakePool(connection), math3Payload, {
    dryRun: true,
  });
  assert.equal(result.batchId, "REQ-016-test");
  assert.equal(result.questionsInserted, 1);
  assert.equal(result.transaction, "rolled_back");
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

test("staged Math2 aggregate years validate and dry-run rolls back inserts", async () => {
  const testDirectory = dirname(fileURLToPath(import.meta.url));
  for (let year = 1997; year <= 2019; year += 1) {
    const payloadPath = resolve(
      testDirectory,
      `../../../content/staging/math2/${year}/questions.json`,
    );
    const rawPayload = JSON.parse(await readFile(payloadPath, "utf8")) as unknown;
    const validated = validateMath2ImportPayload(rawPayload);
    assert.equal(validated.sourceYear, year);
    assert.equal(validated.subjectCode, "math2");
    assert.ok(validated.questions.length > 0);

    const connection = new FakeConnection();
    const result = await importMath2Batch(fakePool(connection), rawPayload, {
      dryRun: true,
    });
    assert.equal(result.questionsInserted, validated.questions.length);
    assert.equal(result.transaction, "rolled_back");
  }
});
test("staged Math3 aggregate years validate and dry-run rolls back inserts", async () => {
  const testDirectory = dirname(fileURLToPath(import.meta.url));
  const cases = [
    { year: 1987, expected: 18 },
    { year: 1988, expected: 18 },
    { year: 1989, expected: 17 },
    { year: 1990, expected: 20 },
    { year: 1991, expected: 20 },
    { year: 1992, expected: 16 },
    { year: 1993, expected: 16 },
    { year: 1994, expected: 20 },
    { year: 1995, expected: 21 },
    { year: 1996, expected: 12 },
  ];

  for (const item of cases) {
    const payloadPath = resolve(
      testDirectory,
      `../../../content/staging/math3/${item.year}/questions.json`,
    );
    const rawPayload = JSON.parse(await readFile(payloadPath, "utf8")) as unknown;
    const validated = validateQuestionImportPayload(rawPayload);
    assert.equal(validated.subjectCode, "math3");
    assert.equal(validated.sourceYear, item.year);
    assert.equal(validated.questions.length, item.expected);

    const connection = new FakeConnection();
    const result = await importQuestionBatch(fakePool(connection), rawPayload, {
      dryRun: true,
    });
    assert.equal(result.questionsInserted, item.expected);
    assert.equal(result.transaction, "rolled_back");
  }
});
