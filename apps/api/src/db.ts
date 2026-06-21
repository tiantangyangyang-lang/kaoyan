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
  RegistrationResult,
} from "./store.js";

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
];

export async function initializeDatabase(pool: Pool): Promise<void> {
  const connection = await pool.getConnection();
  try {
    await connection.query("SELECT 1");
    for (const statement of schemaStatements) {
      await connection.execute(statement);
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

export class MySqlAuthStore implements AuthStore {
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
}
