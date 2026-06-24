import { randomUUID } from "node:crypto";
import mysql, {
  type Pool,
  type ResultSetHeader,
  type RowDataPacket,
} from "mysql2/promise";
import type { AppConfig } from "./config.js";
import type {
  AuthStore,
  LearningStateRecord,
  PasswordUser,
  PublicUser,
  QuestionAnimationRecord,
  RegistrationResult,
} from "./store.js";
import type {
  ContentOption,
  ContentQuestionDetail,
  ContentQuestionPage,
  ContentStore,
} from "./content-store.js";
import {
  mathAnimationSpecSchema,
  QUESTION_ANIMATION_SEEDS,
} from "./animationSeeds.js";

interface UserRow extends RowDataPacket {
  id: string;
  email: string;
  password_hash: string;
  email_verified_at: Date | null;
}

export function createDatabasePool(config: AppConfig): Pool {
  const url = new URL(config.DATABASE_URL);
  const ca = config.DATABASE_CA_BASE64
    ? Buffer.from(config.DATABASE_CA_BASE64, "base64").toString("utf8")
    : undefined;
  return mysql.createPool({
    host: url.hostname,
    port: Number(url.port || 3306),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.replace(/^\//, ""),
    connectionLimit: 5,
    timezone: "Z",
    ssl: config.DATABASE_SSL
      ? { rejectUnauthorized: true, ...(ca ? { ca } : {}) }
      : undefined,
  });
}

const schemaStatements = [
  `CREATE TABLE IF NOT EXISTS kaoyan_users (
    id CHAR(36) PRIMARY KEY,
    email VARCHAR(320) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    email_verified_at DATETIME(3) NULL,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
  )`,
  `CREATE TABLE IF NOT EXISTS kaoyan_email_verification_tokens (
    id CHAR(36) PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    token_hash CHAR(64) NOT NULL UNIQUE,
    expires_at DATETIME(3) NOT NULL,
    used_at DATETIME(3) NULL,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    CONSTRAINT fk_kaoyan_verification_user FOREIGN KEY (user_id) REFERENCES kaoyan_users(id) ON DELETE CASCADE,
    INDEX idx_verification_user (user_id),
    INDEX idx_verification_expiry (expires_at)
  )`,
  `CREATE TABLE IF NOT EXISTS kaoyan_sessions (
    id CHAR(36) PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    token_hash CHAR(64) NOT NULL UNIQUE,
    expires_at DATETIME(3) NOT NULL,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    last_seen_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    CONSTRAINT fk_kaoyan_session_user FOREIGN KEY (user_id) REFERENCES kaoyan_users(id) ON DELETE CASCADE,
    INDEX idx_session_user (user_id),
    INDEX idx_session_expiry (expires_at)
  )`,
  `CREATE TABLE IF NOT EXISTS kaoyan_learning_states (
    user_id CHAR(36) NOT NULL,
    subject_code VARCHAR(32) NOT NULL,
    question_states JSON NOT NULL,
    paper_sessions JSON NOT NULL,
    updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (user_id, subject_code),
    CONSTRAINT fk_kaoyan_learning_user FOREIGN KEY (user_id) REFERENCES kaoyan_users(id) ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS kaoyan_content_batches (
    id VARCHAR(128) PRIMARY KEY,
    subject_code VARCHAR(32) NOT NULL,
    source_year SMALLINT UNSIGNED NOT NULL,
    schema_version VARCHAR(64) NOT NULL,
    source_repo VARCHAR(128) NOT NULL,
    source_commit CHAR(40) NOT NULL,
    source_dirty BOOLEAN NOT NULL,
    source_files JSON NOT NULL,
    expected_counts JSON NOT NULL,
    actual_counts JSON NOT NULL,
    content_hash CHAR(64) NOT NULL,
    status ENUM('staging', 'published', 'superseded', 'failed') NOT NULL DEFAULT 'staging',
    published_slot VARCHAR(64) GENERATED ALWAYS AS (
      CASE WHEN status = 'published' THEN CONCAT(subject_code, ':', source_year) ELSE NULL END
    ) STORED,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    published_at DATETIME(3) NULL,
    INDEX idx_content_batch_public (subject_code, status, source_year),
    INDEX idx_content_batch_year (subject_code, source_year),
    UNIQUE KEY uq_content_published_slot (published_slot)
  )`,
  `CREATE TABLE IF NOT EXISTS kaoyan_questions (
    batch_id VARCHAR(128) NOT NULL,
    stable_id VARCHAR(64) NOT NULL,
    subject_code VARCHAR(32) NOT NULL,
    source_year SMALLINT UNSIGNED NOT NULL,
    question_number SMALLINT UNSIGNED NOT NULL,
    question_type VARCHAR(32) NOT NULL,
    stem MEDIUMTEXT NOT NULL,
    options_json JSON NOT NULL,
    answer_text MEDIUMTEXT NULL,
    answer_status VARCHAR(64) NOT NULL,
    explanation_text LONGTEXT NULL,
    explanation_status VARCHAR(64) NOT NULL,
    source_traceability JSON NOT NULL,
    review_status VARCHAR(64) NOT NULL,
    finalization_status VARCHAR(64) NOT NULL,
    knowledge_points JSON NOT NULL,
    anomalies JSON NOT NULL,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (batch_id, stable_id),
    UNIQUE KEY uq_question_batch_number (batch_id, question_number),
    CONSTRAINT fk_kaoyan_question_batch FOREIGN KEY (batch_id) REFERENCES kaoyan_content_batches(id) ON DELETE CASCADE,
    INDEX idx_question_list (subject_code, source_year, question_type, question_number),
    INDEX idx_question_stable (stable_id)
  )`,
  `CREATE TABLE IF NOT EXISTS kaoyan_question_animations (
    question_id VARCHAR(64) PRIMARY KEY,
    subject_code VARCHAR(32) NOT NULL,
    payload JSON NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    INDEX idx_question_animation_subject (subject_code, is_active)
  )`,
];

export async function initializeDatabase(pool: Pool): Promise<void> {
  const connection = await pool.getConnection();
  try {
    await connection.query("SELECT 1");
    for (const statement of schemaStatements) {
      await connection.execute(statement);
    }
    await connection.beginTransaction();
    try {
      for (const seed of QUESTION_ANIMATION_SEEDS) {
        await connection.execute(
          `INSERT IGNORE INTO kaoyan_question_animations
             (question_id, subject_code, payload)
           VALUES (?, ?, ?)`,
          [seed.questionId, seed.subjectCode, JSON.stringify(seed.payload)],
        );
      }
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    }
  } finally {
    connection.release();
  }
}

const toPublicUser = (row: UserRow): PublicUser => ({
  id: row.id,
  email: row.email,
  emailVerified: Boolean(row.email_verified_at),
});

interface QuestionContentRow extends RowDataPacket {
  stable_id: string;
  source_year: number;
  question_type: string;
  question_number: number;
  stem: string;
  options_json: string | ContentOption[];
  answer_text: string | null;
  answer_status: string;
  explanation_text: string | null;
  explanation_status: string;
  review_status: string;
  finalization_status: string;
  knowledge_points: string | string[];
}

const parseJson = <T>(value: string | T): T =>
  typeof value === "string" ? (JSON.parse(value) as T) : value;

const toListItem = (row: QuestionContentRow) => ({
  stableId: row.stable_id,
  sourceYear: row.source_year,
  type: row.question_type,
  questionNumber: row.question_number,
  stem: row.stem,
  options: parseJson<ContentOption[]>(row.options_json),
  finalizationStatus: row.finalization_status,
});

export class MySqlAuthStore implements AuthStore, ContentStore {
  constructor(private readonly pool: Pool) {}

  async registerUser(input: {
    email: string;
    passwordHash: string;
    tokenHash: string;
    tokenExpiresAt: Date;
  }): Promise<RegistrationResult> {
    const connection = await this.pool.getConnection();
    try {
      await connection.beginTransaction();
      const [rows] = await connection.query<UserRow[]>(
        "SELECT id, email, password_hash, email_verified_at FROM kaoyan_users WHERE email = ? FOR UPDATE",
        [input.email],
      );
      const existing = rows[0];
      if (existing?.email_verified_at) {
        await connection.rollback();
        return { status: "email_taken" };
      }
      const userId = existing?.id ?? randomUUID();
      if (existing) {
        await connection.execute(
          "UPDATE kaoyan_users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP(3) WHERE id = ?",
          [input.passwordHash, userId],
        );
      } else {
        await connection.execute(
          "INSERT INTO kaoyan_users (id, email, password_hash) VALUES (?, ?, ?)",
          [userId, input.email, input.passwordHash],
        );
      }
      await connection.execute(
        "UPDATE kaoyan_email_verification_tokens SET used_at = CURRENT_TIMESTAMP(3) WHERE user_id = ? AND used_at IS NULL",
        [userId],
      );
      await connection.execute(
        "INSERT INTO kaoyan_email_verification_tokens (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, ?)",
        [randomUUID(), userId, input.tokenHash, input.tokenExpiresAt],
      );
      await connection.commit();
      return { status: "ready", userId };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async replaceVerificationToken(input: {
    email: string;
    tokenHash: string;
    tokenExpiresAt: Date;
  }): Promise<"ready" | "already_verified" | "not_found"> {
    const connection = await this.pool.getConnection();
    try {
      await connection.beginTransaction();
      const [rows] = await connection.query<UserRow[]>(
        "SELECT id, email, password_hash, email_verified_at FROM kaoyan_users WHERE email = ? FOR UPDATE",
        [input.email],
      );
      const user = rows[0];
      if (!user) {
        await connection.rollback();
        return "not_found";
      }
      if (user.email_verified_at) {
        await connection.rollback();
        return "already_verified";
      }
      await connection.execute(
        "UPDATE kaoyan_email_verification_tokens SET used_at = CURRENT_TIMESTAMP(3) WHERE user_id = ? AND used_at IS NULL",
        [user.id],
      );
      await connection.execute(
        "INSERT INTO kaoyan_email_verification_tokens (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, ?)",
        [randomUUID(), user.id, input.tokenHash, input.tokenExpiresAt],
      );
      await connection.commit();
      return "ready";
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async verifyEmail(tokenHash: string): Promise<PublicUser | null> {
    const connection = await this.pool.getConnection();
    try {
      await connection.beginTransaction();
      const [rows] = await connection.query<UserRow[]>(
        `SELECT u.id, u.email, u.password_hash, u.email_verified_at
         FROM kaoyan_email_verification_tokens t
         JOIN kaoyan_users u ON u.id = t.user_id
         WHERE t.token_hash = ? AND t.used_at IS NULL AND t.expires_at > CURRENT_TIMESTAMP(3)
         FOR UPDATE`,
        [tokenHash],
      );
      const user = rows[0];
      if (!user) {
        await connection.rollback();
        return null;
      }
      await connection.execute(
        "UPDATE kaoyan_users SET email_verified_at = COALESCE(email_verified_at, CURRENT_TIMESTAMP(3)), updated_at = CURRENT_TIMESTAMP(3) WHERE id = ?",
        [user.id],
      );
      await connection.execute(
        "UPDATE kaoyan_email_verification_tokens SET used_at = CURRENT_TIMESTAMP(3) WHERE user_id = ? AND used_at IS NULL",
        [user.id],
      );
      await connection.commit();
      return { id: user.id, email: user.email, emailVerified: true };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async findUserByEmail(email: string): Promise<PasswordUser | null> {
    const [rows] = await this.pool.query<UserRow[]>(
      "SELECT id, email, password_hash, email_verified_at FROM kaoyan_users WHERE email = ?",
      [email],
    );
    const user = rows[0];
    return user
      ? { ...toPublicUser(user), passwordHash: user.password_hash }
      : null;
  }

  async createSession(input: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<void> {
    await this.pool.execute(
      "INSERT INTO kaoyan_sessions (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, ?)",
      [randomUUID(), input.userId, input.tokenHash, input.expiresAt],
    );
  }

  async findUserBySession(tokenHash: string): Promise<PublicUser | null> {
    const [rows] = await this.pool.query<UserRow[]>(
      `SELECT u.id, u.email, u.password_hash, u.email_verified_at
       FROM kaoyan_sessions s JOIN kaoyan_users u ON u.id = s.user_id
       WHERE s.token_hash = ? AND s.expires_at > CURRENT_TIMESTAMP(3)`,
      [tokenHash],
    );
    const user = rows[0];
    if (!user) return null;
    await this.pool.execute(
      "UPDATE kaoyan_sessions SET last_seen_at = CURRENT_TIMESTAMP(3) WHERE token_hash = ?",
      [tokenHash],
    );
    return toPublicUser(user);
  }

  async deleteSession(tokenHash: string): Promise<void> {
    await this.pool.execute("DELETE FROM kaoyan_sessions WHERE token_hash = ?", [
      tokenHash,
    ]);
  }

  async getLearningState(
    userId: string,
    subjectCode: string,
  ): Promise<LearningStateRecord | null> {
    const [rows] = await this.pool.query<
      Array<
        RowDataPacket & {
          question_states: string | Record<string, unknown>;
          paper_sessions: string | Record<string, unknown>;
          updated_at: Date;
        }
      >
    >(
      "SELECT question_states, paper_sessions, updated_at FROM kaoyan_learning_states WHERE user_id = ? AND subject_code = ?",
      [userId, subjectCode],
    );
    const row = rows[0];
    if (!row) return null;
    const parseJson = (value: string | Record<string, unknown>) =>
      typeof value === "string"
        ? (JSON.parse(value) as Record<string, unknown>)
        : value;
    return {
      questionStates: parseJson(row.question_states),
      paperSessions: parseJson(row.paper_sessions),
      updatedAt: row.updated_at.toISOString(),
    };
  }

  async saveLearningState(input: {
    userId: string;
    subjectCode: string;
    questionStates: Record<string, unknown>;
    paperSessions: Record<string, unknown>;
  }): Promise<void> {
    await this.pool.execute<ResultSetHeader>(
      `INSERT INTO kaoyan_learning_states
         (user_id, subject_code, question_states, paper_sessions)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         question_states = VALUES(question_states),
         paper_sessions = VALUES(paper_sessions),
         updated_at = CURRENT_TIMESTAMP(3)`,
      [
        input.userId,
        input.subjectCode,
        JSON.stringify(input.questionStates),
        JSON.stringify(input.paperSessions),
      ],
    );
  }

  async listPublishedQuestions(input: {
    subjectCode: "math2";
    year?: number;
    type?: "multiple_choice" | "fill_in_blank" | "solution";
    page: number;
    pageSize: number;
  }): Promise<ContentQuestionPage> {
    const filters = ["b.status = 'published'", "q.subject_code = ?"];
    const params: Array<string | number> = [input.subjectCode];
    if (input.year !== undefined) {
      filters.push("q.source_year = ?");
      params.push(input.year);
    }
    if (input.type !== undefined) {
      filters.push("q.question_type = ?");
      params.push(input.type);
    }
    const where = filters.join(" AND ");
    const [countRows] = await this.pool.query<
      Array<RowDataPacket & { total: number }>
    >(
      `SELECT COUNT(*) AS total
       FROM kaoyan_questions q
       JOIN kaoyan_content_batches b ON b.id = q.batch_id
       WHERE ${where}`,
      params,
    );
    const totalItems = Number(countRows[0]?.total ?? 0);
    const offset = (input.page - 1) * input.pageSize;
    const [rows] = await this.pool.query<QuestionContentRow[]>(
      `SELECT q.stable_id, q.source_year, q.question_type, q.question_number,
              q.stem, q.options_json, q.answer_text, q.answer_status,
              q.explanation_text, q.explanation_status, q.review_status,
              q.finalization_status, q.knowledge_points
       FROM kaoyan_questions q
       JOIN kaoyan_content_batches b ON b.id = q.batch_id
       WHERE ${where}
       ORDER BY q.source_year DESC, q.question_number ASC
       LIMIT ? OFFSET ?`,
      [...params, input.pageSize, offset],
    );
    return {
      items: rows.map(toListItem),
      page: input.page,
      pageSize: input.pageSize,
      totalItems,
      totalPages: Math.ceil(totalItems / input.pageSize),
    };
  }

  async getPublishedQuestion(
    subjectCode: "math2",
    stableId: string,
  ): Promise<ContentQuestionDetail | null> {
    const [rows] = await this.pool.query<QuestionContentRow[]>(
      `SELECT q.stable_id, q.source_year, q.question_type, q.question_number,
              q.stem, q.options_json, q.answer_text, q.answer_status,
              q.explanation_text, q.explanation_status, q.review_status,
              q.finalization_status, q.knowledge_points
       FROM kaoyan_questions q
       JOIN kaoyan_content_batches b ON b.id = q.batch_id
       WHERE b.status = 'published' AND q.subject_code = ? AND q.stable_id = ?
       LIMIT 1`,
      [subjectCode, stableId],
    );
    const row = rows[0];
    return row
      ? {
          ...toListItem(row),
          answer: row.answer_text,
          answerStatus: row.answer_status,
          explanation: row.explanation_text,
          explanationStatus: row.explanation_status,
          reviewStatus: row.review_status,
          knowledgePoints: parseJson<string[]>(row.knowledge_points),
        }
      : null;
  }

  async getQuestionAnimation(
    questionId: string,
  ): Promise<QuestionAnimationRecord | null> {
    const [rows] = await this.pool.query<
      Array<
        RowDataPacket & {
          question_id: string;
          subject_code: string;
          payload: string | Record<string, unknown>;
          updated_at: Date;
        }
      >
    >(
      `SELECT question_id, subject_code, payload, updated_at
       FROM kaoyan_question_animations
       WHERE question_id = ? AND is_active = TRUE`,
      [questionId],
    );
    const row = rows[0];
    if (!row) return null;
    const payload =
      typeof row.payload === "string" ? JSON.parse(row.payload) : row.payload;
    return {
      questionId: row.question_id,
      subjectCode: row.subject_code,
      payload: mathAnimationSpecSchema.parse(payload),
      updatedAt: row.updated_at.toISOString(),
    };
  }

  async hasQuestionAnimation(questionId: string): Promise<boolean> {
    const [rows] = await this.pool.query<Array<RowDataPacket & { found: number }>>(
      `SELECT 1 AS found
       FROM kaoyan_question_animations
       WHERE question_id = ? AND is_active = TRUE
       LIMIT 1`,
      [questionId],
    );
    return Boolean(rows[0]?.found);
  }
}
