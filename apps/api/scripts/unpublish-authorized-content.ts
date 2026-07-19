import { loadConfig } from "../src/config.js";
import { createDatabasePool, initializeDatabase } from "../src/db.js";
import { unpublishAuthorizedContent } from "../src/content-unpublish.js";

const dryRun = !process.argv.slice(2).includes("--commit");
const pool = createDatabasePool(loadConfig());

try {
  await initializeDatabase(pool);
  const result = await unpublishAuthorizedContent(pool, { dryRun });
  console.log(JSON.stringify(result, null, 2));
} finally {
  await pool.end();
}
