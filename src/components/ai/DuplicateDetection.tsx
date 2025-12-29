'use client';

import * as React from 'react';
import { useLocale } from 'next-intl';
import { AlertTriangle, GitMerge, X, Loader2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { detectDuplicates, type DuplicateSuggestion } from '@/lib/ai/suggestions';

interface DuplicateDetectionProps {
  treeId: string;
  onMerge?: (personId: string, duplicateId: string) => void;
}

const translations = {
  ar: {
    title: 'اكتشاف التكرارات',
    subtitle: 'تم العثور على سجلات قد تكون مكررة',
    loading: 'جاري البحث عن تكرارات...',
    noDuplicates: 'لم يتم العثور على تكرارات',
    similarity: 'تشابه',
    matchingFields: 'الحقول المتطابقة',
    merge: 'دمج',
    dismiss: 'تجاهل',
    given_name: 'الاسم الأول',
    full_name: 'الاسم الكامل',
    birth_date: 'تاريخ الميلاد',
    birth_place: 'مكان الميلاد',
    scan: 'فحص التكرارات',
  },
  en: {
    title: 'Duplicate Detection',
    subtitle: 'Found records that may be duplicates',
    loading: 'Scanning for duplicates...',
    noDuplicates: 'No duplicates found',
    similarity: 'Similarity',
    matchingFields: 'Matching fields',
    merge: 'Merge',
    dismiss: 'Dismiss',
    given_name: 'Given Name',
    full_name: 'Full Name',
    birth_date: 'Birth Date',
    birth_place: 'Birth Place',
    scan: 'Scan for Duplicates',
  },
};

export function DuplicateDetection({ treeId, onMerge }: DuplicateDetectionProps) {
  const locale = useLocale() as 'ar' | 'en';
  const t = translations[locale];

  const [duplicates, setDuplicates] = React.useState<DuplicateSuggestion[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [hasScanned, setHasScanned] = React.useState(false);
  const [dismissedPairs, setDismissedPairs] = React.useState<Set<string>>(new Set());

  const handleScan = async () => {
    setIsLoading(true);
    try {
      const results = await detectDuplicates(treeId);
      setDuplicates(results);
      setHasScanned(true);
    } catch (error) {
      console.error('Failed to detect duplicates:', error);
    }
    setIsLoading(false);
  };

  const handleDismiss = (personId: string, duplicateId: string) => {
    const pairKey = [personId, duplicateId].sort().join('-');
    setDismissedPairs(prev => new Set(prev).add(pairKey));
  };

  const visibleDuplicates = duplicates.filter(d => {
    const pairKey = [d.personId, d.duplicateId].sort().join('-');
    return !dismissedPairs.has(pairKey);
  });

  if (!hasScanned) {
    return (
      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white">{t.title}</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {t.subtitle}
              </p>
            </div>
          </div>
          <Button
            onClick={handleScan}
            disabled={isLoading}
            variant="outline"
            className="border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-400"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 me-2 animate-spin" />
            ) : (
              <AlertTriangle className="w-4 h-4 me-2" />
            )}
            {t.scan}
          </Button>
        </div>
      </div>
    );
  }

  if (visibleDuplicates.length === 0) {
    return (
      <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl p-6 border border-emerald-200 dark:border-emerald-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white">{t.title}</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">{t.noDuplicates}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl p-6 border border-amber-200 dark:border-amber-800">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center shrink-0">
          <AlertTriangle className="w-5 h-5 text-amber-600" />
        </div>
        <div>
          <h3 className="font-bold text-slate-900 dark:text-white">{t.title}</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {t.subtitle} ({visibleDuplicates.length})
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {visibleDuplicates.map((dup) => (
          <div
            key={`${dup.personId}-${dup.duplicateId}`}
            className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                  <span className="font-mono bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded">
                    {dup.personId.slice(-6)}
                  </span>
                  <span className="text-slate-400">&harr;</span>
                  <span className="font-mono bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded">
                    {dup.duplicateId.slice(-6)}
                  </span>
                  <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full text-xs font-medium">
                    {t.similarity}: {dup.similarity}%
                  </span>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {dup.matchingFields.map(field => (
                    <span
                      key={field}
                      className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded text-xs"
                    >
                      {t[field as keyof typeof t] || field}
                    </span>
                  ))}
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                  {locale === 'ar' ? dup.suggestionAr : dup.suggestion}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDismiss(dup.personId, dup.duplicateId)}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                  title={t.dismiss}
                >
                  <X className="w-4 h-4" />
                </button>
                {onMerge && (
                  <Button
                    size="sm"
                    onClick={() => onMerge(dup.personId, dup.duplicateId)}
                    className="bg-amber-600 hover:bg-amber-700 text-white"
                  >
                    <GitMerge className="w-4 h-4 me-1" />
                    {t.merge}
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
