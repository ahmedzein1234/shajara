'use client';

import * as React from 'react';
import {
  Calendar, Baby, Heart, Flame, BookOpen, Trophy, MapPin,
  ChevronDown, ChevronUp, Filter, Plus, Loader2, RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  type TimelineEvent,
  type EventCategory,
  getTreeTimeline,
  generateTimelineFromData,
  getTimelineStats,
} from '@/lib/db/timeline-actions';

interface FamilyTimelineProps {
  treeId: string;
  locale?: 'ar' | 'en';
  onEventClick?: (event: TimelineEvent) => void;
  onAddEvent?: () => void;
}

const translations = {
  ar: {
    title: 'رحلة العائلة عبر الزمن',
    subtitle: 'اكتشف اللحظات التي شكّلت عائلتك وجمعت أفرادها',
    generate: 'اكتشاف الأحداث',
    generating: 'جاري الاكتشاف...',
    addEvent: 'أضف لحظة',
    noEvents: 'ابدأ رحلة عائلتك',
    noEventsDesc: 'أضف أول حدث لتبدأ توثيق رحلة عائلتك عبر الزمن',
    filter: 'تصفية',
    all: 'الكل',
    showMore: 'اكتشف المزيد',
    stats: {
      total: 'أحداث',
      births: 'مواليد',
      deaths: 'وفيات',
      marriages: 'زيجات',
      stories: 'قصص',
    },
    categories: {
      life: 'أحداث الحياة',
      marriage: 'زيجات',
      achievement: 'إنجازات',
      memorial: 'ذكرى ووفاء',
      historical: 'تاريخية',
      custom: 'أخرى',
    },
  },
  en: {
    title: 'Your Family Journey',
    subtitle: 'Discover the moments that shaped your family and brought them together',
    generate: 'Discover Events',
    generating: 'Discovering...',
    addEvent: 'Add Moment',
    noEvents: 'Start Your Family Journey',
    noEventsDesc: 'Add the first event to begin documenting your family\'s journey through time',
    filter: 'Filter',
    all: 'All',
    showMore: 'Discover More',
    stats: {
      total: 'Moments Captured',
      births: 'Births',
      deaths: 'Eternal Memories',
      marriages: 'Unions',
      stories: 'Stories',
    },
    categories: {
      life: 'Life Moments',
      marriage: 'Unions',
      achievement: 'Achievements',
      memorial: 'Eternal Memories',
      historical: 'From History',
      custom: 'Other',
    },
  },
};

const eventIcons: Record<string, React.ElementType> = {
  baby: Baby,
  heart: Heart,
  candle: Flame,
  flame: Flame,
  'book-open': BookOpen,
  trophy: Trophy,
  calendar: Calendar,
};

const categoryColors: Record<EventCategory, string> = {
  life: 'bg-emerald-500',
  marriage: 'bg-pink-500',
  achievement: 'bg-amber-500',
  memorial: 'bg-slate-500',
  historical: 'bg-blue-500',
  custom: 'bg-purple-500',
};

function formatYear(dateStr: string): string {
  return dateStr.split('-')[0];
}

