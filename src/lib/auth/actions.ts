'use server';

import { cookies } from 'next/headers';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import bcrypt from 'bcryptjs';
import {
  AUTH_COOKIE_NAME,
  SESSION_DURATION,
  generateId,
  generateSessionToken,
  generateReferralCode
} from './config';
import { checkAccountLockout, recordLoginAttempt } from './lockout';

// Password complexity requirements
const MIN_PASSWORD_LENGTH = 12;
const BCRYPT_ROUNDS = 12;

// Types
export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  locale: string;
  email_verified: boolean;
  created_at: number;
}

export interface Session {
  id: string;
  user_id: string;
  session_token: string;
  expires: number;
}

interface DbUser {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  locale: string;
  password_hash: string | null;
  auth_provider: string;
  provider_id: string | null;
  email_verified: number;
  created_at: number;
  updated_at: number;
}

async function getDB() {
  const { env } = await getCloudflareContext();
  return env.DB;
}

// Validate password complexity
function validatePasswordComplexity(password: string): { valid: boolean; error?: string } {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return { valid: false, error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` };
  }
  return { valid: true };
}

// Hash password using bcrypt (secure)
async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

// Verify password - supports both bcrypt (new) and legacy SHA-256 hashes
async function verifyPassword(password: string, storedHash: string): Promise<{ valid: boolean; needsUpgrade: boolean }> {
  // Check if it's a bcrypt hash (starts with $2a$, $2b$, or $2y$)
  if (storedHash.startsWith('$2')) {
    const valid = await bcrypt.compare(password, storedHash);
    return { valid, needsUpgrade: false };
  }

  // Legacy SHA-256 format: "salt:hash"
  const [salt, hash] = storedHash.split(':');
  if (!salt || !hash) {
    return { valid: false, needsUpgrade: false };
  }

  // Verify legacy SHA-256 hash
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const computedHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  const valid = computedHash === hash;
  return { valid, needsUpgrade: valid }; // If valid, needs upgrade to bcrypt
}

// Upgrade password hash from SHA-256 to bcrypt
async function upgradePasswordHash(userId: string, password: string): Promise<void> {
  const db = await getDB();
  const newHash = await hashPassword(password);
  await db.prepare('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?')
    .bind(newHash, Math.floor(Date.now() / 1000), userId)
    .run();
}

// Get current session
export async function getSession(): Promise<{ user: User; session: Session } | null> {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(AUTH_COOKIE_NAME)?.value;

    if (!sessionToken) {
      return null;
    }

    const db = await getDB();
    const now = Math.floor(Date.now() / 1000);

    // Get session and user
    const result = await db.prepare(`
      SELECT
        s.id as session_id,
        s.session_token,
        s.expires,
        u.id,
        u.email,
        u.name,
        u.avatar_url,
        u.locale,
        u.email_verified,
        u.created_at
      FROM sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.session_token = ? AND s.expires > ?
    `).bind(sessionToken, now).first<{
      session_id: string;
      session_token: string;
      expires: number;
      id: string;
      email: string;
      name: string;
      avatar_url: string | null;
      locale: string;
      email_verified: number;
      created_at: number;
    }>();

    if (!result) {
      return null;
    }

    return {
      user: {
        id: result.id,
        email: result.email,
        name: result.name,
        avatar_url: result.avatar_url,
        locale: result.locale,
        email_verified: result.email_verified === 1,
        created_at: result.created_at,
      },
      session: {
        id: result.session_id,
        user_id: result.id,
        session_token: result.session_token,
        expires: result.expires,
      },
    };
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
}

// Register new user
export async function register(data: {
  email: string;
  password: string;
  name: string;
  locale?: string;
  referralCode?: string;
}): Promise<{ success: boolean; error?: string; user?: User }> {
  try {
    // Validate password complexity
    const passwordCheck = validatePasswordComplexity(data.password);
    if (!passwordCheck.valid) {
      return { success: false, error: passwordCheck.error };
    }

    const db = await getDB();

    // Check if email already exists
    const existing = await db.prepare(
      'SELECT id FROM users WHERE email = ?'
    ).bind(data.email.toLowerCase()).first();

    if (existing) {
      return { success: false, error: 'email_exists' };
    }

    // Hash password with bcrypt
    const passwordHash = await hashPassword(data.password);
    const userId = generateId();
    const now = Math.floor(Date.now() / 1000);

    // Create user
    await db.prepare(`
      INSERT INTO users (id, email, name, locale, password_hash, auth_provider, email_verified, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 'email', 0, ?, ?)
    `).bind(
      userId,
      data.email.toLowerCase(),
      data.name,
      data.locale || 'ar',
      passwordHash,
      now,
      now
    ).run();

    // Generate referral code for new user
    const referralCode = generateReferralCode();
    await db.prepare(`
      INSERT INTO referrals (id, referrer_id, code, status, created_at)
      VALUES (?, ?, ?, 'active', ?)
    `).bind(generateId(), userId, referralCode, now).run();

    // Handle referral if code provided
    if (data.referralCode) {
      await db.prepare(`
        UPDATE referrals
        SET referred_id = ?, status = 'completed', completed_at = ?
        WHERE code = ? AND status = 'pending' AND referred_id IS NULL
      `).bind(userId, now, data.referralCode).run();
    }

    // Create session
    const sessionToken = generateSessionToken();
    const expires = now + Math.floor(SESSION_DURATION / 1000);

    await db.prepare(`
      INSERT INTO sessions (id, session_token, user_id, expires, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).bind(generateId(), sessionToken, userId, expires, now).run();

    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set(AUTH_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: new Date(expires * 1000),
      path: '/',
    });

    return {
      success: true,
      user: {
        id: userId,
        email: data.email.toLowerCase(),
        name: data.name,
        avatar_url: null,
        locale: data.locale || 'ar',
        email_verified: false,
        created_at: now,
      },
    };
  } catch (error) {
    console.error('Registration error:', error);
    return { success: false, error: 'registration_failed' };
  }
}

