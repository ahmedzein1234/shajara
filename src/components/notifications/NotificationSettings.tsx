'use client';

import * as React from 'react';
import {
  Bell, BellOff, Mail, Smartphone, Clock, Globe, Save, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import {
  type NotificationPreferences,
  getNotificationPreferences,
  updateNotificationPreferences,
} from '@/lib/db/notification-actions';

interface NotificationSettingsProps {
  locale?: 'ar' | 'en';
}

const translations = {
  ar: {
    title: 'إعدادات الإشعارات',
    subtitle: 'تحكم في كيفية تلقي الإشعارات',
    push: {
      title: 'إشعارات الهاتف',
      description: 'تلقي إشعارات فورية على جهازك',
      enable: 'تفعيل الإشعارات',
      enabled: 'مفعّل',
      disabled: 'غير مفعّل',
      notSupported: 'غير مدعوم في هذا المتصفح',
      treeUpdates: 'تحديثات الشجرة',
      contributions: 'المساهمات',
      messages: 'الرسائل',
      mentions: 'الإشارات',
      memorials: 'التذكيرات',
    },
    email: {
      title: 'إشعارات البريد',
      description: 'تلقي إشعارات عبر البريد الإلكتروني',
      treeUpdates: 'تحديثات الشجرة',
      contributions: 'المساهمات',
      messages: 'الرسائل',
      mentions: 'الإشارات',
      memorials: 'التذكيرات',
    },
    digest: {
      title: 'ملخص النشاط',
      description: 'تلقي ملخص دوري للنشاط',
      frequency: 'التكرار',
      frequencies: {
        daily: 'يومي',
        weekly: 'أسبوعي',
        monthly: 'شهري',
        never: 'لا أريد',
      },
    },
    quietHours: {
      title: 'ساعات الهدوء',
      description: 'عدم إزعاجي خلال هذه الأوقات',
      enable: 'تفعيل',
      from: 'من',
      to: 'إلى',
    },
    timezone: 'المنطقة الزمنية',
    saving: 'جاري الحفظ...',
    saved: 'تم الحفظ',
    saveChanges: 'حفظ التغييرات',
  },
  en: {
    title: 'Notification Settings',
    subtitle: 'Control how you receive notifications',
    push: {
      title: 'Push Notifications',
      description: 'Receive instant notifications on your device',
      enable: 'Enable Notifications',
      enabled: 'Enabled',
      disabled: 'Disabled',
      notSupported: 'Not supported in this browser',
      treeUpdates: 'Tree Updates',
      contributions: 'Contributions',
      messages: 'Messages',
      mentions: 'Mentions',
      memorials: 'Reminders',
    },
    email: {
      title: 'Email Notifications',
      description: 'Receive notifications via email',
      treeUpdates: 'Tree Updates',
      contributions: 'Contributions',
      messages: 'Messages',
      mentions: 'Mentions',
      memorials: 'Reminders',
    },
    digest: {
      title: 'Activity Digest',
      description: 'Receive periodic activity summaries',
      frequency: 'Frequency',
      frequencies: {
        daily: 'Daily',
        weekly: 'Weekly',
        monthly: 'Monthly',
        never: 'Never',
      },
    },
    quietHours: {
      title: 'Quiet Hours',
      description: 'Do not disturb during these times',
      enable: 'Enable',
      from: 'From',
      to: 'To',
    },
    timezone: 'Timezone',
    saving: 'Saving...',
    saved: 'Saved',
    saveChanges: 'Save Changes',
  },
};

export function NotificationSettings({ locale = 'ar' }: NotificationSettingsProps) {
  const t = translations[locale];
  const isRTL = locale === 'ar';

  const { isSupported, isSubscribed, isLoading: pushLoading, subscribe, unsubscribe } = usePushNotifications();
  const [preferences, setPreferences] = React.useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [hasChanges, setHasChanges] = React.useState(false);

  React.useEffect(() => {
    const loadPreferences = async () => {
      setLoading(true);
      try {
        const prefs = await getNotificationPreferences();
        setPreferences(prefs);
      } catch (error) {
        console.error('Failed to load preferences:', error);
      } finally {
        setLoading(false);
      }
    };
    loadPreferences();
  }, []);

  const updatePreference = <K extends keyof NotificationPreferences>(
    key: K,
    value: NotificationPreferences[K]
  ) => {
    setPreferences(prev => prev ? { ...prev, [key]: value } : null);
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!preferences) return;

    setSaving(true);
    try {
      await updateNotificationPreferences(preferences);
      setHasChanges(false);
    } catch (error) {
      console.error('Failed to save preferences:', error);
    } finally {
      setSaving(false);
    }
  };

  const handlePushToggle = async () => {
    if (isSubscribed) {
      await unsubscribe();
    } else {
      await subscribe();
    }
  };

  const Toggle = ({
    checked,
    onChange,
    disabled,
  }: {
    checked: boolean;
    onChange: (value: boolean) => void;
    disabled?: boolean;
  }) => (
    <button
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={`relative w-11 h-6 rounded-full transition-colors ${
        disabled
          ? 'bg-slate-200 dark:bg-slate-700 cursor-not-allowed'
          : checked
            ? 'bg-islamic-primary'
            : 'bg-slate-300 dark:bg-slate-600'
      }`}
    >
      <span
        className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
          checked
            ? isRTL ? 'left-0.5' : 'right-0.5'
            : isRTL ? 'right-0.5' : 'left-0.5'
        }`}
      />
    </button>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-islamic-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Bell className="w-6 h-6 text-islamic-primary" />
            {t.title}
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{t.subtitle}</p>
        </div>
        {hasChanges && (
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-islamic-primary hover:bg-islamic-dark text-white"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 me-2 animate-spin" />
                {t.saving}
              </>
            ) : (
              <>
                <Save className="w-4 h-4 me-2" />
                {t.saveChanges}
              </>
            )}
          </Button>
        )}
      </div>

      {/* Push Notifications */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Smartphone className="w-5 h-5 text-islamic-primary" />
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white">{t.push.title}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">{t.push.description}</p>
              </div>
            </div>
            {isSupported ? (
              <Button
                variant={isSubscribed ? 'outline' : 'primary'}
                size="sm"
                onClick={handlePushToggle}
                disabled={pushLoading}
                className={isSubscribed ? '' : 'bg-islamic-primary hover:bg-islamic-dark text-white'}
              >
                {pushLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isSubscribed ? (
                  t.push.enabled
                ) : (
                  t.push.enable
                )}
              </Button>
            ) : (
              <span className="text-xs text-slate-400">{t.push.notSupported}</span>
            )}
          </div>
        </div>

        {isSubscribed && preferences && (
          <div className="p-4 space-y-3">
            {[
              { key: 'push_tree_updates', label: t.push.treeUpdates },
              { key: 'push_contributions', label: t.push.contributions },
              { key: 'push_messages', label: t.push.messages },
              { key: 'push_mentions', label: t.push.mentions },
              { key: 'push_memorials', label: t.push.memorials },
            ].map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-sm text-slate-700 dark:text-slate-300">{label}</span>
                <Toggle
                  checked={preferences[key as keyof NotificationPreferences] as boolean}
                  onChange={(v) => updatePreference(key as keyof NotificationPreferences, v)}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Email Notifications */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-islamic-primary" />
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white">{t.email.title}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">{t.email.description}</p>
              </div>
            </div>
            {preferences && (
              <Toggle
                checked={preferences.email_enabled}
                onChange={(v) => updatePreference('email_enabled', v)}
              />
            )}
          </div>
        </div>

        {preferences?.email_enabled && (
          <div className="p-4 space-y-3">
            {[
              { key: 'email_tree_updates', label: t.email.treeUpdates },
              { key: 'email_contributions', label: t.email.contributions },
              { key: 'email_messages', label: t.email.messages },
              { key: 'email_mentions', label: t.email.mentions },
              { key: 'email_memorials', label: t.email.memorials },
            ].map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-sm text-slate-700 dark:text-slate-300">{label}</span>
                <Toggle
                  checked={preferences[key as keyof NotificationPreferences] as boolean}
                  onChange={(v) => updatePreference(key as keyof NotificationPreferences, v)}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Digest Settings */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
        <div className="flex items-center gap-3 mb-4">
          <Clock className="w-5 h-5 text-islamic-primary" />
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white">{t.digest.title}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">{t.digest.description}</p>
          </div>
        </div>

        {preferences && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-700 dark:text-slate-300">{t.digest.frequency}</span>
            <select
              value={preferences.digest_frequency}
              onChange={(e) => updatePreference('digest_frequency', e.target.value as NotificationPreferences['digest_frequency'])}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
            >
              {Object.entries(t.digest.frequencies).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Quiet Hours */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <BellOff className="w-5 h-5 text-islamic-primary" />
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white">{t.quietHours.title}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">{t.quietHours.description}</p>
            </div>
          </div>
          {preferences && (
            <Toggle
              checked={preferences.quiet_hours_enabled}
              onChange={(v) => updatePreference('quiet_hours_enabled', v)}
            />
          )}
        </div>

        {preferences?.quiet_hours_enabled && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500">{t.quietHours.from}</span>
              <input
                type="number"
                min="0"
                max="23"
                value={preferences.quiet_hours_start}
                onChange={(e) => updatePreference('quiet_hours_start', parseInt(e.target.value))}
                className="w-16 px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-center"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500">{t.quietHours.to}</span>
              <input
                type="number"
                min="0"
                max="23"
                value={preferences.quiet_hours_end}
                onChange={(e) => updatePreference('quiet_hours_end', parseInt(e.target.value))}
                className="w-16 px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-center"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
