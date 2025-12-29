'use client';

import * as React from 'react';
import { useLocale } from 'next-intl';
import { Sparkles, UserPlus, ChevronRight, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { suggestRelationships, type RelationshipSuggestion } from '@/lib/ai/suggestions';

interface RelationshipSuggestionsProps {
  treeId: string;
  personId: string;
  personName: string;
  onAddRelationship: (suggestedPersonId: string, relationshipType: string) => void;
}

const translations = {
  ar: {
    title: 'اقتراحات العلاقات',
    subtitle: 'تم اكتشاف علاقات محتملة بناءً على الأسماء والبيانات',
    loading: 'جاري البحث عن اقتراحات...',
    noSuggestions: 'لا توجد اقتراحات حالياً',
    addRelation: 'إضافة علاقة',
    confidence: 'ثقة',
    father: 'أب',
    mother: 'أم',
    sibling: 'أخ/أخت',
    spouse: 'زوج/زوجة',
    child: 'ابن/ابنة',
    relative: 'قريب',
    dismiss: 'تجاهل',
  },
  en: {
    title: 'Relationship Suggestions',
    subtitle: 'Potential relationships detected based on names and data',
    loading: 'Searching for suggestions...',
    noSuggestions: 'No suggestions at this time',
    addRelation: 'Add Relationship',
    confidence: 'Confidence',
    father: 'Father',
    mother: 'Mother',
    sibling: 'Sibling',
    spouse: 'Spouse',
    child: 'Child',
    relative: 'Relative',
    dismiss: 'Dismiss',
  },
};

const relationshipColors: Record<string, string> = {
  father: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  mother: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
  sibling: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  spouse: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  child: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  relative: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
};

export function RelationshipSuggestions({
  treeId,
  personId,
  personName,
  onAddRelationship,
}: RelationshipSuggestionsProps) {
  const locale = useLocale() as 'ar' | 'en';
  const t = translations[locale];

  const [suggestions, setSuggestions] = React.useState<RelationshipSuggestion[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [dismissedIds, setDismissedIds] = React.useState<Set<string>>(new Set());
  const [personNames, setPersonNames] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    async function loadSuggestions() {
      setIsLoading(true);
      try {
        const results = await suggestRelationships(treeId, personId);
        setSuggestions(results);

        // Load names for suggested persons
        // In a real implementation, this would be part of the suggestion response
        const names: Record<string, string> = {};
        for (const suggestion of results) {
          names[suggestion.suggestedPersonId] = `Person ${suggestion.suggestedPersonId.slice(-4)}`;
        }
        setPersonNames(names);
      } catch (error) {
        console.error('Failed to load suggestions:', error);
      }
      setIsLoading(false);
    }

    loadSuggestions();
  }, [treeId, personId]);

  const handleDismiss = (suggestionId: string) => {
    setDismissedIds(prev => new Set(prev).add(suggestionId));
  };

  const visibleSuggestions = suggestions.filter(
    s => !dismissedIds.has(s.suggestedPersonId)
  );

  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-2xl p-6 border border-purple-200 dark:border-purple-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
            <Loader2 className="w-5 h-5 text-purple-600 animate-spin" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-500" />
              {t.title}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">{t.loading}</p>
          </div>
        </div>
      </div>
    );
  }

  if (visibleSuggestions.length === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-2xl p-6 border border-purple-200 dark:border-purple-800">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center shrink-0">
          <Sparkles className="w-5 h-5 text-purple-600" />
        </div>
        <div>
          <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
            {t.title}
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">{t.subtitle}</p>
        </div>
      </div>

      <div className="space-y-3">
        {visibleSuggestions.map((suggestion) => (
          <div
            key={suggestion.suggestedPersonId}
            className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-700 transition-colors"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-slate-900 dark:text-white">
                    {personNames[suggestion.suggestedPersonId] || suggestion.suggestedPersonId}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    relationshipColors[suggestion.relationshipType] || relationshipColors.relative
                  }`}>
                    {t[suggestion.relationshipType as keyof typeof t] || suggestion.relationshipType}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {t.confidence}: {suggestion.confidence}%
                  </span>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  {locale === 'ar' ? suggestion.reasonAr : suggestion.reason}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDismiss(suggestion.suggestedPersonId)}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                  title={t.dismiss}
                >
                  <X className="w-4 h-4" />
                </button>
                <Button
                  size="sm"
                  onClick={() => onAddRelationship(suggestion.suggestedPersonId, suggestion.relationshipType)}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <UserPlus className="w-4 h-4 me-1" />
                  {t.addRelation}
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
