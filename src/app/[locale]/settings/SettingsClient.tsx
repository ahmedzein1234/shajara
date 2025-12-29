'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight, ArrowLeft, Settings, Shield, Bell, User,
  Globe, Eye, Lock, Check, Loader2, TreeDeciduous
} from 'lucide-react';
import type { VisibilityLevel } from '@/lib/privacy/actions';
import { updateUserPrivacyPreferences } from '@/lib/privacy/actions';

interface SettingsClientProps {
  locale: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  privacyPrefs: {
    allow_family_search: boolean;
    show_in_member_directory: boolean;
    default_tree_visibility: VisibilityLevel;
    notify_on_connection_request: boolean;
    notify_on_profile_view: boolean;
    notify_on_tree_update: boolean;
  } | null;
}

const translations = {
  ar: {
    title: 'الإعدادات',
    subtitle: 'إدارة حسابك وتفضيلاتك',
    back: 'العودة',
    tabs: {
      account: 'الحساب',
      privacy: 'الخصوصية',
      notifications: 'الإشعارات',
    },
    account: {
      title: 'معلومات الحساب',
      name: 'الاسم',
      email: 'البريد الإلكتروني',
      editProfile: 'تعديل الملف الشخصي',
    },
    privacy: {
      title: 'إعدادات الخصوصية',
      description: 'تحكم في كيفية ظهورك للآخرين',
      allowFamilySearch: 'السماح بالظهور في بحث العائلة',
      allowFamilySearchDesc: 'يمكن للأقارب العثور عليك عند البحث',
      showInDirectory: 'الظهور في دليل الأعضاء',
      showInDirectoryDesc: 'يمكن لأعضاء الأشجار المتصلين رؤيتك',
      defaultTreeVisibility: 'الرؤية الافتراضية للأشجار الجديدة',
    },
    notifications: {
      title: 'إعدادات الإشعارات',
      description: 'اختر الإشعارات التي تريد تلقيها',
      connectionRequest: 'طلبات الانضمام',
      connectionRequestDesc: 'عند طلب شخص الانضمام لشجرتك',
      profileView: 'مشاهدات الملف الشخصي',
      profileViewDesc: 'عند مشاهدة شخص لملفك الشخصي',
      treeUpdate: 'تحديثات الشجرة',
      treeUpdateDesc: 'عند تحديث شجرة أنت عضو فيها',
    },
    visibility: {
      private: 'خاص',
      family: 'العائلة',
      extended: 'العائلة الموسعة',
      public: 'عام',
    },
    save: 'حفظ التغييرات',
    saving: 'جاري الحفظ...',
    saved: 'تم الحفظ',
  },
  en: {
    title: 'Settings',
    subtitle: 'Manage your account and preferences',
    back: 'Back',
    tabs: {
      account: 'Account',
      privacy: 'Privacy',
      notifications: 'Notifications',
    },
    account: {
      title: 'Account Information',
      name: 'Name',
      email: 'Email',
      editProfile: 'Edit Profile',
    },
    privacy: {
      title: 'Privacy Settings',
      description: 'Control how you appear to others',
      allowFamilySearch: 'Allow family search',
      allowFamilySearchDesc: 'Relatives can find you when searching',
      showInDirectory: 'Show in member directory',
      showInDirectoryDesc: 'Connected tree members can see you',
      defaultTreeVisibility: 'Default visibility for new trees',
    },
    notifications: {
      title: 'Notification Settings',
      description: 'Choose which notifications to receive',
      connectionRequest: 'Connection requests',
      connectionRequestDesc: 'When someone requests to join your tree',
      profileView: 'Profile views',
      profileViewDesc: 'When someone views your profile',
      treeUpdate: 'Tree updates',
      treeUpdateDesc: 'When a tree you\'re in gets updated',
    },
    visibility: {
      private: 'Private',
      family: 'Family',
      extended: 'Extended',
      public: 'Public',
    },
    save: 'Save Changes',
    saving: 'Saving...',
    saved: 'Saved',
  },
};

