import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const webRoot = resolve(here, "..");
const repoRoot = resolve(webRoot, "../..");
const baseUrl = process.env.BASE_URL ?? "http://127.0.0.1:5173";
let server;

async function isReachable() {
  try {
    const response = await fetch(baseUrl);
    return response.ok;
  } catch {
    return false;
  }
}

async function waitForServer() {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    if (await isReachable()) return;
    await new Promise((resolveWait) => setTimeout(resolveWait, 250));
  }
  throw new Error(`Vite did not become ready at ${baseUrl} within 30 seconds`);
}

if (!(await isReachable())) {
  server = spawn(
    process.execPath,
    [
      resolve(repoRoot, "node_modules/vite/bin/vite.js"),
      "--host",
      "127.0.0.1",
      "--port",
      "5173",
      "--strictPort",
    ],
    {
      cwd: webRoot,
      env: { ...process.env, BASE_URL: baseUrl },
      stdio: ["ignore", "inherit", "inherit"],
      windowsHide: true,
    },
  );
  await waitForServer();
}

try {
  await import("./smoke.mjs");
} finally {
  if (server && !server.killed) {
    server.kill();
    await Promise.race([
      new Promise((resolveExit) => server.once("exit", resolveExit)),
      new Promise((resolveWait) => setTimeout(resolveWait, 3_000)),
    ]);
  }
}
