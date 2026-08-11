import { loadConfig } from "../src/config.js";
import { createDatabasePool } from "../src/db.js";
import { replaceAnimationSamples } from "../src/animation-sample-replacement.js";

const pool = createDatabasePool(loadConfig());
try {
  const result = await replaceAnimationSamples(pool, {
    dryRun: !process.argv.slice(2).includes("--commit"),
  });
  console.log(JSON.stringify(result, null, 2));
} finally {
  await pool.end();
}
