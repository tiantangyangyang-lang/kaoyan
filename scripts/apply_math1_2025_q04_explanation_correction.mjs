import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const STABLE_ID = "math1-2025-q04";
const EXPECTED_OLD_EXPLANATION_SHA256 =
  "42dae7485648ab274c3c70a021c21e10cf8eab36f41eb0ad01608375318b9e3e";

export const CORRECTED_EXPLANATION = String.raw`【解析】原积分区域为

$$
D=\left\{(x,y)\mid -2\le x\le 2,\ 4-x^2\le y\le 4\right\}.
$$

交换积分次序。对固定的 $y$，有 $0\le y\le 4$，且 $4-x^2\le y$ 等价于 $x^2\ge 4-y$。

因此，$-2\le x\le-\sqrt{4-y}$ 或 $\sqrt{4-y}\le x\le 2$。

所以原积分等于

$$
\int_0^4\left[\int_{-2}^{-\sqrt{4-y}}f(x,y)\,\mathrm{d}x+\int_{\sqrt{4-y}}^2f(x,y)\,\mathrm{d}x\right]\mathrm{d}y.
$$

故选 A。`;

const sha256 = (value) =>
  createHash("sha256").update(value).digest("hex");

function assertOldOrCorrected(value, field) {
  if (
    value !== CORRECTED_EXPLANATION &&
    sha256(value) !== EXPECTED_OLD_EXPLANATION_SHA256
  ) {
    throw new Error(`${field} no longer matches the audited old explanation`);
  }
}

function serializeLikeSource(raw, value) {
  const newline = raw.includes("\r\n") ? "\r\n" : "\n";
  return `${JSON.stringify(value, null, 2)}\n`.replaceAll("\n", newline);
}

async function updateJson(relativePath, update) {
  const path = resolve(process.cwd(), relativePath);
  const raw = await readFile(path, "utf8");
  const value = JSON.parse(raw);
  update(value);
  const next = serializeLikeSource(raw, value);
  if (next !== raw) await writeFile(path, next, "utf8");
}

export async function applyMath1Q04ExplanationCorrection() {
  await updateJson("content/final/math1/question-bank.json", (bank) => {
    const question = bank.questions.find((item) => item.stableId === STABLE_ID);
    if (!question) {
      throw new Error(`${STABLE_ID} is missing from the canonical bank`);
    }
    assertOldOrCorrected(question.explanation, "canonical explanation");
    assertOldOrCorrected(
      question.explanationCandidate,
      "canonical explanationCandidate",
    );
    if (question.explanationStatus !== "candidate_from_solutions") {
      throw new Error("canonical explanation status changed unexpectedly");
    }
    question.explanation = CORRECTED_EXPLANATION;
    question.explanationCandidate = CORRECTED_EXPLANATION;
  });

  await updateJson(
    "content/review/math1/2025/questions-reviewed.json",
    (review) => {
      const item = review.reviews.find(
        (candidate) => candidate.stableId === STABLE_ID,
      );
      if (!item) throw new Error(`${STABLE_ID} is missing from the review file`);
      assertOldOrCorrected(
        item.candidateResult.explanationCandidate,
        "review explanationCandidate",
      );
      if (item.candidateResult.explanationStatus !== "candidate_from_solutions") {
        throw new Error("review explanation status changed unexpectedly");
      }
      item.candidateResult.explanationCandidate = CORRECTED_EXPLANATION;
      item.semanticReview.modifications ??= [];
      if (
        !item.semanticReview.modifications.some(
          (modification) =>
            modification.field === "explanation/explanationCandidate",
        )
      ) {
        item.semanticReview.modifications.push({
          field: "explanation/explanationCandidate",
          before: "Unresolved image reference and OCR-damaged solution text",
          after: "Source-equivalent region and order-of-integration derivation",
          reason:
            "REQ-023 removes rendering/OCR artifacts while preserving the sourced conclusion A.",
        });
      }
    },
  );

  console.log(`Corrected ${STABLE_ID} explanation in canonical and review content`);
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  await applyMath1Q04ExplanationCorrection();
}
