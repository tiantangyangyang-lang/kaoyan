import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ANIMATION_SAMPLE_REPLACEMENT_IDS,
  ORIGINAL_ANIMATION_SAMPLE_PAYLOADS,
  replaceAnimationSamples,
} from "../src/animation-sample-replacement.js";

type Row = {
  question_id: string;
  subject_code: string;
  payload: string;
  is_active: number;
};

class FakeConnection {
  events: string[] = [];
  updates: Array<{ sql: string; params: unknown[] }> = [];

  constructor(
    public rows: Row[],
    private readonly affectedRowsByUpdate: number[] = [],
  ) {}

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

  async query(_sql: string, params: unknown[]) {
    assert.deepEqual(params, [...ANIMATION_SAMPLE_REPLACEMENT_IDS]);
    return [this.rows];
  }

  async execute(sql: string, params: unknown[]) {
    this.updates.push({ sql, params });
    return [{
      affectedRows:
        this.affectedRowsByUpdate[this.updates.length - 1] ?? 1,
    }];
  }
}

const originalRows = (): Row[] =>
  ANIMATION_SAMPLE_REPLACEMENT_IDS.map((questionId) => ({
    question_id: questionId,
    subject_code: "math1",
    payload: JSON.stringify(ORIGINAL_ANIMATION_SAMPLE_PAYLOADS[questionId]),
    is_active: 1,
  }));

const fakePool = (connection: FakeConnection) => ({
  async getConnection() {
    return connection;
  },
});

test("three reviewed animation samples are replaced transactionally in dry-run mode", async () => {
  const connection = new FakeConnection(originalRows());
  const result = await replaceAnimationSamples(
    fakePool(connection) as never,
    { dryRun: true },
  );

  assert.deepEqual(result.questionIds, [...ANIMATION_SAMPLE_REPLACEMENT_IDS]);
  assert.equal(result.transaction, "rolled_back");
  assert.deepEqual(connection.events, ["begin", "rollback", "release"]);
  assert.equal(connection.updates.length, 3);
  assert.deepEqual(
    connection.updates.map(({ params }) => params[1]),
    [...ANIMATION_SAMPLE_REPLACEMENT_IDS],
  );
  for (const questionId of ANIMATION_SAMPLE_REPLACEMENT_IDS) {
    assert.notEqual(result.beforeHashes[questionId], result.afterHashes[questionId]);
  }
  for (const update of connection.updates) {
    assert.match(update.sql, /SET payload = \?/);
    assert.equal(update.params.length, 2);
  }
});

test("commit mode commits exactly the fixed three replacements", async () => {
  const connection = new FakeConnection(originalRows());
  const result = await replaceAnimationSamples(
    fakePool(connection) as never,
    { dryRun: false },
  );

  assert.equal(result.transaction, "committed");
  assert.deepEqual(connection.events, ["begin", "commit", "release"]);
  assert.equal(connection.updates.length, 3);
});

test("payload drift refuses every replacement and rolls back", async () => {
  const rows = originalRows();
  rows[0] = {
    ...rows[0]!,
    payload: JSON.stringify({
      ...ORIGINAL_ANIMATION_SAMPLE_PAYLOADS["math1-2023-q01"],
      title: "manually changed",
    }),
  };
  const connection = new FakeConnection(rows);

  await assert.rejects(
    replaceAnimationSamples(fakePool(connection) as never, { dryRun: false }),
    /no longer matches the reviewed original payload/,
  );
  assert.deepEqual(connection.events, ["begin", "rollback", "release"]);
  assert.equal(connection.updates.length, 0);
});

test("unknown fields in a stored payload count as drift", async () => {
  const rows = originalRows();
  rows[0] = {
    ...rows[0]!,
    payload: JSON.stringify({
      ...ORIGINAL_ANIMATION_SAMPLE_PAYLOADS["math1-2023-q01"],
      unreviewed: true,
    }),
  };
  const connection = new FakeConnection(rows);

  await assert.rejects(
    replaceAnimationSamples(fakePool(connection) as never, { dryRun: false }),
    /no longer matches the reviewed original payload/,
  );
  assert.deepEqual(connection.events, ["begin", "rollback", "release"]);
  assert.equal(connection.updates.length, 0);
});

test("trimmed whitespace in a stored payload still counts as drift", async () => {
  const rows = originalRows();
  rows[0] = {
    ...rows[0]!,
    payload: JSON.stringify({
      ...ORIGINAL_ANIMATION_SAMPLE_PAYLOADS["math1-2023-q01"],
      title: `${ORIGINAL_ANIMATION_SAMPLE_PAYLOADS["math1-2023-q01"].title} `,
    }),
  };
  const connection = new FakeConnection(rows);

  await assert.rejects(
    replaceAnimationSamples(fakePool(connection) as never, { dryRun: false }),
    /no longer matches the reviewed original payload/,
  );
  assert.deepEqual(connection.events, ["begin", "rollback", "release"]);
  assert.equal(connection.updates.length, 0);
});

test("a later update mismatch rolls back earlier updates", async () => {
  const connection = new FakeConnection(originalRows(), [1, 0]);

  await assert.rejects(
    replaceAnimationSamples(fakePool(connection) as never, { dryRun: false }),
    /update affected 0 rows/,
  );
  assert.deepEqual(connection.events, ["begin", "rollback", "release"]);
  assert.equal(connection.updates.length, 2);
});

test("missing rows refuse a partial replacement", async () => {
  const connection = new FakeConnection(originalRows().slice(0, 2));

  await assert.rejects(
    replaceAnimationSamples(fakePool(connection) as never, { dryRun: false }),
    /expected 3 animation rows, found 2/,
  );
  assert.deepEqual(connection.events, ["begin", "rollback", "release"]);
  assert.equal(connection.updates.length, 0);
});
