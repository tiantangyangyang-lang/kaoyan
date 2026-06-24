import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createDatabasePool, initializeDatabase } from "../src/db.js";
import { loadConfig } from "../src/config.js";
import { importMath2Batch } from "../src/math2-import.js";

const args = process.argv.slice(2);
const inputIndex = args.indexOf("--input");
if (inputIndex === -1 || !args[inputIndex + 1]) {
  throw new Error("Usage: npm run import:math2 -- --input <questions.json> [--commit]");
}
const dryRun = !args.includes("--commit");
const inputPath = resolve(args[inputIndex + 1]);
const payload = JSON.parse(await readFile(inputPath, "utf8")) as unknown;
const pool = createDatabasePool(loadConfig());

try {
  await initializeDatabase(pool);
  const result = await importMath2Batch(pool, payload, { dryRun });
  console.log(JSON.stringify(result, null, 2));
} finally {
  await pool.end();
}
