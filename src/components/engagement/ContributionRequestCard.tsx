'use client';

import * as React from 'react';
import {
  Image, FileText, MessageSquare, Users, CheckCircle, AlertCircle,
  Clock, Share2, ChevronRight, User, Mail
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  type ContributionRequest,
  type ContributionRequestType,
  type ContributionStatus,
  updateContributionRequestStatus,
} from '@/lib/db/contribution-actions';
import { getWhatsAppShareUrl, getSmsShareUrl } from '@/lib/sharing/share-utils';

interface ContributionRequestCardProps {
  request: ContributionRequest;
  locale?: 'ar' | 'en';
  onUpdate?: () => void;
  showActions?: boolean;
}

const translations = {
  ar: {
    requestTypes: {
      photo: 'صورة',
      info: 'معلومات',
      memory: 'ذكرى',
      relative: 'قريب',
      verification: 'تحقق',
      correction: 'تصحيح',
    },
    statusLabels: {
      open: 'مفتوح',
      fulfilled: 'مكتمل',
      closed: 'مغلق',
      expired: 'منتهي',
    },
    responses: 'ردود',
    noResponses: 'لا توجد ردود بعد',
    shareRequest: 'مشاركة الطلب',
    closeRequest: 'إغلاق الطلب',
    viewResponses: 'عرض الردود',
    requestedBy: 'طلب بواسطة',
    requestedFor: 'لـ',
    copyLink: 'نسخ الرابط',
    shareWhatsApp: 'واتساب',
    shareSms: 'رسالة',
  },
  en: {
    requestTypes: {
      photo: 'Photo',
      info: 'Information',
      memory: 'Memory',
      relative: 'Relative',
      verification: 'Verification',
      correction: 'Correction',
    },
    statusLabels: {
      open: 'Open',
      fulfilled: 'Fulfilled',
      closed: 'Closed',
      expired: 'Expired',
    },
    responses: 'responses',
    noResponses: 'No responses yet',
    shareRequest: 'Share Request',
    closeRequest: 'Close Request',
    viewResponses: 'View Responses',
    requestedBy: 'Requested by',
    requestedFor: 'For',
    copyLink: 'Copy Link',
    shareWhatsApp: 'WhatsApp',
    shareSms: 'SMS',
  },
};

const typeIcons: Record<ContributionRequestType, React.ElementType> = {
  photo: Image,
  info: FileText,
  memory: MessageSquare,
  relative: Users,
  verification: CheckCircle,
  correction: AlertCircle,
};

const statusColors: Record<ContributionStatus, string> = {
  open: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  fulfilled: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  closed: 'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400',
  expired: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export function ContributionRequestCard({
  request,
  locale = 'ar',
  onUpdate,
  showActions = true,
}: ContributionRequestCardProps) {
  const t = translations[locale];
  const isRTL = locale === 'ar';

  const [showShareMenu, setShowShareMenu] = React.useState(false);
  const [closing, setClosing] = React.useState(false);

  const Icon = typeIcons[request.request_type];
  const title = locale === 'ar' ? request.title_ar : request.title_en;
  const description = locale === 'ar' ? request.description_ar : request.description_en;
  const personName = locale === 'ar' ? request.person_name_ar : request.person_name_en;

  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/contribute/${request.share_code}`
    : '';

  const handleClose = async () => {
    if (!confirm(locale === 'ar' ? 'هل أنت متأكد من إغلاق هذا الطلب؟' : 'Are you sure you want to close this request?')) {
      return;
    }

    setClosing(true);
    try {
      await updateContributionRequestStatus(request.id, 'closed');
      onUpdate?.();
    } catch (error) {
      console.error('Failed to close request:', error);
    } finally {
      setClosing(false);
    }
  };

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setShowShareMenu(false);
  };

  const handleWhatsAppShare = () => {
    const url = getWhatsAppShareUrl({
      title: title || 'Contribution Request',
      titleAr: request.title_ar || 'طلب مساهمة',
      message: description || 'Please help us with this request',
      messageAr: request.description_ar || 'نرجو مساعدتنا في هذا الطلب',
      url: shareUrl,
    }, locale);
    window.open(url, '_blank');
    setShowShareMenu(false);
  };

  const handleSmsShare = () => {
    const url = getSmsShareUrl(
      '',
      locale === 'ar'
        ? `${request.title_ar || 'طلب مساهمة'}: ${shareUrl}`
        : `${request.title_en || 'Contribution Request'}: ${shareUrl}`
    );
    window.open(url, '_blank');
    setShowShareMenu(false);
  };

  return (
    <div
      className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-islamic-light dark:bg-islamic-primary/20">
            <Icon className="w-5 h-5 text-islamic-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[request.status]}`}>
                {t.statusLabels[request.status]}
              </span>
              <span className="text-xs text-slate-400">
                {t.requestTypes[request.request_type]}
              </span>
            </div>
            <h3 className="font-semibold text-slate-900 dark:text-white mt-1">
              {title || t.requestTypes[request.request_type]}
            </h3>
            {description && (
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">
                {description}
              </p>
            )}
          </div>
        </div>

        {/* Person Info */}
        {personName && (
          <div className="mt-3 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <User className="w-4 h-4" />
            <span>{t.requestedFor}</span>
            <span className="font-medium text-slate-700 dark:text-slate-300">{personName}</span>
          </div>
        )}

        {/* Requester & Responses */}
        <div className="mt-3 flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <span>{t.requestedBy}</span>
            <span className="font-medium text-slate-700 dark:text-slate-300">
              {request.requester_name}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <MessageSquare className="w-4 h-4 text-slate-400" />
            <span className="text-slate-600 dark:text-slate-400">
              {request.response_count || 0} {t.responses}
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      {showActions && request.status === 'open' && (
        <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowShareMenu(!showShareMenu)}
                className="text-islamic-primary border-islamic-primary/30 hover:bg-islamic-light"
              >
                <Share2 className="w-4 h-4 me-1" />
                {t.shareRequest}
              </Button>

              {showShareMenu && (
                <div className="absolute top-full mt-1 start-0 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-1 z-10">
                  <button
                    onClick={handleCopyLink}
                    className="w-full px-4 py-2 text-sm text-start text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
                  >
                    <Share2 className="w-4 h-4" />
                    {t.copyLink}
                  </button>
                  <button
                    onClick={handleWhatsAppShare}
                    className="w-full px-4 py-2 text-sm text-start text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
                  >
                    <MessageSquare className="w-4 h-4 text-green-500" />
                    {t.shareWhatsApp}
                  </button>
                  <button
                    onClick={handleSmsShare}
                    className="w-full px-4 py-2 text-sm text-start text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
                  >
                    <Mail className="w-4 h-4 text-blue-500" />
                    {t.shareSms}
                  </button>
                </div>
              )}
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              disabled={closing}
              className="text-slate-500 hover:text-red-600"
            >
              {t.closeRequest}
            </Button>

            {(request.response_count || 0) > 0 && (
              <Button variant="ghost" size="sm" className="ms-auto">
                {t.viewResponses}
                <ChevronRight className="w-4 h-4 ms-1" />
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
