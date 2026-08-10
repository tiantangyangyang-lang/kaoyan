import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { test } from "node:test";
import request from "supertest";
import {
  createApp,
  getSessionCookieOptions,
  isAllowedWebOrigin,
} from "../src/app.js";
import type { AppConfig } from "../src/config.js";
import { hashToken } from "../src/security.js";
import type {
  AuthStore,
  LearningStateRecord,
  PasswordUser,
  PublicUser,
  QuestionAnimationRecord,
  RegistrationResult,
} from "../src/store.js";
import type {
  ContentQuestionDetail,
  ContentQuestionPage,
  ContentStore,
  PublicContentOverride,
} from "../src/content-store.js";
import type {
  AdminContentStore,
  AdminQuestionSnapshot,
} from "../src/admin-content.js";
import type {
  ContentOverrideCommand,
  ContentOverrideResult,
} from "../src/content-overrides.js";

class MemoryStore implements AuthStore, ContentStore, AdminContentStore {
  users = new Map<string, PasswordUser>();
  tokens = new Map<string, string>();
  sessions = new Map<string, string>();
  learning = new Map<string, LearningStateRecord>();
  publishedQuestions: ContentQuestionDetail[] = [];
  publicOverrides: PublicContentOverride[] = [];
  adminSnapshot: AdminQuestionSnapshot | null = null;
  adminCommands: Array<{
    command: ContentOverrideCommand;
    dryRun: boolean;
  }> = [];
  animations = new Map<string, QuestionAnimationRecord>([
    [
      "math1-2023-q01",
      {
        questionId: "math1-2023-q01",
        subjectCode: "math1",
        payload: { version: 1, kind: "asymptote" },
        updatedAt: new Date().toISOString(),
      },
    ],
  ]);

  async registerUser(input: {
    email: string;
    passwordHash: string;
    tokenHash: string;
  }): Promise<RegistrationResult> {
    const existing = this.users.get(input.email);
    if (existing?.emailVerified) return { status: "email_taken" };
    const user: PasswordUser = {
      id: existing?.id ?? "user-1",
      email: input.email,
      passwordHash: input.passwordHash,
      emailVerified: false,
    };
    this.users.set(input.email, user);
    this.tokens.set(input.tokenHash, user.id);
    return { status: "ready", userId: user.id };
  }

  async replaceVerificationToken(input: {
    email: string;
    tokenHash: string;
  }): Promise<"ready" | "already_verified" | "not_found"> {
    const user = this.users.get(input.email);
    if (!user) return "not_found";
    if (user.emailVerified) return "already_verified";
    this.tokens.set(input.tokenHash, user.id);
    return "ready";
  }

  async verifyEmail(tokenHash: string): Promise<PublicUser | null> {
    const userId = this.tokens.get(tokenHash);
    const user = [...this.users.values()].find((item) => item.id === userId);
    if (!user) return null;
    user.emailVerified = true;
    return {
      id: user.id,
      email: user.email,
      emailVerified: true,
    };
  }

  async findUserByEmail(email: string): Promise<PasswordUser | null> {
    return this.users.get(email) ?? null;
  }

  async createSession(input: {
    userId: string;
    tokenHash: string;
  }): Promise<void> {
    this.sessions.set(input.tokenHash, input.userId);
  }

  async findUserBySession(tokenHash: string): Promise<PublicUser | null> {
    const userId = this.sessions.get(tokenHash);
    const user = [...this.users.values()].find((item) => item.id === userId);
    return user
      ? {
          id: user.id,
          email: user.email,
          emailVerified: user.emailVerified,
        }
      : null;
  }

  async deleteSession(tokenHash: string): Promise<void> {
    this.sessions.delete(tokenHash);
  }

  async getLearningState(
    userId: string,
    subjectCode: string,
  ): Promise<LearningStateRecord | null> {
    return this.learning.get(`${userId}:${subjectCode}`) ?? null;
  }

  async saveLearningState(input: {
    userId: string;
    subjectCode: string;
    questionStates: Record<string, unknown>;
    paperSessions: Record<string, unknown>;
  }): Promise<void> {
    this.learning.set(`${input.userId}:${input.subjectCode}`, {
      questionStates: input.questionStates,
      paperSessions: input.paperSessions,
      updatedAt: new Date().toISOString(),
    });
  }