function formatDate(dateStr: string, locale: 'ar' | 'en'): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function FamilyTimeline({
  treeId,
  locale = 'ar',
  onEventClick,
  onAddEvent,
}: FamilyTimelineProps) {
  const t = translations[locale];
  const isRTL = locale === 'ar';

  const [events, setEvents] = React.useState<TimelineEvent[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [generating, setGenerating] = React.useState(false);
  const [selectedCategory, setSelectedCategory] = React.useState<EventCategory | 'all'>('all');
  const [showStats, setShowStats] = React.useState(true);
  const [stats, setStats] = React.useState<{
    totalEvents: number;
    births: number;
    deaths: number;
    marriages: number;
    stories: number;
  } | null>(null);

  const loadData = React.useCallback(async () => {
    setLoading(true);
    try {
      const [eventsData, statsData] = await Promise.all([
        getTreeTimeline(treeId, {
          category: selectedCategory === 'all' ? undefined : selectedCategory,
          limit: 100,
        }),
        getTimelineStats(treeId),
      ]);
      setEvents(eventsData);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load timeline:', error);
    } finally {
      setLoading(false);
    }
  }, [treeId, selectedCategory]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await generateTimelineFromData(treeId);
      await loadData();
    } catch (error) {
      console.error('Failed to generate timeline:', error);
    } finally {
      setGenerating(false);
    }
  };

  // Group events by year
  const eventsByYear = React.useMemo(() => {
    const grouped = new Map<string, TimelineEvent[]>();
    for (const event of events) {
      const year = formatYear(event.event_date);
      if (!grouped.has(year)) {
        grouped.set(year, []);
      }
      grouped.get(year)!.push(event);
    }
    // Sort years descending
    return new Map([...grouped.entries()].sort((a, b) => b[0].localeCompare(a[0])));
  }, [events]);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white">{t.title}</h3>
              <p className="text-sm text-slate-500">{t.subtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerate}
              disabled={generating}
            >
              {generating ? (
                <Loader2 className="w-4 h-4 animate-spin me-2" />
              ) : (
                <RefreshCw className="w-4 h-4 me-2" />
              )}
              {generating ? t.generating : t.generate}
            </Button>
            {onAddEvent && (
              <Button
                size="sm"
                onClick={onAddEvent}
                className="bg-islamic-primary hover:bg-islamic-dark"
              >
                <Plus className="w-4 h-4 me-2" />
                {t.addEvent}
              </Button>
            )}
          </div>
        </div>

        {/* Stats */}
        {stats && showStats && (
          <div className="grid grid-cols-5 gap-2 mb-4">
            <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded-lg text-center">
              <p className="text-lg font-bold text-slate-900 dark:text-white">{stats.totalEvents}</p>
              <p className="text-xs text-slate-500">{t.stats.total}</p>
            </div>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg text-center">
              <p className="text-lg font-bold text-emerald-600">{stats.births}</p>
              <p className="text-xs text-slate-500">{t.stats.births}</p>
            </div>
            <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded-lg text-center">
              <p className="text-lg font-bold text-slate-600">{stats.deaths}</p>
              <p className="text-xs text-slate-500">{t.stats.deaths}</p>
            </div>
            <div className="p-2 bg-pink-50 dark:bg-pink-900/20 rounded-lg text-center">
              <p className="text-lg font-bold text-pink-600">{stats.marriages}</p>
              <p className="text-xs text-slate-500">{t.stats.marriages}</p>
            </div>
            <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-center">
              <p className="text-lg font-bold text-purple-600">{stats.stories}</p>
              <p className="text-xs text-slate-500">{t.stats.stories}</p>
            </div>
          </div>
        )}

        {/* Filter */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
              selectedCategory === 'all'
                ? 'bg-islamic-primary text-white'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
            }`}
          >
            {t.all}
          </button>
          {(Object.keys(t.categories) as EventCategory[]).map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-islamic-primary text-white'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              {t.categories[cat]}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div className="p-4 max-h-[600px] overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="w-6 h-6 animate-spin text-islamic-primary" />
          </div>
        ) : events.length === 0 ? (
          <div className="p-8 text-center">
            <Calendar className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">{t.noEvents}</h3>
            <p className="text-slate-500 mb-4">{t.noEventsDesc}</p>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline Line */}
            <div className={`absolute top-0 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-700 ${isRTL ? 'right-4' : 'left-4'}`} />

            {Array.from(eventsByYear.entries()).map(([year, yearEvents]) => (
              <div key={year} className="mb-8">
                {/* Year Label */}
                <div className={`sticky top-0 z-10 mb-4 ${isRTL ? 'pr-0' : 'pl-0'}`}>
                  <span className="inline-block px-3 py-1 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-full text-sm font-bold">
                    {year}
                  </span>
                </div>

                {/* Events for this year */}
                <div className="space-y-4">
                  {yearEvents.map((event) => {
                    const IconComponent = eventIcons[event.icon || 'calendar'] || Calendar;
                    const colorClass = categoryColors[event.event_category] || 'bg-slate-500';

                    return (
                      <button
                        key={event.id}
                        onClick={() => onEventClick?.(event)}
                        className={`relative w-full text-start group ${isRTL ? 'pr-12' : 'pl-12'}`}
                      >
                        {/* Timeline Dot */}
                        <div className={`absolute top-0 ${isRTL ? 'right-0' : 'left-0'} w-8 h-8 rounded-full ${colorClass} flex items-center justify-center shadow-lg`}>
                          <IconComponent className="w-4 h-4 text-white" />
                        </div>

                        {/* Event Card */}
                        <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl group-hover:bg-slate-100 dark:group-hover:bg-slate-800 transition-colors">
                          {/* Event Image */}
                          {event.image_url && (
                            <img
                              src={event.image_url}
                              alt=""
                              className="w-full h-32 object-cover rounded-lg mb-3"
                            />
                          )}

                          {/* Event Content */}
                          <div className="flex items-start gap-3">
                            {event.primary_member_photo && (
                              <img
                                src={event.primary_member_photo}
                                alt=""
                                className="w-10 h-10 rounded-full object-cover shrink-0"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-slate-900 dark:text-white mb-1">
                                {locale === 'ar' ? event.title_ar : event.title_en || event.title_ar}
                              </h4>
                              {(event.description_ar || event.description_en) && (
                                <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-2">
                                  {locale === 'ar' ? event.description_ar : event.description_en || event.description_ar}
                                </p>
                              )}
                              <div className="flex items-center gap-3 text-xs text-slate-500">
                                <span>{formatDate(event.event_date, locale)}</span>
                                {(event.location_ar || event.location_en) && (
                                  <span className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    {locale === 'ar' ? event.location_ar : event.location_en || event.location_ar}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
