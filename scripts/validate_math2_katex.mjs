import { readFile, writeFile } from "node:fs/promises";
import katex from "katex";

const [inputPath, outputPath] = process.argv.slice(2);
if (!inputPath || !outputPath) {
  throw new Error("Usage: node scripts/validate_math2_katex.mjs <questions.json> <report.json>");
}

const payload = JSON.parse(await readFile(inputPath, "utf8"));
const mathPattern = /\$\$([\s\S]+?)\$\$|\$([^$\n]+?)\$/g;
const errors = [];
let expressionsChecked = 0;

for (const question of payload.questions) {
  const fields = [
    ["stem", question.stem],
    ...question.options.map((option) => [`option.${option.label}`, option.value]),
    ["answer", question.answer],
    ["explanation", question.explanation],
  ];
  for (const [field, content] of fields) {
    if (typeof content !== "string") continue;
    const unmatchedRemainder = content.replace(mathPattern, "");
    if (unmatchedRemainder.includes("$")) {
      errors.push({
        stableId: question.stableId,
        field,
        expression: null,
        message: "Unmatched dollar delimiter",
      });
    }
    for (const match of content.matchAll(mathPattern)) {
      const expression = match[1] ?? match[2];
      expressionsChecked += 1;
      try {
        katex.renderToString(expression, {
          displayMode: match[1] !== undefined,
          throwOnError: true,
          strict: false,
          trust: false,
        });
      } catch (error) {
        errors.push({
          stableId: question.stableId,
          field,
          expression,
          message: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }
}

const report = {
  schemaVersion: "math2-katex-validation-v1",
  expressionsChecked,
  errors,
  valid: errors.length === 0,
};
await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(`KaTeX: ${expressionsChecked} expressions, ${errors.length} errors`);
if (errors.length > 0) process.exitCode = 3;