  async listPublishedQuestions(input: {
    subjectCode: "math1" | "math2" | "math3";
    year?: number;
    minYear?: number;
    maxYear?: number;
    type?: "multiple_choice" | "fill_in_blank" | "solution" | "proof" | "unknown";
    page: number;
    pageSize: number;
  }): Promise<ContentQuestionPage> {
    const filtered = this.publishedQuestions.filter(
      (question) =>
        question.stableId.startsWith(`${input.subjectCode}-`) &&
        (input.year === undefined || question.sourceYear === input.year) &&
        (input.minYear === undefined || question.sourceYear >= input.minYear) &&
        (input.maxYear === undefined || question.sourceYear <= input.maxYear) &&
        (input.type === undefined || question.type === input.type),
    );
    const offset = (input.page - 1) * input.pageSize;
    return {
      items: filtered.slice(offset, offset + input.pageSize).map((question) => ({
        stableId: question.stableId,
        sourceYear: question.sourceYear,
        type: question.type,
        questionNumber: question.questionNumber,
        stem: question.stem,
        options: question.options,
        finalizationStatus: question.finalizationStatus,
      })),
      page: input.page,
      pageSize: input.pageSize,
      totalItems: filtered.length,
      totalPages: Math.ceil(filtered.length / input.pageSize),
    };
  }

  async getPublishedQuestion(
    _subjectCode: "math1" | "math2" | "math3",
    stableId: string,
  ): Promise<ContentQuestionDetail | null> {
    return (
      this.publishedQuestions.find(
        (question) => question.stableId === stableId,
      ) ?? null
    );
  }

  async listPublicMath1Overrides(): Promise<PublicContentOverride[]> {
    return this.publicOverrides;
  }

  async getAdminQuestion(
    stableId: string,
  ): Promise<AdminQuestionSnapshot | null> {
    return this.adminSnapshot?.stableId === stableId
      ? this.adminSnapshot
      : null;
  }

  async executeAdminOverride(
    command: ContentOverrideCommand,
    options: { dryRun: boolean },
  ): Promise<ContentOverrideResult> {
    this.adminCommands.push({ command, dryRun: options.dryRun });
    return {
      stableId: command.stableId,
      subjectCode: "math1",
      action: command.action,
      previousRevision: command.expectedRevision,
      revision: command.expectedRevision + 1,
      targetRevision:
        command.action === "revert" ? command.targetRevision : null,
      beforePatchHash: null,
      afterPatchHash: "a".repeat(64),
      baseSnapshotHash: "b".repeat(64),
      dryRun: options.dryRun,
      transaction: options.dryRun ? "rolled_back" : "committed",
    };
  }

  async getQuestionAnimation(
    questionId: string,
  ): Promise<QuestionAnimationRecord | null> {
    return this.animations.get(questionId) ?? null;
  }

  async hasQuestionAnimation(questionId: string): Promise<boolean> {
    return this.animations.has(questionId);
  }
}

const config: AppConfig = {
  NODE_ENV: "test",
  PORT: 3000,
  DATABASE_URL: "mysql://test:test@127.0.0.1/test",
  DATABASE_SSL: false,
  WEB_ORIGIN: "http://127.0.0.1:5173",
  WEB_ORIGIN_SUFFIXES: [".kaoyan-ddg.pages.dev"],
  MAIL_FROM: "研数 <verify@mail.gongren.xyz>",
  VERIFICATION_URL_BASE: "http://127.0.0.1:5173/?verify=",
  VERIFICATION_TTL_MINUTES: 60,
  SESSION_DAYS: 30,
  TRUST_PROXY: 1,
  ADMIN_CONTENT_EMAILS: ["admin@example.com"],
  ADMIN_CONTENT_KEY_SHA256: createHash("sha256")
    .update("test-admin-content-key")
    .digest("hex"),
};

const addSession = (
  store: MemoryStore,
  email: string,
  options: { id?: string; verified?: boolean; token?: string } = {},
) => {
  const id = options.id ?? `user-${store.users.size + 1}`;
  const token = options.token ?? `authenticated-content-token-${id}`;
  store.users.set(email, {
    id,
    email,
    passwordHash: "unused",
    emailVerified: options.verified ?? true,
  });
  store.sessions.set(hashToken(token), id);
  return `kaoyan_session=${token}`;
};

