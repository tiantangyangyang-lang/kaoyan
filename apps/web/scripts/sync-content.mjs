import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(currentDir, "..");
const repoRoot = resolve(appRoot, "..", "..");
const source = resolve(repoRoot, "content", "final", "math1", "question-bank.json");
const destination = resolve(appRoot, "public", "data", "math1.json");
const catalogDestination = resolve(appRoot, "public", "data", "subjects.json");

const raw = await readFile(source, "utf8");
const bank = JSON.parse(raw);

if (!Array.isArray(bank.questions) || bank.questions.length !== 852) {
  throw new Error(`Unexpected Math1 question count: ${bank.questions?.length ?? "missing"}`);
}

await mkdir(dirname(destination), { recursive: true });
await copyFile(source, destination);
await writeFile(
  catalogDestination,
  JSON.stringify(
    {
      schemaVersion: "kaoyan-subject-catalog-v1",
      subjects: [
        {
          code: "math1",
          name: "数学一",
          questionBankUrl: "/data/math1.json",
          enabled: true,
          questionCount: bank.questions.length,
        },
        {
          code: "math2",
          name: "数学二",
          enabled: false,
          questionCount: 0,
          delivery: "api",
        },
      ],
    },
    null,
    2,
  ),
  "utf8",
);

console.log(`Synced ${bank.questions.length} Math1 questions to ${destination}`);
