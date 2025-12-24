/**
 * TreeLegend Component
 * Explains symbols, colors, and conventions used in the family tree
 */

'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Info, X, Heart, User, Users, MapPin, Calendar } from 'lucide-react';

interface TreeLegendProps {
  locale?: 'ar' | 'en';
  className?: string;
}

export function TreeLegend({ locale = 'ar', className }: TreeLegendProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const t = locale === 'ar' ? translations.ar : translations.en;

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className={cn(
          'fixed bottom-6 left-6 z-10',
          'flex items-center gap-2 px-4 py-2',
          'bg-white rounded-lg shadow-lg border border-gray-200',
          'hover:shadow-xl transition-all duration-200',
          'text-sm font-medium text-gray-700',
          locale === 'ar' && 'left-auto right-6',
          className
        )}
        aria-label={t.showLegend}
      >
        <Info size={18} />
        <span>{t.legend}</span>
      </button>
    );
  }

  return (
    <div
      className={cn(
        'fixed bottom-6 left-6 z-10',
        'bg-white rounded-lg shadow-xl border border-gray-200',
        'w-80 max-h-[80vh] overflow-y-auto',
        locale === 'ar' && 'left-auto right-6',
        className
      )}
      dir={locale === 'ar' ? 'rtl' : 'ltr'}
    >
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Info size={18} className="text-primary-600" />
          <h3 className="font-bold text-gray-900">{t.legend}</h3>
        </div>
        <button
          onClick={() => setIsExpanded(false)}
          className="p-1 hover:bg-gray-100 rounded-md transition-colors"
          aria-label={t.close}
        >
          <X size={18} />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6">
        {/* Gender Colors */}
        <section>
          <h4 className="font-semibold text-sm text-gray-700 mb-3">{t.genderColors}</h4>
          <div className="space-y-2">
            <LegendItem
              icon={<div className="w-4 h-4 rounded-full bg-blue-500" />}
              label={t.male}
            />
            <LegendItem
              icon={<div className="w-4 h-4 rounded-full bg-pink-500" />}
              label={t.female}
            />
            <LegendItem
              icon={<div className="w-4 h-4 rounded-full bg-gray-500" />}
              label={t.unknown}
            />
          </div>
        </section>

        {/* Connection Types */}
        <section>
          <h4 className="font-semibold text-sm text-gray-700 mb-3">{t.connections}</h4>
          <div className="space-y-2">
            <LegendItem
              icon={<div className="w-8 h-0.5 bg-slate-600" />}
              label={t.parentChild}
            />
            <LegendItem
              icon={
                <div className="flex items-center gap-1">
                  <div className="w-6 h-0.5 bg-emerald-500" />
                  <Heart size={10} className="text-emerald-500" />
                </div>
              }
              label={t.marriage}
            />
            <LegendItem
              icon={
                <div className="flex items-center gap-1">
                  <div className="w-6 h-0.5 bg-red-500 border-dashed border-t-2 border-red-500" style={{ height: 0 }} />
                  <X size={10} className="text-red-500" />
                </div>
              }
              label={t.divorce}
            />
          </div>
        </section>

        {/* Node Indicators */}
        <section>
          <h4 className="font-semibold text-sm text-gray-700 mb-3">{t.indicators}</h4>
          <div className="space-y-2">
            <LegendItem
              icon={<div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />}
              label={t.living}
            />
            <LegendItem
              icon={
                <div className="relative">
                  <div className="w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-[8px] font-bold text-gray-600">3</span>
                  </div>
                </div>
              }
              label={t.childrenCount}
            />
            <LegendItem
              icon={<div className="w-6 h-6 rounded-md border-2 border-blue-500 bg-blue-50" />}
              label={t.selected}
            />
            <LegendItem
              icon={<div className="w-6 h-6 rounded-md border-2 border-emerald-500 bg-emerald-50" />}
              label={t.highlighted}
            />
          </div>
        </section>

        {/* Information Display */}
        <section>
          <h4 className="font-semibold text-sm text-gray-700 mb-3">{t.information}</h4>
          <div className="space-y-2">
            <LegendItem
              icon={<Calendar size={14} className="text-gray-600" />}
              label={t.birthDeath}
            />
            <LegendItem
              icon={<MapPin size={14} className="text-gray-600" />}
              label={t.location}
            />
            <LegendItem
              icon={<User size={14} className="text-gray-600" />}
              label={t.photo}
            />
          </div>
        </section>

        {/* Interactions */}
        <section>
          <h4 className="font-semibold text-sm text-gray-700 mb-3">{t.interactions}</h4>
          <div className="space-y-2 text-xs text-gray-600">
            <div className="flex items-start gap-2">
              <div className="w-5 h-5 rounded bg-gray-100 flex items-center justify-center text-[10px] font-mono flex-shrink-0">
                {locale === 'ar' ? 'نقر' : '1×'}
              </div>
              <span>{t.clickSelect}</span>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-5 h-5 rounded bg-gray-100 flex items-center justify-center text-[10px] font-mono flex-shrink-0">
                {locale === 'ar' ? 'نقر2' : '2×'}
              </div>
              <span>{t.doubleClickExpand}</span>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-5 h-5 rounded bg-gray-100 flex items-center justify-center text-[10px] font-mono flex-shrink-0">
                {locale === 'ar' ? 'سحب' : 'Drag'}
              </div>
              <span>{t.dragPan}</span>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-5 h-5 rounded bg-gray-100 flex items-center justify-center text-[10px] font-mono flex-shrink-0">
                {locale === 'ar' ? 'تكبير' : 'Scroll'}
              </div>
              <span>{t.scrollZoom}</span>
            </div>
          </div>
        </section>

        {/* Arabic Naming Convention */}
        {locale === 'ar' && (
          <section>
            <h4 className="font-semibold text-sm text-gray-700 mb-3">{t.namingConvention}</h4>
            <div className="text-xs text-gray-600 space-y-1">
              <p className="font-arabic">{t.namingExample}</p>
              <ul className="list-disc list-inside space-y-1 mr-2">
                <li>{t.namingGiven}</li>
                <li>{t.namingPatronymic}</li>
                <li>{t.namingFamily}</li>
              </ul>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

/**
 * Individual legend item
 */
function LegendItem({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center justify-center w-8 h-6">{icon}</div>
      <span className="text-xs text-gray-600">{label}</span>
    </div>
  );
}

/**
 * Translations
 */
const translations = {
  ar: {
    legend: 'دليل الرموز',
    showLegend: 'عرض دليل الرموز',
    close: 'إغلاق',
    genderColors: 'ألوان الجنس',
    male: 'ذكر',
    female: 'أنثى',
    unknown: 'غير معروف',
    connections: 'أنواع الروابط',
    parentChild: 'رابط أب-ابن',
    marriage: 'زواج',
    divorce: 'طلاق',
    indicators: 'المؤشرات',
    living: 'على قيد الحياة',
    childrenCount: 'عدد الأطفال',
    selected: 'محدد',
    highlighted: 'مميز',
    information: 'المعلومات المعروضة',
    birthDeath: 'تواريخ الميلاد والوفاة',
    location: 'الموقع',
    photo: 'الصورة أو الأحرف الأولى',
    interactions: 'التفاعلات',
    clickSelect: 'انقر لتحديد شخص',
    doubleClickExpand: 'انقر مرتين لتوسيع/طي الفرع',
    dragPan: 'اسحب لتحريك الشجرة',
    scrollZoom: 'استخدم عجلة الفأرة للتكبير/التصغير',
    namingConvention: 'نظام التسمية العربي',
    namingExample: 'مثال: محمد بن أحمد بن علي الفلاني',
    namingGiven: 'الاسم الأول: محمد',
    namingPatronymic: 'سلسلة النسب: بن أحمد بن علي',
    namingFamily: 'اسم العائلة: الفلاني',
  },
  en: {
    legend: 'Legend',
    showLegend: 'Show Legend',
    close: 'Close',
    genderColors: 'Gender Colors',
    male: 'Male',
    female: 'Female',
    unknown: 'Unknown',
    connections: 'Connection Types',
    parentChild: 'Parent-Child Link',
    marriage: 'Marriage',
    divorce: 'Divorce',
    indicators: 'Indicators',
    living: 'Living Person',
    childrenCount: 'Number of Children',
    selected: 'Selected',
    highlighted: 'Highlighted',
    information: 'Displayed Information',
    birthDeath: 'Birth and Death Dates',
    location: 'Location',
    photo: 'Photo or Initials',
    interactions: 'Interactions',
    clickSelect: 'Click to select a person',
    doubleClickExpand: 'Double-click to expand/collapse branch',
    dragPan: 'Drag to pan the tree',
    scrollZoom: 'Scroll to zoom in/out',
    namingConvention: 'Arabic Naming Convention',
    namingExample: 'Example: Muhammad bin Ahmad bin Ali Al-Fulani',
    namingGiven: 'Given name: Muhammad',
    namingPatronymic: 'Patronymic chain: bin Ahmad bin Ali',
    namingFamily: 'Family name: Al-Fulani',
  },
};
