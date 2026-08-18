import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ORIGINAL_PROBABILITY_ANIMATION_PAYLOAD,
  PROBABILITY_ANIMATION_ID,
  replaceProbabilityAnimation,
} from "../src/probability-animation-replacement.js";

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
    private readonly affectedRows = 1,
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

  async query(sql: string, params: unknown[]) {
    assert.match(sql, /FOR UPDATE/);
    assert.deepEqual(params, [PROBABILITY_ANIMATION_ID]);
    return [this.rows];
  }

  async execute(sql: string, params: unknown[]) {
    this.updates.push({ sql, params });
    return [{ affectedRows: this.affectedRows }];
  }
}

const originalRow = (): Row => ({
  question_id: PROBABILITY_ANIMATION_ID,
  subject_code: "math1",
  payload: JSON.stringify(ORIGINAL_PROBABILITY_ANIMATION_PAYLOAD),
  is_active: 1,
});

const fakePool = (connection: FakeConnection) => ({
  async getConnection() {
    return connection;
  },
});

test("probability animation replacement dry-run updates one guarded row and rolls back", async () => {
  const connection = new FakeConnection([originalRow()]);
  const result = await replaceProbabilityAnimation(
    fakePool(connection) as never,
    { dryRun: true },
  );

  assert.equal(result.questionId, PROBABILITY_ANIMATION_ID);
  assert.equal(result.transaction, "rolled_back");
  assert.notEqual(result.beforeHash, result.afterHash);
  assert.deepEqual(connection.events, ["begin", "rollback", "release"]);
  assert.equal(connection.updates.length, 1);
  assert.match(connection.updates[0]!.sql, /SET payload = \?/);
  assert.equal(
    JSON.parse(String(connection.updates[0]!.params[0])).variant,
    "probability-three-results-v1",
  );
  assert.deepEqual(connection.updates[0]!.params.slice(1), [
    PROBABILITY_ANIMATION_ID,
    "math1",
  ]);
});

test("probability animation replacement commit commits exactly one row", async () => {
  const connection = new FakeConnection([originalRow()]);
  const result = await replaceProbabilityAnimation(
    fakePool(connection) as never,
    { dryRun: false },
  );

  assert.equal(result.transaction, "committed");
  assert.deepEqual(connection.events, ["begin", "commit", "release"]);
  assert.equal(connection.updates.length, 1);
});

test("probability animation replacement rejects payload drift before writing", async () => {
  const drifted = {
    ...ORIGINAL_PROBABILITY_ANIMATION_PAYLOAD,
    unreviewed: true,
  };
  const connection = new FakeConnection([
    { ...originalRow(), payload: JSON.stringify(drifted) },
  ]);

  await assert.rejects(
    replaceProbabilityAnimation(fakePool(connection) as never, { dryRun: false }),
    /no longer matches the reviewed payload/,
  );
  assert.deepEqual(connection.events, ["begin", "rollback", "release"]);
  assert.equal(connection.updates.length, 0);
});

test("probability animation replacement rejects whitespace drift before writing", async () => {
  const drifted = {
    ...ORIGINAL_PROBABILITY_ANIMATION_PAYLOAD,
    title: `${ORIGINAL_PROBABILITY_ANIMATION_PAYLOAD.title} `,
  };
  const connection = new FakeConnection([
    { ...originalRow(), payload: JSON.stringify(drifted) },
  ]);

  await assert.rejects(
    replaceProbabilityAnimation(fakePool(connection) as never, { dryRun: false }),
    /no longer matches the reviewed payload/,
  );
  assert.deepEqual(connection.events, ["begin", "rollback", "release"]);
  assert.equal(connection.updates.length, 0);
});

test("probability animation replacement rolls back an affected-row mismatch", async () => {
  const connection = new FakeConnection([originalRow()], 0);

  await assert.rejects(
    replaceProbabilityAnimation(fakePool(connection) as never, { dryRun: false }),
    /update affected 0 rows/,
  );
  assert.deepEqual(connection.events, ["begin", "rollback", "release"]);
  assert.equal(connection.updates.length, 1);
});

test("probability animation replacement refuses a missing row", async () => {
  const connection = new FakeConnection([]);

  await assert.rejects(
    replaceProbabilityAnimation(fakePool(connection) as never, { dryRun: false }),
    /expected 1 animation row/,
  );
  assert.deepEqual(connection.events, ["begin", "rollback", "release"]);
  assert.equal(connection.updates.length, 0);
});
