import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import {
  animationKindSchema,
  QUESTION_ANIMATION_SEEDS,
  questionAnimationSeedSchema,
} from "../src/animationSeeds.js";

const here = dirname(fileURLToPath(import.meta.url));
const questionBankPath = resolve(
  here,
  "../../../content/final/math1/question-bank.json",
);

test("animation seeds match the canonical Math1 question bank", async () => {
  const questionBank = JSON.parse(await readFile(questionBankPath, "utf8")) as {
    questions: Array<{ stableId: string }>;
  };
  const canonicalIds = new Set(
    questionBank.questions.map((question) => question.stableId),
  );
  const questionIds = QUESTION_ANIMATION_SEEDS.map((seed) => seed.questionId);

  assert.equal(QUESTION_ANIMATION_SEEDS.length, 6);
  assert.equal(new Set(questionIds).size, questionIds.length);

  for (const seed of QUESTION_ANIMATION_SEEDS) {
    const parsed = questionAnimationSeedSchema.parse(seed);
    assert.equal(canonicalIds.has(parsed.questionId), true);
    assert.equal(parsed.subjectCode, "math1");
    assert.equal(parsed.payload.version, 1);
    assert.equal(
      animationKindSchema.safeParse(parsed.payload.kind).success,
      true,
    );
    assert.equal(parsed.payload.title.trim().length > 0, true);
    assert.equal(parsed.payload.summary.trim().length > 0, true);
    assert.match(parsed.payload.accent, /^#[0-9a-fA-F]{6}$/);
    assert.equal(parsed.payload.steps.length, 3);
    for (const step of parsed.payload.steps) {
      assert.equal(step.title.trim().length > 0, true);
      assert.equal(step.body.trim().length > 0, true);
    }
  }
});
