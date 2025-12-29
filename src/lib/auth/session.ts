/**
 * Session validation for API routes
 * Provides secure session validation using cookies only (no header/query bypass)
 */

import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import type { D1Database } from '@cloudflare/workers-types';
import { AUTH_COOKIE_NAME } from './config';

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  locale: string;
  email_verified: boolean;
}

export interface ValidSession {
  user: SessionUser;
  sessionId: string;
  expiresAt: number;
}

/**
 * Validate session from request cookies
 * This is the ONLY way to authenticate API requests - no headers or query params
 *
 * @param db - D1 database instance
 * @returns ValidSession if authenticated, null otherwise
 */
export async function validateSessionFromCookies(db: D1Database): Promise<ValidSession | null> {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(AUTH_COOKIE_NAME)?.value;

    if (!sessionToken) {
      return null;
    }

    return await validateSessionToken(db, sessionToken);
  } catch (error) {
    console.error('Session validation error:', error);
    return null;
  }
}

/**
 * Validate a session token against the database
 *
 * @param db - D1 database instance
 * @param token - Session token to validate
 * @returns ValidSession if valid, null otherwise
 */
export async function validateSessionToken(db: D1Database, token: string): Promise<ValidSession | null> {
  const now = Math.floor(Date.now() / 1000);

  const result = await db.prepare(`
    SELECT
      s.id as session_id,
      s.expires,
      u.id as user_id,
      u.email,
      u.name,
      u.avatar_url,
      u.locale,
      u.email_verified
    FROM sessions s
    JOIN users u ON s.user_id = u.id
    WHERE s.session_token = ? AND s.expires > ?
  `).bind(token, now).first<{
    session_id: string;
    expires: number;
    user_id: string;
    email: string;
    name: string;
    avatar_url: string | null;
    locale: string;
    email_verified: number;
  }>();

  if (!result) {
    return null;
  }

  return {
    user: {
      id: result.user_id,
      email: result.email,
      name: result.name,
      avatar_url: result.avatar_url,
      locale: result.locale,
      email_verified: result.email_verified === 1,
    },
    sessionId: result.session_id,
    expiresAt: result.expires,
  };
}

/**
 * Get the current user ID from a validated session
 * Convenience wrapper that returns just the user ID
 *
 * @param db - D1 database instance
 * @returns User ID if authenticated, null otherwise
 */
export async function getCurrentUserId(db: D1Database): Promise<string | null> {
  const session = await validateSessionFromCookies(db);
  return session?.user.id || null;
}

/**
 * Require authentication for an API route
 * Throws if not authenticated
 *
 * @param db - D1 database instance
 * @returns ValidSession
 * @throws Error if not authenticated
 */
export async function requireAuth(db: D1Database): Promise<ValidSession> {
  const session = await validateSessionFromCookies(db);

  if (!session) {
    throw new Error('Authentication required');
  }

  return session;
}

/**
 * Extend session expiry on activity (sliding session)
 * Call this on successful authenticated requests to keep session alive
 *
 * @param db - D1 database instance
 * @param sessionId - Session ID to extend
 * @param extensionSeconds - Seconds to extend (default: 7 days)
 */
export async function extendSession(
  db: D1Database,
  sessionId: string,
  extensionSeconds: number = 7 * 24 * 60 * 60
): Promise<void> {
  const newExpiry = Math.floor(Date.now() / 1000) + extensionSeconds;

  await db.prepare(`
    UPDATE sessions
    SET expires = ?
    WHERE id = ? AND expires > ?
  `).bind(newExpiry, sessionId, Math.floor(Date.now() / 1000)).run();
}
