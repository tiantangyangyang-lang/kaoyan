import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const testDir = dirname(fileURLToPath(import.meta.url));
const dataDir = resolve(testDir, "..", "public", "data");

const readJson = async (name) =>
  JSON.parse(await readFile(resolve(dataDir, name), "utf8"));
const exists = async (name) => {
  try {
    await access(resolve(dataDir, name));
    return true;
  } catch {
    return false;
  }
};

const math1 = await readJson("math1.json");
assert.equal(math1.subjectCode, "math1");
assert.equal(math1.questions.length, 179);
assert.equal(math1.totalQuestions, 179);
assert.ok(
  math1.questions.every(
    (question) =>
      question.subjectCode === "math1" &&
      question.sourceYear >= 2018 &&
      question.sourceYear <= 2025,
  ),
  "public Math1 artifact must contain only 2018-2025 questions",
);
assert.equal(
  new Set(math1.questions.map((question) => question.stableId)).size,
  math1.questions.length,
  "public Math1 stable IDs must be unique",
);
assert.equal(await exists("math2.json"), false);
assert.equal(await exists("math3.json"), false);

const catalog = await readJson("subjects.json");
const byCode = new Map(catalog.subjects.map((subject) => [subject.code, subject]));
assert.equal(byCode.get("math1")?.questionBankUrl, "/data/math1.json");
assert.equal(byCode.get("math1")?.questionCount, 852);
assert.equal(byCode.get("math2")?.questionBankUrl, undefined);
assert.equal(byCode.get("math2")?.questionCount, 522);
assert.equal(byCode.get("math3")?.questionBankUrl, undefined);
assert.equal(byCode.get("math3")?.questionCount, 178);

for (const name of await readdir(dataDir)) {
  if (!name.endsWith(".json")) continue;
  const payload = await readJson(name);
  const questions = Array.isArray(payload.questions) ? payload.questions : [];
  assert.ok(
    questions.every(
      (question) =>
        question.subjectCode === "math1" &&
        question.sourceYear >= 2018 &&
        question.sourceYear <= 2025,
    ),
    `${name} contains protected question content`,
  );
}

console.log(
  JSON.stringify({
    status: "passed",
    publicMath1Questions: math1.questions.length,
    publicYears: [2018, 2025],
    protectedArtifactsPresent: false,
  }),
);
