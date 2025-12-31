'use client';

import * as React from 'react';
import { useLocale } from 'next-intl';
import { X, Mail, Link2, MessageCircle, Copy, Check, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createInvitation, type TreeInvitation, type InvitationRole } from '@/lib/db/invitation-actions';

interface InviteMemberModalProps {
  treeId: string;
  treeName: string;
  isOpen: boolean;
  onClose: () => void;
  onInviteSent?: (invitation: TreeInvitation) => void;
}

const translations = {
  ar: {
    title: 'دعوة عضو للشجرة',
    subtitle: 'أرسل دعوة لأحد أفراد العائلة للانضمام إلى شجرة',
    emailLabel: 'البريد الإلكتروني',
    emailPlaceholder: 'أدخل البريد الإلكتروني',
    roleLabel: 'صلاحية الوصول',
    guest: 'ضيف',
    guestDesc: 'يمكنه رؤية الشجرة فقط',
    member: 'عضو',
    memberDesc: 'يمكنه إضافة وتعديل الأشخاص',
    manager: 'مدير',
    managerDesc: 'صلاحيات كاملة بما في ذلك الدعوات',
    messageLabel: 'رسالة شخصية (اختياري)',
    messagePlaceholder: 'أضف رسالة ترحيبية...',
    sendInvite: 'إرسال الدعوة',
    orShareLink: 'أو شارك الرابط',
    copyLink: 'نسخ الرابط',
    copied: 'تم النسخ!',
    shareWhatsApp: 'مشاركة عبر واتساب',
    sending: 'جاري الإرسال...',
    success: 'تم إرسال الدعوة بنجاح!',
    inviteMessage: 'لقد تمت دعوتك للانضمام إلى شجرة العائلة',
    cancel: 'إلغاء',
  },
  en: {
    title: 'Invite a Family Member',
    subtitle: 'Send an invitation to join',
    emailLabel: 'Email Address',
    emailPlaceholder: 'Enter email address',
    roleLabel: 'Access Level',
    guest: 'Guest',
    guestDesc: 'Can only view the tree',
    member: 'Member',
    memberDesc: 'Can add and edit people',
    manager: 'Manager',
    managerDesc: 'Full access including invitations',
    messageLabel: 'Personal Message (optional)',
    messagePlaceholder: 'Add a welcome message...',
    sendInvite: 'Send Invitation',
    orShareLink: 'Or share a link',
    copyLink: 'Copy Link',
    copied: 'Copied!',
    shareWhatsApp: 'Share via WhatsApp',
    sending: 'Sending...',
    success: 'Invitation sent successfully!',
    inviteMessage: 'You have been invited to join a family tree',
    cancel: 'Cancel',
  },
};

export function InviteMemberModal({ treeId, treeName, isOpen, onClose, onInviteSent }: InviteMemberModalProps) {
  const locale = useLocale() as 'ar' | 'en';
  const t = translations[locale];

  const [email, setEmail] = React.useState('');
  const [role, setRole] = React.useState<InvitationRole>('guest');
  const [message, setMessage] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState(false);
  const [inviteCode, setInviteCode] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const result = await createInvitation({
      treeId,
      email: email || undefined,
      role,
      message: message || undefined,
    });

    setIsLoading(false);

    if (result.success && result.invitation) {
      setSuccess(true);
      setInviteCode(result.invitation.invite_code);
      onInviteSent?.(result.invitation);
    } else {
      setError(result.error || 'Failed to send invitation');
    }
  };

  const getInviteUrl = () => {
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}/${locale}/invite/${inviteCode}`;
  };

  const handleCopyLink = async () => {
    const url = getInviteUrl();
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsAppShare = () => {
    const url = getInviteUrl();
    const text = `${t.inviteMessage}: ${treeName}\n${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleClose = () => {
    setEmail('');
    setRole('guest');
    setMessage('');
    setError('');
    setSuccess(false);
    setInviteCode(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-scale-up">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {t.title}
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                {t.subtitle} "{treeName}"
              </p>
            </div>
            <button
              onClick={handleClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {success ? (
            <div className="space-y-6">
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-emerald-600" />
                </div>
                <p className="text-lg font-medium text-slate-900 dark:text-white">
                  {t.success}
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                  {t.orShareLink}
                </p>

                <div className="flex gap-2">
                  <button
                    onClick={handleCopyLink}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-600 border border-slate-200 dark:border-slate-500 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-500 transition-colors"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    {copied ? t.copied : t.copyLink}
                  </button>

                  <button
                    onClick={handleWhatsAppShare}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#25D366] text-white rounded-lg text-sm font-medium hover:bg-[#20bd5a] transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span className="hidden sm:inline">{t.shareWhatsApp}</span>
                  </button>
                </div>
              </div>

              <Button onClick={handleClose} variant="outline" className="w-full">
                {t.cancel}
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Input */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  <Mail className="w-4 h-4 inline me-2" />
                  {t.emailLabel}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t.emailPlaceholder}
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                  {t.roleLabel}
                </label>
                <div className="space-y-2">
                  {(['guest', 'member', 'manager'] as const).map((r) => (
                    <label
                      key={r}
                      className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors ${
                        role === r
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                          : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
                      }`}
                    >
                      <input
                        type="radio"
                        name="role"
                        value={r}
                        checked={role === r}
                        onChange={() => setRole(r)}
                        className="sr-only"
                      />
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        role === r ? 'border-emerald-500' : 'border-slate-300 dark:border-slate-500'
                      }`}>
                        {role === r && <div className="w-2 h-2 rounded-full bg-emerald-500" />}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">{t[r]}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{t[`${r}Desc` as keyof typeof t]}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  {t.messageLabel}
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={t.messagePlaceholder}
                  rows={2}
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                />
              </div>

              {error && (
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              )}

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {t.sending}
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Send className="w-4 h-4" />
                    {t.sendInvite}
                  </span>
                )}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
