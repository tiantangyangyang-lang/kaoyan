import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { buildMath1ImportPayloads } from "../src/math1-import.js";
import { validateQuestionImportPayload } from "../src/math2-import.js";

test("Math1 final bank converts into validated yearly DB batches", async () => {
  const testDirectory = dirname(fileURLToPath(import.meta.url));
  const inputPath = resolve(
    testDirectory,
    "../../../content/final/math1/question-bank.json",
  );
  const raw = await readFile(inputPath, "utf8");
  const payloads = buildMath1ImportPayloads(JSON.parse(raw) as unknown, {
    sourceCommit: "a".repeat(40),
    sourceHash: createHash("sha256").update(raw).digest("hex"),
  });

  assert.equal(payloads.length, 38);
  assert.equal(
    payloads.reduce((total, payload) => total + payload.questions.length, 0),
    852,
  );
  for (const payload of payloads) {
    const validated = validateQuestionImportPayload(payload);
    assert.equal(validated.subjectCode, "math1");
    assert.ok(validated.questions.every((question) => question.sourceTraceability));
  }
});
