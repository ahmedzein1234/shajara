'use client';

import * as React from 'react';
import {
  Shield, Eye, EyeOff, Globe, Users, Lock, Download, Calendar,
  MapPin, Image, Mail, ChevronDown, ChevronUp, Save, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  type TreePrivacySettings,
  type VisibilityLevel,
  type DateDisplayLevel,
  type PlaceDisplayLevel,
  getTreePrivacySettings,
  updateTreePrivacySettings,
} from '@/lib/db/privacy-actions';

interface PrivacySettingsPanelProps {
  treeId: string;
  locale?: 'ar' | 'en';
  initialSettings?: TreePrivacySettings | null;
}

const translations = {
  ar: {
    title: 'إعدادات الخصوصية',
    subtitle: 'تحكم في من يمكنه رؤية معلومات شجرة عائلتك',
    saving: 'جاري الحفظ...',
    saved: 'تم الحفظ',
    saveChanges: 'حفظ التغييرات',
    visibility: {
      title: 'مستوى الرؤية',
      description: 'من يمكنه رؤية هذه الشجرة',
      private: 'خاصة',
      privateDesc: 'أنت والأعضاء المدعوون فقط',
      family: 'العائلة',
      familyDesc: 'أعضاء العائلة المسجلون',
      public: 'عامة',
      publicDesc: 'أي شخص لديه الرابط',
    },
    livingPerson: {
      title: 'الأشخاص الأحياء',
      description: 'كيفية عرض معلومات الأشخاص الأحياء',
      birthDate: 'تاريخ الميلاد',
      birthPlace: 'مكان الميلاد',
      photos: 'إظهار الصور',
      contact: 'معلومات الاتصال',
    },
    guestAccess: {
      title: 'وصول الزوار',
      description: 'إعدادات للزوار غير المسجلين',
      allowView: 'السماح بالمشاهدة',
      blurPhotos: 'تمويه الصور',
      hideLiving: 'إخفاء الأحياء',
    },
    export: {
      title: 'التصدير',
      description: 'التحكم في تصدير البيانات',
      gedcom: 'تصدير GEDCOM',
      pdf: 'تصدير PDF',
      requireApproval: 'طلب موافقة',
    },
    contributions: {
      title: 'المساهمات',
      description: 'إعدادات مساهمات العائلة',
      allowFamily: 'السماح للعائلة',
      requireApproval: 'طلب موافقة',
    },
    dateDisplay: {
      full: 'كامل',
      year_only: 'السنة فقط',
      hidden: 'مخفي',
    },
    placeDisplay: {
      full: 'كامل',
      country_only: 'الدولة فقط',
      hidden: 'مخفي',
    },
  },
  en: {
    title: 'Privacy Settings',
    subtitle: 'Control who can see your family tree information',
    saving: 'Saving...',
    saved: 'Saved',
    saveChanges: 'Save Changes',
    visibility: {
      title: 'Visibility Level',
      description: 'Who can see this tree',
      private: 'Private',
      privateDesc: 'Only you and invited members',
      family: 'Family',
      familyDesc: 'Registered family members',
      public: 'Public',
      publicDesc: 'Anyone with the link',
    },
    livingPerson: {
      title: 'Living Persons',
      description: 'How to display living persons information',
      birthDate: 'Birth Date',
      birthPlace: 'Birth Place',
      photos: 'Show Photos',
      contact: 'Contact Info',
    },
    guestAccess: {
      title: 'Guest Access',
      description: 'Settings for non-registered visitors',
      allowView: 'Allow Viewing',
      blurPhotos: 'Blur Photos',
      hideLiving: 'Hide Living',
    },
    export: {
      title: 'Export',
      description: 'Control data export',
      gedcom: 'GEDCOM Export',
      pdf: 'PDF Export',
      requireApproval: 'Require Approval',
    },
    contributions: {
      title: 'Contributions',
      description: 'Family contribution settings',
      allowFamily: 'Allow Family',
      requireApproval: 'Require Approval',
    },
    dateDisplay: {
      full: 'Full',
      year_only: 'Year Only',
      hidden: 'Hidden',
    },
    placeDisplay: {
      full: 'Full',
      country_only: 'Country Only',
      hidden: 'Hidden',
    },
  },
};

