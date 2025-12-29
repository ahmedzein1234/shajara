'use client';

import * as React from 'react';
import {
  Bell, Calendar, Heart, User, Plus, X, Settings, Trash2, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  type MemorialReminder,
  getUserMemorialReminders,
  deleteMemorialReminder,
  getUpcomingMemorials,
} from '@/lib/db/activity-actions';

interface MemorialRemindersProps {
  treeId: string;
  locale?: 'ar' | 'en';
}

interface UpcomingMemorial {
  type: 'birth' | 'death';
  person_id: string;
  person_name_ar: string;
  person_name_en: string;
  date: string;
  days_until: number;
}

const translations = {
  ar: {
    title: 'تذكيرات المناسبات',
    subtitle: 'ذكرى الميلاد والوفاة',
    upcoming: 'المناسبات القادمة',
    myReminders: 'تذكيراتي',
    noUpcoming: 'لا توجد مناسبات قريبة',
    noReminders: 'لم تضف أي تذكيرات بعد',
    addReminder: 'إضافة تذكير',
    today: 'اليوم',
    tomorrow: 'غداً',
    inDays: 'بعد {days} أيام',
    birthAnniversary: 'ذكرى ميلاد',
    deathAnniversary: 'ذكرى وفاة',
    deleteReminder: 'حذف التذكير',
    settings: 'إعدادات',
    email: 'بريد',
    push: 'إشعار',
    daysBefore: 'قبل {days} يوم',
  },
  en: {
    title: 'Memorial Reminders',
    subtitle: 'Birth and death anniversaries',
    upcoming: 'Upcoming',
    myReminders: 'My Reminders',
    noUpcoming: 'No upcoming anniversaries',
    noReminders: 'No reminders added yet',
    addReminder: 'Add Reminder',
    today: 'Today',
    tomorrow: 'Tomorrow',
    inDays: 'In {days} days',
    birthAnniversary: 'Birth Anniversary',
    deathAnniversary: 'Death Anniversary',
    deleteReminder: 'Delete Reminder',
    settings: 'Settings',
    email: 'Email',
    push: 'Push',
    daysBefore: '{days} day(s) before',
  },
};

function formatDaysUntil(days: number, locale: 'ar' | 'en', t: typeof translations['ar']): string {
  if (days === 0) return t.today;
  if (days === 1) return t.tomorrow;
  return t.inDays.replace('{days}', days.toString());
}

export function MemorialReminders({ treeId, locale = 'ar' }: MemorialRemindersProps) {
  const t = translations[locale];
  const isRTL = locale === 'ar';

  const [activeTab, setActiveTab] = React.useState<'upcoming' | 'reminders'>('upcoming');
  const [upcoming, setUpcoming] = React.useState<UpcomingMemorial[]>([]);
  const [reminders, setReminders] = React.useState<MemorialReminder[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [upcomingData, remindersData] = await Promise.all([
        getUpcomingMemorials(treeId, 30),
        getUserMemorialReminders(treeId),
      ]);
      setUpcoming(upcomingData);
      setReminders(remindersData);
    } catch (error) {
      console.error('Failed to load memorial data:', error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadData();
  }, [treeId]);

  const handleDeleteReminder = async (reminderId: string) => {
    setDeletingId(reminderId);
    try {
      await deleteMemorialReminder(reminderId);
      setReminders(prev => prev.filter(r => r.id !== reminderId));
    } catch (error) {
      console.error('Failed to delete reminder:', error);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Bell className="w-5 h-5 text-islamic-primary" />
            {t.title}
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">{t.subtitle}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'upcoming'
              ? 'bg-white dark:bg-slate-700 text-islamic-primary shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Calendar className="w-4 h-4 inline me-1" />
          {t.upcoming}
        </button>
        <button
          onClick={() => setActiveTab('reminders')}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'reminders'
              ? 'bg-white dark:bg-slate-700 text-islamic-primary shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Bell className="w-4 h-4 inline me-1" />
          {t.myReminders}
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-islamic-primary" />
        </div>
      ) : activeTab === 'upcoming' ? (
        <div className="space-y-3">
          {upcoming.length === 0 ? (
            <div className="text-center py-12 text-slate-500 dark:text-slate-400">
              <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>{t.noUpcoming}</p>
            </div>
          ) : (
            upcoming.map((memorial, index) => {
              const personName = locale === 'ar' ? memorial.person_name_ar : memorial.person_name_en;
              const isBirth = memorial.type === 'birth';

              return (
                <div
                  key={`${memorial.person_id}-${memorial.type}`}
                  className={`flex items-center gap-4 p-4 rounded-xl border ${
                    memorial.days_until === 0
                      ? 'bg-islamic-light/50 dark:bg-islamic-primary/20 border-islamic-primary/30'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div className={`p-3 rounded-full ${
                    isBirth
                      ? 'bg-pink-100 dark:bg-pink-900/30'
                      : 'bg-slate-100 dark:bg-slate-700'
                  }`}>
                    {isBirth ? (
                      <Heart className="w-5 h-5 text-pink-500" />
                    ) : (
                      <User className="w-5 h-5 text-slate-500" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {personName}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {isBirth ? t.birthAnniversary : t.deathAnniversary}
                    </p>
                  </div>
                  <div className="text-end">
                    <p className={`font-medium ${
                      memorial.days_until === 0
                        ? 'text-islamic-primary'
                        : 'text-slate-700 dark:text-slate-300'
                    }`}>
                      {formatDaysUntil(memorial.days_until, locale, t)}
                    </p>
                    <p className="text-xs text-slate-400">
                      {new Date(memorial.date).toLocaleDateString(
                        locale === 'ar' ? 'ar-SA' : 'en-US',
                        { month: 'short', day: 'numeric' }
                      )}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {reminders.length === 0 ? (
            <div className="text-center py-12 text-slate-500 dark:text-slate-400">
              <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>{t.noReminders}</p>
              <Button variant="outline" className="mt-4">
                <Plus className="w-4 h-4 me-1" />
                {t.addReminder}
              </Button>
            </div>
          ) : (
            reminders.map(reminder => {
              const personName = locale === 'ar'
                ? reminder.person_name_ar
                : reminder.person_name_en;
              const isBirth = reminder.reminder_type === 'birth_anniversary';

              return (
                <div
                  key={reminder.id}
                  className="flex items-center gap-4 p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700"
                >
                  <div className={`p-3 rounded-full ${
                    isBirth
                      ? 'bg-pink-100 dark:bg-pink-900/30'
                      : 'bg-slate-100 dark:bg-slate-700'
                  }`}>
                    {isBirth ? (
                      <Heart className="w-5 h-5 text-pink-500" />
                    ) : (
                      <User className="w-5 h-5 text-slate-500" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {personName}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {reminder.reminder_type === 'birth_anniversary'
                        ? t.birthAnniversary
                        : reminder.reminder_type === 'death_anniversary'
                          ? t.deathAnniversary
                          : reminder.custom_title_ar || reminder.custom_title_en}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                      <span>{t.daysBefore.replace('{days}', reminder.notify_days_before.toString())}</span>
                      {reminder.notify_via_email && (
                        <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded">
                          {t.email}
                        </span>
                      )}
                      {reminder.notify_via_push && (
                        <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded">
                          {t.push}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteReminder(reminder.id)}
                    disabled={deletingId === reminder.id}
                    className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    title={t.deleteReminder}
                  >
                    {deletingId === reminder.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
