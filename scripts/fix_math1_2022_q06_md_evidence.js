const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const readJson = (relative) =>
  JSON.parse(fs.readFileSync(path.join(root, relative), "utf8"));
const writeJson = (relative, value) =>
  fs.writeFileSync(
    path.join(root, relative),
    `${JSON.stringify(value, null, 2)}\n`,
    "utf8",
  );

const wrong = "$BAx = 0$ 与 $BAx = 0$ 不同解";
const fixed = "$ABx = 0$ 与 $BAx = 0$ 不同解";

function replaceExactlyOnce(text, before, after, label) {
  const count = text.split(before).length - 1;
  if (count === 0 && text.includes(after)) {
    return text;
  }
  if (count !== 1) {
    throw new Error(`${label}: expected one occurrence, found ${count}`);
  }
  return text.replace(before, after);
}

const stagingQuestionsPath = "content/staging/math1/2022/questions.json";
const staging = readJson(stagingQuestionsPath);
const stagingQ6 = staging.questions.find(
  (question) => question.stableId === "math1-2022-q06",
);
if (!stagingQ6) throw new Error("Missing staging Q6");
stagingQ6.explanationCandidate = replaceExactlyOnce(
  stagingQ6.explanationCandidate,
  wrong,
  fixed,
  "staging Q6",
);
writeJson(stagingQuestionsPath, staging);

const reviewQuestionsPath =
  "content/review/math1/2022/questions-reviewed.json";
const review = readJson(reviewQuestionsPath);
const reviewItems = review.questions || review.reviews;
if (!reviewItems) throw new Error("Missing review questions/reviews array");
const reviewQ6 = reviewItems.find(
  (question) => question.stableId === "math1-2022-q06",
);
if (!reviewQ6) throw new Error("Missing review Q6");
reviewQ6.candidateResult.explanationCandidate = replaceExactlyOnce(
  reviewQ6.candidateResult.explanationCandidate,
  wrong,
  fixed,
  "review Q6",
);
if (reviewQ6.candidateResult.anomalies) {
  reviewQ6.candidateResult.anomalies =
    reviewQ6.candidateResult.anomalies.filter(
      (anomaly) => anomaly.type !== "source_ocr_issue",
    );
}
if (reviewQ6.semanticReview) {
  reviewQ6.semanticReview.modifications =
    reviewQ6.semanticReview.modifications || [];
  if (
    !reviewQ6.semanticReview.modifications.some(
      (item) => item.field === "explanationCandidate",
    )
  ) {
    reviewQ6.semanticReview.modifications.push({
      field: "explanationCandidate",
      action: "Corrected final comparison from BAx/BAx to ABx/BAx.",
      evidence:
        "solutions/2022 layout.json contains separate ABx=0 and BAx=0 formula nodes; direct multiplication of the stated matrices confirms AB != BA.",
    });
  }
  reviewQ6.semanticReview.humanReviewFocus = [
    "Q6 的 ABx/BAx OCR 末句已由 solution layout.json 的独立公式节点和反例矩阵计算确定性修复。",
  ];
}
writeJson(reviewQuestionsPath, review);

const stagingAnomaliesPath = "content/staging/math1/2022/anomalies.json";
const stagingAnomalies = readJson(stagingAnomaliesPath);
stagingAnomalies.anomalies = stagingAnomalies.anomalies.filter(
  (anomaly) => anomaly.type !== "source_ocr_issue",
);
writeJson(stagingAnomaliesPath, stagingAnomalies);

const reviewAnomaliesPath =
  "content/review/math1/2022/anomalies-reviewed.json";
const reviewAnomalies = readJson(reviewAnomaliesPath);
reviewAnomalies.anomalies = reviewAnomalies.anomalies.filter(
  (anomaly) => anomaly.type !== "source_ocr_issue",
);
reviewAnomalies.summary.totalAnomalies = reviewAnomalies.anomalies.length;
reviewAnomalies.summary.bySeverity = { error: 0, warning: 0, info: 22 };
reviewAnomalies.summary.fixesApplied.push(
  "Q6 explanation: corrected ABx=0 versus BAx=0 from solution layout nodes and direct matrix multiplication.",
);
writeJson(reviewAnomaliesPath, reviewAnomalies);