const addAuthenticatedSession = (store: MemoryStore) =>
  addSession(store, "student@example.com", {
    id: "user-1",
    token: "authenticated-content-token",
  });

const makePublishedMath1Question = (
  year: number,
): ContentQuestionDetail => ({
  stableId: `math1-${year}-q01`,
  sourceYear: year,
  type: "multiple_choice",
  questionNumber: 1,
  stem: `${year} Math1 stem`,
  options: [
    { label: "A", value: "One" },
    { label: "B", value: "Two" },
  ],
  answer: "A",
  answerStatus: "reviewed",
  explanation: `${year} explanation`,
  explanationStatus: "reviewed",
  reviewStatus: "reviewed",
  finalizationStatus: "published",
  knowledgePoints: [],
});

test("allows only configured web origins", () => {
  assert.equal(
    isAllowedWebOrigin(config, "http://127.0.0.1:5173"),
    true,
  );
  assert.equal(
    isAllowedWebOrigin(
      config,
      "https://codex-math1-animation-workfl.kaoyan-ddg.pages.dev",
    ),
    true,
  );
  assert.equal(
    isAllowedWebOrigin(config, "https://evilkaoyan-ddg.pages.dev"),
    false,
  );
  assert.equal(
    isAllowedWebOrigin(config, "http://branch.kaoyan-ddg.pages.dev"),
    false,
  );
});

test("anonymous access is limited to published Math1 from 2018 through 2025", async () => {
  const store = new MemoryStore();
  store.publishedQuestions = [2017, 2018, 2025, 2026].map(
    makePublishedMath1Question,
  );
  store.publicOverrides = [
    {
      stableId: "math1-2025-q01",
      revision: 1,
      changes: { explanation: "Corrected public explanation" },
    },
  ];
  const app = createApp({
    config,
    store,
    mailer: { async sendVerification() {} },
  });

  const publicList = await request(app)
    .get("/api/content/math1/questions?page=1&pageSize=10")
    .expect(200);
  assert.equal(publicList.headers["cache-control"], "private, no-store");
  assert.match(publicList.headers.vary, /Cookie/);
  assert.deepEqual(
    publicList.body.data.items.map((item: { sourceYear: number }) => item.sourceYear),
    [2018, 2025],
  );
  assert.equal(publicList.body.data.totalItems, 2);

  const publicOverrides = await request(app)
    .get("/api/content/math1/public-overrides")
    .expect(200);
  assert.equal(publicOverrides.headers["cache-control"], "public, max-age=0, must-revalidate");
  assert.deepEqual(publicOverrides.body.data, store.publicOverrides);

  await request(app)
    .get("/api/content/math1/questions?page=1&pageSize=10&year=2018")
    .expect(200);
  await request(app)
    .get("/api/content/math1/questions/math1-2025-q01")
    .expect(200);

  for (const year of [2017, 2026]) {
    await request(app)
      .get(`/api/content/math1/questions?page=1&pageSize=10&year=${year}`)
      .expect(401, { error: "authentication_required" });
    await request(app)
      .get(`/api/content/math1/questions/math1-${year}-q01`)
      .expect(401, { error: "authentication_required" });
  }

  const cookie = addAuthenticatedSession(store);
  const authenticatedList = await request(app)
    .get("/api/content/math1/questions?page=1&pageSize=10")
    .set("Cookie", cookie)
    .expect(200);
  assert.equal(authenticatedList.body.data.totalItems, 4);
  await request(app)
    .get("/api/content/math1/questions/math1-2017-q01")
    .set("Cookie", cookie)
    .expect(200);
  await request(app)
    .get("/api/content/math1/questions/math1-2026-q01")
    .set("Cookie", cookie)
    .expect(200);
});

