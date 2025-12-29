'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowRight, ArrowLeft, Calendar, TreeDeciduous, BookOpen } from 'lucide-react';
import { FamilyTimeline } from '@/components/timeline';
import { type TimelineEvent } from '@/lib/db/timeline-actions';

interface TimelineClientProps {
  tree: {
    id: string;
    name_ar: string;
    name_en: string;
  };
  currentUserId: string;
  locale: 'ar' | 'en';
}

const translations = {
  ar: {
    title: 'رحلة العائلة',
    subtitle: 'اكتشف قصة عائلتك عبر الأجيال',
    back: 'العودة للشجرة',
    stories: 'القصص',
  },
  en: {
    title: 'Family Journey',
    subtitle: 'Discover your family story across generations',
    back: 'Back to Tree',
    stories: 'Stories',
  },
};

export function TimelineClient({
  tree,
  currentUserId,
  locale,
}: TimelineClientProps) {
  const t = translations[locale];
  const isRTL = locale === 'ar';
  const BackArrow = isRTL ? ArrowRight : ArrowLeft;

  const treeName = locale === 'ar' ? tree.name_ar : tree.name_en;

  const handleEventClick = (event: TimelineEvent) => {
    // Handle event click - could open a modal or navigate
    console.log('Event clicked:', event);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href={`/${locale}/tree/${tree.id}`}
                className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <BackArrow className="w-5 h-5" />
              </Link>
              <div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-islamic-primary" />
                  <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                    {t.title}
                  </h1>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2 mt-1">
                  <TreeDeciduous className="w-4 h-4" />
                  {treeName}
                </p>
              </div>
            </div>

            <Link
              href={`/${locale}/tree/${tree.id}/stories`}
              className="flex items-center gap-2 px-4 py-2 text-islamic-primary hover:bg-islamic-light dark:hover:bg-islamic-primary/20 rounded-lg transition-colors"
            >
              <BookOpen className="w-4 h-4" />
              {t.stories}
            </Link>
          </div>
        </div>
      </div>

      {/* Timeline Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <FamilyTimeline
            treeId={tree.id}
            locale={locale}
            onEventClick={handleEventClick}
          />
        </div>
      </div>
    </div>
  );
}
