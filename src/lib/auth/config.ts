import { getCloudflareContext } from '@opennextjs/cloudflare';

export const AUTH_COOKIE_NAME = 'shajara_session';
export const SESSION_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days

export async function getDB() {
  try {
    const { env } = await getCloudflareContext();
    return env.DB;
  } catch {
    // For development without Cloudflare context
    return null;
  }
}

export function generateId(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function generateSessionToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function generateReferralCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluding confusing chars
  let code = '';
  const array = new Uint8Array(8);
  crypto.getRandomValues(array);
  for (let i = 0; i < 8; i++) {
    code += chars[array[i] % chars.length];
  }
  return code;
}
