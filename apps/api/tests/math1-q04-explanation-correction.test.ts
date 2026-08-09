import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import type { Pool } from "mysql2/promise";
import {
  EXPECTED_NEW_EXPLANATION,
  replacePublishedMath1Q04Explanation,
  type Math1Q04ExplanationCorrectionInput,
} from "../src/math1-q04-explanation-correction.js";

const repoRoot = resolve(
  fileURLToPath(new URL("../../../", import.meta.url)),
);
const stagedBank = JSON.parse(
  readFileSync(
    resolve(repoRoot, "content/staging/math1/2025/questions.json"),
    "utf8",
  ),
) as {
  questions: Array<{ stableId: string; explanationCandidate: string }>;
};
const oldExplanation = stagedBank.questions.find(
  (question) => question.stableId === "math1-2025-q04",
)?.explanationCandidate;
if (!oldExplanation) throw new Error("audited old Q04 explanation fixture is missing");

const options = [
  { label: "A", value: "option-a" },
  { label: "B", value: "option-b" },
  { label: "C", value: "option-c" },
  { label: "D", value: "option-d" },
];
const input: Math1Q04ExplanationCorrectionInput = {
  sourceCommit: "a".repeat(40),
  sourceFiles: [
    {
      relativePath: "content/final/math1/question-bank.json",
      gitState: "tracked",
      sha256: "b".repeat(64),
    },
    {
      relativePath: "docs/requirements/REQ-023-math1-2025-q04-explanation.md",
      gitState: "tracked",
      sha256: "c".repeat(64),
    },
  ],
  contentHash: "d".repeat(64),
  stem: "question stem",
  options,
  answer: "A",
  answerStatus: "candidate_from_solutions",
  explanation: EXPECTED_NEW_EXPLANATION,
  explanationStatus: "candidate_from_solutions",
  knowledgePoints: [],
  anomalies: [],
};

class FakeCorrectionConnection {
  events: string[] = [];
  explanation = oldExplanation;

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
      return [[{ id: "math1-final-2025-v2", status: "published" }]];
    }
    if (sql.includes("stable_id = ?")) {
      return [[{
        stem: input.stem,
        options_json: input.options,
        answer_text: input.answer,
        answer_status: input.answerStatus,
        explanation_text: this.explanation,
        explanation_status: input.explanationStatus,
        knowledge_points: input.knowledgePoints,
        anomalies: input.anomalies,
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
      this.events.push("insert-v3");
    } else if (sql.includes("INSERT INTO kaoyan_questions")) {
      this.events.push("copy-questions");
    } else if (sql.includes("UPDATE kaoyan_questions")) {
      this.events.push("correct-explanation");
    } else if (sql.includes("status = 'superseded'")) {
      this.events.push("supersede-v2");
    } else if (sql.includes("status = 'published'")) {
      this.events.push("publish-v3");
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

test("Q04 explanation correction versions v2 to v3 and rolls back by default", async () => {
  const connection = new FakeCorrectionConnection();
  const result = await replacePublishedMath1Q04Explanation(
    fakePool(connection),
    input,
    { dryRun: true },
  );
  assert.equal(result.questions, 22);
  assert.equal(result.publishedMath1Questions, 852);
  assert.equal(result.transaction, "rolled_back");
  assert.deepEqual(connection.events, [
    "begin",
    "insert-v3",
    "copy-questions",
    "correct-explanation",
    "supersede-v2",
    "publish-v3",
    "rollback",
    "release",
  ]);
});

test("Q04 explanation correction rejects a changed source explanation", async () => {
  const connection = new FakeCorrectionConnection();
  connection.explanation = "unexpected explanation";
  await assert.rejects(
    replacePublishedMath1Q04Explanation(fakePool(connection), input, {
      dryRun: false,
    }),
    /old explanation precondition failed/,
  );
  assert.deepEqual(connection.events, ["begin", "rollback", "release"]);
});

test("Q04 explanation correction rejects OCR artifacts in canonical input", async () => {
  await assert.rejects(
    replacePublishedMath1Q04Explanation(
      fakePool(new FakeCorrectionConnection()),
      { ...input, explanation: `${EXPECTED_NEW_EXPLANATION}\n![](images/x.jpg)` },
      { dryRun: true },
    ),
    /does not match REQ-023/,
  );
});
