-- Migration: Rate Limiting and Security Tables
-- Created: 2024-12-27

-- Rate limits table for sliding window rate limiting
CREATE TABLE IF NOT EXISTS rate_limits (
  key TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 1,
  reset_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);

-- Index for cleanup of expired entries
CREATE INDEX IF NOT EXISTS idx_rate_limits_reset_at ON rate_limits(reset_at);

-- Login attempts table for account lockout
CREATE TABLE IF NOT EXISTS login_attempts (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  success INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);

-- Index for querying recent attempts by email
CREATE INDEX IF NOT EXISTS idx_login_attempts_email_created ON login_attempts(email, created_at);
CREATE INDEX IF NOT EXISTS idx_login_attempts_ip_created ON login_attempts(ip_address, created_at);

-- Account lockouts table
CREATE TABLE IF NOT EXISTS account_lockouts (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  locked_until INTEGER NOT NULL,
  failed_attempts INTEGER NOT NULL DEFAULT 0,
  last_attempt_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);

-- Index for checking lockout status
CREATE INDEX IF NOT EXISTS idx_account_lockouts_email ON account_lockouts(email);
CREATE INDEX IF NOT EXISTS idx_account_lockouts_locked_until ON account_lockouts(locked_until);

-- Cleanup old rate limit entries (run periodically)
-- DELETE FROM rate_limits WHERE reset_at < (strftime('%s', 'now') * 1000 - 3600000);

-- Cleanup old login attempts older than 24 hours
-- DELETE FROM login_attempts WHERE created_at < (strftime('%s', 'now') - 86400);
