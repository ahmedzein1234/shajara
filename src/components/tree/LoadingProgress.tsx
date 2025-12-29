/**
 * LoadingProgress Component
 * Shows loading progress for large family trees
 */

'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2, TreePine, Users, AlertCircle, X } from 'lucide-react';

interface LoadingProgressProps {
  locale: 'ar' | 'en';
  isLoading: boolean;
  progress?: number; // 0-100
  totalNodes?: number;
  loadedNodes?: number;
  stage?: 'fetching' | 'processing' | 'rendering' | 'complete';
  error?: string;
  onCancel?: () => void;
  className?: string;
}

export function LoadingProgress({
  locale,
  isLoading,
  progress = 0,
  totalNodes = 0,
  loadedNodes = 0,
  stage = 'fetching',
  error,
  onCancel,
  className,
}: LoadingProgressProps) {
  const t = locale === 'ar' ? translations.ar : translations.en;

  if (!isLoading && !error) return null;

  const getStageMessage = () => {
    switch (stage) {
      case 'fetching':
        return t.fetching;
      case 'processing':
        return t.processing;
      case 'rendering':
        return t.rendering;
      case 'complete':
        return t.complete;
      default:
        return t.loading;
    }
  };

  const getTip = () => {
    if (totalNodes > 200) {
      return t.largTreeTip;
    }
    if (totalNodes > 100) {
      return t.mediumTreeTip;
    }
    return null;
  };

  return (
    <div
      className={cn(
        'fixed inset-0 z-40 flex items-center justify-center',
        'bg-white/80 backdrop-blur-sm',
        className
      )}
      role="progressbar"
      aria-valuenow={progress}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={getStageMessage()}
    >
      <div
        className={cn(
          'bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4',
          'border border-gray-100'
        )}
        dir={locale === 'ar' ? 'rtl' : 'ltr'}
      >
        {error ? (
          // Error state
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle size={32} className="text-red-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {t.errorTitle}
            </h3>
            <p className="text-sm text-gray-600 mb-4">{error}</p>
            <button
              onClick={onCancel}
              className="px-6 py-2.5 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors min-h-[44px]"
            >
              {t.tryAgain}
            </button>
          </div>
        ) : (
          // Loading state
          <>
            {/* Icon */}
            <div className="text-center mb-6">
              <div className="relative inline-block">
                <div className="w-20 h-20 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full flex items-center justify-center">
                  <TreePine size={40} className="text-emerald-600" />
                </div>
                <div className="absolute -bottom-1 -end-1 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center">
                  <Loader2 size={20} className="text-emerald-500 animate-spin" />
                </div>
              </div>
            </div>

            {/* Title */}
            <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
              {t.loadingTitle}
            </h3>

            {/* Stage message */}
            <p className="text-sm text-gray-600 text-center mb-6">
              {getStageMessage()}
            </p>

            {/* Progress bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                <span>{Math.round(progress)}%</span>
                {totalNodes > 0 && (
                  <span className="flex items-center gap-1">
                    <Users size={12} />
                    {loadedNodes} / {totalNodes}
                  </span>
                )}
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                />
              </div>
            </div>

            {/* Tip */}
            {getTip() && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4">
                <p className="text-xs text-amber-700 flex items-start gap-2">
                  <span className="text-amber-500 mt-0.5">💡</span>
                  <span>{getTip()}</span>
                </p>
              </div>
            )}

            {/* Cancel button */}
            {onCancel && (
              <button
                onClick={onCancel}
                className="w-full py-2.5 border border-gray-200 rounded-xl text-gray-600 font-medium hover:bg-gray-50 transition-colors text-sm min-h-[44px] flex items-center justify-center gap-2"
              >
                <X size={16} />
                {t.cancel}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

const translations = {
  ar: {
    loadingTitle: 'جارٍ تحميل شجرة العائلة',
    loading: 'جارٍ التحميل...',
    fetching: 'جارٍ جلب بيانات العائلة...',
    processing: 'جارٍ معالجة العلاقات...',
    rendering: 'جارٍ رسم الشجرة...',
    complete: 'اكتمل التحميل!',
    errorTitle: 'حدث خطأ',
    tryAgain: 'حاول مرة أخرى',
    cancel: 'إلغاء',
    largTreeTip: 'شجرتك كبيرة! جرب عرض "الأسلاف فقط" لتحميل أسرع.',
    mediumTreeTip: 'نصيحة: يمكنك استخدام الفلتر لعرض جزء محدد من الشجرة.',
  },
  en: {
    loadingTitle: 'Loading Family Tree',
    loading: 'Loading...',
    fetching: 'Fetching family data...',
    processing: 'Processing relationships...',
    rendering: 'Rendering tree...',
    complete: 'Loading complete!',
    errorTitle: 'An Error Occurred',
    tryAgain: 'Try Again',
    cancel: 'Cancel',
    largTreeTip: 'Your tree is large! Try "Ancestors only" view for faster loading.',
    mediumTreeTip: 'Tip: You can use filters to view a specific part of the tree.',
  },
};

export default LoadingProgress;