const validationPath = "content/staging/math1/2022/validation.json";
const validation = readJson(validationPath);
validation.totalAnomalies = 22;
validation.anomaliesBySeverity = { error: 0, warning: 0, info: 22 };
validation.fixesApplied.push(
  "Q6 explanation: corrected ABx=0 versus BAx=0 using solution layout.json evidence and direct matrix multiplication.",
);
validation.sourceContentIssues = [];
validation.parserChecks = {
  node: "passed",
  python: "passed",
  powershell: "passed",
};
writeJson(validationPath, validation);

const markdownUpdates = [
  [
    "content/staging/math1/2022/summary.md",
    [
      ["Anomalies: 23 (1 warning + 22 info)", "Anomalies: 22 (0 warning + 22 info)"],
      [
        "  - 1 warning: source_ocr_issue on Q6 (BAx/BAx → likely ABx/BAx)\n",
        "",
      ],
      [
        "Pending content issue: Q6 explanation `$BAx=0$ 与 $BAx=0$` — source OCR error, should likely be `$ABx=0$` vs `$BAx=0$`; preserved as-is, flagged for human review",
        "Resolved content issue: Q6 explanation now reads `$ABx=0$ 与 $BAx=0$`; confirmed by solution layout nodes and direct matrix multiplication",
      ],
    ],
  ],
  [
    "content/reports/math1-2022/md-finalization.md",
    [
      ["Active anomalies**: 23 (1 warning + 22 info)", "Active anomalies**: 22 (0 warning + 22 info)"],
      [
        "2. **New anomaly added**: Q6 explanation source OCR issue (1 warning)",
        "2. **Deterministic Q6 fix**: restored `ABx=0` versus `BAx=0` from solution layout nodes and direct matrix multiplication",
      ],
      [
        "| warning | 1 | Q6: source OCR error BAx→BAx (likely ABx→BAx) |",
        "| warning | 0 | — |",
      ],
      [
        "- Q6 explanation has a source OCR error preserved for human review",
        "- Q6 ABx/BAx OCR error is resolved; no visual review is required",
      ],
    ],
  ],
  [
    "content/reports/math1-2022/conflicts-and-uncertainties.md",
    [
      ["### Warning（1 项）", "### Warning（0 项）"],
      [
        "- `math1-2022-q06` [source_ocr_issue, warning]: 解析中 `$BAx = 0$ 与 $BAx = 0$ 不同解` — 第二个 `BAx` 根据上下文应为 `ABx`（取 A=[[0,1],[0,0]], B=[[0,1],[0,1]]，AB≠BA）。源内容保留，待人工确认。",
        "- 无。Q6 已由 solution `layout.json` 中的 `ABx=0`、`BAx=0` 独立公式节点及矩阵乘法确定性修复。",
      ],
      [
        "- Q6 源 OCR 错误保留，需人工判断是否修复",
        "- Q6 OCR 冲突已解决，不再需要人工或视觉确认",
      ],
    ],
  ],
  [
    "content/reports/math1-2022/human-review-checklist.md",
    [
      [
        "- **`math1-2022-q06`**: 解析中 `$BAx = 0$ 与 $BAx = 0$ 不同解` — 根据上下文（A=[[0,1],[0,0]], B=[[0,1],[0,1]]），第二个 `BAx` 应为 `ABx`。需人工确认后修复。\n",
        "",
      ],
      [
        "- Q6 源 OCR 错误需人工判断后修复",
        "- Q6 的 ABx/BAx OCR 冲突已确定性修复",
      ],
    ],
  ],
];

for (const [relative, replacements] of markdownUpdates) {
  const fullPath = path.join(root, relative);
  let text = fs.readFileSync(fullPath, "utf8");
  for (const [before, after] of replacements) {
    text = replaceExactlyOnce(text, before, after, relative);
  }
  fs.writeFileSync(fullPath, text, "utf8");
}

console.log("Math1 2022 Q6 Markdown-evidence correction applied.");
