import assert from "node:assert/strict";
import { test } from "node:test";
import type { Pool } from "mysql2/promise";
import {
  applyContentOverride,
  executeContentOverride,
} from "../src/content-overrides.js";

const baseRow = {
  stable_id: "math1-2025-q04",
  subject_code: "math1",
  source_year: 2025,
  question_type: "multiple_choice",
  question_number: 4,
  stem: "Original stem",
  options_json: [
    { label: "A", value: "One" },
    { label: "B", value: "Two" },
  ],
  answer_text: "A",
  answer_status: "reviewed",
  explanation_text: "Original explanation",
  explanation_status: "reviewed",
};

const upsertCommand = {
  schemaVersion: "kaoyan-content-override-v1",
  action: "upsert",
  stableId: "math1-2025-q04",
  expectedRevision: 0,
  editor: "maintainer",
  reason: "Correct the verified explanation",
  changes: { explanation: "Corrected explanation" },
} as const;

class FakeOverrideConnection {
  events: string[] = [];
  executions: Array<{ sql: string; params: unknown[] }> = [];
  base = { ...baseRow };
  current: {
    revision: number;
    patch_json: object;
    base_snapshot_hash: string;
    is_active: boolean;
  } | null = null;
  targetPatch: object | null = null;
  targetBaseSnapshotHash: string | null = null;
  writeAffectedRows = 1;
  auditAffectedRows = 1;

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
    if (sql.includes("FROM kaoyan_questions q")) return [[this.base]];
    if (sql.includes("FROM kaoyan_question_override_revisions")) {
      return [[
        this.targetPatch === null
          ? undefined
          : {
              after_patch_json: this.targetPatch,
              base_snapshot_hash:
                this.targetBaseSnapshotHash ?? this.current?.base_snapshot_hash,
            },
      ].filter(Boolean)];
    }
    if (sql.includes("FROM kaoyan_question_overrides")) {
      return [this.current ? [this.current] : []];
    }
    throw new Error(`Unexpected query: ${sql}`);
  }
  async execute(sql: string, params: unknown[] = []) {
    this.executions.push({ sql, params });
    if (sql.includes("kaoyan_question_override_revisions")) {
      this.events.push("insert-audit");
      return [{ affectedRows: this.auditAffectedRows }];
    }
    if (sql.includes("kaoyan_question_overrides")) {
      this.events.push(this.current ? "update-override" : "insert-override");
      return [{ affectedRows: this.writeAffectedRows }];
    }
    throw new Error(`Unexpected execute: ${sql}`);
  }
}

const fakePool = (connection: FakeOverrideConnection) =>
  ({
    async getConnection() {
      return connection;
    },
  }) as unknown as Pick<Pool, "getConnection">;

test("applies only allowlisted content fields including explicit null", () => {
  const base = {
    stem: "Before",
    options: [{ label: "A", value: "One" }],
    answer: "A",
    answerStatus: "reviewed",
    explanation: "Before",
    explanationStatus: "reviewed",
    untouched: "keep",
  };
  const result = applyContentOverride(base, {
    stem: "After",
    answer: null,
    explanation: null,
  });
  assert.equal(result.stem, "After");
  assert.equal(result.answer, null);
  assert.equal(result.explanation, null);
  assert.equal(result.untouched, "keep");
});

test("dry-run writes both rows then rolls back", async () => {
  const connection = new FakeOverrideConnection();
  const result = await executeContentOverride(
    fakePool(connection),
    upsertCommand,
    { dryRun: true },
  );
  assert.equal(result.previousRevision, 0);
  assert.equal(result.revision, 1);
  assert.equal(result.transaction, "rolled_back");
  assert.deepEqual(connection.events, [
    "begin",
    "insert-override",
    "insert-audit",
    "rollback",
    "release",
  ]);
});

test("rejects stale expectedRevision and rolls back", async () => {
  const connection = new FakeOverrideConnection();
  connection.current = {
    revision: 2,
    patch_json: { stem: "Existing correction" },
    base_snapshot_hash: "different-hash-is-checked-after-lock",
    is_active: true,
  };
  await assert.rejects(
    executeContentOverride(fakePool(connection), upsertCommand, {
      dryRun: false,
    }),
    /expectedRevision 0 does not match current revision 2/,
  );
  assert.deepEqual(connection.events, ["begin", "rollback", "release"]);
});

