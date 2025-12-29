/**
 * EmptyTreeState Component
 * Welcoming empty state with onboarding guidance for new users
 */

'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  TreePine,
  UserPlus,
  Users,
  Share2,
  Sparkles,
  Bot,
  PlayCircle,
  BookOpen,
  ChevronRight,
  Heart,
} from 'lucide-react';

interface EmptyTreeStateProps {
  locale?: 'ar' | 'en';
  onAddFirstPerson?: () => void;
  onUseAIAssistant?: () => void;
  onLoadExample?: () => void;
  onWatchTutorial?: () => void;
  className?: string;
}

export function EmptyTreeState({
  locale = 'ar',
  onAddFirstPerson,
  onUseAIAssistant,
  onLoadExample,
  onWatchTutorial,
  className,
}: EmptyTreeStateProps) {
  const [hoveredStep, setHoveredStep] = useState<number | null>(null);
  const t = locale === 'ar' ? translations.ar : translations.en;

  const steps = [
    {
      icon: UserPlus,
      title: t.step1Title,
      description: t.step1Desc,
      color: 'from-blue-500 to-blue-600',
    },
    {
      icon: Users,
      title: t.step2Title,
      description: t.step2Desc,
      color: 'from-emerald-500 to-emerald-600',
    },
    {
      icon: Heart,
      title: t.step3Title,
      description: t.step3Desc,
      color: 'from-pink-500 to-pink-600',
    },
    {
      icon: Share2,
      title: t.step4Title,
      description: t.step4Desc,
      color: 'from-violet-500 to-violet-600',
    },
  ];

  return (
    <div
      className={cn(
        'w-full h-full flex flex-col items-center justify-center p-4 md:p-8',
        'bg-gradient-to-br from-slate-50 via-white to-blue-50',
        className
      )}
      dir={locale === 'ar' ? 'rtl' : 'ltr'}
    >
      {/* Hero Section */}
      <div className="text-center mb-8 md:mb-12 max-w-2xl">
        {/* Animated Tree Icon */}
        <div className="relative inline-block mb-6">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full blur-2xl opacity-20 animate-pulse" />
          <div className="relative bg-gradient-to-br from-emerald-500 to-teal-600 p-6 rounded-3xl shadow-xl">
            <TreePine size={48} className="text-white" strokeWidth={1.5} />
          </div>
          <Sparkles
            size={24}
            className="absolute -top-2 -end-2 text-amber-400 animate-bounce"
          />
        </div>

        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          {t.title}
        </h1>

        {/* Subtitle */}
        <p className="text-lg text-gray-600 leading-relaxed">
          {t.subtitle}
        </p>
      </div>

      {/* Steps */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8 md:mb-12 max-w-3xl w-full">
        {steps.map((step, index) => (
          <div
            key={index}
            className={cn(
              'relative bg-white rounded-2xl p-4 md:p-5 shadow-sm border border-gray-100',
              'transition-all duration-300 cursor-default',
              hoveredStep === index && 'shadow-lg scale-105 border-gray-200'
            )}
            onMouseEnter={() => setHoveredStep(index)}
            onMouseLeave={() => setHoveredStep(null)}
          >
            {/* Step Number */}
            <div className="absolute -top-2 -start-2 w-6 h-6 bg-gray-900 text-white rounded-full text-xs font-bold flex items-center justify-center">
              {index + 1}
            </div>

            {/* Icon */}
            <div className={cn(
              'w-10 h-10 md:w-12 md:h-12 rounded-xl mb-3',
              'bg-gradient-to-br flex items-center justify-center',
              step.color
            )}>
              <step.icon size={20} className="text-white" />
            </div>

            {/* Content */}
            <h3 className="font-semibold text-gray-900 text-sm md:text-base mb-1">
              {step.title}
            </h3>
            <p className="text-xs text-gray-500 leading-relaxed hidden md:block">
              {step.description}
            </p>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 md:gap-4 w-full max-w-lg mb-8">
        {/* Primary: AI Assistant */}
        <button
          onClick={onUseAIAssistant}
          className={cn(
            'flex-1 flex items-center justify-center gap-3 px-6 py-4',
            'bg-gradient-to-r from-violet-600 to-indigo-600 text-white',
            'rounded-2xl font-semibold shadow-lg shadow-violet-500/25',
            'hover:shadow-xl hover:shadow-violet-500/30 hover:scale-[1.02]',
            'transition-all duration-200',
            'min-h-[56px]' // 48px + padding for touch target
          )}
          aria-label={t.aiButtonAriaLabel}
        >
          <Bot size={22} />
          <span>{t.useAI}</span>
          <Sparkles size={16} className="text-violet-200" />
        </button>

        {/* Secondary: Manual Entry */}
        <button
          onClick={onAddFirstPerson}
          className={cn(
            'flex-1 flex items-center justify-center gap-3 px-6 py-4',
            'bg-white text-gray-700 border-2 border-gray-200',
            'rounded-2xl font-semibold',
            'hover:border-gray-300 hover:bg-gray-50 hover:scale-[1.02]',
            'transition-all duration-200',
            'min-h-[56px]'
          )}
          aria-label={t.manualButtonAriaLabel}
        >
          <UserPlus size={22} />
          <span>{t.addManually}</span>
        </button>
      </div>

      {/* Secondary Actions */}
      <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
        {/* Load Example */}
        <button
          onClick={onLoadExample}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 text-gray-600',
            'hover:text-gray-900 hover:bg-gray-100 rounded-xl',
            'transition-colors min-h-[44px]'
          )}
          aria-label={t.loadExampleAriaLabel}
        >
          <TreePine size={18} />
          <span>{t.loadExample}</span>
        </button>

        {/* Watch Tutorial */}
        <button
          onClick={onWatchTutorial}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 text-gray-600',
            'hover:text-gray-900 hover:bg-gray-100 rounded-xl',
            'transition-colors min-h-[44px]'
          )}
          aria-label={t.watchTutorialAriaLabel}
        >
          <PlayCircle size={18} />
          <span>{t.watchTutorial}</span>
        </button>

        {/* Read Guide */}
        <button
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 text-gray-600',
            'hover:text-gray-900 hover:bg-gray-100 rounded-xl',
            'transition-colors min-h-[44px]'
          )}
          aria-label={t.readGuideAriaLabel}
        >
          <BookOpen size={18} />
          <span>{t.readGuide}</span>
        </button>
      </div>

      {/* Bottom Hint */}
      <div className="mt-8 md:mt-12 text-center">
        <p className="text-xs text-gray-400 flex items-center justify-center gap-1">
          <Sparkles size={12} />
          {t.hint}
        </p>
      </div>
    </div>
  );
}

