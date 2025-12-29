'use client';

import * as React from 'react';
import { useLocale } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DualDatePicker } from './DualDatePicker';
import { VoiceInput } from './VoiceInput';
import {
  User, Calendar, MapPin, Camera, Save,
  Loader2, X, ChevronDown, Mic
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PersonFormData {
  given_name: string;
  patronymic_chain?: string;
  family_name?: string;
  full_name_ar?: string;
  full_name_en?: string;
  gender: 'male' | 'female';
  birth_date?: string;
  birth_place?: string;
  birth_place_lat?: number;
  birth_place_lng?: number;
  death_date?: string;
  death_place?: string;
  death_place_lat?: number;
  death_place_lng?: number;
  is_living: boolean;
  photo_url?: string;
  notes?: string;
}

export interface PersonFormProps {
  initialData?: Partial<PersonFormData>;
  onSubmit: (data: PersonFormData) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

const translations = {
  ar: {
    title: 'معلومات الشخص',
    givenName: 'الاسم الأول',
    givenNamePlaceholder: 'أدخل الاسم الأول',
    patronymicChain: 'سلسلة النسب',
    patronymicChainPlaceholder: 'بن/بنت خالد بن محمد...',
    familyName: 'اسم العائلة/القبيلة',
    familyNamePlaceholder: 'مثال: القحطاني، العتيبي',
    fullNameAr: 'الاسم الكامل (عربي)',
    fullNameEn: 'الاسم الكامل (إنجليزي)',
    gender: 'الجنس',
    male: 'ذكر',
    female: 'أنثى',
    birthInfo: 'معلومات الميلاد',
    birthDate: 'تاريخ الميلاد',
    birthPlace: 'مكان الميلاد',
    birthPlacePlaceholder: 'مثال: الرياض، السعودية',
    deathInfo: 'معلومات الوفاة',
    deathDate: 'تاريخ الوفاة',
    deathPlace: 'مكان الوفاة',
    isLiving: 'على قيد الحياة',
    photo: 'الصورة الشخصية',
    uploadPhoto: 'رفع صورة',
    removePhoto: 'إزالة الصورة',
    notes: 'ملاحظات',
    notesPlaceholder: 'أضف ملاحظات إضافية عن هذا الشخص...',
    save: 'حفظ',
    saving: 'جاري الحفظ...',
    cancel: 'إلغاء',
    required: 'مطلوب',
    voiceHint: 'اضغط على الميكروفون للإدخال الصوتي',
  },
  en: {
    title: 'Person Information',
    givenName: 'Given Name',
    givenNamePlaceholder: 'Enter given name',
    patronymicChain: 'Patronymic Chain',
    patronymicChainPlaceholder: 'bin/bint Khaled bin Mohammed...',
    familyName: 'Family Name',
    familyNamePlaceholder: 'e.g., Al-Qahtani, Al-Otaibi',
    fullNameAr: 'Full Name (Arabic)',
    fullNameEn: 'Full Name (English)',
    gender: 'Gender',
    male: 'Male',
    female: 'Female',
    birthInfo: 'Birth Information',
    birthDate: 'Birth Date',
    birthPlace: 'Birth Place',
    birthPlacePlaceholder: 'e.g., Riyadh, Saudi Arabia',
    deathInfo: 'Death Information',
    deathDate: 'Death Date',
    deathPlace: 'Death Place',
    isLiving: 'Is Living',
    photo: 'Profile Photo',
    uploadPhoto: 'Upload Photo',
    removePhoto: 'Remove Photo',
    notes: 'Notes',
    notesPlaceholder: 'Add additional notes about this person...',
    save: 'Save',
    saving: 'Saving...',
    cancel: 'Cancel',
    required: 'Required',
    voiceHint: 'Tap microphone for voice input',
  },
};

export function PersonForm({ initialData, onSubmit, onCancel, isLoading = false }: PersonFormProps) {
  const locale = useLocale() as 'ar' | 'en';
  const t = translations[locale];

  const [formData, setFormData] = React.useState<PersonFormData>({
    given_name: initialData?.given_name || '',
    patronymic_chain: initialData?.patronymic_chain || '',
    family_name: initialData?.family_name || '',
    full_name_ar: initialData?.full_name_ar || '',
    full_name_en: initialData?.full_name_en || '',
    gender: initialData?.gender || 'male',
    birth_date: initialData?.birth_date || '',
    birth_place: initialData?.birth_place || '',
    death_date: initialData?.death_date || '',
    death_place: initialData?.death_place || '',
    is_living: initialData?.is_living ?? true,
    photo_url: initialData?.photo_url || '',
    notes: initialData?.notes || '',
  });

  const [photoPreview, setPhotoPreview] = React.useState<string | null>(initialData?.photo_url || null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Auto-generate full name from components
  React.useEffect(() => {
    const prefix = formData.gender === 'male' ? 'بن' : 'بنت';
    const parts = [formData.given_name];
    if (formData.patronymic_chain) {
      parts.push(formData.patronymic_chain);
    }
    if (formData.family_name) {
      parts.push(formData.family_name);
    }
    const fullNameAr = parts.join(' ');
    setFormData(prev => ({ ...prev, full_name_ar: fullNameAr }));
  }, [formData.given_name, formData.patronymic_chain, formData.family_name, formData.gender]);

  const handleChange = (field: keyof PersonFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // TODO: Upload to R2 and get URL
    // For now, we'll just store the data URL
    setFormData(prev => ({ ...prev, photo_url: '' }));
  };

  const handleRemovePhoto = () => {
    setPhotoPreview(null);
    setFormData(prev => ({ ...prev, photo_url: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <User className="w-5 h-5 text-emerald-600" />
          {t.title}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Given Name with Voice Input */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              {t.givenName} <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-2">
              <Input
                value={formData.given_name}
                onChange={(e) => handleChange('given_name', e.target.value)}
                placeholder={t.givenNamePlaceholder}
                required
                className="flex-1"
              />
              <VoiceInput
                onTranscript={(text) => handleChange('given_name', formData.given_name ? `${formData.given_name} ${text}`.trim() : text)}
                lang={locale === 'ar' ? 'ar-SA' : 'en-US'}
              />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
              <Mic className="w-3 h-3" />
              {t.voiceHint}
            </p>
          </div>

          {/* Gender */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              {t.gender} <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="gender"
                  value="male"
                  checked={formData.gender === 'male'}
                  onChange={() => handleChange('gender', 'male')}
                  className="w-4 h-4 text-emerald-600 border-slate-300 focus:ring-emerald-500"
                />
                <span className="text-sm text-slate-700 dark:text-slate-300">{t.male}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="gender"
                  value="female"
                  checked={formData.gender === 'female'}
                  onChange={() => handleChange('gender', 'female')}
                  className="w-4 h-4 text-emerald-600 border-slate-300 focus:ring-emerald-500"
                />
                <span className="text-sm text-slate-700 dark:text-slate-300">{t.female}</span>
              </label>
            </div>
          </div>
        </div>

        {/* Patronymic Chain with Voice Input */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            {t.patronymicChain}
          </label>
          <div className="flex items-center gap-2">
            <Input
              value={formData.patronymic_chain}
              onChange={(e) => handleChange('patronymic_chain', e.target.value)}
              placeholder={t.patronymicChainPlaceholder}
              className="flex-1"
            />
            <VoiceInput
              onTranscript={(text) => handleChange('patronymic_chain', formData.patronymic_chain ? `${formData.patronymic_chain} ${text}`.trim() : text)}
              lang="ar-SA"
            />
          </div>
        </div>

        {/* Family Name with Voice Input */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            {t.familyName}
          </label>
          <div className="flex items-center gap-2">
            <Input
              value={formData.family_name}
              onChange={(e) => handleChange('family_name', e.target.value)}
              placeholder={t.familyNamePlaceholder}
              className="flex-1"
            />
            <VoiceInput
              onTranscript={(text) => handleChange('family_name', text)}
              lang="ar-SA"
            />
          </div>
        </div>

        {/* Full Names */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              {t.fullNameAr}
            </label>
            <Input
              value={formData.full_name_ar}
              onChange={(e) => handleChange('full_name_ar', e.target.value)}
              dir="rtl"
              className="bg-slate-50 dark:bg-slate-800"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              {t.fullNameEn}
            </label>
            <Input
              value={formData.full_name_en}
              onChange={(e) => handleChange('full_name_en', e.target.value)}
              dir="ltr"
            />
          </div>
        </div>
      </div>

      {/* Birth Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <Calendar className="w-5 h-5 text-emerald-600" />
          {t.birthInfo}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <DualDatePicker
            label={t.birthDate}
            value={formData.birth_date}
            onChange={(value) => handleChange('birth_date', value)}
          />
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              {t.birthPlace}
            </label>
            <div className="relative">
              <MapPin className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                value={formData.birth_place}
                onChange={(e) => handleChange('birth_place', e.target.value)}
                placeholder={t.birthPlacePlaceholder}
                className="ps-10"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Living Status & Death Information */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.is_living}
              onChange={(e) => handleChange('is_living', e.target.checked)}
              className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
            />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {t.isLiving}
            </span>
          </label>
        </div>

        {!formData.is_living && (
          <div className="space-y-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
            <h4 className="text-md font-medium text-slate-900 dark:text-white">
              {t.deathInfo}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <DualDatePicker
                label={t.deathDate}
                value={formData.death_date}
                onChange={(value) => handleChange('death_date', value)}
              />
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  {t.deathPlace}
                </label>
                <div className="relative">
                  <MapPin className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    value={formData.death_place}
                    onChange={(e) => handleChange('death_place', e.target.value)}
                    className="ps-10"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Photo */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <Camera className="w-5 h-5 text-emerald-600" />
          {t.photo}
        </h3>

        <div className="flex items-start gap-4">
          {photoPreview ? (
            <div className="relative">
              <img
                src={photoPreview}
                alt="Preview"
                className="w-24 h-24 rounded-lg object-cover border border-slate-200 dark:border-slate-700"
              />
              <button
                type="button"
                onClick={handleRemovePhoto}
                className="absolute -top-2 -end-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="w-24 h-24 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center bg-slate-50 dark:bg-slate-800">
              <User className="w-8 h-8 text-slate-400" />
            </div>
          )}

          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="hidden"
              id="photo-upload"
            />
            <label
              htmlFor="photo-upload"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer transition-colors"
            >
              <Camera className="w-4 h-4" />
              {t.uploadPhoto}
            </label>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          {t.notes}
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) => handleChange('notes', e.target.value)}
          placeholder={t.notesPlaceholder}
          rows={4}
          className={cn(
            'w-full px-4 py-3 text-base',
            'bg-white dark:bg-slate-800',
            'border border-slate-300 dark:border-slate-600 rounded-lg',
            'text-slate-900 dark:text-slate-100',
            'placeholder:text-slate-400',
            'focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent',
            'resize-none'
          )}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            {t.cancel}
          </Button>
        )}
        <Button
          type="submit"
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
          disabled={isLoading || !formData.given_name}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin me-2" />
              {t.saving}
            </>
          ) : (
            <>
              <Save className="w-4 h-4 me-2" />
              {t.save}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
