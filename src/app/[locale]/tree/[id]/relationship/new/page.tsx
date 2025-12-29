'use client';

import * as React from 'react';
import { useLocale } from 'next-intl';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { RelationshipForm, type RelationshipFormData } from '@/components/forms/RelationshipForm';
import { createRelationship, getPersonsByTreeId } from '@/lib/db/actions';
import type { Person } from '@/lib/db/schema';
import { ArrowRight, ArrowLeft, Link2, Loader2 } from 'lucide-react';

const translations = {
  ar: {
    title: 'إضافة علاقة جديدة',
    back: 'العودة للشجرة',
    loading: 'جاري التحميل...',
    success: 'تمت إضافة العلاقة بنجاح',
    error: 'حدث خطأ أثناء إضافة العلاقة',
    noPersons: 'لا يوجد أشخاص في الشجرة. أضف أشخاصاً أولاً.',
  },
  en: {
    title: 'Add New Relationship',
    back: 'Back to Tree',
    loading: 'Loading...',
    success: 'Relationship added successfully',
    error: 'Error adding relationship',
    noPersons: 'No persons in tree. Add persons first.',
  },
};

export default function AddRelationshipPage() {
  const locale = useLocale() as 'ar' | 'en';
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const treeId = params.id as string;
  const personId = searchParams.get('personId') || undefined;
  const t = translations[locale];
  const Arrow = locale === 'ar' ? ArrowLeft : ArrowRight;

  const [persons, setPersons] = React.useState<Person[]>([]);
  const [isLoadingPersons, setIsLoadingPersons] = React.useState(true);
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    async function loadPersons() {
      try {
        const data = await getPersonsByTreeId(treeId);
        setPersons(data);
      } catch (error) {
        console.error('Error loading persons:', error);
      } finally {
        setIsLoadingPersons(false);
      }
    }
    loadPersons();
  }, [treeId]);

  const handleSubmit = async (data: RelationshipFormData) => {
    setIsLoading(true);
    try {
      await createRelationship({
        tree_id: treeId,
        person1_id: data.person1_id,
        person2_id: data.person2_id,
        relationship_type: data.relationship_type,
        marriage_date: data.marriage_date,
        marriage_place: data.marriage_place,
      });

      router.push(`/${locale}/tree/${treeId}`);
      router.refresh();
    } catch (error) {
      console.error('Error creating relationship:', error);
      alert(t.error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.push(`/${locale}/tree/${treeId}`);
  };

  if (isLoadingPersons) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          <span className="ms-3 text-slate-600">{t.loading}</span>
        </div>
      </div>
    );
  }

  if (persons.length < 2) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <button
          onClick={handleCancel}
          className="flex items-center gap-2 text-slate-600 hover:text-emerald-600 transition-colors mb-6"
        >
          <Arrow className="w-4 h-4 rotate-180" />
          {t.back}
        </button>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-center">
          <p className="text-amber-800">{t.noPersons}</p>
        </div>
      </div>
    );
  }

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
          <Link2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          {t.title}
        </h1>
      </div>

      {/* Form */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        <RelationshipForm
          persons={persons}
          currentPersonId={personId}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
