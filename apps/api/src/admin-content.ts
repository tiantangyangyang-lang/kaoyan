import { createHash, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import type { AppConfig } from "./config.js";
import type { ContentQuestionDetail } from "./content-store.js";
import {
  contentOverrideChangesSchema,
  type ContentOverrideChanges,
  type ContentOverrideCommand,
  type ContentOverrideResult,
} from "./content-overrides.js";

export const adminStableIdSchema = z.string().regex(
  /^(?:math[23]-\d{4}-q\d{2,3}|math1-\d{4}-(?:q\d{2,3}|s\d{2}(?:-q\d{2,3})?))$/,
);

const adminActionCommon = {
  expectedRevision: z.number().int().nonnegative(),
  reason: z.string().trim().min(3).max(500),
  mode: z.enum(["preview", "commit"]),
};

export const adminContentActionSchema = z.discriminatedUnion("action", [
  z
    .object({
      ...adminActionCommon,
      action: z.literal("upsert"),
      changes: contentOverrideChangesSchema,
    })
    .strict(),
  z
    .object({
      ...adminActionCommon,
      action: z.literal("revert"),
      targetRevision: z.number().int().nonnegative(),
    })
    .strict(),
]);

export type AdminContentAction = z.infer<typeof adminContentActionSchema>;

export interface AdminOverrideRevision {
  revision: number;
  action: "upsert" | "revert";
  targetRevision: number | null;
  beforePatch: ContentOverrideChanges | null;
  afterPatch: ContentOverrideChanges | null;
  editor: string;
  reason: string;
  createdAt: string;
}

export interface AdminQuestionSnapshot {
  stableId: string;
  subjectCode: "math1" | "math2" | "math3";
  base: ContentQuestionDetail;
  effective: ContentQuestionDetail;
  override: {
    revision: number;
    active: boolean;
    changes: ContentOverrideChanges | null;
    editor: string;
    reason: string;
    updatedAt: string;
  } | null;
  revisions: AdminOverrideRevision[];
  historyHasMore: boolean;
}

export interface AdminContentStore {
  getAdminQuestion(stableId: string): Promise<AdminQuestionSnapshot | null>;
  executeAdminOverride(
    command: ContentOverrideCommand,
    options: { dryRun: boolean },
  ): Promise<ContentOverrideResult>;
}

export const isAdminContentConfigured = (
  config: Pick<AppConfig, "ADMIN_CONTENT_EMAILS" | "ADMIN_CONTENT_KEY_SHA256">,
) =>
  config.ADMIN_CONTENT_EMAILS.length > 0 &&
  config.ADMIN_CONTENT_KEY_SHA256 !== undefined;

export const isAdminContentEmail = (
  config: Pick<AppConfig, "ADMIN_CONTENT_EMAILS" | "ADMIN_CONTENT_KEY_SHA256">,
  email: string,
) =>
  isAdminContentConfigured(config) &&
  config.ADMIN_CONTENT_EMAILS.includes(email.trim().toLowerCase());

export function verifyAdminContentKey(
  config: Pick<AppConfig, "ADMIN_CONTENT_EMAILS" | "ADMIN_CONTENT_KEY_SHA256">,
  suppliedKey: string,
): boolean {
  const actual = createHash("sha256").update(suppliedKey).digest();
  const expected = config.ADMIN_CONTENT_KEY_SHA256
    ? Buffer.from(config.ADMIN_CONTENT_KEY_SHA256, "hex")
    : Buffer.alloc(32);
  const matches = timingSafeEqual(actual, expected);
  return isAdminContentConfigured(config) && matches;
}
