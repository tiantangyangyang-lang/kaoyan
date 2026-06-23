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

CREATE TABLE IF NOT EXISTS kaoyan_content_batches (
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
);

CREATE TABLE IF NOT EXISTS kaoyan_questions (
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
);
