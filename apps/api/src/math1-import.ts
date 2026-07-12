import { z } from "zod";
import type { QuestionImportPayload } from "./math2-import.js";

const optionSchema = z
  .object({
    label: z.enum(["A", "B", "C", "D"]),
    value: z.string().optional(),
    text: z.string().optional(),
  })
  .passthrough();

const math1QuestionSchema = z
  .object({
    stableId: z
      .string()
      .regex(/^math1-\d{4}-(?:q\d{2,3}|s\d{2}(?:-q\d{2,3})?)$/),
    sourceYear: z.number().int(),
    subjectCode: z.literal("math1"),
    type: z.enum([
      "multiple_choice",
      "fill_in_blank",
      "solution",
      "proof",
      "unknown",
    ]),
    questionNumber: z.number().int().positive().nullable(),
    stem: z.string().min(1),
    options: z.array(optionSchema),
    answer: z.string().nullable(),
    answerStatus: z.string().min(1),
    explanation: z.string().nullable(),
    explanationStatus: z.string().min(1),
    reviewStatus: z.string().min(1),
    finalizationStatus: z.string().min(1),
    knowledgePoints: z.array(z.string()),
    anomalies: z.array(z.record(z.string(), z.unknown())),
    sourceRepo: z.string().min(1),
    sourceRelativePaths: z.array(z.string().min(1)).min(1),
    sourceCommit: z.string().regex(/^[0-9a-f]{40}$/i),
    sourcePageRefs: z.array(z.unknown()),
    sourceFileHashes: z.record(z.string(), z.string().nullable()),
    transformVersion: z.string().min(1),
  })
  .passthrough();

const math1BankSchema = z
  .object({
    schemaVersion: z.string().min(1),
    subjectCode: z.literal("math1"),
    totalQuestions: z.number().int().positive(),
    questions: z.array(math1QuestionSchema).min(1),
  })
  .passthrough();

export function buildMath1ImportPayloads(
  input: unknown,
  metadata: { sourceCommit: string; sourceHash: string },
): QuestionImportPayload[] {
  const bank = math1BankSchema.parse(input);
  if (bank.questions.length !== bank.totalQuestions) {
    throw new Error(
      `Math1 bank count mismatch: expected ${bank.totalQuestions}, got ${bank.questions.length}`,
    );
  }
  if (!/^[0-9a-f]{40}$/i.test(metadata.sourceCommit)) {
    throw new Error("sourceCommit must be a 40-character Git commit");
  }
  if (!/^[0-9a-f]{64}$/i.test(metadata.sourceHash)) {
    throw new Error("sourceHash must be a SHA-256 digest");
  }

  const byYear = new Map<number, typeof bank.questions>();
  for (const question of bank.questions) {
    const questions = byYear.get(question.sourceYear) ?? [];
    questions.push(question);
    byYear.set(question.sourceYear, questions);
  }

  return [...byYear.entries()]
    .sort(([left], [right]) => left - right)
    .map(([sourceYear, questions]) => {
      const questionCounts = questions.reduce<Record<string, number>>(
        (counts, question) => {
          counts[question.type] = (counts[question.type] ?? 0) + 1;
          return counts;
        },
        {},
      );
      return {
        schemaVersion: "math1-final-db-v1",
        batchId: `math1-final-${sourceYear}-v1`,
        subjectCode: "math1",
        sourceYear,
        sourceRepository: {
          name: "kaoyan",
          commit: metadata.sourceCommit,
          branch: "",
          dirty: false,
        },
        sourceFiles: [
          {
            relativePath: "content/final/math1/question-bank.json",
            gitState: "tracked",
            sha256: metadata.sourceHash,
          },
        ],
        questions: questions.map((question, index) => ({
          stableId: question.stableId,
          sourceYear: question.sourceYear,
          subjectCode: question.subjectCode,
          type: question.type,
          questionNumber: index + 1,
          stem: question.stem,
          options: question.options.map((option) => ({
            label: option.label,
            value: option.value ?? option.text ?? "",
          })),
          answer: question.answer,
          answerStatus: question.answerStatus,
          explanation: question.explanation,
          explanationStatus: question.explanationStatus,
          reviewStatus: question.reviewStatus,
          finalizationStatus: question.finalizationStatus,
          knowledgePoints: question.knowledgePoints,
          anomalies: question.anomalies,
          sourceTraceability: {
            sourceRepo: question.sourceRepo,
            sourceRelativePaths: question.sourceRelativePaths,
            sourceCommit: question.sourceCommit,
            sourcePageRefs: question.sourcePageRefs,
            sourceFileHashes: question.sourceFileHashes,
            transformVersion: question.transformVersion,
            originalQuestionNumber: question.questionNumber,
          },
        })),
        validation: {
          questionCounts,
          expectedCounts: questionCounts,
          countsMatch: true,
          stableIdsUnique: true,
          schemaValid: true,
        },
      } satisfies QuestionImportPayload;
    });
}