export default function SettingsClient({
  locale,
  user,
  privacyPrefs,
}: SettingsClientProps) {
  const t = translations[locale as 'ar' | 'en'] || translations.en;
  const isRTL = locale === 'ar';
  const BackArrow = isRTL ? ArrowRight : ArrowLeft;
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<'account' | 'privacy' | 'notifications'>('privacy');
  const [saved, setSaved] = useState(false);

  // Privacy settings state
  const [prefs, setPrefs] = useState({
    allow_family_search: privacyPrefs?.allow_family_search ?? true,
    show_in_member_directory: privacyPrefs?.show_in_member_directory ?? true,
    default_tree_visibility: privacyPrefs?.default_tree_visibility || 'family',
    notify_on_connection_request: privacyPrefs?.notify_on_connection_request ?? true,
    notify_on_profile_view: privacyPrefs?.notify_on_profile_view ?? false,
    notify_on_tree_update: privacyPrefs?.notify_on_tree_update ?? true,
  });

  const handleSave = async () => {
    startTransition(async () => {
      try {
        await updateUserPrivacyPreferences({
          allow_family_search: prefs.allow_family_search,
          show_in_member_directory: prefs.show_in_member_directory,
          default_tree_visibility: prefs.default_tree_visibility as VisibilityLevel,
          notify_on_connection_request: prefs.notify_on_connection_request,
          notify_on_profile_view: prefs.notify_on_profile_view,
          notify_on_tree_update: prefs.notify_on_tree_update,
        });
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
        router.refresh();
      } catch (error) {
        console.error('Failed to save settings:', error);
      }
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <Link
              href={`/${locale}/tree`}
              className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              <BackArrow className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white font-accent flex items-center gap-3">
                <Settings className="w-7 h-7 text-islamic-primary" />
                {t.title}
              </h1>
              <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">{t.subtitle}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          {/* Tabs */}
          <div className="flex gap-2 mb-8 border-b border-slate-200 dark:border-slate-700">
            {(['account', 'privacy', 'notifications'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-3 font-medium text-sm transition-colors border-b-2 -mb-[2px] ${
                  activeTab === tab
                    ? 'border-islamic-primary text-islamic-primary'
                    : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tab === 'account' && <User className="w-4 h-4 inline-block me-2" />}
                {tab === 'privacy' && <Shield className="w-4 h-4 inline-block me-2" />}
                {tab === 'notifications' && <Bell className="w-4 h-4 inline-block me-2" />}
                {t.tabs[tab]}
              </button>
            ))}
          </div>

          {/* Account Tab */}
          {activeTab === 'account' && (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">{t.account.title}</h2>

              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                  <div className="w-16 h-16 bg-gradient-to-br from-islamic-500 to-emerald-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                    {user.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-medium text-slate-900 dark:text-white">{user.name}</div>
                    <div className="text-sm text-slate-500">{user.email}</div>
                  </div>
                </div>

                <Link
                  href={`/${locale}/profile`}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-islamic-primary hover:bg-islamic-600 text-white rounded-lg font-medium transition-colors"
                >
                  <User className="w-4 h-4" />
                  {t.account.editProfile}
                </Link>
              </div>
            </div>
          )}

          {/* Privacy Tab */}
          {activeTab === 'privacy' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{t.privacy.title}</h2>
                <p className="text-slate-600 dark:text-slate-400 text-sm mb-6">{t.privacy.description}</p>

                <div className="space-y-4">
                  <label className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700">
                    <div>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{t.privacy.allowFamilySearch}</span>
                      <p className="text-xs text-slate-500">{t.privacy.allowFamilySearchDesc}</p>
                    </div>
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={prefs.allow_family_search}
                        onChange={(e) => setPrefs({ ...prefs, allow_family_search: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-300 dark:bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-islamic-primary"></div>
                    </div>
                  </label>

                  <label className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700">
                    <div>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{t.privacy.showInDirectory}</span>
                      <p className="text-xs text-slate-500">{t.privacy.showInDirectoryDesc}</p>
                    </div>
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={prefs.show_in_member_directory}
                        onChange={(e) => setPrefs({ ...prefs, show_in_member_directory: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-300 dark:bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-islamic-primary"></div>
                    </div>
                  </label>

                  <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      {t.privacy.defaultTreeVisibility}
                    </label>
                    <select
                      value={prefs.default_tree_visibility}
                      onChange={(e) => setPrefs({ ...prefs, default_tree_visibility: e.target.value as VisibilityLevel })}
                      className="w-full max-w-xs px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    >
                      <option value="private">{t.visibility.private}</option>
                      <option value="family">{t.visibility.family}</option>
                      <option value="extended">{t.visibility.extended}</option>
                      <option value="public">{t.visibility.public}</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleSave}
                  disabled={isPending}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-islamic-primary hover:bg-islamic-600 disabled:opacity-50 text-white rounded-xl font-medium transition-colors"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {t.saving}
                    </>
                  ) : saved ? (
                    <>
                      <Check className="w-5 h-5" />
                      {t.saved}
                    </>
                  ) : (
                    t.save
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{t.notifications.title}</h2>
                <p className="text-slate-600 dark:text-slate-400 text-sm mb-6">{t.notifications.description}</p>

                <div className="space-y-4">
                  <label className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700">
                    <div>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{t.notifications.connectionRequest}</span>
                      <p className="text-xs text-slate-500">{t.notifications.connectionRequestDesc}</p>
                    </div>
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={prefs.notify_on_connection_request}
                        onChange={(e) => setPrefs({ ...prefs, notify_on_connection_request: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-300 dark:bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-islamic-primary"></div>
                    </div>
                  </label>

                  <label className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700">
                    <div>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{t.notifications.profileView}</span>
                      <p className="text-xs text-slate-500">{t.notifications.profileViewDesc}</p>
                    </div>
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={prefs.notify_on_profile_view}
                        onChange={(e) => setPrefs({ ...prefs, notify_on_profile_view: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-300 dark:bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-islamic-primary"></div>
                    </div>
                  </label>

                  <label className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700">
                    <div>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{t.notifications.treeUpdate}</span>
                      <p className="text-xs text-slate-500">{t.notifications.treeUpdateDesc}</p>
                    </div>
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={prefs.notify_on_tree_update}
                        onChange={(e) => setPrefs({ ...prefs, notify_on_tree_update: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-300 dark:bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-islamic-primary"></div>
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleSave}
                  disabled={isPending}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-islamic-primary hover:bg-islamic-600 disabled:opacity-50 text-white rounded-xl font-medium transition-colors"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {t.saving}
                    </>
                  ) : saved ? (
                    <>
                      <Check className="w-5 h-5" />
                      {t.saved}
                    </>
                  ) : (
                    t.save
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