export function PrivacySettingsPanel({
  treeId,
  locale = 'ar',
  initialSettings,
}: PrivacySettingsPanelProps) {
  const t = translations[locale];
  const isRTL = locale === 'ar';

  const [settings, setSettings] = React.useState<Partial<TreePrivacySettings>>(
    initialSettings || {
      visibility: 'private',
      show_living_birth_date: 'year_only',
      show_living_birth_place: 'country_only',
      show_living_photos: true,
      show_living_contact: false,
      allow_guest_view: false,
      guest_blur_photos: true,
      guest_hide_living: true,
      allow_gedcom_export: true,
      allow_pdf_export: true,
      require_approval_for_export: false,
      allow_family_contributions: true,
      require_approval_for_contributions: true,
    }
  );

  const [saving, setSaving] = React.useState(false);
  const [hasChanges, setHasChanges] = React.useState(false);
  const [expandedSections, setExpandedSections] = React.useState<string[]>(['visibility']);

  const toggleSection = (section: string) => {
    setExpandedSections(prev =>
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const updateSetting = <K extends keyof TreePrivacySettings>(
    key: K,
    value: TreePrivacySettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateTreePrivacySettings(treeId, settings);
      setHasChanges(false);
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const VisibilityOption = ({
    value,
    icon: Icon,
    label,
    description,
  }: {
    value: VisibilityLevel;
    icon: React.ElementType;
    label: string;
    description: string;
  }) => (
    <button
      onClick={() => updateSetting('visibility', value)}
      className={`flex-1 p-4 rounded-xl border-2 transition-all text-start ${
        settings.visibility === value
          ? 'border-islamic-primary bg-islamic-light/50 dark:bg-islamic-primary/20'
          : 'border-slate-200 dark:border-slate-700 hover:border-islamic-primary/50'
      }`}
    >
      <Icon className={`w-6 h-6 mb-2 ${
        settings.visibility === value ? 'text-islamic-primary' : 'text-slate-400'
      }`} />
      <p className={`font-semibold ${
        settings.visibility === value ? 'text-islamic-primary' : 'text-slate-700 dark:text-slate-300'
      }`}>{label}</p>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{description}</p>
    </button>
  );

  const Toggle = ({
    checked,
    onChange,
    label,
  }: {
    checked: boolean;
    onChange: (value: boolean) => void;
    label: string;
  }) => (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-slate-700 dark:text-slate-300">{label}</span>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors ${
          checked ? 'bg-islamic-primary' : 'bg-slate-300 dark:bg-slate-600'
        }`}
      >
        <span
          className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
            checked
              ? isRTL ? 'left-0.5' : 'right-0.5 translate-x-0'
              : isRTL ? 'right-0.5' : 'left-0.5'
          }`}
        />
      </button>
    </div>
  );

  const Select = ({
    value,
    onChange,
    options,
  }: {
    value: string;
    onChange: (value: string) => void;
    options: { value: string; label: string }[];
  }) => (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-32 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-islamic-primary"
    >
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  );

  const Section = ({
    id,
    icon: Icon,
    title,
    description,
    children,
  }: {
    id: string;
    icon: React.ElementType;
    title: string;
    description: string;
    children: React.ReactNode;
  }) => {
    const isExpanded = expandedSections.includes(id);

    return (
      <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
        <button
          onClick={() => toggleSection(id)}
          className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Icon className="w-5 h-5 text-islamic-primary" />
            <div className="text-start">
              <p className="font-semibold text-slate-900 dark:text-white">{title}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{description}</p>
            </div>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          )}
        </button>
        {isExpanded && (
          <div className="p-4 space-y-4 border-t border-slate-200 dark:border-slate-700">
            {children}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Shield className="w-6 h-6 text-islamic-primary" />
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

      {/* Visibility Section */}
      <Section
        id="visibility"
        icon={Globe}
        title={t.visibility.title}
        description={t.visibility.description}
      >
        <div className="flex gap-4">
          <VisibilityOption
            value="private"
            icon={Lock}
            label={t.visibility.private}
            description={t.visibility.privateDesc}
          />
          <VisibilityOption
            value="family"
            icon={Users}
            label={t.visibility.family}
            description={t.visibility.familyDesc}
          />
          <VisibilityOption
            value="public"
            icon={Globe}
            label={t.visibility.public}
            description={t.visibility.publicDesc}
          />
        </div>
      </Section>

      {/* Living Persons Section */}
      <Section
        id="livingPerson"
        icon={Eye}
        title={t.livingPerson.title}
        description={t.livingPerson.description}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-700 dark:text-slate-300">
                {t.livingPerson.birthDate}
              </span>
            </div>
            <Select
              value={settings.show_living_birth_date || 'year_only'}
              onChange={(v) => updateSetting('show_living_birth_date', v as DateDisplayLevel)}
              options={[
                { value: 'full', label: t.dateDisplay.full },
                { value: 'year_only', label: t.dateDisplay.year_only },
                { value: 'hidden', label: t.dateDisplay.hidden },
              ]}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-700 dark:text-slate-300">
                {t.livingPerson.birthPlace}
              </span>
            </div>
            <Select
              value={settings.show_living_birth_place || 'country_only'}
              onChange={(v) => updateSetting('show_living_birth_place', v as PlaceDisplayLevel)}
              options={[
                { value: 'full', label: t.placeDisplay.full },
                { value: 'country_only', label: t.placeDisplay.country_only },
                { value: 'hidden', label: t.placeDisplay.hidden },
              ]}
            />
          </div>

          <Toggle
            checked={settings.show_living_photos || false}
            onChange={(v) => updateSetting('show_living_photos', v)}
            label={t.livingPerson.photos}
          />

          <Toggle
            checked={settings.show_living_contact || false}
            onChange={(v) => updateSetting('show_living_contact', v)}
            label={t.livingPerson.contact}
          />
        </div>
      </Section>

      {/* Guest Access Section */}
      <Section
        id="guestAccess"
        icon={EyeOff}
        title={t.guestAccess.title}
        description={t.guestAccess.description}
      >
        <Toggle
          checked={settings.allow_guest_view || false}
          onChange={(v) => updateSetting('allow_guest_view', v)}
          label={t.guestAccess.allowView}
        />
        {settings.allow_guest_view && (
          <>
            <Toggle
              checked={settings.guest_blur_photos || false}
              onChange={(v) => updateSetting('guest_blur_photos', v)}
              label={t.guestAccess.blurPhotos}
            />
            <Toggle
              checked={settings.guest_hide_living || false}
              onChange={(v) => updateSetting('guest_hide_living', v)}
              label={t.guestAccess.hideLiving}
            />
          </>
        )}
      </Section>

      {/* Export Section */}
      <Section
        id="export"
        icon={Download}
        title={t.export.title}
        description={t.export.description}
      >
        <Toggle
          checked={settings.allow_gedcom_export || false}
          onChange={(v) => updateSetting('allow_gedcom_export', v)}
          label={t.export.gedcom}
        />
        <Toggle
          checked={settings.allow_pdf_export || false}
          onChange={(v) => updateSetting('allow_pdf_export', v)}
          label={t.export.pdf}
        />
        <Toggle
          checked={settings.require_approval_for_export || false}
          onChange={(v) => updateSetting('require_approval_for_export', v)}
          label={t.export.requireApproval}
        />
      </Section>

      {/* Contributions Section */}
      <Section
        id="contributions"
        icon={Users}
        title={t.contributions.title}
        description={t.contributions.description}
      >
        <Toggle
          checked={settings.allow_family_contributions || false}
          onChange={(v) => updateSetting('allow_family_contributions', v)}
          label={t.contributions.allowFamily}
        />
        <Toggle
          checked={settings.require_approval_for_contributions || false}
          onChange={(v) => updateSetting('require_approval_for_contributions', v)}
          label={t.contributions.requireApproval}
        />
      </Section>
    </div>
  );
}