test("published Math3 content requires authentication", async () => {
  const store = new MemoryStore();
  store.publishedQuestions = [
    {
      stableId: "math3-1987-q01",
      sourceYear: 1987,
      type: "fill_in_blank",
      questionNumber: 1,
      stem: "Math3 stem",
      options: [],
      answer: null,
      answerStatus: "missing",
      explanation: "Sourced explanation",
      explanationStatus: "sourced_from_aggregate",
      reviewStatus: "needs_human_review",
      finalizationStatus: "published",
      knowledgePoints: [],
    },
  ];
  const app = createApp({
    config,
    store,
    mailer: { async sendVerification() {} },
  });

  await request(app)
    .get("/api/content/math3/questions?page=1&pageSize=1&year=1987")
    .expect(401, { error: "authentication_required" });
  await request(app)
    .get("/api/content/math3/questions/math3-1987-q01")
    .expect(401, { error: "authentication_required" });

  const cookie = addAuthenticatedSession(store);
  const list = await request(app)
    .get("/api/content/math3/questions?page=1&pageSize=1&year=1987")
    .set("Cookie", cookie)
    .expect(200);
  assert.equal(list.body.data.items[0].stableId, "math3-1987-q01");

  const detail = await request(app)
    .get("/api/content/math3/questions/math3-1987-q01")
    .set("Cookie", cookie)
    .expect(200);
  assert.equal(detail.body.data.explanationStatus, "sourced_from_aggregate");

  await request(app)
    .get("/api/content/math3/questions/math2-2020-q01")
    .set("Cookie", cookie)
    .expect(400, { error: "stable_id_subject_mismatch" });
});

test("production session cookies support approved cross-site previews", () => {
  const options = getSessionCookieOptions({
    ...config,
    NODE_ENV: "production",
    COOKIE_DOMAIN: ".gongren.xyz",
  });
  assert.equal(options.httpOnly, true);
  assert.equal(options.secure, true);
  assert.equal(options.sameSite, "none");
  assert.equal(options.domain, ".gongren.xyz");
});

test("preview origin receives CORS headers and passes write-origin checks", async () => {
  const app = createApp({
    config,
    store: new MemoryStore(),
    mailer: { async sendVerification() {} },
  });
  const previewOrigin =
    "https://codex-math1-animation-workfl.kaoyan-ddg.pages.dev";

  await request(app)
    .options("/api/auth/login")
    .set("Origin", previewOrigin)
    .set("Access-Control-Request-Method", "POST")
    .set("Access-Control-Request-Headers", "content-type")
    .expect("Access-Control-Allow-Origin", previewOrigin)
    .expect(204);

  await request(app)
    .post("/api/auth/login")
    .set("Origin", previewOrigin)
    .send({ email: "nobody@example.com", password: "wrong-password" })
    .expect("Access-Control-Allow-Origin", previewOrigin)
    .expect(401, { error: "invalid_credentials" });
});

test("register, verify, login, sync and logout", async () => {
  const store = new MemoryStore();
  let verificationToken = "";
  const app = createApp({
    config,
    store,
    mailer: {
      async sendVerification(_email, token) {
        verificationToken = token;
      },
    },
  });
  const agent = request.agent(app);

  await request(app)
    .get("/api/question-animations/math1-2023-q01/availability")
    .expect(200, { available: true });
  await request(app)
    .get("/api/question-animations/math1-2023-q02/availability")
    .expect(200, { available: false });
  await request(app)
    .get("/api/question-animations/math1-2023-q01")
    .expect(401);

  await agent
    .post("/api/auth/register")
    .send({ email: "student@example.com", password: "correct-horse" })
    .expect(202);
  assert.equal(store.tokens.has(hashToken(verificationToken)), true);

  await agent
    .post("/api/auth/login")
    .send({ email: "student@example.com", password: "correct-horse" })
    .expect(403, { error: "email_not_verified" });

  await agent
    .post("/api/auth/verify")
    .send({ token: verificationToken })
    .expect(200);

  await agent
    .post("/api/auth/login")
    .send({ email: "student@example.com", password: "correct-horse" })
    .expect(200);
  await agent.get("/api/auth/me").expect(200);
  const animation = await agent
    .get("/api/question-animations/math1-2023-q01")
    .expect(200);
  assert.equal(animation.body.animation.payload.kind, "asymptote");
  await agent
    .get("/api/question-animations/math1-2023-q02")
    .expect(404, { error: "animation_not_found" });

  await agent
    .put("/api/learning-state/math1")
    .send({
      questionStates: { "math1-2025-q01": { attempts: 1 } },
      paperSessions: {},
    })
    .expect(200, { status: "saved" });
  const cloud = await agent.get("/api/learning-state/math1").expect(200);
  assert.equal(
    cloud.body.data.questionStates["math1-2025-q01"].attempts,
    1,
  );

  await agent.post("/api/auth/logout").expect(204);
  await agent.get("/api/auth/me").expect(401);
  await agent
    .get("/api/question-animations/math1-2023-q01")
    .expect(401);
});

