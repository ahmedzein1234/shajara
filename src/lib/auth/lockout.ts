/**
 * Account Lockout System
 * Implements progressive lockout after failed login attempts
 */

import { getCloudflareContext } from '@opennextjs/cloudflare';

// Lockout configuration
const LOCKOUT_CONFIG = {
  maxAttempts: 5,              // Lock after 5 failed attempts
  lockoutDuration: 15 * 60,    // 15 minutes initial lockout (in seconds)
  maxLockoutDuration: 24 * 60 * 60, // Max 24 hour lockout
  attemptWindow: 15 * 60,      // Count attempts within 15 minute window
  lockoutMultiplier: 2,        // Double lockout time on each subsequent lockout
};

async function getDB() {
  const { env } = await getCloudflareContext();
  return env.DB;
}

interface LockoutStatus {
  isLocked: boolean;
  remainingAttempts: number;
  lockedUntil: number | null;
  message?: string;
}

/**
 * Check if an account is currently locked out
 */
export async function checkAccountLockout(email: string): Promise<LockoutStatus> {
  const db = await getDB();
  const now = Math.floor(Date.now() / 1000);
  const normalizedEmail = email.toLowerCase();

  try {
    // Check for active lockout
    const lockout = await db.prepare(`
      SELECT locked_until, failed_attempts FROM account_lockouts
      WHERE email = ? AND locked_until > ?
    `).bind(normalizedEmail, now).first<{
      locked_until: number;
      failed_attempts: number;
    }>();

    if (lockout) {
      const remainingSeconds = lockout.locked_until - now;
      const remainingMinutes = Math.ceil(remainingSeconds / 60);

      return {
        isLocked: true,
        remainingAttempts: 0,
        lockedUntil: lockout.locked_until,
        message: `Account temporarily locked. Try again in ${remainingMinutes} minute${remainingMinutes > 1 ? 's' : ''}.`,
      };
    }

    // Count recent failed attempts
    const windowStart = now - LOCKOUT_CONFIG.attemptWindow;
    const attempts = await db.prepare(`
      SELECT COUNT(*) as count FROM login_attempts
      WHERE email = ? AND success = 0 AND created_at > ?
    `).bind(normalizedEmail, windowStart).first<{ count: number }>();

    const failedAttempts = attempts?.count || 0;
    const remainingAttempts = Math.max(0, LOCKOUT_CONFIG.maxAttempts - failedAttempts);

    return {
      isLocked: false,
      remainingAttempts,
      lockedUntil: null,
    };
  } catch (error) {
    console.error('Error checking account lockout:', error);
    // Fail open - allow login attempt but log the error
    return {
      isLocked: false,
      remainingAttempts: LOCKOUT_CONFIG.maxAttempts,
      lockedUntil: null,
    };
  }
}

/**
 * Record a login attempt
 */
