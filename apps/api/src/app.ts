import argon2 from "argon2";
import cookieParser from "cookie-parser";
import cors from "cors";
import express, {
  type NextFunction,
  type Request,
  type Response,
} from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { z } from "zod";
import type { AppConfig } from "./config.js";
import type { VerificationMailer } from "./mailer.js";
import { createOpaqueToken, hashToken } from "./security.js";
import type { AuthStore, PublicUser } from "./store.js";

const SESSION_COOKIE = "kaoyan_session";

type AuthenticatedRequest = Request & { user?: PublicUser };

export function createApp({
  config,
  store,
  mailer,
}: {
  config: AppConfig;
  store: AuthStore;
  mailer: VerificationMailer;
}) {
  const app = express();
  app.set("trust proxy", config.TRUST_PROXY);
  app.use(helmet());
  app.use(
    cors({
      origin: config.WEB_ORIGIN,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "2mb" }));
  app.use(cookieParser());
  app.use((request, response, next) => {
    if (
      !["GET", "HEAD", "OPTIONS"].includes(request.method) &&
      request.headers.origin &&
      request.headers.origin !== config.WEB_ORIGIN
    ) {
      response.status(403).json({ error: "origin_not_allowed" });
      return;
    }
    next();
  });

  const authLimiter =
    config.NODE_ENV === "test"
      ? (_request: Request, _response: Response, next: NextFunction) => next()
      : rateLimit({
          windowMs: 15 * 60 * 1000,
          limit: 20,
          standardHeaders: "draft-8",
          legacyHeaders: false,
        });

  const setSessionCookie = (response: Response, token: string) => {
    response.cookie(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: config.NODE_ENV === "production",
      sameSite: "lax",
      domain: config.COOKIE_DOMAIN,
      path: "/",
      maxAge: config.SESSION_DAYS * 24 * 60 * 60 * 1000,
    });
  };

  const requireUser = async (
    request: AuthenticatedRequest,
    response: Response,
    next: NextFunction,
  ) => {
    const token = request.cookies[SESSION_COOKIE] as string | undefined;
    if (!token) {
      response.status(401).json({ error: "authentication_required" });
      return;
    }
    const user = await store.findUserBySession(hashToken(token));
    if (!user) {
      response.clearCookie(SESSION_COOKIE, {
        domain: config.COOKIE_DOMAIN,
        path: "/",
      });
      response.status(401).json({ error: "authentication_required" });
      return;
    }
    request.user = user;
    next();
  };

  app.get("/health", (_request, response) => {
    response.json({ status: "ok" });
  });

  app.post("/api/auth/register", authLimiter, async (request, response, next) => {
    try {
      const body = z
        .object({
          email: z.string().trim().toLowerCase().email().max(320),
          password: z.string().min(8).max(72),
        })
        .parse(request.body);
      const token = createOpaqueToken();
      const result = await store.registerUser({
        email: body.email,
        passwordHash: await argon2.hash(body.password, {
          type: argon2.argon2id,
        }),
        tokenHash: hashToken(token),
        tokenExpiresAt: new Date(
          Date.now() + config.VERIFICATION_TTL_MINUTES * 60 * 1000,
        ),
      });
      if (result.status === "email_taken") {
        response.status(409).json({ error: "email_already_registered" });
        return;
      }
      await mailer.sendVerification(body.email, token);
      response.status(202).json({ status: "verification_sent" });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/auth/resend", authLimiter, async (request, response, next) => {
    try {
      const { email } = z
        .object({ email: z.string().trim().toLowerCase().email().max(320) })
        .parse(request.body);
      const token = createOpaqueToken();
      const status = await store.replaceVerificationToken({
        email,
        tokenHash: hashToken(token),
        tokenExpiresAt: new Date(
          Date.now() + config.VERIFICATION_TTL_MINUTES * 60 * 1000,
        ),
      });
      if (status === "ready") await mailer.sendVerification(email, token);
      response.status(202).json({ status: "verification_sent_if_available" });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/auth/verify", authLimiter, async (request, response, next) => {
    try {
      const { token } = z
        .object({ token: z.string().min(20).max(200) })
        .parse(request.body);
      const user = await store.verifyEmail(hashToken(token));
      if (!user) {
        response.status(400).json({ error: "verification_token_invalid" });
        return;
      }
      response.json({ user });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/auth/login", authLimiter, async (request, response, next) => {
    try {
      const body = z
        .object({
          email: z.string().trim().toLowerCase().email().max(320),
          password: z.string().min(1).max(72),
        })
        .parse(request.body);
      const user = await store.findUserByEmail(body.email);
      if (!user || !(await argon2.verify(user.passwordHash, body.password))) {
        response.status(401).json({ error: "invalid_credentials" });
        return;
      }
      if (!user.emailVerified) {
        response.status(403).json({ error: "email_not_verified" });
        return;
      }
      const token = createOpaqueToken();
      await store.createSession({
        userId: user.id,
        tokenHash: hashToken(token),
        expiresAt: new Date(
          Date.now() + config.SESSION_DAYS * 24 * 60 * 60 * 1000,
        ),
      });
      setSessionCookie(response, token);
      response.json({
        user: { id: user.id, email: user.email, emailVerified: true },
      });
    } catch (error) {
      next(error);
    }
  });

  app.post(
    "/api/auth/logout",
    async (request: Request, response, next) => {
      try {
        const token = request.cookies[SESSION_COOKIE] as string | undefined;
        if (token) await store.deleteSession(hashToken(token));
        response.clearCookie(SESSION_COOKIE, {
          domain: config.COOKIE_DOMAIN,
          path: "/",
        });
        response.status(204).end();
      } catch (error) {
        next(error);
      }
    },
  );

  app.get(
    "/api/auth/me",
    requireUser,
    (request: AuthenticatedRequest, response) => {
      response.json({ user: request.user });
    },
  );

  app.get(
    "/api/learning-state/:subjectCode",
    requireUser,
    async (request: AuthenticatedRequest, response, next) => {
      try {
        const subjectCode = z.enum(["math1", "math2"]).parse(
          request.params.subjectCode,
        );
        const data = await store.getLearningState(
          request.user!.id,
          subjectCode,
        );
        response.json({ data });
      } catch (error) {
        next(error);
      }
    },
  );

  app.put(
    "/api/learning-state/:subjectCode",
    requireUser,
    async (request: AuthenticatedRequest, response, next) => {
      try {
        const subjectCode = z.enum(["math1", "math2"]).parse(
          request.params.subjectCode,
        );
        const body = z
          .object({
            questionStates: z.record(z.string(), z.unknown()),
            paperSessions: z.record(z.string(), z.unknown()),
          })
          .parse(request.body);
        await store.saveLearningState({
          userId: request.user!.id,
          subjectCode,
          questionStates: body.questionStates,
          paperSessions: body.paperSessions,
        });
        response.json({ status: "saved" });
      } catch (error) {
        next(error);
      }
    },
  );

  app.get(
    "/api/question-animations/:questionId/availability",
    async (request, response, next) => {
      try {
        const questionId = z
          .string()
          .regex(/^math1-\d{4}-q\d{2}$/)
          .parse(request.params.questionId);
        response.set("Cache-Control", "public, max-age=300");
        response.json({
          available: await store.hasQuestionAnimation(questionId),
        });
      } catch (error) {
        next(error);
      }
    },
  );

  app.get(
    "/api/question-animations/:questionId",
    requireUser,
    async (request: AuthenticatedRequest, response, next) => {
      try {
        const questionId = z
          .string()
          .regex(/^math1-\d{4}-q\d{2}$/)
          .parse(request.params.questionId);
        const animation = await store.getQuestionAnimation(questionId);
        if (!animation) {
          response.status(404).json({ error: "animation_not_found" });
          return;
        }
        response.set("Cache-Control", "private, no-store");
        response.json({ animation });
      } catch (error) {
        next(error);
      }
    },
  );

  app.use(
    (
      error: unknown,
      _request: Request,
      response: Response,
      _next: NextFunction,
    ) => {
      if (error instanceof z.ZodError) {
        response.status(400).json({
          error: "invalid_request",
          details: error.issues.map((issue) => issue.message),
        });
        return;
      }
      console.error(error);
      response.status(500).json({ error: "internal_error" });
    },
  );

  return app;
}