test("published content is authenticated, bounded and split into list/detail", async () => {
  const store = new MemoryStore();
  store.publishedQuestions = [
    {
      stableId: "math2-2020-q01",
      sourceYear: 2020,
      type: "multiple_choice",
      questionNumber: 1,
      stem: "Question stem",
      options: [
        { label: "A", value: "One" },
        { label: "B", value: "Two" },
        { label: "C", value: "Three" },
        { label: "D", value: "Four" },
      ],
      answer: "A",
      answerStatus: "reviewed",
      explanation: "Explanation",
      explanationStatus: "reviewed",
      reviewStatus: "reviewed",
      finalizationStatus: "published",
      knowledgePoints: ["limits"],
    },
  ];
  const app = createApp({
    config,
    store,
    mailer: { async sendVerification() {} },
  });
  const cookie = addAuthenticatedSession(store);

  await request(app)
    .get("/api/content/math2/questions?page=1&pageSize=1&year=2020")
    .expect(401, { error: "authentication_required" });
  await request(app)
    .get("/api/content/math2/questions/math2-2020-q01")
    .expect(401, { error: "authentication_required" });

  const list = await request(app)
    .get("/api/content/math2/questions?page=1&pageSize=1&year=2020")
    .set("Cookie", cookie)
    .expect(200);
  assert.equal(list.headers["cache-control"], "private, no-store");
  assert.equal(list.body.data.items.length, 1);
  assert.equal("answer" in list.body.data.items[0], false);
  assert.equal("explanation" in list.body.data.items[0], false);

  const detail = await request(app)
    .get("/api/content/math2/questions/math2-2020-q01")
    .set("Cookie", cookie)
    .expect(200);
  assert.equal(detail.headers["cache-control"], "private, no-store");
  assert.equal(detail.body.data.answer, "A");
  assert.equal(detail.body.data.explanation, "Explanation");
  assert.equal("sourceTraceability" in detail.body.data, false);
  assert.equal("anomalies" in detail.body.data, false);

  await request(app)
    .get("/api/content/math2/questions?pageSize=51")
    .set("Cookie", cookie)
    .expect(400);
  await request(app)
    .get("/api/content/math2/questions/math2-2020-q99")
    .set("Cookie", cookie)
    .expect(404);

  await request(app)
    .get("/api/content/math1/questions/math1-2020-q01")
    .set("Cookie", cookie)
    .expect(404);
});

const makeAdminSnapshot = (): AdminQuestionSnapshot => {
  const base: ContentQuestionDetail = {
    stableId: "math1-2025-q04",
    sourceYear: 2025,
    type: "multiple_choice",
    questionNumber: 4,
    stem: "Base stem",
    options: [
      { label: "A", value: "Base A" },
      { label: "B", value: "Base B" },
      { label: "C", value: "Base C" },
      { label: "D", value: "Base D" },
    ],
    answer: "A",
    answerStatus: "reviewed",
    explanation: "Base explanation",
    explanationStatus: "reviewed",
    reviewStatus: "approved",
    finalizationStatus: "published",
    knowledgePoints: [],
  };
  return {
    stableId: base.stableId,
    subjectCode: "math1",
    base,
    effective: { ...base, explanation: "Current explanation" },
    override: {
      revision: 2,
      active: true,
      changes: { explanation: "Current explanation" },
      editor: "admin@example.com",
      reason: "Earlier correction",
      updatedAt: "2026-08-10T00:00:00.000Z",
    },
    revisions: [],
    historyHasMore: false,
  };
};

