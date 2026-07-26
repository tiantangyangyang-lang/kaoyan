import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const testDir = dirname(fileURLToPath(import.meta.url));
const publicDir = resolve(testDir, "..", "public");
const dataDir = resolve(publicDir, "data");

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
for (const subjectCode of ["math2", "math3"]) {
  assert.equal(await exists(`${subjectCode}.json`), true);
  const denial = await readJson(`${subjectCode}.json`);
  assert.deepEqual(denial, {
    schemaVersion: "kaoyan-protected-content-v1",
    subjectCode,
    error: "authentication_required",
  });
  assert.equal("questions" in denial, false);
}
const redirects = await readFile(resolve(publicDir, "_redirects"), "utf8");
for (const subjectCode of ["math2", "math3"]) {
  assert.match(
    redirects,
    new RegExp(
      `^/data/${subjectCode}\\.json https://api\\.gongren\\.xyz/api/content/${subjectCode}/questions\\?page=1&pageSize=1 302$`,
      "m",
    ),
  );
}

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
    protectedQuestionPayloadsPresent: false,
    legacyProtectedPaths: "authentication_required",
  }),
);
