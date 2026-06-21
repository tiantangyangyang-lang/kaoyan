import { createApp } from "./app.js";
import { loadConfig } from "./config.js";
import {
  createDatabasePool,
  initializeDatabase,
  MySqlAuthStore,
} from "./db.js";
import { ResendVerificationMailer } from "./mailer.js";

const config = loadConfig();
const pool = createDatabasePool(config);
console.info("Connecting to MySQL and ensuring schema...");
await initializeDatabase(pool);
console.info("MySQL connection and schema are ready.");
const app = createApp({
  config,
  store: new MySqlAuthStore(pool),
  mailer: new ResendVerificationMailer(config),
});

const server = app.listen(config.PORT, "0.0.0.0", () => {
  console.info(`Kaoyan API listening on ${config.PORT}`);
});

const shutdown = () => {
  server.close(() => {
    void pool.end().finally(() => process.exit(0));
  });
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
