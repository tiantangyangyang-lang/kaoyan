import assert from "node:assert/strict";
import { test } from "node:test";
import type { Pool } from "mysql2/promise";
import { MySqlAuthStore } from "../src/db.js";

const baseQuestionRow = {
  stable_id: "math1-2025-q04",
  source_year: 2025,
  question_type: "multiple_choice",
  question_number: 4,
  stem: "Base stem",
  options_json: [
    { label: "A", value: "Base A" },
    { label: "B", value: "Base B" },
    { label: "C", value: "Base C" },
    { label: "D", value: "Base D" },
  ],
  answer_text: "A",
  answer_status: "reviewed",
  explanation_text: "Base explanation",
  explanation_status: "reviewed",
  review_status: "approved",
  finalization_status: "published",
  knowledge_points: [],
  override_patch_json: null,
};

class FakeContentPool {
  queries: Array<{ sql: string; params: unknown[] | undefined }> = [];
  constructor(private readonly results: unknown[][]) {}

  async query(sql: string, params?: unknown[]) {
    this.queries.push({ sql, params });
    const rows = this.results.shift();
    if (!rows) throw new Error(`No fake rows configured for query: ${sql}`);
    return [rows];
  }
}

const makeStore = (pool: FakeContentPool) =>
  new MySqlAuthStore(pool as unknown as Pool);

test("list and detail reads merge validated active overrides", async () => {
  const listPool = new FakeContentPool([
    [{ total: 1 }],
    [
      {
        ...baseQuestionRow,
        override_patch_json: {
          stem: "Corrected stem",
          options: [
            { label: "A", value: "Corrected A" },
            { label: "B", value: "Corrected B" },
            { label: "C", value: "Corrected C" },
            { label: "D", value: "Corrected D" },
          ],
        },
      },
    ],
  ]);
  const page = await makeStore(listPool).listPublishedQuestions({
    subjectCode: "math1",
    page: 1,
    pageSize: 20,
  });
  assert.equal(page.items[0]?.stem, "Corrected stem");
  assert.equal(page.items[0]?.options[3]?.value, "Corrected D");
  assert.equal("answer" in (page.items[0] ?? {}), false);
  assert.match(listPool.queries[1]?.sql ?? "", /o\.is_active = TRUE/);

  const detailPool = new FakeContentPool([
    [
      {
        ...baseQuestionRow,
        override_patch_json: {
          answer: null,
          answerStatus: "missing",
          explanation: "Corrected explanation",
        },
      },
    ],
  ]);
  const detail = await makeStore(detailPool).getPublishedQuestion(
    "math1",
    "math1-2025-q04",
  );
  assert.equal(detail?.answer, null);
  assert.equal(detail?.answerStatus, "missing");
  assert.equal(detail?.explanation, "Corrected explanation");
});

test("invalid stored override JSON fails closed as an internal integrity error", async () => {
  const pool = new FakeContentPool([
    [
      {
        ...baseQuestionRow,
        override_patch_json: { sourceYear: 2024 },
      },
    ],
  ]);
  await assert.rejects(
    makeStore(pool).getPublishedQuestion("math1", "math1-2025-q04"),
    (error: unknown) =>
      error instanceof Error &&
      error.name !== "ZodError" &&
      error.message === "stored content override failed integrity validation",
  );
});

test("public override query constrains both override and base rows to public Math1", async () => {
  const pool = new FakeContentPool([
    [
      {
        stable_id: "math1-2025-q04",
        revision: 3,
        patch_json: { explanation: "Public correction" },
      },
    ],
  ]);
  const overrides = await makeStore(pool).listPublicMath1Overrides();
  assert.deepEqual(overrides, [
    {
      stableId: "math1-2025-q04",
      revision: 3,
      changes: { explanation: "Public correction" },
    },
  ]);
  const sql = pool.queries[0]?.sql ?? "";
  assert.match(sql, /o\.subject_code = 'math1'/);
  assert.match(sql, /q\.subject_code = 'math1'/);
  assert.match(sql, /o\.subject_code = q\.subject_code/);
  assert.match(sql, /q\.source_year BETWEEN 2018 AND 2025/);
  assert.doesNotMatch(sql, /math2|math3/);
});