test("admin content routes require verified allowlisted email and independent key", async () => {
  const store = new MemoryStore();
  store.adminSnapshot = makeAdminSnapshot();
  const app = createApp({
    config,
    store,
    mailer: { async sendVerification() {} },
  });

  await request(app)
    .get("/api/admin/content/access")
    .expect(401, { error: "authentication_required" });
  await request(app)
    .get("/api/admin/content/questions/math1-2025-q04")
    .set("X-Admin-Content-Key", "test-admin-content-key")
    .expect(401, { error: "authentication_required" });

  const studentCookie = addSession(store, "student-2@example.com", {
    id: "student-2",
  });
  await request(app)
    .get("/api/admin/content/access")
    .set("Cookie", studentCookie)
    .expect(200, { eligible: false });
  await request(app)
    .get("/api/admin/content/questions/math1-2025-q04")
    .set("Cookie", studentCookie)
    .set("X-Admin-Content-Key", "test-admin-content-key")
    .expect(403, { error: "admin_access_denied" });

  const unverifiedCookie = addSession(store, "admin@example.com", {
    id: "admin-unverified",
    verified: false,
    token: "unverified-admin-token",
  });
  await request(app)
    .get("/api/admin/content/access")
    .set("Cookie", unverifiedCookie)
    .expect(200, { eligible: false });
  await request(app)
    .get("/api/admin/content/questions/math1-2025-q04")
    .set("Cookie", unverifiedCookie)
    .set("X-Admin-Content-Key", "test-admin-content-key")
    .expect(403, { error: "admin_access_denied" });

  const adminCookie = addSession(store, "admin@example.com", {
    id: "admin-verified",
    token: "verified-admin-token",
  });
  await request(app)
    .get("/api/admin/content/access")
    .set("Cookie", adminCookie)
    .expect("Cache-Control", "private, no-store")
    .expect(200, { eligible: true });
  await request(app)
    .get("/api/admin/content/questions/math1-2025-q04")
    .set("Cookie", adminCookie)
    .set("X-Admin-Content-Key", "wrong-admin-content-key")
    .expect(403, { error: "admin_access_denied" });

  const allowed = await request(app)
    .get("/api/admin/content/questions/math1-2025-q04")
    .set("Cookie", adminCookie)
    .set("X-Admin-Content-Key", "test-admin-content-key")
    .expect("Cache-Control", "private, no-store")
    .expect(200);
  assert.equal(allowed.body.data.effective.explanation, "Current explanation");
  assert.equal(JSON.stringify(allowed.body).includes("test-admin-content-key"), false);
});

test("admin content preview rolls back, commit uses session email, and invalid patches fail early", async () => {
  const store = new MemoryStore();
  store.adminSnapshot = makeAdminSnapshot();
  const app = createApp({
    config,
    store,
    mailer: { async sendVerification() {} },
  });
  const adminCookie = addSession(store, "admin@example.com", {
    id: "admin-actions",
    token: "admin-actions-token",
  });
  const headers = {
    Cookie: adminCookie,
    "X-Admin-Content-Key": "test-admin-content-key",
  };
  const action = {
    action: "upsert",
    expectedRevision: 2,
    reason: "Correct source transcription",
    changes: { explanation: "Corrected explanation" },
  };

  const preview = await request(app)
    .post("/api/admin/content/questions/math1-2025-q04/override")
    .set(headers)
    .send({ ...action, mode: "preview" })
    .expect(200);
  assert.equal(preview.body.result.transaction, "rolled_back");
  assert.equal(preview.body.result.dryRun, true);
  assert.equal(store.adminCommands[0]?.dryRun, true);
  assert.equal(store.adminCommands[0]?.command.editor, "admin@example.com");

  const commit = await request(app)
    .post("/api/admin/content/questions/math1-2025-q04/override")
    .set(headers)
    .send({ ...action, mode: "commit" })
    .expect(200);
  assert.equal(commit.body.result.transaction, "committed");
  assert.equal(commit.body.result.dryRun, false);
  assert.equal(store.adminCommands[1]?.dryRun, false);

  await request(app)
    .post("/api/admin/content/questions/math1-2025-q04/override")
    .set(headers)
    .send({
      ...action,
      mode: "preview",
      changes: { options: [{ label: "A", value: "Only A" }] },
    })
    .expect(400, { error: "invalid_request", details: ["Too small: expected array to have >=4 items"] });
  assert.equal(store.adminCommands.length, 2);
});
