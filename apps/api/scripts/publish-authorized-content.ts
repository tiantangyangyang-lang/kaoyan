import { loadConfig } from "../src/config.js";
import { AUTHORIZED_BATCH_IDS } from "../src/content-approve.js";
import { publishContentBatch } from "../src/content-publish.js";
import { createDatabasePool, initializeDatabase } from "../src/db.js";

const dryRun = !process.argv.slice(2).includes("--commit");
const pool = createDatabasePool(loadConfig());

try {
  await initializeDatabase(pool);
  const results = [];
  for (const batchId of AUTHORIZED_BATCH_IDS) {
    results.push(await publishContentBatch(pool, batchId, { dryRun }));
  }
  console.log(
    JSON.stringify(
      {
        batches: results.length,
        questions: results.reduce(
          (total, result) => total + result.questions,
          0,
        ),
        dryRun,
        transactions: [...new Set(results.map((result) => result.transaction))],
        results,
      },
      null,
      2,
    ),
  );
} finally {
  await pool.end();
}
