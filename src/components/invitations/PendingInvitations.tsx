'use client';

import * as React from 'react';
import { useLocale } from 'next-intl';
import { Mail, Clock, X, Copy, Check, MessageCircle } from 'lucide-react';
import { cancelInvitation, type TreeInvitation } from '@/lib/db/invitation-actions';

interface PendingInvitationsProps {
  invitations: TreeInvitation[];
  onUpdate?: () => void;
}

const translations = {
  ar: {
    title: 'الدعوات المعلقة',
    noInvitations: 'لا توجد دعوات معلقة',
    expires: 'تنتهي',
    expired: 'منتهية',
    cancel: 'إلغاء',
    cancelConfirm: 'هل أنت متأكد من إلغاء هذه الدعوة؟',
    copyLink: 'نسخ الرابط',
    copied: 'تم النسخ',
    shareWhatsApp: 'واتساب',
    viewer: 'مشاهد',
    editor: 'محرر',
    admin: 'مدير',
  },
  en: {
    title: 'Pending Invitations',
    noInvitations: 'No pending invitations',
    expires: 'Expires',
    expired: 'Expired',
    cancel: 'Cancel',
    cancelConfirm: 'Are you sure you want to cancel this invitation?',
    copyLink: 'Copy Link',
    copied: 'Copied',
    shareWhatsApp: 'WhatsApp',
    viewer: 'Viewer',
    editor: 'Editor',
    admin: 'Admin',
  },
};

export function PendingInvitations({ invitations, onUpdate }: PendingInvitationsProps) {
  const locale = useLocale() as 'ar' | 'en';
  const t = translations[locale];
  const [copied, setCopied] = React.useState<string | null>(null);
  const [cancelling, setCancelling] = React.useState<string | null>(null);

  const pendingInvitations = invitations.filter((inv) => inv.status === 'pending');

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const isExpired = (timestamp: number) => {
    return timestamp * 1000 < Date.now();
  };

  const getInviteUrl = (code: string) => {
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}/${locale}/invite/${code}`;
  };

  const handleCopyLink = async (code: string) => {
    await navigator.clipboard.writeText(getInviteUrl(code));
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleWhatsAppShare = (invitation: TreeInvitation) => {
    const url = getInviteUrl(invitation.invite_code);
    const text = locale === 'ar'
      ? `لقد تمت دعوتك للانضمام إلى شجرة العائلة\n${url}`
      : `You've been invited to join a family tree\n${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleCancel = async (id: string) => {
    if (!confirm(t.cancelConfirm)) return;

    setCancelling(id);
    const result = await cancelInvitation(id);
    setCancelling(null);

    if (result.success) {
      onUpdate?.();
    }
  };

  if (pendingInvitations.length === 0) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Mail className="w-5 h-5" />
          {t.title}
          <span className="ms-auto px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-medium rounded-full">
            {pendingInvitations.length}
          </span>
        </h3>
      </div>

      <div className="divide-y divide-slate-100 dark:divide-slate-700">
        {pendingInvitations.map((invitation) => {
          const expired = isExpired(invitation.expires_at);

          return (
            <div
              key={invitation.id}
              className={`p-4 ${expired ? 'opacity-60' : ''}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {/* Email */}
                  <p className="font-medium text-slate-900 dark:text-white truncate">
                    {invitation.invitee_email || 'Link invitation'}
                  </p>

                  {/* Details */}
                  <div className="flex flex-wrap items-center gap-2 mt-1 text-sm">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full text-xs">
                      {t[invitation.role as keyof typeof t]}
                    </span>

                    <span className={`inline-flex items-center gap-1 text-xs ${
                      expired ? 'text-red-500' : 'text-slate-500 dark:text-slate-400'
                    }`}>
                      <Clock className="w-3 h-3" />
                      {expired ? t.expired : `${t.expires} ${formatDate(invitation.expires_at)}`}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleCopyLink(invitation.invite_code)}
                    className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                    title={t.copyLink}
                  >
                    {copied === invitation.invite_code ? (
                      <Check className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>

                  <button
                    onClick={() => handleWhatsAppShare(invitation)}
                    className="p-2 text-[#25D366] hover:bg-[#25D366]/10 rounded-lg"
                    title={t.shareWhatsApp}
                  >
                    <MessageCircle className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleCancel(invitation.id)}
                    disabled={cancelling === invitation.id}
                    className="p-2 text-red-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                    title={t.cancel}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