const translations = {
  ar: {
    title: 'ابنِ شجرة عائلتك',
    subtitle: 'وثّق تاريخ عائلتك واحفظه للأجيال القادمة. ابدأ بإضافة نفسك أو استخدم المساعد الذكي.',
    step1Title: 'أضف نفسك',
    step1Desc: 'ابدأ بإضافة معلوماتك الشخصية',
    step2Title: 'أضف العائلة',
    step2Desc: 'أضف الوالدين والأبناء والأقارب',
    step3Title: 'اربط العلاقات',
    step3Desc: 'حدد علاقات الزواج والقرابة',
    step4Title: 'شارك وتعاون',
    step4Desc: 'ادعُ أفراد العائلة للمساهمة',
    useAI: 'استخدم المساعد الذكي',
    addManually: 'إضافة يدوية',
    loadExample: 'تحميل مثال',
    watchTutorial: 'شاهد الشرح',
    readGuide: 'اقرأ الدليل',
    hint: 'المساعد الذكي يفهم العربية ويستخرج المعلومات تلقائياً',
    aiButtonAriaLabel: 'افتح المساعد الذكي لإضافة أفراد العائلة بالوصف',
    manualButtonAriaLabel: 'أضف أول شخص يدوياً باستخدام النموذج',
    loadExampleAriaLabel: 'تحميل شجرة عائلة نموذجية للاستكشاف',
    watchTutorialAriaLabel: 'شاهد فيديو تعليمي مدته دقيقتان',
    readGuideAriaLabel: 'اقرأ دليل المستخدم الكامل',
  },
  en: {
    title: 'Build Your Family Tree',
    subtitle: 'Document your family history and preserve it for future generations. Start by adding yourself or use the AI Assistant.',
    step1Title: 'Add Yourself',
    step1Desc: 'Start with your personal information',
    step2Title: 'Add Family',
    step2Desc: 'Add parents, children, and relatives',
    step3Title: 'Connect Relations',
    step3Desc: 'Define marriages and family ties',
    step4Title: 'Share & Collaborate',
    step4Desc: 'Invite family members to contribute',
    useAI: 'Use AI Assistant',
    addManually: 'Add Manually',
    loadExample: 'Load Example',
    watchTutorial: 'Watch Tutorial',
    readGuide: 'Read Guide',
    hint: 'AI Assistant understands natural language and extracts information automatically',
    aiButtonAriaLabel: 'Open AI Assistant to add family members by description',
    manualButtonAriaLabel: 'Add first person manually using a form',
    loadExampleAriaLabel: 'Load a sample family tree to explore',
    watchTutorialAriaLabel: 'Watch a 2-minute tutorial video',
    readGuideAriaLabel: 'Read the full user guide',
  },
};

export default EmptyTreeState;
