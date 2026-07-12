import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { loadConfig } from "../src/config.js";
import { createDatabasePool, initializeDatabase } from "../src/db.js";
import { buildMath1ImportPayloads } from "../src/math1-import.js";
import { importQuestionBatch } from "../src/math2-import.js";

function resolveInputPath(input: string) {
  const direct = resolve(input);
  if (existsSync(direct)) return direct;
  const repoRelative = resolve(process.cwd(), "..", "..", input);
  return existsSync(repoRelative) ? repoRelative : direct;
}

const args = process.argv.slice(2);
const inputIndex = args.indexOf("--input");
const inputPath = resolveInputPath(
  inputIndex >= 0 && args[inputIndex + 1]
    ? args[inputIndex + 1]
    : "content/final/math1/question-bank.json",
);
const dryRun = !args.includes("--commit");
const fromYearIndex = args.indexOf("--from-year");
const fromYear =
  fromYearIndex >= 0 && args[fromYearIndex + 1]
    ? Number(args[fromYearIndex + 1])
    : undefined;
if (fromYear !== undefined && (!Number.isInteger(fromYear) || fromYear < 1987)) {
  throw new Error("--from-year must be an integer greater than or equal to 1987");
}
const raw = await readFile(inputPath, "utf8");
const payloads = buildMath1ImportPayloads(JSON.parse(raw) as unknown, {
  sourceCommit: execFileSync("git", ["rev-parse", "HEAD"], {
    encoding: "utf8",
  }).trim(),
  sourceHash: createHash("sha256").update(raw).digest("hex"),
}).filter((payload) => fromYear === undefined || payload.sourceYear >= fromYear);
const pool = createDatabasePool(loadConfig());

try {
  await initializeDatabase(pool);
  const results = [];
  for (const payload of payloads) {
    const result = await importQuestionBatch(pool, payload, { dryRun });
    results.push(result);
    console.log(
      JSON.stringify({
        batchId: result.batchId,
        questions: result.questionsInserted,
        transaction: result.transaction,
      }),
    );
  }
  console.log(
    JSON.stringify(
      {
        subjectCode: "math1",
        years: results.length,
        questions: results.reduce(
          (total, result) => total + result.questionsInserted,
          0,
        ),
        dryRun,
        transactions: [...new Set(results.map((result) => result.transaction))],
      },
      null,
      2,
    ),
  );
} finally {
  await pool.end();
}
