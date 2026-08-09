import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import katex from "katex";
import { CORRECTED_EXPLANATION } from "./apply_math1_2025_q04_explanation_correction.mjs";

const STABLE_ID = "math1-2025-q04";
const readJson = async (path) => JSON.parse(await readFile(path, "utf8"));
const oldBank = JSON.parse(
  execFileSync(
    "git",
    ["show", "origin/main:content/final/math1/question-bank.json"],
    { encoding: "utf8", maxBuffer: 10 * 1024 * 1024 },
  ),
);
const oldReview = JSON.parse(
  execFileSync(
    "git",
    ["show", "origin/main:content/review/math1/2025/questions-reviewed.json"],
    { encoding: "utf8", maxBuffer: 1024 * 1024 },
  ),
);
const [bank, review, publicBank] = await Promise.all([
  readJson("content/final/math1/question-bank.json"),
  readJson("content/review/math1/2025/questions-reviewed.json"),
  readJson("apps/web/public/data/math1.json"),
]);

const assertClean = (value, label) => {
  if (
    value !== CORRECTED_EXPLANATION ||
    value.includes("![](images/") ||
    value.includes("f ~ o ~ r") ||
    value.includes("\\mathbb { M }") ||
    value.includes("\\mathbf { \\Pi }")
  ) {
    throw new Error(`${label} is not the clean REQ-023 explanation`);
  }
};
const oldById = new Map(oldBank.questions.map((question) => [question.stableId, question]));
let unrelatedChanged = 0;
for (const question of bank.questions) {
  const oldQuestion = oldById.get(question.stableId);
  if (!oldQuestion) throw new Error(`new stable ID: ${question.stableId}`);
  if (question.stableId === STABLE_ID) {
    const before = structuredClone(oldQuestion);
    const after = structuredClone(question);
    delete before.explanation;
    delete before.explanationCandidate;
    delete after.explanation;
    delete after.explanationCandidate;
    if (JSON.stringify(before) !== JSON.stringify(after)) {
      throw new Error("Q04 non-explanation canonical fields changed");
    }
  } else if (JSON.stringify(oldQuestion) !== JSON.stringify(question)) {
    unrelatedChanged += 1;
  }
}

const question = bank.questions.find((item) => item.stableId === STABLE_ID);
const reviewed = review.reviews.find((item) => item.stableId === STABLE_ID);
const publicQuestion = publicBank.questions.find(
  (item) => item.stableId === STABLE_ID,
);
if (!question || !reviewed || !publicQuestion) {
  throw new Error("Q04 is missing from canonical, review, or public content");
}
assertClean(question.explanation, "canonical explanation");
assertClean(question.explanationCandidate, "canonical explanationCandidate");
assertClean(
  reviewed.candidateResult.explanationCandidate,
  "review explanationCandidate",
);
assertClean(publicQuestion.explanation, "public explanation");

const oldReviewed = oldReview.reviews.find((item) => item.stableId === STABLE_ID);
const oldOtherReviews = oldReview.reviews.filter((item) => item.stableId !== STABLE_ID);
const newOtherReviews = review.reviews.filter((item) => item.stableId !== STABLE_ID);
if (
  !oldReviewed ||
  JSON.stringify(oldOtherReviews) !== JSON.stringify(newOtherReviews)
) {
  throw new Error("an unrelated 2025 review entry changed");
}

const expressions = [
  ...CORRECTED_EXPLANATION.matchAll(/\$\$([\s\S]*?)\$\$|\$([^$\n]+?)\$/g),
].map((match) => match[1] ?? match[2]);
for (const expression of expressions) {
  katex.renderToString(expression, {
    displayMode: expression.includes("\\int"),
    throwOnError: true,
    strict: false,
  });
}

const uniqueStableIds = new Set(bank.questions.map((item) => item.stableId)).size;
if (
  bank.questions.length !== 852 ||
  uniqueStableIds !== 852 ||
  publicBank.totalQuestions !== 179 ||
  unrelatedChanged !== 0 ||
  question.answer !== "A"
) {
  throw new Error("Math1 counts, unrelated content, or Q04 answer changed");
}

console.log(
  JSON.stringify({
    canonicalQuestions: bank.questions.length,
    uniqueStableIds,
    publicQuestions: publicBank.totalQuestions,
    unrelatedChanged,
    q04Answer: question.answer,
    explanationLength: question.explanation.length,
    katexExpressions: expressions.length,
  }),
);