export async function recordLoginAttempt(
  email: string,
  success: boolean,
  ipAddress?: string,
  userAgent?: string
): Promise<LockoutStatus> {
  const db = await getDB();
  const now = Math.floor(Date.now() / 1000);
  const normalizedEmail = email.toLowerCase();
  const id = crypto.randomUUID();

  try {
    // Record the attempt
    await db.prepare(`
      INSERT INTO login_attempts (id, email, ip_address, user_agent, success, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(id, normalizedEmail, ipAddress || null, userAgent || null, success ? 1 : 0, now).run();

    if (success) {
      // Clear lockout on successful login
      await db.prepare(`
        DELETE FROM account_lockouts WHERE email = ?
      `).bind(normalizedEmail).run();

      // Clean up old attempts
      await db.prepare(`
        DELETE FROM login_attempts WHERE email = ? AND created_at < ?
      `).bind(normalizedEmail, now - LOCKOUT_CONFIG.attemptWindow).run();

      return {
        isLocked: false,
        remainingAttempts: LOCKOUT_CONFIG.maxAttempts,
        lockedUntil: null,
      };
    }

    // Check if we should lock the account
    const windowStart = now - LOCKOUT_CONFIG.attemptWindow;
    const attempts = await db.prepare(`
      SELECT COUNT(*) as count FROM login_attempts
      WHERE email = ? AND success = 0 AND created_at > ?
    `).bind(normalizedEmail, windowStart).first<{ count: number }>();

    const failedAttempts = attempts?.count || 0;

    if (failedAttempts >= LOCKOUT_CONFIG.maxAttempts) {
      // Calculate lockout duration with exponential backoff
      const existingLockout = await db.prepare(`
        SELECT failed_attempts FROM account_lockouts WHERE email = ?
      `).bind(normalizedEmail).first<{ failed_attempts: number }>();

      const previousLockouts = existingLockout?.failed_attempts || 0;
      const multiplier = Math.pow(LOCKOUT_CONFIG.lockoutMultiplier, previousLockouts);
      const lockoutDuration = Math.min(
        LOCKOUT_CONFIG.lockoutDuration * multiplier,
        LOCKOUT_CONFIG.maxLockoutDuration
      );

      const lockedUntil = now + lockoutDuration;

      // Create or update lockout
      await db.prepare(`
        INSERT INTO account_lockouts (id, email, locked_until, failed_attempts, last_attempt_at, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(email) DO UPDATE SET
          locked_until = excluded.locked_until,
          failed_attempts = account_lockouts.failed_attempts + 1,
          last_attempt_at = excluded.last_attempt_at
      `).bind(crypto.randomUUID(), normalizedEmail, lockedUntil, 1, now, now).run();

      const remainingMinutes = Math.ceil(lockoutDuration / 60);

      return {
        isLocked: true,
        remainingAttempts: 0,
        lockedUntil,
        message: `Too many failed attempts. Account locked for ${remainingMinutes} minute${remainingMinutes > 1 ? 's' : ''}.`,
      };
    }

    return {
      isLocked: false,
      remainingAttempts: LOCKOUT_CONFIG.maxAttempts - failedAttempts,
      lockedUntil: null,
    };
  } catch (error) {
    console.error('Error recording login attempt:', error);
    return {
      isLocked: false,
      remainingAttempts: LOCKOUT_CONFIG.maxAttempts,
      lockedUntil: null,
    };
  }
}

/**
 * Check if an IP address should be blocked
 * (For detecting brute force attacks across multiple accounts)
 */
export async function checkIPBlocking(ipAddress: string): Promise<boolean> {
  if (!ipAddress || ipAddress === 'unknown') return false;

  const db = await getDB();
  const now = Math.floor(Date.now() / 1000);
  const windowStart = now - LOCKOUT_CONFIG.attemptWindow;

  try {
    // Count failed attempts from this IP across all accounts
    const attempts = await db.prepare(`
      SELECT COUNT(*) as count FROM login_attempts
      WHERE ip_address = ? AND success = 0 AND created_at > ?
    `).bind(ipAddress, windowStart).first<{ count: number }>();

    // Block if more than 20 failed attempts from same IP
    return (attempts?.count || 0) > 20;
  } catch (error) {
    console.error('Error checking IP blocking:', error);
    return false;
  }
}

/**
 * Clean up expired lockouts and old login attempts
 * Should be run periodically (e.g., via cron job)
 */
export async function cleanupExpiredRecords(): Promise<void> {
  const db = await getDB();
  const now = Math.floor(Date.now() / 1000);
  const dayAgo = now - 24 * 60 * 60;

  try {
    // Remove expired lockouts
    await db.prepare(`
      DELETE FROM account_lockouts WHERE locked_until < ?
    `).bind(now).run();

    // Remove old login attempts (older than 24 hours)
    await db.prepare(`
      DELETE FROM login_attempts WHERE created_at < ?
    `).bind(dayAgo).run();

    // Remove old rate limit entries
    await db.prepare(`
      DELETE FROM rate_limits WHERE reset_at < ?
    `).bind(now * 1000).run();
  } catch (error) {
    console.error('Error cleaning up expired records:', error);
  }
}
