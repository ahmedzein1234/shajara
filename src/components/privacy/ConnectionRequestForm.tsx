'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { UserPlus, Send, Loader2, Check, X, TreeDeciduous } from 'lucide-react';
import { createConnectionRequest } from '@/lib/privacy/actions';

interface ConnectionRequestFormProps {
  treeId: string;
  treeName: string;
  locale: 'ar' | 'en';
  onSuccess?: () => void;
  onCancel?: () => void;
}

const translations = {
  ar: {
    title: 'طلب الانضمام للشجرة',
    subtitle: 'أرسل طلبًا لصاحب الشجرة للانضمام',
    relationship: 'ما علاقتك بهذه العائلة؟',
    relationshipPlaceholder: 'مثال: أنا حفيد محمد بن عبدالله',
    message: 'رسالة للمالك (اختياري)',
    messagePlaceholder: 'اكتب رسالة قصيرة توضح سبب طلبك...',
    submit: 'إرسال الطلب',
    submitting: 'جاري الإرسال...',
    success: 'تم إرسال الطلب بنجاح',
    successDesc: 'سيتم إعلامك عند الموافقة على طلبك',
    cancel: 'إلغاء',
    error: 'حدث خطأ، حاول مرة أخرى',
    alreadyRequested: 'لديك طلب سابق لهذه الشجرة',
    alreadyConnected: 'أنت متصل بالفعل بهذه الشجرة',
  },
  en: {
    title: 'Request to Join Tree',
    subtitle: 'Send a request to the tree owner to join',
    relationship: 'What is your relationship to this family?',
    relationshipPlaceholder: 'Example: I am the grandson of Mohammed bin Abdullah',
    message: 'Message to owner (optional)',
    messagePlaceholder: 'Write a short message explaining your request...',
    submit: 'Send Request',
    submitting: 'Sending...',
    success: 'Request sent successfully',
    successDesc: 'You will be notified when your request is approved',
    cancel: 'Cancel',
    error: 'An error occurred, please try again',
    alreadyRequested: 'You already have a pending request for this tree',
    alreadyConnected: 'You are already connected to this tree',
  },
};

export default function ConnectionRequestForm({
  treeId,
  treeName,
  locale,
  onSuccess,
  onCancel,
}: ConnectionRequestFormProps) {
  const t = translations[locale];
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [relationship, setRelationship] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    startTransition(async () => {
      try {
        await createConnectionRequest({
          treeId,
          claimedRelationship: relationship || undefined,
          message: message || undefined,
        });
        setStatus('success');
        router.refresh();
        if (onSuccess) {
          setTimeout(onSuccess, 2000);
        }
      } catch (error) {
        setStatus('error');
        const err = error as Error;
        if (err.message.includes('already exists')) {
          setErrorMessage(t.alreadyRequested);
        } else if (err.message.includes('Already connected')) {
          setErrorMessage(t.alreadyConnected);
        } else {
          setErrorMessage(t.error);
        }
      }
    });
  };

  if (status === 'success') {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check className="w-8 h-8 text-emerald-600" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
          {t.success}
        </h3>
        <p className="text-slate-600 dark:text-slate-400">
          {t.successDesc}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-islamic-100 dark:bg-islamic-900/30 rounded-xl flex items-center justify-center">
          <UserPlus className="w-6 h-6 text-islamic-600" />
        </div>
        <div>
          <h3 className="font-bold text-slate-900 dark:text-white">{t.title}</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">{t.subtitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-6 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
        <TreeDeciduous className="w-5 h-5 text-islamic-500" />
        <span className="font-medium text-slate-900 dark:text-white">{treeName}</span>
      </div>

      {status === 'error' && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg flex items-center gap-2">
          <X className="w-4 h-4" />
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
            {t.relationship}
          </label>
          <input
            type="text"
            value={relationship}
            onChange={(e) => setRelationship(e.target.value)}
            placeholder={t.relationshipPlaceholder}
            className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400"
            dir={locale === 'ar' ? 'rtl' : 'ltr'}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
            {t.message}
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t.messagePlaceholder}
            rows={3}
            className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 resize-none"
            dir={locale === 'ar' ? 'rtl' : 'ltr'}
          />
        </div>

        <div className="flex gap-3 pt-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              {t.cancel}
            </button>
          )}
          <button
            type="submit"
            disabled={isPending}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-islamic-primary hover:bg-islamic-600 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {t.submitting}
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                {t.submit}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