// Login user
export async function login(data: {
  email: string;
  password: string;
}): Promise<{ success: boolean; error?: string; user?: User; remainingAttempts?: number }> {
  try {
    // Check for account lockout first
    const lockoutStatus = await checkAccountLockout(data.email);
    if (lockoutStatus.isLocked) {
      return {
        success: false,
        error: 'account_locked',
        remainingAttempts: 0,
      };
    }

    const db = await getDB();

    // Get user
    const user = await db.prepare(
      'SELECT * FROM users WHERE email = ? AND auth_provider = ?'
    ).bind(data.email.toLowerCase(), 'email').first<DbUser>();

    if (!user || !user.password_hash) {
      // Record failed attempt (user not found)
      await recordLoginAttempt(data.email, false);
      return {
        success: false,
        error: 'invalid_credentials',
        remainingAttempts: lockoutStatus.remainingAttempts - 1,
      };
    }

    // Verify password (supports bcrypt and legacy SHA-256)
    const passwordResult = await verifyPassword(data.password, user.password_hash);
    if (!passwordResult.valid) {
      // Record failed attempt (wrong password)
      const newLockoutStatus = await recordLoginAttempt(data.email, false);
      return {
        success: false,
        error: newLockoutStatus.isLocked ? 'account_locked' : 'invalid_credentials',
        remainingAttempts: newLockoutStatus.remainingAttempts,
      };
    }

    // Record successful login
    await recordLoginAttempt(data.email, true);

    // Upgrade legacy SHA-256 hash to bcrypt on successful login
    if (passwordResult.needsUpgrade) {
      await upgradePasswordHash(user.id, data.password);
    }

    // Create session
    const now = Math.floor(Date.now() / 1000);
    const sessionToken = generateSessionToken();
    const expires = now + Math.floor(SESSION_DURATION / 1000);

    await db.prepare(`
      INSERT INTO sessions (id, session_token, user_id, expires, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).bind(generateId(), sessionToken, user.id, expires, now).run();

    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set(AUTH_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: new Date(expires * 1000),
      path: '/',
    });

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar_url: user.avatar_url,
        locale: user.locale,
        email_verified: user.email_verified === 1,
        created_at: user.created_at,
      },
    };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, error: 'login_failed' };
  }
}

// Logout user
export async function logout(): Promise<{ success: boolean }> {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(AUTH_COOKIE_NAME)?.value;

    if (sessionToken) {
      const db = await getDB();
      await db.prepare('DELETE FROM sessions WHERE session_token = ?')
        .bind(sessionToken).run();
    }

    cookieStore.delete(AUTH_COOKIE_NAME);

    return { success: true };
  } catch (error) {
    console.error('Logout error:', error);
    return { success: false };
  }
}

// Update user profile
export async function updateProfile(data: {
  name?: string;
  locale?: string;
  avatar_url?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getSession();
    if (!session) {
      return { success: false, error: 'not_authenticated' };
    }

    const db = await getDB();
    const updates: string[] = [];
    const values: (string | number)[] = [];

    if (data.name) {
      updates.push('name = ?');
      values.push(data.name);
    }
    if (data.locale) {
      updates.push('locale = ?');
      values.push(data.locale);
    }
    if (data.avatar_url !== undefined) {
      updates.push('avatar_url = ?');
      values.push(data.avatar_url);
    }

    if (updates.length === 0) {
      return { success: true };
    }

    updates.push('updated_at = ?');
    values.push(Math.floor(Date.now() / 1000));
    values.push(session.user.id);

    await db.prepare(`
      UPDATE users SET ${updates.join(', ')} WHERE id = ?
    `).bind(...values).run();

    return { success: true };
  } catch (error) {
    console.error('Update profile error:', error);
    return { success: false, error: 'update_failed' };
  }
}

// Get user's referral info
export async function getReferralInfo(): Promise<{
  code: string;
  referralCount: number;
  rewards: { type: string; count: number }[];
} | null> {
  try {
    const session = await getSession();
    if (!session) return null;

    const db = await getDB();

    // Get user's referral code
    const referral = await db.prepare(`
      SELECT code FROM referrals WHERE referrer_id = ? AND status = 'active'
    `).bind(session.user.id).first<{ code: string }>();

    // Count completed referrals
    const countResult = await db.prepare(`
      SELECT COUNT(*) as count FROM referrals
      WHERE referrer_id = ? AND status IN ('completed', 'rewarded')
    `).bind(session.user.id).first<{ count: number }>();

    // Get rewards
    const rewards = await db.prepare(`
      SELECT reward_type, COUNT(*) as count FROM referrals
      WHERE referrer_id = ? AND status = 'rewarded'
      GROUP BY reward_type
    `).bind(session.user.id).all<{ reward_type: string; count: number }>();

    return {
      code: referral?.code || generateReferralCode(),
      referralCount: countResult?.count || 0,
      rewards: rewards.results.map(r => ({ type: r.reward_type, count: r.count })),
    };
  } catch (error) {
    console.error('Get referral info error:', error);
    return null;
  }
}
