'use client';

import * as React from 'react';
import {
  X, Image, FileText, MessageSquare, Users, CheckCircle, AlertCircle,
  Send, Calendar, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  type ContributionRequestType,
  type ContributionPriority,
  createContributionRequest,
} from '@/lib/db/contribution-actions';

interface CreateContributionModalProps {
  isOpen: boolean;
  onClose: () => void;
  treeId: string;
  personId?: string;
  personName?: string;
  locale?: 'ar' | 'en';
  onSuccess?: () => void;
}

const translations = {
  ar: {
    title: 'طلب مساهمة جديد',
    subtitle: 'اطلب من أفراد العائلة المساهمة بمعلومات أو صور',
    requestType: 'نوع الطلب',
    types: {
      photo: 'صورة',
      info: 'معلومات',
      memory: 'ذكرى أو قصة',
      relative: 'معلومات قريب',
      verification: 'تحقق من معلومات',
      correction: 'تصحيح خطأ',
    },
    typeDescriptions: {
      photo: 'طلب صورة لشخص أو مناسبة',
      info: 'طلب معلومات مفقودة',
      memory: 'طلب قصة أو ذكرى عائلية',
      relative: 'البحث عن معلومات عن قريب',
      verification: 'التأكد من صحة معلومات',
      correction: 'الإبلاغ عن خطأ للتصحيح',
    },
    titleField: 'عنوان الطلب',
    titlePlaceholder: 'مثال: صورة جدي في زفافه',
    descriptionField: 'الوصف',
    descriptionPlaceholder: 'اشرح ما تبحث عنه بالتفصيل...',
    priority: 'الأولوية',
    priorities: {
      low: 'منخفضة',
      normal: 'عادية',
      high: 'مرتفعة',
    },
    makePublic: 'جعل الطلب عام',
    makePublicDesc: 'السماح لغير أفراد العائلة بالمشاهدة والمساهمة',
    expiresIn: 'ينتهي بعد',
    noExpiry: 'بلا انتهاء',
    days: 'أيام',
    submit: 'إرسال الطلب',
    submitting: 'جاري الإرسال...',
    cancel: 'إلغاء',
    forPerson: 'لـ {person}',
  },
  en: {
    title: 'New Contribution Request',
    subtitle: 'Ask family members to contribute information or photos',
    requestType: 'Request Type',
    types: {
      photo: 'Photo',
      info: 'Information',
      memory: 'Memory or Story',
      relative: 'Relative Info',
      verification: 'Verification',
      correction: 'Correction',
    },
    typeDescriptions: {
      photo: 'Request a photo of a person or event',
      info: 'Request missing information',
      memory: 'Request a family story or memory',
      relative: 'Looking for info about a relative',
      verification: 'Verify existing information',
      correction: 'Report an error for correction',
    },
    titleField: 'Request Title',
    titlePlaceholder: 'e.g., Photo of grandpa at his wedding',
    descriptionField: 'Description',
    descriptionPlaceholder: 'Explain what you are looking for in detail...',
    priority: 'Priority',
    priorities: {
      low: 'Low',
      normal: 'Normal',
      high: 'High',
    },
    makePublic: 'Make request public',
    makePublicDesc: 'Allow non-family members to view and contribute',
    expiresIn: 'Expires in',
    noExpiry: 'No expiry',
    days: 'days',
    submit: 'Submit Request',
    submitting: 'Submitting...',
    cancel: 'Cancel',
    forPerson: 'For {person}',
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

export function CreateContributionModal({
  isOpen,
  onClose,
  treeId,
  personId,
  personName,
  locale = 'ar',
  onSuccess,
}: CreateContributionModalProps) {
  const t = translations[locale];
  const isRTL = locale === 'ar';

  const [requestType, setRequestType] = React.useState<ContributionRequestType>('photo');
  const [titleAr, setTitleAr] = React.useState('');
  const [titleEn, setTitleEn] = React.useState('');
  const [descriptionAr, setDescriptionAr] = React.useState('');
  const [descriptionEn, setDescriptionEn] = React.useState('');
  const [priority, setPriority] = React.useState<ContributionPriority>('normal');
  const [isPublic, setIsPublic] = React.useState(false);
  const [expiresInDays, setExpiresInDays] = React.useState<number | undefined>(undefined);
  const [submitting, setSubmitting] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const result = await createContributionRequest(treeId, {
        personId,
        requestType,
        titleAr,
        titleEn,
        descriptionAr,
        descriptionEn,
        priority,
        isPublic,
        expiresInDays,
      });

      if (result.success) {
        onSuccess?.();
        onClose();
      } else {
        console.error('Failed to create request:', result.error);
      }
    } catch (error) {
      console.error('Failed to create request:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-2xl shadow-xl m-4"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-t-2xl">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {t.title}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {personName
                ? t.forPerson.replace('{person}', personName)
                : t.subtitle}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-6">
          {/* Request Type */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
              {t.requestType}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(typeIcons) as ContributionRequestType[]).map(type => {
                const Icon = typeIcons[type];
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setRequestType(type)}
                    className={`p-3 rounded-xl border-2 transition-all text-center ${
                      requestType === type
                        ? 'border-islamic-primary bg-islamic-light/50 dark:bg-islamic-primary/20'
                        : 'border-slate-200 dark:border-slate-700 hover:border-islamic-primary/50'
                    }`}
                  >
                    <Icon className={`w-6 h-6 mx-auto mb-1 ${
                      requestType === type ? 'text-islamic-primary' : 'text-slate-400'
                    }`} />
                    <span className={`text-xs font-medium ${
                      requestType === type ? 'text-islamic-primary' : 'text-slate-600 dark:text-slate-400'
                    }`}>
                      {t.types[type]}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              {t.typeDescriptions[requestType]}
            </p>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              {t.titleField}
            </label>
            <input
              type="text"
              value={locale === 'ar' ? titleAr : titleEn}
              onChange={e => locale === 'ar' ? setTitleAr(e.target.value) : setTitleEn(e.target.value)}
              placeholder={t.titlePlaceholder}
              className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-islamic-primary"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              {t.descriptionField}
            </label>
            <textarea
              value={locale === 'ar' ? descriptionAr : descriptionEn}
              onChange={e => locale === 'ar' ? setDescriptionAr(e.target.value) : setDescriptionEn(e.target.value)}
              placeholder={t.descriptionPlaceholder}
              rows={4}
              className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-islamic-primary resize-none"
            />
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              {t.priority}
            </label>
            <div className="flex gap-2">
              {(['low', 'normal', 'high'] as ContributionPriority[]).map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`flex-1 py-2 rounded-lg border transition-all ${
                    priority === p
                      ? 'border-islamic-primary bg-islamic-light dark:bg-islamic-primary/20 text-islamic-primary'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {t.priorities[p]}
                </button>
              ))}
            </div>
          </div>

          {/* Expiry */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              {t.expiresIn}
            </label>
            <div className="flex gap-2">
              {[undefined, 7, 30, 90].map(days => (
                <button
                  key={days ?? 'none'}
                  type="button"
                  onClick={() => setExpiresInDays(days)}
                  className={`flex-1 py-2 rounded-lg border transition-all text-sm ${
                    expiresInDays === days
                      ? 'border-islamic-primary bg-islamic-light dark:bg-islamic-primary/20 text-islamic-primary'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {days ? `${days} ${t.days}` : t.noExpiry}
                </button>
              ))}
            </div>
          </div>

          {/* Public Toggle */}
          <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
            <div>
              <p className="font-medium text-slate-700 dark:text-slate-300">{t.makePublic}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{t.makePublicDesc}</p>
            </div>
            <button
              type="button"
              onClick={() => setIsPublic(!isPublic)}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                isPublic ? 'bg-islamic-primary' : 'bg-slate-300 dark:bg-slate-600'
              }`}
            >
              <span
                className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  isPublic
                    ? isRTL ? 'left-0.5' : 'right-0.5'
                    : isRTL ? 'right-0.5' : 'left-0.5'
                }`}
              />
            </button>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              {t.cancel}
            </Button>
            <Button
              type="submit"
              disabled={submitting || (!titleAr && !titleEn)}
              className="flex-1 bg-islamic-primary hover:bg-islamic-dark text-white"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 me-2 animate-spin" />
                  {t.submitting}
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 me-2" />
                  {t.submit}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
