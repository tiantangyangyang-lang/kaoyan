import { loadConfig } from "../src/config.js";
import { approveAuthorizedStagingContent } from "../src/content-approve.js";
import { createDatabasePool, initializeDatabase } from "../src/db.js";

const pool = createDatabasePool(loadConfig());

try {
  await initializeDatabase(pool);
  const result = await approveAuthorizedStagingContent(pool, {
    dryRun: !process.argv.slice(2).includes("--commit"),
  });
  console.log(JSON.stringify(result, null, 2));
} finally {
  await pool.end();
}
