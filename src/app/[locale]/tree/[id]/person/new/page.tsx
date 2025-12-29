'use client';

import * as React from 'react';
import { useLocale } from 'next-intl';
import { useRouter, useParams } from 'next/navigation';
import { PersonForm, type PersonFormData } from '@/components/forms/PersonForm';
import { createPerson } from '@/lib/db/actions';
import { ArrowRight, ArrowLeft, UserPlus } from 'lucide-react';

const translations = {
  ar: {
    title: 'إضافة شخص جديد',
    back: 'العودة للشجرة',
    success: 'تمت إضافة الشخص بنجاح',
    error: 'حدث خطأ أثناء إضافة الشخص',
  },
  en: {
    title: 'Add New Person',
    back: 'Back to Tree',
    success: 'Person added successfully',
    error: 'Error adding person',
  },
};

export default function AddPersonPage() {
  const locale = useLocale() as 'ar' | 'en';
  const router = useRouter();
  const params = useParams();
  const treeId = params.id as string;
  const t = translations[locale];
  const Arrow = locale === 'ar' ? ArrowLeft : ArrowRight;

  const [isLoading, setIsLoading] = React.useState(false);

  const handleSubmit = async (data: PersonFormData) => {
    setIsLoading(true);
    try {
      await createPerson({
        tree_id: treeId,
        given_name: data.given_name,
        patronymic_chain: data.patronymic_chain,
        family_name: data.family_name,
        full_name_ar: data.full_name_ar,
        full_name_en: data.full_name_en,
        gender: data.gender,
        birth_date: data.birth_date,
        birth_place: data.birth_place,
        death_date: data.death_date,
        death_place: data.death_place,
        is_living: data.is_living,
        notes: data.notes,
      });

      router.push(`/${locale}/tree/${treeId}`);
      router.refresh();
    } catch (error) {
      console.error('Error creating person:', error);
      alert(t.error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.push(`/${locale}/tree/${treeId}`);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      {/* Back button */}
      <button
        onClick={handleCancel}
        className="flex items-center gap-2 text-slate-600 hover:text-emerald-600 transition-colors mb-6"
      >
        <Arrow className="w-4 h-4 rotate-180" />
        {t.back}
      </button>

      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
          <UserPlus className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          {t.title}
        </h1>
      </div>

      {/* Form */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        <PersonForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
