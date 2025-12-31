import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import {
  sendSms,
  generateInviteSmsMessage,
  isValidPhoneNumber,
  getTwilioConfig,
} from '@/lib/sms/twilio-service';
import { createInvitation, getInviteLink, type InvitationRole } from '@/lib/db/invitation-actions';

interface SendInviteSmsRequest {
  treeId: string;
  phone: string;
  inviterName: string;
  treeName: string;
  role: InvitationRole;
  message?: string;
  locale?: 'ar' | 'en';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as SendInviteSmsRequest;
    const { treeId, phone, inviterName, treeName, role, message, locale = 'ar' } = body;

    // Validate phone number
    if (!isValidPhoneNumber(phone)) {
      return NextResponse.json(
        { error: locale === 'ar' ? 'رقم الهاتف غير صحيح' : 'Invalid phone number' },
        { status: 400 }
      );
    }

    // Get Cloudflare context for environment variables
    const { env } = await getCloudflareContext();

    // Check if Twilio is configured
    const twilioConfig = getTwilioConfig(env as unknown as Record<string, string>);
    if (!twilioConfig) {
      return NextResponse.json(
        { error: locale === 'ar' ? 'خدمة الرسائل غير متاحة' : 'SMS service not available' },
        { status: 503 }
      );
    }

    // Create the invitation
    const inviteResult = await createInvitation({
      treeId,
      phone,
      role,
      message,
      expiresInDays: 30,
    });

    if (!inviteResult.success || !inviteResult.invitation) {
      return NextResponse.json(
        { error: inviteResult.error || 'Failed to create invitation' },
        { status: 500 }
      );
    }

    // Generate invite URL
    const baseUrl = request.headers.get('origin') || 'https://shajara.a-m-zein.workers.dev';
    const inviteUrl = `${baseUrl}/${locale}/invite/${inviteResult.invitation.invite_code}`;

    // Generate and send SMS
    const smsBody = generateInviteSmsMessage(inviterName, treeName, inviteUrl, locale);
    const smsResult = await sendSms(phone, smsBody, twilioConfig);

    if (!smsResult.success) {
      return NextResponse.json(
        { error: smsResult.error || 'Failed to send SMS' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      inviteCode: inviteResult.invitation.invite_code,
      messageId: smsResult.messageId,
    });
  } catch (error) {
    console.error('Send invite SMS error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
