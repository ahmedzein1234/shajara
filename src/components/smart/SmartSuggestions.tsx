'use client';

import * as React from 'react';
import {
  Lightbulb, AlertCircle, Calendar, Users, Link2, X, Check,
  ChevronRight, Loader2, Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  type AISuggestion,
  type SuggestionType,
  getAISuggestions,
  updateSuggestionStatus,
  generateAISuggestions,
} from '@/lib/db/smart-actions';

interface SmartSuggestionsProps {
  treeId: string;
  locale?: 'ar' | 'en';
  onMemberClick?: (memberId: string) => void;
}

const translations = {
  ar: {
    title: 'الاقتراحات الذكية',
    subtitle: 'تحسينات مقترحة لشجرتك',
    generate: 'تحليل الشجرة',
    generating: 'جاري التحليل...',
    noSuggestions: 'لا توجد اقتراحات حالياً',
    accept: 'قبول',
    dismiss: 'تجاهل',
    viewMember: 'عرض العضو',
    confidence: 'الثقة',
    types: {
      relationship_hint: 'اقتراح علاقة',
      missing_info: 'معلومات ناقصة',
      date_correction: 'تصحيح تاريخ',
      name_suggestion: 'اقتراح اسم',
      potential_relative: 'قريب محتمل',
      data_inconsistency: 'تضارب في البيانات',
    },
  },
  en: {
    title: 'Smart Suggestions',
    subtitle: 'Suggested improvements for your tree',
    generate: 'Analyze Tree',
    generating: 'Analyzing...',
    noSuggestions: 'No suggestions at this time',
    accept: 'Accept',
    dismiss: 'Dismiss',
    viewMember: 'View Member',
    confidence: 'Confidence',
    types: {
      relationship_hint: 'Relationship Hint',
      missing_info: 'Missing Information',
      date_correction: 'Date Correction',
      name_suggestion: 'Name Suggestion',
      potential_relative: 'Potential Relative',
      data_inconsistency: 'Data Inconsistency',
    },
  },
};

const suggestionIcons: Record<SuggestionType, React.ElementType> = {
  relationship_hint: Users,
  missing_info: AlertCircle,
  date_correction: Calendar,
  name_suggestion: Lightbulb,
  potential_relative: Link2,
  data_inconsistency: AlertCircle,
};

const suggestionColors: Record<SuggestionType, string> = {
  relationship_hint: 'text-blue-500 bg-blue-100 dark:bg-blue-900/30',
  missing_info: 'text-amber-500 bg-amber-100 dark:bg-amber-900/30',
  date_correction: 'text-red-500 bg-red-100 dark:bg-red-900/30',
  name_suggestion: 'text-purple-500 bg-purple-100 dark:bg-purple-900/30',
  potential_relative: 'text-green-500 bg-green-100 dark:bg-green-900/30',
  data_inconsistency: 'text-orange-500 bg-orange-100 dark:bg-orange-900/30',
};

export function SmartSuggestions({ treeId, locale = 'ar', onMemberClick }: SmartSuggestionsProps) {
  const t = translations[locale];
  const isRTL = locale === 'ar';

  const [suggestions, setSuggestions] = React.useState<AISuggestion[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [generating, setGenerating] = React.useState(false);
  const [processingId, setProcessingId] = React.useState<string | null>(null);

  const loadSuggestions = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAISuggestions(treeId, { status: 'pending', limit: 20 });
      setSuggestions(data);
    } catch (error) {
      console.error('Failed to load suggestions:', error);
    } finally {
      setLoading(false);
    }
  }, [treeId]);

  React.useEffect(() => {
    loadSuggestions();
  }, [loadSuggestions]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await generateAISuggestions(treeId);
      await loadSuggestions();
    } catch (error) {
      console.error('Failed to generate suggestions:', error);
    } finally {
      setGenerating(false);
    }
  };

  const handleAction = async (suggestionId: string, action: 'accepted' | 'dismissed') => {
    setProcessingId(suggestionId);
    try {
      await updateSuggestionStatus(suggestionId, action);
      setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
    } catch (error) {
      console.error('Failed to update suggestion:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const getMemberName = (suggestion: AISuggestion): string => {
    if (!suggestion.member) return '';
    return locale === 'ar'
      ? `${suggestion.member.first_name_ar} ${suggestion.member.last_name_ar}`
      : `${suggestion.member.first_name_en || suggestion.member.first_name_ar} ${suggestion.member.last_name_en || suggestion.member.last_name_ar}`;
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white">{t.title}</h3>
              <p className="text-sm text-slate-500">{t.subtitle}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerate}
            disabled={generating}
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin me-2" />
                {t.generating}
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 me-2" />
                {t.generate}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Suggestions List */}
      <div className="divide-y divide-slate-100 dark:divide-slate-700 max-h-[400px] overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="w-6 h-6 animate-spin text-islamic-primary" />
          </div>
        ) : suggestions.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <Lightbulb className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>{t.noSuggestions}</p>
          </div>
        ) : (
          suggestions.map((suggestion) => {
            const Icon = suggestionIcons[suggestion.suggestion_type];
            const colorClass = suggestionColors[suggestion.suggestion_type];

            return (
              <div
                key={suggestion.id}
                className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorClass}`}>
                    <Icon className="w-5 h-5" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${colorClass}`}>
                        {t.types[suggestion.suggestion_type]}
                      </span>
                      <span className="text-xs text-slate-400">
                        {t.confidence}: {Math.round(suggestion.confidence * 100)}%
                      </span>
                    </div>

                    <h4 className="font-medium text-slate-900 dark:text-white mb-1">
                      {locale === 'ar' ? suggestion.title_ar : suggestion.title_en}
                    </h4>

                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                      {locale === 'ar' ? suggestion.description_ar : suggestion.description_en}
                    </p>

                    {suggestion.member && (
                      <button
                        onClick={() => onMemberClick?.(suggestion.member!.id)}
                        className="inline-flex items-center gap-1 text-sm text-islamic-primary hover:underline"
                      >
                        <span>{getMemberName(suggestion)}</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    {processingId === suggestion.id ? (
                      <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                    ) : (
                      <>
                        <button
                          onClick={() => handleAction(suggestion.id, 'accepted')}
                          className="p-2 text-green-500 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-colors"
                          title={t.accept}
                        >
                          <Check className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleAction(suggestion.id, 'dismissed')}
                          className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                          title={t.dismiss}
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      {suggestions.length > 0 && (
        <div className="p-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700">
          <p className="text-xs text-center text-slate-400">
            {locale === 'ar'
              ? `${suggestions.length} اقتراحات قيد الانتظار`
              : `${suggestions.length} pending suggestions`}
          </p>
        </div>
      )}
    </div>
  );
}
