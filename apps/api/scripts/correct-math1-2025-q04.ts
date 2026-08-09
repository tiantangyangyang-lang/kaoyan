import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { loadConfig } from "../src/config.js";
import { createDatabasePool } from "../src/db.js";
import { buildMath1ImportPayloads } from "../src/math1-import.js";
import { replacePublishedMath1Q04 } from "../src/math1-q04-correction.js";

const repoRoot = resolve(process.cwd(), "..", "..");
const bankPath = resolve(repoRoot, "content/final/math1/question-bank.json");
const evidencePath = resolve(
  repoRoot,
  "content/reports/req-022-math1-2025-q04-correction/source-evidence.json",
);
const bankRaw = await readFile(bankPath, "utf8");
const evidenceRaw = await readFile(evidencePath, "utf8");
const sourceCommit = execFileSync("git", ["rev-parse", "HEAD"], {
  cwd: repoRoot,
  encoding: "utf8",
}).trim();
const sha256 = (value: string) =>
  createHash("sha256").update(value).digest("hex");
const payload = buildMath1ImportPayloads(JSON.parse(bankRaw) as unknown, {
  sourceCommit,
  sourceHash: sha256(bankRaw),
}).find((candidate) => candidate.sourceYear === 2025);
const question = payload?.questions.find(
  (candidate) => candidate.stableId === "math1-2025-q04",
);
if (!payload || !question) throw new Error("canonical Math1 2025 Q04 is missing");

const pool = createDatabasePool(loadConfig());
try {
  const result = await replacePublishedMath1Q04(
    pool,
    {
      sourceCommit,
      sourceFiles: [
        {
          relativePath: "content/final/math1/question-bank.json",
          gitState: "tracked",
          sha256: sha256(bankRaw),
        },
        {
          relativePath:
            "content/reports/req-022-math1-2025-q04-correction/source-evidence.json",
          gitState: "tracked",
          sha256: sha256(evidenceRaw),
        },
      ],
      contentHash: sha256(JSON.stringify(payload.questions)),
      stem: question.stem,
      options: question.options,
      anomalies: question.anomalies,
    },
    { dryRun: !process.argv.slice(2).includes("--commit") },
  );
  console.log(JSON.stringify(result, null, 2));
} finally {
  await pool.end();
}
