'use client';

import { useState, useEffect } from 'react';
import {
  X,
  MessageCircle,
  Mail,
  Smartphone,
  QrCode,
  Link2,
  Check,
  Copy,
  Send,
  Loader2,
  Users,
  ChevronDown,
} from 'lucide-react';
import { QRCodeGenerator } from './QRCodeGenerator';
import { WhatsAppShareButton } from './ShareButtons';
import {
  generateInviteShareContent,
  copyToClipboard,
  getWhatsAppDirectUrl,
  getSmsUrl,
} from '@/lib/sharing/share-utils';
import { createInvitation, type InvitationRole } from '@/lib/db/invitation-actions';

interface MultiChannelInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  treeId: string;
  treeName: string;
  treeNameAr: string;
  inviterName: string;
  locale?: 'ar' | 'en';
}

type InviteMethod = 'whatsapp' | 'sms' | 'email' | 'qr' | 'link';

export function MultiChannelInviteModal({
  isOpen,
  onClose,
  treeId,
  treeName,
  treeNameAr,
  inviterName,
  locale = 'ar',
}: MultiChannelInviteModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<InviteMethod>('whatsapp');
  const [role, setRole] = useState<InvitationRole>('guest');
  const [contact, setContact] = useState('');
  const [message, setMessage] = useState('');
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const isRTL = locale === 'ar';

  const t = {
    ar: {
      title: 'دعوة أفراد العائلة',
      subtitle: 'اختر طريقة الدعوة المناسبة',
      methods: {
        whatsapp: 'واتساب',
        sms: 'رسالة نصية',
        email: 'بريد إلكتروني',
        qr: 'رمز QR',
        link: 'نسخ الرابط',
      },
      role: 'الصلاحية',
      roles: {
        guest: 'ضيف - عرض فقط',
        member: 'عضو - إضافة وتعديل الأشخاص',
        manager: 'مدير - صلاحيات كاملة وإدارة الأعضاء',
      },
      phone: 'رقم الهاتف',
      email: 'البريد الإلكتروني',
      phonePlaceholder: '+966XXXXXXXXX',
      emailPlaceholder: 'example@email.com',
      message: 'رسالة شخصية (اختياري)',
      messagePlaceholder: 'أضف رسالة ترحيبية للمدعو...',
      send: 'إرسال الدعوة',
      sendVia: 'إرسال عبر',
      generating: 'جاري إنشاء الدعوة...',
      copyLink: 'نسخ رابط الدعوة',
      copied: 'تم النسخ!',
      inviteLink: 'رابط الدعوة',
      scanCode: 'امسح الرمز للانضمام',
      qrInstructions: 'اعرض هذا الرمز لأفراد العائلة في التجمعات',
      printQR: 'طباعة',
      success: 'تم إرسال الدعوة بنجاح!',
      error: 'حدث خطأ، يرجى المحاولة مرة أخرى',
      invalidPhone: 'رقم الهاتف غير صحيح',
      invalidEmail: 'البريد الإلكتروني غير صحيح',
      close: 'إغلاق',
    },
    en: {
      title: 'Invite Family Members',
      subtitle: 'Choose your preferred invite method',
      methods: {
        whatsapp: 'WhatsApp',
        sms: 'SMS',
        email: 'Email',
        qr: 'QR Code',
        link: 'Copy Link',
      },
      role: 'Permission',
      roles: {
        guest: 'Guest - Read-only access',
        member: 'Member - Can add and edit people',
        manager: 'Manager - Full access and can manage members',
      },
      phone: 'Phone Number',
      email: 'Email Address',
      phonePlaceholder: '+1XXXXXXXXXX',
      emailPlaceholder: 'example@email.com',
      message: 'Personal Message (optional)',
      messagePlaceholder: 'Add a welcome message...',
      send: 'Send Invite',
      sendVia: 'Send via',
      generating: 'Creating invite...',
      copyLink: 'Copy Invite Link',
      copied: 'Copied!',
      inviteLink: 'Invite Link',
      scanCode: 'Scan to join',
      qrInstructions: 'Show this code to family at gatherings',
      printQR: 'Print',
      success: 'Invitation sent successfully!',
      error: 'An error occurred, please try again',
      invalidPhone: 'Invalid phone number',
      invalidEmail: 'Invalid email address',
      close: 'Close',
    },
  }[locale];

  const methods: { id: InviteMethod; icon: typeof MessageCircle; color: string }[] = [
    { id: 'whatsapp', icon: MessageCircle, color: 'bg-[#25D366]' },
    { id: 'sms', icon: Smartphone, color: 'bg-blue-500' },
    { id: 'email', icon: Mail, color: 'bg-gray-600' },
    { id: 'qr', icon: QrCode, color: 'bg-islamic-primary' },
    { id: 'link', icon: Link2, color: 'bg-gray-500' },
  ];

  // Generate invite code when modal opens
  useEffect(() => {
    if (isOpen && !inviteCode) {
      generateInvite();
    }
  }, [isOpen]);

  const generateInvite = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await createInvitation({
        treeId,
        role,
        message,
        expiresInDays: 30,
      });

      if (result.success && result.invitation) {
        setInviteCode(result.invitation.invite_code);
      } else {
        setError(result.error || t.error);
      }
    } catch (err) {
      console.error('Error creating invite:', err);
      setError(t.error);
    } finally {
      setIsLoading(false);
    }
  };

  const getInviteUrl = () => {
    if (!inviteCode) return '';
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    return `${baseUrl}/${locale}/invite/${inviteCode}`;
  };

  const getShareContent = () => {
    return generateInviteShareContent(
      inviteCode || '',
      treeName,
      treeNameAr,
      inviterName,
      role
    );
  };

  const handleCopyLink = async () => {
    const url = getInviteUrl();
    const success = await copyToClipboard(url);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const validateContact = (): boolean => {
    if (selectedMethod === 'whatsapp' || selectedMethod === 'sms') {
      const phoneRegex = /^\+?[1-9]\d{6,14}$/;
      if (!phoneRegex.test(contact.replace(/\s/g, ''))) {
        setError(t.invalidPhone);
        return false;
      }
    } else if (selectedMethod === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(contact)) {
        setError(t.invalidEmail);
        return false;
      }
    }
    return true;
  };

  const handleSend = () => {
    if (!inviteCode) return;
    if (!validateContact()) return;

    setError(null);
    const content = getShareContent();

    if (selectedMethod === 'whatsapp') {
      const url = getWhatsAppDirectUrl(contact, content, locale);
      window.open(url, '_blank');
      setSuccess(true);
    } else if (selectedMethod === 'sms') {
      const url = getSmsUrl(contact, content, locale);
      window.location.href = url;
      setSuccess(true);
    } else if (selectedMethod === 'email') {
      const subject = encodeURIComponent(locale === 'ar' ? content.titleAr : content.title);
      const body = encodeURIComponent(
        `${locale === 'ar' ? content.messageAr : content.message}\n\n${content.url}`
      );
      window.location.href = `mailto:${contact}?subject=${subject}&body=${body}`;
      setSuccess(true);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-islamic-primary to-islamic-gold p-6 text-white">
          <button
            onClick={onClose}
            className="absolute top-4 left-4 p-2 rounded-full hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="text-center">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-90" />
            <h2 className="text-2xl font-bold">{t.title}</h2>
            <p className="text-white/80 mt-1">{t.subtitle}</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* Method Selection */}
          <div className="flex justify-center gap-2 mb-6">
            {methods.map((method) => {
              const Icon = method.icon;
              const isSelected = selectedMethod === method.id;
              return (
                <button
                  key={method.id}
                  onClick={() => setSelectedMethod(method.id)}
                  className={`
                    flex flex-col items-center gap-1 p-3 rounded-xl transition-all
                    ${isSelected
                      ? `${method.color} text-white shadow-lg scale-105`
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }
                  `}
                >
                  <Icon className="w-6 h-6" />
                  <span className="text-xs font-medium">
                    {t.methods[method.id]}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Role Selection */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {t.role}
            </label>
            <div className="relative">
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as InvitationRole)}
                className="w-full p-3 border-2 border-gray-200 rounded-xl appearance-none bg-white focus:border-islamic-primary focus:outline-none"
              >
                <option value="guest">{t.roles.guest}</option>
                <option value="member">{t.roles.member}</option>
                <option value="manager">{t.roles.manager}</option>
              </select>
              <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Method-specific content */}
          {(selectedMethod === 'whatsapp' || selectedMethod === 'sms' || selectedMethod === 'email') && (
            <div className="space-y-4">
              {/* Contact Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {selectedMethod === 'email' ? t.email : t.phone}
                </label>
                <input
                  type={selectedMethod === 'email' ? 'email' : 'tel'}
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder={selectedMethod === 'email' ? t.emailPlaceholder : t.phonePlaceholder}
                  className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-islamic-primary focus:outline-none"
                  dir="ltr"
                />
              </div>

              {/* Message Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {t.message}
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={t.messagePlaceholder}
                  rows={3}
                  className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-islamic-primary focus:outline-none resize-none"
                />
              </div>

              {/* Send Button */}
              <button
                onClick={handleSend}
                disabled={isLoading || !contact}
                className={`
                  w-full flex items-center justify-center gap-2 p-4 rounded-xl
                  font-bold text-lg transition-all
                  ${selectedMethod === 'whatsapp'
                    ? 'bg-[#25D366] hover:bg-[#20bd5a] text-white'
                    : selectedMethod === 'sms'
                    ? 'bg-blue-500 hover:bg-blue-600 text-white'
                    : 'bg-gray-600 hover:bg-gray-700 text-white'
                  }
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {t.generating}
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    {t.sendVia} {t.methods[selectedMethod]}
                  </>
                )}
              </button>
            </div>
          )}

          {/* QR Code */}
          {selectedMethod === 'qr' && inviteCode && (
            <div className="text-center">
              <QRCodeGenerator
                value={getInviteUrl()}
                size={200}
                title={treeNameAr}
                subtitle={t.scanCode}
                locale={locale}
                showActions={true}
              />
              <p className="text-sm text-gray-500 mt-4">{t.qrInstructions}</p>
            </div>
          )}

          {/* Copy Link */}
          {selectedMethod === 'link' && inviteCode && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {t.inviteLink}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={getInviteUrl()}
                    readOnly
                    className="flex-1 p-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-600"
                    dir="ltr"
                  />
                  <button
                    onClick={handleCopyLink}
                    className={`
                      px-4 rounded-xl font-medium transition-all
                      ${copied
                        ? 'bg-green-500 text-white'
                        : 'bg-islamic-primary text-white hover:bg-islamic-primary/90'
                      }
                    `}
                  >
                    {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Quick Share via WhatsApp */}
              <WhatsAppShareButton
                content={getShareContent()}
                locale={locale}
                fullWidth
              />
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-xl text-green-600 text-sm flex items-center gap-2">
              <Check className="w-5 h-5" />
              {t.success}
            </div>
          )}

          {/* Loading State */}
          {isLoading && !inviteCode && (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="w-10 h-10 animate-spin text-islamic-primary" />
              <p className="mt-3 text-gray-500">{t.generating}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
