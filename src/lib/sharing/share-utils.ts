/**
 * Sharing Utilities for Family Tree
 * Supports WhatsApp, SMS, Email, Social Media, and QR codes
 */

export interface ShareContent {
  title: string;
  titleAr: string;
  message: string;
  messageAr: string;
  url: string;
  imageUrl?: string;
}

export interface InviteShareContent extends ShareContent {
  inviteCode: string;
  treeName: string;
  treeNameAr: string;
  inviterName: string;
  role: 'viewer' | 'editor' | 'admin';
}

// Base URL for the app
const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return process.env.NEXT_PUBLIC_APP_URL || 'https://shajara.a-m-zein.workers.dev';
};

/**
 * Generate WhatsApp share URL
 */
export function getWhatsAppShareUrl(content: ShareContent, locale: 'ar' | 'en' = 'ar'): string {
  const text = locale === 'ar'
    ? `${content.titleAr}\n\n${content.messageAr}\n\n${content.url}`
    : `${content.title}\n\n${content.message}\n\n${content.url}`;

  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

/**
 * Generate WhatsApp share URL for specific number
 */
export function getWhatsAppDirectUrl(phone: string, content: ShareContent, locale: 'ar' | 'en' = 'ar'): string {
  const cleanPhone = phone.replace(/\D/g, '');
  const text = locale === 'ar'
    ? `${content.titleAr}\n\n${content.messageAr}\n\n${content.url}`
    : `${content.title}\n\n${content.message}\n\n${content.url}`;

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
}

/**
 * Generate SMS URL (works on mobile)
 */
export function getSmsUrl(phone: string, content: ShareContent, locale: 'ar' | 'en' = 'ar'): string {
  const text = locale === 'ar'
    ? `${content.titleAr}: ${content.url}`
    : `${content.title}: ${content.url}`;

  // Use different separators for iOS vs Android
  const separator = /iPhone|iPad|iPod/i.test(navigator?.userAgent || '') ? '&' : '?';
  return `sms:${phone}${separator}body=${encodeURIComponent(text)}`;
}

/**
 * Generate SMS share URL without phone number
 */
export function getSmsShareUrl(phone: string, message: string): string {
  // Use different separators for iOS vs Android
  const separator = typeof navigator !== 'undefined' && /iPhone|iPad|iPod/i.test(navigator?.userAgent || '') ? '&' : '?';
  const phoneParam = phone ? phone : '';
  return `sms:${phoneParam}${separator}body=${encodeURIComponent(message)}`;
}

/**
 * Generate Email share URL
 */
export function getEmailShareUrl(content: ShareContent, locale: 'ar' | 'en' = 'ar'): string {
  const subject = locale === 'ar' ? content.titleAr : content.title;
  const body = locale === 'ar'
    ? `${content.messageAr}\n\n${content.url}`
    : `${content.message}\n\n${content.url}`;

  return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/**
 * Generate Twitter/X share URL
 */
export function getTwitterShareUrl(content: ShareContent, locale: 'ar' | 'en' = 'ar'): string {
  const text = locale === 'ar' ? content.titleAr : content.title;
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(content.url)}`;
}

/**
 * Generate Facebook share URL
 */
export function getFacebookShareUrl(content: ShareContent): string {
  return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(content.url)}`;
}

/**
 * Generate LinkedIn share URL
 */
export function getLinkedInShareUrl(content: ShareContent): string {
  return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(content.url)}`;
}

/**
 * Copy to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      return true;
    } catch {
      return false;
    } finally {
      document.body.removeChild(textArea);
    }
  }
}

/**
 * Use Web Share API if available
 */
export async function nativeShare(content: ShareContent, locale: 'ar' | 'en' = 'ar'): Promise<boolean> {
  if (!navigator.share) {
    return false;
  }

  try {
    await navigator.share({
      title: locale === 'ar' ? content.titleAr : content.title,
      text: locale === 'ar' ? content.messageAr : content.message,
      url: content.url,
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if Web Share API is available
 */
export function canNativeShare(): boolean {
  return typeof navigator !== 'undefined' && !!navigator.share;
}

// =====================================================
// INVITE-SPECIFIC SHARE CONTENT GENERATORS
// =====================================================

/**
 * Generate invite share content
 */
export function generateInviteShareContent(
  inviteCode: string,
  treeName: string,
  treeNameAr: string,
  inviterName: string,
  role: 'viewer' | 'editor' | 'admin'
): InviteShareContent {
  const baseUrl = getBaseUrl();
  const inviteUrl = `${baseUrl}/ar/invite/${inviteCode}`;

  const roleTextAr = {
    viewer: 'مشاهد',
    editor: 'محرر',
    admin: 'مدير',
  }[role];

  const roleTextEn = {
    viewer: 'viewer',
    editor: 'editor',
    admin: 'admin',
  }[role];

  return {
    inviteCode,
    treeName,
    treeNameAr,
    inviterName,
    role,
    title: `Join ${treeName} Family Tree`,
    titleAr: `انضم إلى شجرة عائلة ${treeNameAr}`,
    message: `${inviterName} has invited you to join their family tree as a ${roleTextEn}. Click the link below to accept the invitation and start exploring your family history.`,
    messageAr: `${inviterName} دعاك للانضمام إلى شجرة العائلة كـ${roleTextAr}. اضغط على الرابط أدناه لقبول الدعوة واستكشاف تاريخ عائلتك.`,
    url: inviteUrl,
  };
}

/**
 * Generate tree share content (for public sharing)
 */
export function generateTreeShareContent(
  treeId: string,
  treeName: string,
  treeNameAr: string,
  memberCount: number,
  generationCount: number
): ShareContent {
  const baseUrl = getBaseUrl();
  const treeUrl = `${baseUrl}/ar/tree/${treeId}`;

  return {
    title: `${treeName} Family Tree`,
    titleAr: `شجرة عائلة ${treeNameAr}`,
    message: `Discover the ${treeName} family tree with ${memberCount} members across ${generationCount} generations.`,
    messageAr: `اكتشف شجرة عائلة ${treeNameAr} مع ${memberCount} فرد عبر ${generationCount} أجيال.`,
    url: treeUrl,
  };
}

/**
 * Generate person share content
 */
export function generatePersonShareContent(
  personId: string,
  personName: string,
  personNameAr: string,
  treeId: string
): ShareContent {
  const baseUrl = getBaseUrl();
  const personUrl = `${baseUrl}/ar/tree/${treeId}/person/${personId}`;

  return {
    title: `${personName} - Family Tree`,
    titleAr: `${personNameAr} - شجرة العائلة`,
    message: `Learn about ${personName} and their family connections.`,
    messageAr: `تعرف على ${personNameAr} وروابطه العائلية.`,
    url: personUrl,
  };
}

/**
 * Generate contribution request content
 */
export function generateContributionRequestContent(
  personId: string,
  personName: string,
  personNameAr: string,
  treeId: string,
  requestType: 'photo' | 'info' | 'memory' | 'relative'
): ShareContent {
  const baseUrl = getBaseUrl();
  const requestUrl = `${baseUrl}/ar/tree/${treeId}/contribute/${personId}?type=${requestType}`;

  const requestTextAr = {
    photo: 'صور',
    info: 'معلومات',
    memory: 'ذكريات',
    relative: 'أقارب',
  }[requestType];

  const requestTextEn = {
    photo: 'photos',
    info: 'information',
    memory: 'memories',
    relative: 'relatives',
  }[requestType];

  return {
    title: `Help add ${requestTextEn} for ${personName}`,
    titleAr: `ساعدنا بإضافة ${requestTextAr} عن ${personNameAr}`,
    message: `Do you have ${requestTextEn} about ${personName}? Help us preserve family history by contributing.`,
    messageAr: `هل لديك ${requestTextAr} عن ${personNameAr}؟ ساعدنا في الحفاظ على تاريخ العائلة.`,
    url: requestUrl,
  };
}
