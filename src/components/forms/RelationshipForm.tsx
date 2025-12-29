'use client';

import * as React from 'react';
import { useLocale } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Link2, Calendar, MapPin, Save, Loader2, Users, Heart, User } from 'lucide-react';
import type { Person } from '@/lib/db/schema';

export interface RelationshipFormData {
  person1_id: string;
  person2_id: string;
  relationship_type: 'parent' | 'spouse' | 'sibling';
  marriage_date?: string;
  marriage_place?: string;
  divorce_date?: string;
  divorce_place?: string;
}

export interface RelationshipFormProps {
  persons: Person[];
  currentPersonId?: string;
  initialData?: Partial<RelationshipFormData>;
  onSubmit: (data: RelationshipFormData) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

const translations = {
  ar: {
    title: 'إضافة علاقة',
    selectPerson: 'اختر الشخص',
    person1: 'الشخص الأول',
    person2: 'الشخص الثاني',
    relationshipType: 'نوع العلاقة',
    parent: 'أب/أم',
    parentDesc: 'الشخص الأول هو والد/ة الشخص الثاني',
    spouse: 'زوج/زوجة',
    spouseDesc: 'الشخصان متزوجان',
    sibling: 'أخ/أخت',
    siblingDesc: 'الشخصان إخوة',
    marriageInfo: 'معلومات الزواج',
    marriageDate: 'تاريخ الزواج',
    marriagePlace: 'مكان الزواج',
    divorceInfo: 'معلومات الطلاق (إن وجد)',
    divorceDate: 'تاريخ الطلاق',
    divorcePlace: 'مكان الطلاق',
    save: 'حفظ',
    saving: 'جاري الحفظ...',
    cancel: 'إلغاء',
  },
  en: {
    title: 'Add Relationship',
    selectPerson: 'Select Person',
    person1: 'First Person',
    person2: 'Second Person',
    relationshipType: 'Relationship Type',
    parent: 'Parent',
    parentDesc: 'First person is parent of second person',
    spouse: 'Spouse',
    spouseDesc: 'Both persons are married',
    sibling: 'Sibling',
    siblingDesc: 'Both persons are siblings',
    marriageInfo: 'Marriage Information',
    marriageDate: 'Marriage Date',
    marriagePlace: 'Marriage Place',
    divorceInfo: 'Divorce Information (if applicable)',
    divorceDate: 'Divorce Date',
    divorcePlace: 'Divorce Place',
    save: 'Save',
    saving: 'Saving...',
    cancel: 'Cancel',
  },
};

const relationshipTypes = [
  { value: 'parent', icon: Users },
  { value: 'spouse', icon: Heart },
  { value: 'sibling', icon: User },
] as const;

export function RelationshipForm({
  persons,
  currentPersonId,
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
}: RelationshipFormProps) {
  const locale = useLocale() as 'ar' | 'en';
  const t = translations[locale];

  const [formData, setFormData] = React.useState<RelationshipFormData>({
    person1_id: currentPersonId || initialData?.person1_id || '',
    person2_id: initialData?.person2_id || '',
    relationship_type: initialData?.relationship_type || 'parent',
    marriage_date: initialData?.marriage_date || '',
    marriage_place: initialData?.marriage_place || '',
    divorce_date: initialData?.divorce_date || '',
    divorce_place: initialData?.divorce_place || '',
  });

  const handleChange = (field: keyof RelationshipFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  const getPersonName = (person: Person) => {
    return person.full_name_ar || person.given_name;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Relationship Type */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          {t.relationshipType}
        </label>
        <div className="grid grid-cols-3 gap-3">
          {relationshipTypes.map(({ value, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => handleChange('relationship_type', value)}
              className={cn(
                'flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all',
                formData.relationship_type === value
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
              )}
            >
              <Icon className={cn(
                'w-6 h-6',
                formData.relationship_type === value
                  ? 'text-emerald-600'
                  : 'text-slate-400'
              )} />
              <span className={cn(
                'text-sm font-medium',
                formData.relationship_type === value
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : 'text-slate-600 dark:text-slate-400'
              )}>
                {t[value as keyof typeof t]}
              </span>
            </button>
          ))}
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {t[`${formData.relationship_type}Desc` as keyof typeof t]}
        </p>
      </div>

      {/* Person Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            {t.person1} <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.person1_id}
            onChange={(e) => handleChange('person1_id', e.target.value)}
            required
            className={cn(
              'w-full h-10 px-3 py-2 text-base',
              'bg-white dark:bg-slate-800',
              'border border-slate-300 dark:border-slate-600 rounded-lg',
              'text-slate-900 dark:text-slate-100',
              'focus:outline-none focus:ring-2 focus:ring-emerald-500'
            )}
          >
            <option value="">{t.selectPerson}</option>
            {persons.map((person) => (
              <option
                key={person.id}
                value={person.id}
                disabled={person.id === formData.person2_id}
              >
                {getPersonName(person)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            {t.person2} <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.person2_id}
            onChange={(e) => handleChange('person2_id', e.target.value)}
            required
            className={cn(
              'w-full h-10 px-3 py-2 text-base',
              'bg-white dark:bg-slate-800',
              'border border-slate-300 dark:border-slate-600 rounded-lg',
              'text-slate-900 dark:text-slate-100',
              'focus:outline-none focus:ring-2 focus:ring-emerald-500'
            )}
          >
            <option value="">{t.selectPerson}</option>
            {persons.map((person) => (
              <option
                key={person.id}
                value={person.id}
                disabled={person.id === formData.person1_id}
              >
                {getPersonName(person)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Marriage Info (only for spouse) */}
      {formData.relationship_type === 'spouse' && (
        <div className="space-y-4 p-4 bg-pink-50 dark:bg-pink-900/10 rounded-lg">
          <h4 className="text-md font-medium text-slate-900 dark:text-white flex items-center gap-2">
            <Heart className="w-4 h-4 text-pink-500" />
            {t.marriageInfo}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                {t.marriageDate}
              </label>
              <Input
                type="date"
                value={formData.marriage_date}
                onChange={(e) => handleChange('marriage_date', e.target.value)}
                dir="ltr"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                {t.marriagePlace}
              </label>
              <div className="relative">
                <MapPin className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  value={formData.marriage_place}
                  onChange={(e) => handleChange('marriage_place', e.target.value)}
                  className="ps-10"
                />
              </div>
            </div>
          </div>

          {/* Divorce Info */}
          <h4 className="text-md font-medium text-slate-700 dark:text-slate-300 pt-4">
            {t.divorceInfo}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                {t.divorceDate}
              </label>
              <Input
                type="date"
                value={formData.divorce_date}
                onChange={(e) => handleChange('divorce_date', e.target.value)}
                dir="ltr"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                {t.divorcePlace}
              </label>
              <div className="relative">
                <MapPin className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  value={formData.divorce_place}
                  onChange={(e) => handleChange('divorce_place', e.target.value)}
                  className="ps-10"
                />
              </div>
            </div>
          </div>
        </div>
      )}

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
          disabled={isLoading || !formData.person1_id || !formData.person2_id}
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
