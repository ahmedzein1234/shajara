'use client';

import * as React from 'react';
import { useLocale } from 'next-intl';
import { X, Download, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const translations = {
  ar: {
    title: 'أضف شجرة لشاشتك الرئيسية',
    description: 'احصل على تجربة أفضل مع الوصول السريع',
    install: 'تثبيت التطبيق',
    later: 'لاحقاً',
    iosTitle: 'تثبيت شجرة على iPhone',
    iosStep1: '1. اضغط على زر المشاركة',
    iosStep2: '2. اختر "إضافة إلى الشاشة الرئيسية"',
    iosStep3: '3. اضغط "إضافة"',
  },
  en: {
    title: 'Add Shajara to your home screen',
    description: 'Get a better experience with quick access',
    install: 'Install App',
    later: 'Later',
    iosTitle: 'Install Shajara on iPhone',
    iosStep1: '1. Tap the Share button',
    iosStep2: '2. Select "Add to Home Screen"',
    iosStep3: '3. Tap "Add"',
  },
};

export function InstallPrompt() {
  const locale = useLocale() as 'ar' | 'en';
  const t = translations[locale];

  const [deferredPrompt, setDeferredPrompt] = React.useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = React.useState(false);
  const [showIosPrompt, setShowIosPrompt] = React.useState(false);
  const [isIos, setIsIos] = React.useState(false);

  React.useEffect(() => {
    // Check if already installed or dismissed
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) return;

    // Check if iOS
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const inStandalone = window.matchMedia('(display-mode: standalone)').matches;

    if (ios && !inStandalone) {
      setIsIos(true);
      // Show iOS prompt after a delay
      setTimeout(() => setShowIosPrompt(true), 5000);
      return;
    }

    // Listen for install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setShowPrompt(false);
    }

    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setShowIosPrompt(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  if (!showPrompt && !showIosPrompt) return null;

  // iOS-specific prompt
  if (isIos && showIosPrompt) {
    return (
      <div className="fixed bottom-4 start-4 end-4 z-50 animate-slide-up">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-4">
          <button
            onClick={handleDismiss}
            className="absolute top-3 end-3 p-1 text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
              <Smartphone className="w-6 h-6 text-emerald-600" />
            </div>

            <div>
              <h3 className="font-bold text-slate-900 dark:text-white mb-2">
                {t.iosTitle}
              </h3>
              <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                <p>{t.iosStep1} <span className="inline-block w-5 h-5 align-middle">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M16 5l-1.42 1.42-1.59-1.59V16h-1.98V4.83L9.42 6.42 8 5l4-4 4 4zm4 5v11c0 1.1-.9 2-2 2H6c-1.11 0-2-.9-2-2V10c0-1.11.89-2 2-2h3v2H6v11h12V10h-3V8h3c1.1 0 2 .89 2 2z"/>
                  </svg>
                </span></p>
                <p>{t.iosStep2}</p>
                <p>{t.iosStep3}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Standard install prompt
  return (
    <div className="fixed bottom-4 start-4 end-4 z-50 animate-slide-up">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-4">
        <button
          onClick={handleDismiss}
          className="absolute top-3 end-3 p-1 text-slate-400 hover:text-slate-600"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
            <Download className="w-6 h-6 text-emerald-600" />
          </div>

          <div className="flex-1">
            <h3 className="font-bold text-slate-900 dark:text-white">
              {t.title}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {t.description}
            </p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleDismiss}>
              {t.later}
            </Button>
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={handleInstall}
            >
              {t.install}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
