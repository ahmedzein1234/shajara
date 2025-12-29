/**
 * Twilio SMS Service for Cloudflare Workers
 * Uses Twilio REST API directly (no Node.js SDK required)
 */

interface TwilioConfig {
  accountSid: string;
  authToken: string;
  fromNumber: string; // Your Twilio phone number
}

interface SendSmsResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

interface SendWhatsAppResult extends SendSmsResult {}

/**
 * Send SMS via Twilio REST API
 */
export async function sendSms(
  to: string,
  body: string,
  config: TwilioConfig
): Promise<SendSmsResult> {
  const { accountSid, authToken, fromNumber } = config;

  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

  const auth = btoa(`${accountSid}:${authToken}`);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To: formatPhoneNumber(to),
        From: fromNumber,
        Body: body,
      }),
    });

    const data = await response.json() as { sid?: string; message?: string; code?: number };

    if (response.ok) {
      return {
        success: true,
        messageId: data.sid,
      };
    } else {
      return {
        success: false,
        error: data.message || 'Failed to send SMS',
      };
    }
  } catch (error) {
    console.error('Twilio SMS error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send WhatsApp message via Twilio REST API
 */
export async function sendWhatsApp(
  to: string,
  body: string,
  config: TwilioConfig & { whatsappNumber?: string }
): Promise<SendWhatsAppResult> {
  const { accountSid, authToken, whatsappNumber, fromNumber } = config;

  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

  const auth = btoa(`${accountSid}:${authToken}`);

  // WhatsApp numbers must be prefixed with 'whatsapp:'
  const whatsappFrom = whatsappNumber || `whatsapp:${fromNumber}`;
  const whatsappTo = to.startsWith('whatsapp:') ? to : `whatsapp:${formatPhoneNumber(to)}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To: whatsappTo,
        From: whatsappFrom,
        Body: body,
      }),
    });

    const data = await response.json() as { sid?: string; message?: string; code?: number };

    if (response.ok) {
      return {
        success: true,
        messageId: data.sid,
      };
    } else {
      return {
        success: false,
        error: data.message || 'Failed to send WhatsApp message',
      };
    }
  } catch (error) {
    console.error('Twilio WhatsApp error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Format phone number to E.164 format
 */
function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters except leading +
  let cleaned = phone.replace(/[^\d+]/g, '');

  // If no + at start, add it
  if (!cleaned.startsWith('+')) {
    // Assume Saudi Arabia if starts with 05
    if (cleaned.startsWith('05')) {
      cleaned = '+966' + cleaned.substring(1);
    }
    // Assume Saudi Arabia if starts with 5
    else if (cleaned.startsWith('5') && cleaned.length === 9) {
      cleaned = '+966' + cleaned;
    }
    // Otherwise add +
    else {
      cleaned = '+' + cleaned;
    }
  }

  return cleaned;
}

/**
 * Generate invite SMS message
 */
export function generateInviteSmsMessage(
  inviterName: string,
  treeName: string,
  inviteUrl: string,
  locale: 'ar' | 'en' = 'ar'
): string {
  if (locale === 'ar') {
    return `${inviterName} دعاك للانضمام إلى شجرة عائلة ${treeName}.\n\nاضغط هنا: ${inviteUrl}`;
  }
  return `${inviterName} has invited you to join the ${treeName} family tree.\n\nClick here: ${inviteUrl}`;
}

/**
 * Generate verification code SMS
 */
export function generateVerificationSms(
  code: string,
  locale: 'ar' | 'en' = 'ar'
): string {
  if (locale === 'ar') {
    return `رمز التحقق الخاص بك في شجرة: ${code}\n\nلا تشارك هذا الرمز مع أي شخص.`;
  }
  return `Your Shajara verification code: ${code}\n\nDo not share this code with anyone.`;
}

/**
 * Validate phone number format
 */
export function isValidPhoneNumber(phone: string): boolean {
  const cleaned = phone.replace(/[^\d+]/g, '');
  // Must be at least 10 digits (with country code)
  return /^\+?[1-9]\d{9,14}$/.test(cleaned);
}

/**
 * Check if Twilio is configured
 */
export function isTwilioConfigured(env: { TWILIO_ACCOUNT_SID?: string; TWILIO_AUTH_TOKEN?: string; TWILIO_PHONE_NUMBER?: string }): boolean {
  return !!(env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN && env.TWILIO_PHONE_NUMBER);
}

/**
 * Get Twilio config from environment
 */
export function getTwilioConfig(env: { TWILIO_ACCOUNT_SID?: string; TWILIO_AUTH_TOKEN?: string; TWILIO_PHONE_NUMBER?: string; TWILIO_WHATSAPP_NUMBER?: string }): TwilioConfig & { whatsappNumber?: string } | null {
  if (!isTwilioConfigured(env)) {
    return null;
  }

  return {
    accountSid: env.TWILIO_ACCOUNT_SID!,
    authToken: env.TWILIO_AUTH_TOKEN!,
    fromNumber: env.TWILIO_PHONE_NUMBER!,
    whatsappNumber: env.TWILIO_WHATSAPP_NUMBER,
  };
}
