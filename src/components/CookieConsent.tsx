/**
 * Cookie Consent Banner
 * GDPR-compliant cookie consent for essential cookies
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { X, Cookie, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CookieConsentProps {
  locale?: 'ar' | 'en';
}

const CONSENT_KEY = 'shajara-cookie-consent';

export function CookieConsent({ locale = 'ar' }: CookieConsentProps) {
  const [showBanner, setShowBanner] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const isRtl = locale === 'ar';

  useEffect(() => {
    // Check if consent was already given
    const consent = localStorage.getItem(CONSENT_KEY);
    if (!consent) {
      // Small delay for better UX
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(CONSENT_KEY, JSON.stringify({
      accepted: true,
      timestamp: new Date().toISOString(),
      essential: true,
    }));
    setIsAnimating(true);
    setTimeout(() => setShowBanner(false), 300);
  };

  const handleDecline = () => {
    // For essential cookies only, declining means they can still use the site
    // but won't have personalization features
    localStorage.setItem(CONSENT_KEY, JSON.stringify({
      accepted: false,
      timestamp: new Date().toISOString(),
      essential: true, // Essential cookies are always required
    }));
    setIsAnimating(true);
    setTimeout(() => setShowBanner(false), 300);
  };

  if (!showBanner) return null;

  const t = isRtl ? translations.ar : translations.en;

  return (
    <div
      className={cn(
        'fixed bottom-0 inset-x-0 z-50 p-4',
        'animate-in slide-in-from-bottom duration-500',
        isAnimating && 'animate-out slide-out-to-bottom duration-300'
      )}
      dir={isRtl ? 'rtl' : 'ltr'}
      role="dialog"
      aria-label={t.title}
      aria-modal="false"
    >
      <div className="container mx-auto max-w-4xl">
        <div className={cn(
          'bg-white rounded-2xl shadow-2xl border border-gray-200',
          'p-6 md:p-8'
        )}>
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div className="hidden sm:flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-100">
              <Cookie className="w-6 h-6 text-emerald-600" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {t.title}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed mb-4">
                    {t.description}
                  </p>
                </div>

                {/* Close button (mobile) */}
                <button
                  onClick={handleDecline}
                  className="sm:hidden min-w-[44px] min-h-[44px] -m-2 p-2 text-gray-400 hover:text-gray-600"
                  aria-label={t.close}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Cookie Types */}
              <div className="flex flex-wrap gap-3 mb-6">
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-gray-700">{t.essential}</span>
                  <span className="text-xs text-gray-400">({t.required})</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 rounded-full bg-gray-300" />
                  <span className="text-gray-500 line-through">{t.analytics}</span>
                  <span className="text-xs text-gray-400">({t.notUsed})</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 rounded-full bg-gray-300" />
                  <span className="text-gray-500 line-through">{t.marketing}</span>
                  <span className="text-xs text-gray-400">({t.notUsed})</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={handleAccept}
                  className={cn(
                    'min-h-[44px] px-6 py-2.5 rounded-xl font-medium',
                    'bg-emerald-600 text-white hover:bg-emerald-700',
                    'transition-colors flex items-center gap-2'
                  )}
                >
                  <Shield className="w-4 h-4" />
                  {t.accept}
                </button>

                <button
                  onClick={handleDecline}
                  className={cn(
                    'min-h-[44px] px-6 py-2.5 rounded-xl font-medium',
                    'bg-gray-100 text-gray-700 hover:bg-gray-200',
                    'transition-colors hidden sm:flex'
                  )}
                >
                  {t.decline}
                </button>

                <Link
                  href={`/${locale}/privacy`}
                  className="text-sm text-emerald-600 hover:text-emerald-700 underline underline-offset-2"
                >
                  {t.learnMore}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const translations = {
  en: {
    title: 'Cookie Notice',
    description: 'We use essential cookies to make our service work. We do not use tracking or advertising cookies. Your privacy is important to us.',
    essential: 'Essential',
    analytics: 'Analytics',
    marketing: 'Marketing',
    required: 'Required',
    notUsed: 'Not used',
    accept: 'Accept Essential Cookies',
    decline: 'Decline Optional',
    learnMore: 'Learn more about our privacy policy',
    close: 'Close',
  },
  ar: {
    title: 'إشعار ملفات تعريف الارتباط',
    description: 'نستخدم ملفات تعريف الارتباط الأساسية لتشغيل خدمتنا. لا نستخدم ملفات تعريف الارتباط للتتبع أو الإعلانات. خصوصيتك مهمة بالنسبة لنا.',
    essential: 'أساسية',
    analytics: 'تحليلية',
    marketing: 'تسويقية',
    required: 'مطلوبة',
    notUsed: 'غير مستخدمة',
    accept: 'قبول ملفات تعريف الارتباط الأساسية',
    decline: 'رفض الاختيارية',
    learnMore: 'اعرف المزيد عن سياسة الخصوصية',
    close: 'إغلاق',
  },
};

export default CookieConsent;