test("revert to revision zero commits an inactive override revision", async () => {
  const seedConnection = new FakeOverrideConnection();
  const seeded = await executeContentOverride(
    fakePool(seedConnection),
    upsertCommand,
    { dryRun: true },
  );
  const connection = new FakeOverrideConnection();
  connection.current = {
    revision: 1,
    patch_json: upsertCommand.changes,
    base_snapshot_hash: seeded.baseSnapshotHash,
    is_active: true,
  };
  const result = await executeContentOverride(
    fakePool(connection),
    {
      schemaVersion: "kaoyan-content-override-v1",
      action: "revert",
      stableId: "math1-2025-q04",
      expectedRevision: 1,
      editor: "maintainer",
      reason: "Restore the published base",
      targetRevision: 0,
    },
    { dryRun: false },
  );
  assert.equal(result.revision, 2);
  assert.equal(result.afterPatchHash, null);
  assert.equal(result.transaction, "committed");
  assert.deepEqual(connection.events, [
    "begin",
    "update-override",
    "insert-audit",
    "commit",
    "release",
  ]);
});

test("revert to zero can disable an override after the published base changes", async () => {
  const connection = new FakeOverrideConnection();
  connection.current = {
    revision: 1,
    patch_json: upsertCommand.changes,
    base_snapshot_hash: "old-published-base-hash",
    is_active: true,
  };
  const result = await executeContentOverride(
    fakePool(connection),
    {
      schemaVersion: "kaoyan-content-override-v1",
      action: "revert",
      stableId: "math1-2025-q04",
      expectedRevision: 1,
      editor: "maintainer",
      reason: "Disable the stale override after promotion",
      targetRevision: 0,
    },
    { dryRun: true },
  );
  assert.equal(result.afterPatchHash, null);
  assert.equal(result.transaction, "rolled_back");
});

test("invalid fields are rejected before opening a connection", async () => {
  let opened = false;
  const pool = {
    async getConnection() {
      opened = true;
      return new FakeOverrideConnection();
    },
  } as unknown as Pick<Pool, "getConnection">;
  await assert.rejects(
    executeContentOverride(
      pool,
      { ...upsertCommand, changes: { sourceYear: 2024 } },
      { dryRun: true },
    ),
  );
  assert.equal(opened, false);
});

test("incomplete or unordered options are rejected before opening a connection", async () => {
  const invalidOptions = [
    [],
    [{ label: "A", value: "One" }],
    [
      { label: "A", value: "One" },
      { label: "B", value: "Two" },
    ],
    [
      { label: "A", value: "One" },
      { label: "B", value: "Two" },
      { label: "C", value: "Three" },
    ],
    [
      { label: "A", value: "One" },
      { label: "C", value: "Three" },
      { label: "B", value: "Two" },
      { label: "D", value: "Four" },
    ],
    [
      { label: "A", value: "One" },
      { label: "B", value: "Two" },
      { label: "B", value: "Duplicate" },
      { label: "D", value: "Four" },
    ],
  ];
  let opened = 0;
  const pool = {
    async getConnection() {
      opened += 1;
      return new FakeOverrideConnection();
    },
  } as unknown as Pick<Pool, "getConnection">;
  for (const options of invalidOptions) {
    await assert.rejects(
      executeContentOverride(
        pool,
        { ...upsertCommand, changes: { options } },
        { dryRun: true },
      ),
    );
  }
  assert.equal(opened, 0);
});

test("options cannot be added to a non-multiple-choice question", async () => {
  const connection = new FakeOverrideConnection();
  connection.base.question_type = "fill_in_blank";
  await assert.rejects(
    executeContentOverride(
      fakePool(connection),
      {
        ...upsertCommand,
        changes: {
          options: [
            { label: "A", value: "One" },
            { label: "B", value: "Two" },
            { label: "C", value: "Three" },
            { label: "D", value: "Four" },
          ],
        },
      },
      { dryRun: true },
    ),
    /options can only be overridden for multiple-choice questions/,
  );
  assert.deepEqual(connection.events, ["begin", "rollback", "release"]);
  assert.equal(connection.executions.length, 0);
});

