import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { loadConfig } from "../src/config.js";
import { executeContentOverride } from "../src/content-overrides.js";
import { createDatabasePool } from "../src/db.js";

const args = process.argv.slice(2);
const inputIndex = args.indexOf("--input");
const inputPath = inputIndex >= 0 ? args[inputIndex + 1] : undefined;
if (!inputPath) {
  throw new Error("usage: --input <patch.json> [--commit]");
}

const invocationDirectory = process.env.INIT_CWD ?? process.cwd();
const raw = await readFile(resolve(invocationDirectory, inputPath), "utf8");
const command = JSON.parse(raw) as unknown;
const pool = createDatabasePool(loadConfig());

try {
  const result = await executeContentOverride(pool, command, {
    dryRun: !args.includes("--commit"),
  });
  console.log(JSON.stringify(result, null, 2));
} finally {
  await pool.end();
}
