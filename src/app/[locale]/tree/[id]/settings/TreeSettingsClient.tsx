'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight, ArrowLeft, Settings, Shield, Users, Bell,
  Eye, EyeOff, Globe, Lock, UserPlus, Check, X, Loader2,
  Database, Download, Upload
} from 'lucide-react';
import type { Tree } from '@/lib/db/schema';
import type { TreePrivacySettings, VisibilityLevel } from '@/lib/privacy/actions';
import { updateTreePrivacySettings } from '@/lib/privacy/actions';
import ConnectionRequestsManager from '@/components/privacy/ConnectionRequestsManager';
import GedcomImport from '@/components/tree/GedcomImport';

interface TreeSettingsClientProps {
  tree: Tree;
  privacySettings: TreePrivacySettings | null;
  locale: string;
  isOwner: boolean;
}

const translations = {
  ar: {
    title: 'إعدادات الشجرة',
    back: 'العودة للشجرة',
    tabs: {
      general: 'عام',
      privacy: 'الخصوصية',
      members: 'الأعضاء',
      requests: 'طلبات الانضمام',
      data: 'البيانات',
    },
    data: {
      title: 'إدارة البيانات',
      description: 'استيراد وتصدير بيانات شجرة العائلة',
      importSection: 'استيراد',
      exportSection: 'تصدير',
      exportGedcom: 'تصدير GEDCOM',
      exportGedcomDesc: 'تحميل بيانات الشجرة بتنسيق GEDCOM القياسي',
      download: 'تحميل',
    },
    privacy: {
      title: 'إعدادات الخصوصية',
      description: 'تحكم في من يمكنه رؤية شجرة عائلتك',
      defaultVisibility: 'الرؤية الافتراضية',
      defaultVisibilityDesc: 'مستوى الرؤية للأعضاء الجدد',
      livingMembers: 'الأحياء',
      livingMembersDesc: 'من يمكنه رؤية الأعضاء الأحياء',
      deceasedMembers: 'المتوفون',
      deceasedMembersDesc: 'من يمكنه رؤية الأعضاء المتوفين',
      publicSettings: 'إعدادات العرض العام',
      showLivingToPublic: 'إظهار الأحياء للعامة',
      showPhotosToPublic: 'إظهار الصور للعامة',
      showDatesToPublic: 'إظهار التواريخ للعامة',
      showLocationsToPublic: 'إظهار الأماكن للعامة',
      discovery: 'الاكتشاف',
      allowDiscovery: 'السماح بالظهور في البحث',
      allowDiscoveryDesc: 'السماح للآخرين بإيجاد شجرتك',
      requireApproval: 'طلب موافقة للانضمام',
      requireApprovalDesc: 'يجب الموافقة على طلبات الانضمام',
      save: 'حفظ التغييرات',
      saving: 'جاري الحفظ...',
      saved: 'تم الحفظ',
    },
    visibility: {
      private: 'خاص',
      privateDesc: 'المالك فقط',
      family: 'العائلة',
      familyDesc: 'أفراد العائلة المعتمدون',
      extended: 'العائلة الموسعة',
      extendedDesc: 'الأقارب المعتمدون',
      public: 'عام',
      publicDesc: 'أي شخص',
    },
  },
  en: {
    title: 'Tree Settings',
    back: 'Back to Tree',
    tabs: {
      general: 'General',
      privacy: 'Privacy',
      members: 'Members',
      requests: 'Requests',
      data: 'Data',
    },
    data: {
      title: 'Data Management',
      description: 'Import and export family tree data',
      importSection: 'Import',
      exportSection: 'Export',
      exportGedcom: 'Export GEDCOM',
      exportGedcomDesc: 'Download tree data in standard GEDCOM format',
      download: 'Download',
    },
    privacy: {
      title: 'Privacy Settings',
      description: 'Control who can view your family tree',
      defaultVisibility: 'Default Visibility',
      defaultVisibilityDesc: 'Visibility level for new members',
      livingMembers: 'Living Members',
      livingMembersDesc: 'Who can see living members',
      deceasedMembers: 'Deceased Members',
      deceasedMembersDesc: 'Who can see deceased members',
      publicSettings: 'Public Display Settings',
      showLivingToPublic: 'Show living members publicly',
      showPhotosToPublic: 'Show photos publicly',
      showDatesToPublic: 'Show dates publicly',
      showLocationsToPublic: 'Show locations publicly',
      discovery: 'Discovery',
      allowDiscovery: 'Allow search discovery',
      allowDiscoveryDesc: 'Let others find your tree',
      requireApproval: 'Require approval to join',
      requireApprovalDesc: 'Connection requests need approval',
      save: 'Save Changes',
      saving: 'Saving...',
      saved: 'Saved',
    },
    visibility: {
      private: 'Private',
      privateDesc: 'Owner only',
      family: 'Family',
      familyDesc: 'Verified family members',
      extended: 'Extended',
      extendedDesc: 'Approved connections',
      public: 'Public',
      publicDesc: 'Anyone',
    },
  },
};

