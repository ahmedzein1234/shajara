/**
 * Web Push Notification Service
 * Handles sending push notifications via Web Push API
 */

import { getUserPushSubscriptions, type Notification } from '@/lib/db/notification-actions';

// VAPID keys should be stored in environment variables
// Generate with: npx web-push generate-vapid-keys
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@shajara.app';

interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: {
    url?: string;
    notificationId?: string;
    [key: string]: unknown;
  };
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

/**
 * Generate JWT for VAPID authentication
 */
async function generateVapidJwt(audience: string): Promise<string> {
  const header = {
    typ: 'JWT',
    alg: 'ES256',
  };

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    aud: audience,
    exp: now + 12 * 60 * 60, // 12 hours
    sub: VAPID_SUBJECT,
  };

  // Base64URL encode
  const base64url = (data: unknown) =>
    btoa(JSON.stringify(data))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

  const unsignedToken = `${base64url(header)}.${base64url(payload)}`;

  // Import VAPID private key
  const privateKeyBuffer = Uint8Array.from(
    atob(VAPID_PRIVATE_KEY.replace(/-/g, '+').replace(/_/g, '/')),
    (c) => c.charCodeAt(0)
  );

  const key = await crypto.subtle.importKey(
    'pkcs8',
    privateKeyBuffer,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  );

  // Sign the token
  const encoder = new TextEncoder();
  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    key,
    encoder.encode(unsignedToken)
  );

  const signatureBase64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  return `${unsignedToken}.${signatureBase64}`;
}

/**
 * Send a push notification to a single subscription
 */
async function sendPushToSubscription(
  subscription: { endpoint: string; p256dh_key: string; auth_key: string },
  payload: PushPayload
): Promise<boolean> {
  try {
    const url = new URL(subscription.endpoint);
    const audience = `${url.protocol}//${url.host}`;

    // Generate VAPID JWT
    const jwt = await generateVapidJwt(audience);

    // Create the push message
    const response = await fetch(subscription.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Encoding': 'aes128gcm',
        'TTL': '86400', // 24 hours
        'Authorization': `vapid t=${jwt}, k=${VAPID_PUBLIC_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error('Push notification failed:', response.status, await response.text());
      return false;
    }

    return true;
  } catch (error) {
    console.error('Send push to subscription error:', error);
    return false;
  }
}

/**
 * Send push notification to a user
 */
export async function sendPushNotification(
  userId: string,
  payload: PushPayload
): Promise<{ success: boolean; sent: number; failed: number }> {
  try {
    const subscriptions = await getUserPushSubscriptions(userId);

    if (subscriptions.length === 0) {
      return { success: true, sent: 0, failed: 0 };
    }

    let sent = 0;
    let failed = 0;

    for (const sub of subscriptions) {
      const result = await sendPushToSubscription(sub, payload);
      if (result) {
        sent++;
      } else {
        failed++;
      }
    }

    return { success: sent > 0, sent, failed };
  } catch (error) {
    console.error('Send push notification error:', error);
    return { success: false, sent: 0, failed: 0 };
  }
}

/**
 * Send push notification from a Notification object
 */
export async function sendNotificationPush(
  notification: Notification,
  locale: 'ar' | 'en' = 'ar'
): Promise<boolean> {
  const payload: PushPayload = {
    title: locale === 'ar' ? notification.title_ar : notification.title_en,
    body: (locale === 'ar' ? notification.body_ar : notification.body_en) || '',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag: notification.id,
    data: {
      url: notification.action_url || '/',
      notificationId: notification.id,
    },
    actions: [
      {
        action: 'open',
        title: locale === 'ar' ? 'فتح' : 'Open',
      },
      {
        action: 'dismiss',
        title: locale === 'ar' ? 'إغلاق' : 'Dismiss',
      },
    ],
  };

  const result = await sendPushNotification(notification.user_id, payload);
  return result.success;
}

/**
 * Get VAPID public key for client subscription
 */
export function getVapidPublicKey(): string {
  return VAPID_PUBLIC_KEY;
}

/**
 * Convert base64 string to Uint8Array for push subscription
 */
export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
