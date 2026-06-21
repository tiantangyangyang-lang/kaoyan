CREATE TABLE IF NOT EXISTS kaoyan_users (
  id CHAR(36) PRIMARY KEY,
  email VARCHAR(320) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  email_verified_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
);

CREATE TABLE IF NOT EXISTS kaoyan_email_verification_tokens (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  token_hash CHAR(64) NOT NULL UNIQUE,
  expires_at DATETIME(3) NOT NULL,
  used_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT fk_kaoyan_verification_user FOREIGN KEY (user_id) REFERENCES kaoyan_users(id) ON DELETE CASCADE,
  INDEX idx_verification_user (user_id),
  INDEX idx_verification_expiry (expires_at)
);

CREATE TABLE IF NOT EXISTS kaoyan_sessions (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  token_hash CHAR(64) NOT NULL UNIQUE,
  expires_at DATETIME(3) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  last_seen_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT fk_kaoyan_session_user FOREIGN KEY (user_id) REFERENCES kaoyan_users(id) ON DELETE CASCADE,
  INDEX idx_session_user (user_id),
  INDEX idx_session_expiry (expires_at)
);

CREATE TABLE IF NOT EXISTS kaoyan_learning_states (
  user_id CHAR(36) NOT NULL,
  subject_code VARCHAR(32) NOT NULL,
  question_states JSON NOT NULL,
  paper_sessions JSON NOT NULL,
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (user_id, subject_code),
  CONSTRAINT fk_kaoyan_learning_user FOREIGN KEY (user_id) REFERENCES kaoyan_users(id) ON DELETE CASCADE
);
