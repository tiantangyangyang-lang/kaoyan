import { loadConfig } from "../src/config.js";
import { publishContentBatch } from "../src/content-publish.js";
import { createDatabasePool, initializeDatabase } from "../src/db.js";

const args = process.argv.slice(2);
const batchIndex = args.indexOf("--batch-id");
if (batchIndex === -1 || !args[batchIndex + 1]) {
  throw new Error(
    "Usage: npm run content:publish -- --batch-id <batch-id> [--commit]",
  );
}
const pool = createDatabasePool(loadConfig());

try {
  await initializeDatabase(pool);
  const result = await publishContentBatch(pool, args[batchIndex + 1], {
    dryRun: !args.includes("--commit"),
  });
  console.log(JSON.stringify(result, null, 2));
} finally {
  await pool.end();
}
