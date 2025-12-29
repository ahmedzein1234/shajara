/**
 * Rate Limiting Implementation for API Routes
 * Uses a sliding window algorithm with D1 for storage
 * Falls back to in-memory storage if D1 is not available
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import type { D1Database } from '@cloudflare/workers-types';

// Rate limit configurations for different endpoint types
export const RATE_LIMITS = {
  // Authentication endpoints - strict limits
  login: { requests: 5, windowMs: 60 * 1000 },       // 5 per minute
  register: { requests: 3, windowMs: 60 * 1000 },   // 3 per minute
  passwordReset: { requests: 3, windowMs: 60 * 1000 }, // 3 per minute

  // API endpoints - moderate limits
  api: { requests: 100, windowMs: 60 * 1000 },      // 100 per minute

  // Upload endpoints - strict limits
  upload: { requests: 10, windowMs: 60 * 1000 },    // 10 per minute

  // AI endpoints - very strict limits
  ai: { requests: 20, windowMs: 60 * 1000 },        // 20 per minute

  // Search/read endpoints - relaxed limits
  read: { requests: 200, windowMs: 60 * 1000 },     // 200 per minute
} as const;

export type RateLimitType = keyof typeof RATE_LIMITS;

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory fallback store (for development/testing)
const memoryStore = new Map<string, RateLimitEntry>();

/**
 * Get client identifier from request
 * Uses CF-Connecting-IP header (Cloudflare), X-Forwarded-For, or fallback
 */
function getClientId(request: NextRequest): string {
  // Cloudflare provides real client IP
  const cfIp = request.headers.get('cf-connecting-ip');
  if (cfIp) return cfIp;

  // X-Forwarded-For header (first IP)
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  // X-Real-IP header
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp;

  // Fallback to a hash of user-agent and other headers
  return 'unknown';
}

/**
 * Generate rate limit key
 */
function getRateLimitKey(clientId: string, endpoint: string, type: RateLimitType): string {
  return `ratelimit:${type}:${clientId}:${endpoint}`;
}

/**
 * Check and update rate limit using D1 storage
 */
async function checkRateLimitD1(
  db: D1Database,
  key: string,
  limit: number,
  windowMs: number
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const now = Date.now();
  const resetAt = now + windowMs;

  try {
    // Try to get existing entry
    const result = await db.prepare(`
      SELECT count, reset_at FROM rate_limits WHERE key = ?
    `).bind(key).first<{ count: number; reset_at: number }>();

    if (!result || result.reset_at < now) {
      // Create new entry or reset expired one
      await db.prepare(`
        INSERT OR REPLACE INTO rate_limits (key, count, reset_at, created_at)
        VALUES (?, 1, ?, ?)
      `).bind(key, resetAt, now).run();

      return { allowed: true, remaining: limit - 1, resetAt };
    }

    if (result.count >= limit) {
      return { allowed: false, remaining: 0, resetAt: result.reset_at };
    }

    // Increment count
    await db.prepare(`
      UPDATE rate_limits SET count = count + 1 WHERE key = ?
    `).bind(key).run();

    return {
      allowed: true,
      remaining: limit - result.count - 1,
      resetAt: result.reset_at,
    };
  } catch (error) {
    console.error('Rate limit D1 error, falling back to memory:', error);
    return checkRateLimitMemory(key, limit, windowMs);
  }
}

/**
 * Check and update rate limit using in-memory storage (fallback)
 */
function checkRateLimitMemory(
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = memoryStore.get(key);

  if (!entry || entry.resetAt < now) {
    // Create new entry or reset expired one
    const resetAt = now + windowMs;
    memoryStore.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: limit - 1, resetAt };
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return {
    allowed: true,
    remaining: limit - entry.count,
    resetAt: entry.resetAt,
  };
}

/**
 * Clean up expired entries from memory store
 * Call periodically to prevent memory leaks
 */
export function cleanupMemoryStore(): void {
  const now = Date.now();
  for (const [key, entry] of memoryStore.entries()) {
    if (entry.resetAt < now) {
      memoryStore.delete(key);
    }
  }
}

// Run cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupMemoryStore, 5 * 60 * 1000);
}

/**
 * Rate limit middleware function
 * Returns null if allowed, or a Response if rate limited
 */
export async function rateLimit(
  request: NextRequest,
  type: RateLimitType = 'api',
  customEndpoint?: string
): Promise<NextResponse | null> {
  const config = RATE_LIMITS[type];
  const clientId = getClientId(request);
  const endpoint = customEndpoint || new URL(request.url).pathname;
  const key = getRateLimitKey(clientId, endpoint, type);

  let result: { allowed: boolean; remaining: number; resetAt: number };

  try {
    const { env } = await getCloudflareContext();
    if (env?.DB) {
      result = await checkRateLimitD1(env.DB, key, config.requests, config.windowMs);
    } else {
      result = checkRateLimitMemory(key, config.requests, config.windowMs);
    }
  } catch {
    // If we can't get context, use memory store
    result = checkRateLimitMemory(key, config.requests, config.windowMs);
  }

  // Set rate limit headers on all responses
  const headers = {
    'X-RateLimit-Limit': config.requests.toString(),
    'X-RateLimit-Remaining': Math.max(0, result.remaining).toString(),
    'X-RateLimit-Reset': Math.ceil(result.resetAt / 1000).toString(),
  };

  if (!result.allowed) {
    const retryAfter = Math.ceil((result.resetAt - Date.now()) / 1000);

    return new NextResponse(
      JSON.stringify({
        success: false,
        error: 'rate_limit_exceeded',
        message: 'Too many requests. Please try again later.',
        retryAfter,
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': retryAfter.toString(),
          ...headers,
        },
      }
    );
  }

  return null;
}

/**
 * Get rate limit type based on pathname
 */
export function getRateLimitType(pathname: string): RateLimitType {
  if (pathname.includes('/api/auth/login') || pathname.includes('/login')) {
    return 'login';
  }
  if (pathname.includes('/api/auth/register') || pathname.includes('/register')) {
    return 'register';
  }
  if (pathname.includes('/api/auth/reset') || pathname.includes('/reset-password')) {
    return 'passwordReset';
  }
  if (pathname.includes('/api/upload')) {
    return 'upload';
  }
  if (pathname.includes('/api/ai')) {
    return 'ai';
  }
  if (pathname.startsWith('/api/') && (pathname.includes('GET') || !pathname.includes('POST'))) {
    return 'read';
  }
  return 'api';
}

/**
 * Create rate limit headers to add to responses
 */
export function createRateLimitHeaders(type: RateLimitType): Record<string, string> {
  const config = RATE_LIMITS[type];
  return {
    'X-RateLimit-Limit': config.requests.toString(),
  };
}