export default function TreeSettingsClient({
  tree,
  privacySettings,
  locale,
  isOwner,
}: TreeSettingsClientProps) {
  const t = translations[locale as 'ar' | 'en'] || translations.en;
  const isRTL = locale === 'ar';
  const BackArrow = isRTL ? ArrowRight : ArrowLeft;
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<'general' | 'privacy' | 'members' | 'requests' | 'data'>('privacy');
  const [saved, setSaved] = useState(false);

  // Privacy settings state
  const [settings, setSettings] = useState({
    default_visibility: privacySettings?.default_visibility || 'family',
    living_members_visibility: privacySettings?.living_members_visibility || 'family',
    deceased_members_visibility: privacySettings?.deceased_members_visibility || 'extended',
    show_living_members_to_public: privacySettings?.show_living_members_to_public || false,
    show_photos_to_public: privacySettings?.show_photos_to_public || false,
    show_dates_to_public: privacySettings?.show_dates_to_public || false,
    show_locations_to_public: privacySettings?.show_locations_to_public || false,
    allow_discovery: privacySettings?.allow_discovery ?? true,
    require_approval_for_connections: privacySettings?.require_approval_for_connections ?? true,
  });

  const handleSavePrivacy = async () => {
    startTransition(async () => {
      try {
        await updateTreePrivacySettings(tree.id, settings);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
        router.refresh();
      } catch (error) {
        console.error('Failed to save privacy settings:', error);
      }
    });
  };

  const visibilityOptions: { value: VisibilityLevel; label: string; desc: string }[] = [
    { value: 'private', label: t.visibility.private, desc: t.visibility.privateDesc },
    { value: 'family', label: t.visibility.family, desc: t.visibility.familyDesc },
    { value: 'extended', label: t.visibility.extended, desc: t.visibility.extendedDesc },
    { value: 'public', label: t.visibility.public, desc: t.visibility.publicDesc },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <Link
              href={`/${locale}/tree/${tree.id}`}
              className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              <BackArrow className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white font-accent flex items-center gap-3">
                <Settings className="w-7 h-7 text-islamic-primary" />
                {t.title}
              </h1>
              <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">{tree.name}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Tabs */}
          <div className="flex gap-2 mb-8 border-b border-slate-200 dark:border-slate-700 overflow-x-auto">
            {(['privacy', 'data', 'members', 'requests'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-3 font-medium text-sm transition-colors border-b-2 -mb-[2px] whitespace-nowrap ${
                  activeTab === tab
                    ? 'border-islamic-primary text-islamic-primary'
                    : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tab === 'privacy' && <Shield className="w-4 h-4 inline-block me-2" />}
                {tab === 'data' && <Database className="w-4 h-4 inline-block me-2" />}
                {tab === 'members' && <Users className="w-4 h-4 inline-block me-2" />}
                {tab === 'requests' && <UserPlus className="w-4 h-4 inline-block me-2" />}
                {t.tabs[tab]}
              </button>
            ))}
          </div>

          {/* Privacy Tab */}
          {activeTab === 'privacy' && (
            <div className="space-y-8">
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{t.privacy.title}</h2>
                <p className="text-slate-600 dark:text-slate-400 text-sm mb-6">{t.privacy.description}</p>

                {/* Visibility Settings */}
                <div className="space-y-6">
                  {/* Default Visibility */}
                  <div>
                    <label className="block text-sm font-medium text-slate-900 dark:text-white mb-1">
                      {t.privacy.defaultVisibility}
                    </label>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                      {t.privacy.defaultVisibilityDesc}
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {visibilityOptions.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => setSettings({ ...settings, default_visibility: opt.value })}
                          className={`p-3 rounded-lg border text-start transition-all ${
                            settings.default_visibility === opt.value
                              ? 'border-islamic-primary bg-islamic-50 dark:bg-islamic-900/20'
                              : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            {opt.value === 'private' && <Lock className="w-4 h-4" />}
                            {opt.value === 'family' && <Users className="w-4 h-4" />}
                            {opt.value === 'extended' && <UserPlus className="w-4 h-4" />}
                            {opt.value === 'public' && <Globe className="w-4 h-4" />}
                            <span className="font-medium text-sm">{opt.label}</span>
                          </div>
                          <p className="text-xs text-slate-500">{opt.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Living Members Visibility */}
                  <div>
                    <label className="block text-sm font-medium text-slate-900 dark:text-white mb-1">
                      {t.privacy.livingMembers}
                    </label>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                      {t.privacy.livingMembersDesc}
                    </p>
                    <select
                      value={settings.living_members_visibility}
                      onChange={(e) => setSettings({ ...settings, living_members_visibility: e.target.value as VisibilityLevel })}
                      className="w-full max-w-xs px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    >
                      {visibilityOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label} - {opt.desc}</option>
                      ))}
                    </select>
                  </div>

                  {/* Deceased Members Visibility */}
                  <div>
                    <label className="block text-sm font-medium text-slate-900 dark:text-white mb-1">
                      {t.privacy.deceasedMembers}
                    </label>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                      {t.privacy.deceasedMembersDesc}
                    </p>
                    <select
                      value={settings.deceased_members_visibility}
                      onChange={(e) => setSettings({ ...settings, deceased_members_visibility: e.target.value as VisibilityLevel })}
                      className="w-full max-w-xs px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    >
                      {visibilityOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label} - {opt.desc}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Public Display Settings */}
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                <h3 className="text-md font-bold text-slate-900 dark:text-white mb-4">{t.privacy.publicSettings}</h3>
                <div className="space-y-4">
                  {[
                    { key: 'show_living_members_to_public', label: t.privacy.showLivingToPublic },
                    { key: 'show_photos_to_public', label: t.privacy.showPhotosToPublic },
                    { key: 'show_dates_to_public', label: t.privacy.showDatesToPublic },
                    { key: 'show_locations_to_public', label: t.privacy.showLocationsToPublic },
                  ].map(({ key, label }) => (
                    <label key={key} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700">
                      <span className="text-sm text-slate-700 dark:text-slate-300">{label}</span>
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={settings[key as keyof typeof settings] as boolean}
                          onChange={(e) => setSettings({ ...settings, [key]: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-300 dark:bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-islamic-primary"></div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Discovery Settings */}
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                <h3 className="text-md font-bold text-slate-900 dark:text-white mb-4">{t.privacy.discovery}</h3>
                <div className="space-y-4">
                  <label className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700">
                    <div>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{t.privacy.allowDiscovery}</span>
                      <p className="text-xs text-slate-500">{t.privacy.allowDiscoveryDesc}</p>
                    </div>
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={settings.allow_discovery}
                        onChange={(e) => setSettings({ ...settings, allow_discovery: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-300 dark:bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-islamic-primary"></div>
                    </div>
                  </label>

                  <label className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700">
                    <div>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{t.privacy.requireApproval}</span>
                      <p className="text-xs text-slate-500">{t.privacy.requireApprovalDesc}</p>
                    </div>
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={settings.require_approval_for_connections}
                        onChange={(e) => setSettings({ ...settings, require_approval_for_connections: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-300 dark:bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-islamic-primary"></div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end">
                <button
                  onClick={handleSavePrivacy}
                  disabled={isPending}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-islamic-primary hover:bg-islamic-600 disabled:opacity-50 text-white rounded-xl font-medium transition-colors"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {t.privacy.saving}
                    </>
                  ) : saved ? (
                    <>
                      <Check className="w-5 h-5" />
                      {t.privacy.saved}
                    </>
                  ) : (
                    t.privacy.save
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Data Tab */}
          {activeTab === 'data' && (
            <div className="space-y-8">
              {/* Import Section */}
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                <GedcomImport
                  treeId={tree.id}
                  treeName={tree.name}
                  locale={locale as 'ar' | 'en'}
                  onImportComplete={() => router.refresh()}
                />
              </div>

              {/* Export Section */}
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                  {t.data.exportSection}
                </h3>

                <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-white dark:bg-slate-800 rounded-lg">
                      <Download className="w-6 h-6 text-islamic-primary" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-slate-900 dark:text-white">
                        {t.data.exportGedcom}
                      </h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                        {t.data.exportGedcomDesc}
                      </p>
                    </div>
                    <a
                      href={`/api/export/${tree.id}?format=gedcom`}
                      download={`${tree.name}.ged`}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-islamic-primary hover:bg-islamic-600 text-white rounded-lg font-medium transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      {t.data.download}
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Members Tab */}
          {activeTab === 'members' && (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                  {locale === 'ar' ? 'إدارة الأعضاء قريبًا' : 'Member Management Coming Soon'}
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  {locale === 'ar' ? 'ستتمكن من إدارة أعضاء العائلة وصلاحياتهم' : 'You\'ll be able to manage family members and their permissions'}
                </p>
              </div>
            </div>
          )}

          {/* Connection Requests Tab */}
          {activeTab === 'requests' && (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
              <ConnectionRequestsManager treeId={tree.id} locale={locale as 'ar' | 'en'} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
