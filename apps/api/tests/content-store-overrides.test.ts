import assert from "node:assert/strict";
import { test } from "node:test";
import type { Pool } from "mysql2/promise";
import { MySqlAuthStore } from "../src/db.js";

const baseQuestionRow = {
  stable_id: "math1-2025-q04",
  subject_code: "math1",
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

test("admin read returns base, effective content, metadata, and immutable history", async () => {
  const updatedAt = new Date("2026-08-10T01:00:00.000Z");
  const createdAt = new Date("2026-08-10T00:00:00.000Z");
  const pool = new FakeContentPool([
    [
      {
        ...baseQuestionRow,
        override_patch_json: { explanation: "Corrected explanation" },
        override_subject_code: "math1",
        override_revision: 3,
        override_is_active: 1,
        override_editor: "admin@example.com",
        override_reason: "Corrected from source",
        override_updated_at: updatedAt,
      },
    ],
    [
      {
        revision: 3,
        action: "upsert",
        target_revision: null,
        before_patch_json: null,
        after_patch_json: { explanation: "Corrected explanation" },
        editor: "admin@example.com",
        reason: "Corrected from source",
        created_at: createdAt,
      },
    ],
  ]);

  const snapshot = await makeStore(pool).getAdminQuestion("math1-2025-q04");
  assert.equal(snapshot?.base.explanation, "Base explanation");
  assert.equal(snapshot?.effective.explanation, "Corrected explanation");
  assert.equal(snapshot?.override?.revision, 3);
  assert.equal(snapshot?.override?.updatedAt, updatedAt.toISOString());
  assert.equal(snapshot?.revisions[0]?.createdAt, createdAt.toISOString());
  assert.equal(snapshot?.historyHasMore, false);
  assert.deepEqual(snapshot?.revisions[0]?.afterPatch, {
    explanation: "Corrected explanation",
  });
  assert.match(pool.queries[0]?.sql ?? "", /b\.status = 'published'/);
  assert.match(pool.queries[1]?.sql ?? "", /ORDER BY revision DESC/);
  assert.match(pool.queries[1]?.sql ?? "", /LIMIT 51/);
});

for (const [field, value] of [
  ["options_json", { unexpected: true }],
  ["knowledge_points", { unexpected: true }],
] as const) {
  test(`admin read fails closed when ${field} has an invalid JSON shape`, async () => {
    const pool = new FakeContentPool([
      [
        {
          ...baseQuestionRow,
          [field]: value,
          override_patch_json: null,
          override_subject_code: null,
          override_revision: null,
          override_is_active: null,
          override_editor: null,
          override_reason: null,
          override_updated_at: null,
        },
      ],
    ]);

    await assert.rejects(
      makeStore(pool).getAdminQuestion("math1-2025-q04"),
      new RegExp(`stored question ${field} failed integrity validation`),
    );
  });
}

for (const [name, questionType, options] of [
  [
    "wrong label",
    "multiple_choice",
    [
      { label: "A", value: "A" },
      { label: "B", value: "B" },
      { label: "C", value: "C" },
      { label: "X", value: "D" },
    ],
  ],
  [
    "missing option",
    "multiple_choice",
    [
      { label: "A", value: "A" },
      { label: "B", value: "B" },
      { label: "C", value: "C" },
    ],
  ],
  [
    "duplicate label",
    "multiple_choice",
    [
      { label: "A", value: "A" },
      { label: "A", value: "B" },
      { label: "C", value: "C" },
      { label: "D", value: "D" },
    ],
  ],
  [
    "empty value",
    "multiple_choice",
    [
      { label: "A", value: "A" },
      { label: "B", value: "" },
      { label: "C", value: "C" },
      { label: "D", value: "D" },
    ],
  ],
  [
    "options on non-multiple-choice question",
    "solution",
    [{ label: "A", value: "A" }],
  ],
] as const) {
  test(`admin read rejects ${name}`, async () => {
    const pool = new FakeContentPool([
      [
        {
          ...baseQuestionRow,
          question_type: questionType,
          options_json: options,
          override_patch_json: null,
          override_subject_code: null,
          override_revision: null,
          override_is_active: null,
          override_editor: null,
          override_reason: null,
          override_updated_at: null,
        },
      ],
    ]);

    await assert.rejects(
      makeStore(pool).getAdminQuestion("math1-2025-q04"),
      /stored question options_json failed integrity validation/,
    );
  });
}

test("admin read caps history at 50 rows and reports more revisions", async () => {
  const revisionRows = Array.from({ length: 51 }, (_, index) => ({
    revision: 52 - index,
    action: "upsert",
    target_revision: null,
    before_patch_json: null,
    after_patch_json: { explanation: `Revision ${52 - index}` },
    editor: "admin@example.com",
    reason: `Revision ${52 - index}`,
    created_at: new Date("2026-08-10T00:00:00.000Z"),
  }));
  const pool = new FakeContentPool([
    [
      {
        ...baseQuestionRow,
        override_patch_json: { explanation: "Revision 52" },
        override_subject_code: "math1",
        override_revision: 52,
        override_is_active: 1,
        override_editor: "admin@example.com",
        override_reason: "Revision 52",
        override_updated_at: new Date("2026-08-10T01:00:00.000Z"),
      },
    ],
    revisionRows,
  ]);

  const snapshot = await makeStore(pool).getAdminQuestion("math1-2025-q04");
  assert.equal(snapshot?.revisions.length, 50);
  assert.equal(snapshot?.historyHasMore, true);
  assert.equal(snapshot?.revisions[0]?.revision, 52);
  assert.equal(snapshot?.revisions[49]?.revision, 3);
});

test("admin read fails closed when override audit metadata is incomplete", async () => {
  const pool = new FakeContentPool([
    [
      {
        ...baseQuestionRow,
        override_patch_json: { explanation: "Corrected explanation" },
        override_subject_code: "math1",
        override_revision: 3,
        override_is_active: 1,
        override_editor: null,
        override_reason: "Corrected from source",
        override_updated_at: new Date(),
      },
    ],
  ]);

  await assert.rejects(
    makeStore(pool).getAdminQuestion("math1-2025-q04"),
    /stored content override metadata failed integrity validation/,
  );
});
