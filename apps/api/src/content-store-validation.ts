import { z } from "zod";
import { multipleChoiceOptionsSchema } from "./content-overrides.js";
import type { ContentOption } from "./content-store.js";

const emptyOptionsSchema = z.array(z.never()).length(0);
const storedKnowledgePointsSchema = z.array(z.string().max(500)).max(200);

function parseStoredJson<T>(
  value: string | unknown,
  schema: z.ZodType<T>,
  field: string,
): T {
  try {
    const parsed = typeof value === "string" ? JSON.parse(value) : value;
    return schema.parse(parsed);
  } catch {
    throw new Error(`stored question ${field} failed integrity validation`);
  }
}

export function parseStoredContentOptions(
  questionType: string,
  value: string | ContentOption[],
): ContentOption[] {
  return parseStoredJson(
    value,
    questionType === "multiple_choice"
      ? multipleChoiceOptionsSchema
      : emptyOptionsSchema,
    "options_json",
  );
}

export function parseStoredKnowledgePoints(
  value: string | string[],
): string[] {
  return parseStoredJson(
    value,
    storedKnowledgePointsSchema,
    "knowledge_points",
  );
}