test("active stale override blocks upsert", async () => {
  const connection = new FakeOverrideConnection();
  connection.current = {
    revision: 1,
    patch_json: { stem: "Existing correction" },
    base_snapshot_hash: "stale-base-hash",
    is_active: true,
  };
  await assert.rejects(
    executeContentOverride(
      fakePool(connection),
      { ...upsertCommand, expectedRevision: 1 },
      { dryRun: true },
    ),
    /published base content changed/,
  );
  assert.deepEqual(connection.events, ["begin", "rollback", "release"]);
});

test("existing active patch is merged and an inactive override can reactivate", async () => {
  const seed = await executeContentOverride(
    fakePool(new FakeOverrideConnection()),
    upsertCommand,
    { dryRun: true },
  );
  const active = new FakeOverrideConnection();
  active.current = {
    revision: 1,
    patch_json: { stem: "Existing correction" },
    base_snapshot_hash: seed.baseSnapshotHash,
    is_active: true,
  };
  await executeContentOverride(
    fakePool(active),
    {
      ...upsertCommand,
      expectedRevision: 1,
      changes: { explanation: "Merged explanation" },
    },
    { dryRun: true },
  );
  const activeUpdate = active.executions.find(({ sql }) =>
    sql.includes("UPDATE kaoyan_question_overrides"),
  );
  assert.deepEqual(JSON.parse(String(activeUpdate?.params[2])), {
    stem: "Existing correction",
    explanation: "Merged explanation",
  });

  const inactive = new FakeOverrideConnection();
  inactive.current = {
    revision: 2,
    patch_json: {},
    base_snapshot_hash: "old-base-hash",
    is_active: false,
  };
  const reactivated = await executeContentOverride(
    fakePool(inactive),
    { ...upsertCommand, expectedRevision: 2 },
    { dryRun: true },
  );
  assert.equal(reactivated.revision, 3);
  assert.ok(inactive.events.includes("update-override"));
});

test("historical revert succeeds and rejects missing or mismatched targets", async () => {
  const seed = await executeContentOverride(
    fakePool(new FakeOverrideConnection()),
    upsertCommand,
    { dryRun: true },
  );
  const makeCurrent = () => {
    const connection = new FakeOverrideConnection();
    connection.current = {
      revision: 2,
      patch_json: { stem: "Revision two" },
      base_snapshot_hash: seed.baseSnapshotHash,
      is_active: true,
    };
    return connection;
  };
  const command = {
    schemaVersion: "kaoyan-content-override-v1",
    action: "revert",
    stableId: "math1-2025-q04",
    expectedRevision: 2,
    editor: "maintainer",
    reason: "Restore revision one",
    targetRevision: 1,
  } as const;

  const success = makeCurrent();
  success.targetPatch = { stem: "Revision one" };
  const result = await executeContentOverride(fakePool(success), command, {
    dryRun: true,
  });
  assert.equal(result.revision, 3);
  assert.notEqual(result.afterPatchHash, null);

  const missing = makeCurrent();
  await assert.rejects(
    executeContentOverride(fakePool(missing), command, { dryRun: true }),
    /target revision 1 was not found/,
  );

  const mismatched = makeCurrent();
  mismatched.targetPatch = { stem: "Revision one" };
  mismatched.targetBaseSnapshotHash = "different-base-hash";
  await assert.rejects(
    executeContentOverride(fakePool(mismatched), command, { dryRun: true }),
    /target revision belongs to a different base snapshot/,
  );
});

test("override affectedRows mismatch rolls back before audit insertion", async () => {
  const connection = new FakeOverrideConnection();
  connection.writeAffectedRows = 0;
  await assert.rejects(
    executeContentOverride(fakePool(connection), upsertCommand, {
      dryRun: false,
    }),
    /override write affected 0 rows/,
  );
  assert.deepEqual(connection.events, [
    "begin",
    "insert-override",
    "rollback",
    "release",
  ]);
});

test("audit affectedRows mismatch rolls back the override write", async () => {
  const connection = new FakeOverrideConnection();
  connection.auditAffectedRows = 0;
  await assert.rejects(
    executeContentOverride(fakePool(connection), upsertCommand, {
      dryRun: false,
    }),
    /override audit insert affected 0 rows/,
  );
  assert.deepEqual(connection.events, [
    "begin",
    "insert-override",
    "insert-audit",
    "rollback",
    "release",
  ]);
});
