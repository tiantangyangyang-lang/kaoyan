import { loadConfig } from "../src/config.js";
import { createDatabasePool } from "../src/db.js";
import { replaceProbabilityAnimation } from "../src/probability-animation-replacement.js";

const pool = createDatabasePool(loadConfig());
try {
  const result = await replaceProbabilityAnimation(pool, {
    dryRun: !process.argv.slice(2).includes("--commit"),
  });
  console.log(JSON.stringify(result, null, 2));
} finally {
  await pool.end();
}
