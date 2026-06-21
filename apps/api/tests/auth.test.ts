import assert from "node:assert/strict";
import { test } from "node:test";
import request from "supertest";
import { createApp } from "../src/app.js";
import type { AppConfig } from "../src/config.js";
import { hashToken } from "../src/security.js";
import type {
  AuthStore,
  LearningStateRecord,
  PasswordUser,
  PublicUser,
  RegistrationResult,
} from "../src/store.js";

class MemoryStore implements AuthStore {
  users = new Map<string, PasswordUser>();
  tokens = new Map<string, string>();
  sessions = new Map<string, string>();
  learning = new Map<string, LearningStateRecord>();

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
}

const config: AppConfig = {
  NODE_ENV: "test",
  PORT: 3000,
  DATABASE_URL: "mysql://test:test@127.0.0.1/test",
  DATABASE_SSL: false,
  WEB_ORIGIN: "http://127.0.0.1:5173",
  MAIL_FROM: "研数 <verify@mail.gongren.xyz>",
  VERIFICATION_URL_BASE: "http://127.0.0.1:5173/?verify=",
  VERIFICATION_TTL_MINUTES: 60,
  SESSION_DAYS: 30,
  TRUST_PROXY: 1,
};

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
});
