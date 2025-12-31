'use client';

/**
 * Guest Tree Builder
 *
 * Interactive tree building experience for guest users.
 * Uses localStorage for persistence until user registers.
 */

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  UserPlus,
  Link2,
  Save,
  LogIn,
  TreeDeciduous,
  Eye,
  Edit3,
  Trash2,
  AlertTriangle,
  ChevronDown,
  Users,
} from 'lucide-react';
import { useGuest } from '@/contexts/GuestContext';
import type { Person, Relationship } from '@/lib/db/schema';

export default function GuestTreePage() {
  const { locale } = useParams();
  const router = useRouter();
  const {
    tree,
    persons,
    relationships,
    addPerson,
    removePerson,
    addRelationship,
    isLoading,
    hasData,
  } = useGuest();

  const [showAddPerson, setShowAddPerson] = useState(false);
  const [showAddRelationship, setShowAddRelationship] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<string | null>(null);
  const isRTL = locale === 'ar';

  const t = {
    ar: {
      title: 'شجرتك',
      addPerson: 'إضافة شخص',
      addRelationship: 'إضافة علاقة',
      registerToSave: 'سجّل للحفظ الدائم',
      noTree: 'لم تنشئ شجرة بعد',
      startTree: 'ابدأ شجرتك',
      members: 'أفراد العائلة',
      noMembers: 'لا يوجد أفراد بعد. أضف أول شخص!',
      relationships: 'العلاقات',
      noRelationships: 'لا توجد علاقات بعد.',
      viewTree: 'عرض الشجرة',
      guestWarning: 'أنت في وضع التجربة. سجّل لحفظ شجرتك بشكل دائم.',
      // Person form
      personForm: {
        title: 'إضافة فرد',
        givenName: 'الاسم الأول',
        familyName: 'اسم العائلة',
        gender: 'الجنس',
        male: 'ذكر',
        female: 'أنثى',
        birthDate: 'تاريخ الميلاد',
        birthPlace: 'مكان الميلاد',
        save: 'حفظ',
        cancel: 'إلغاء',
      },
      // Relationship form
      relForm: {
        title: 'إضافة علاقة',
        person1: 'الشخص الأول',
        person2: 'الشخص الثاني',
        type: 'نوع العلاقة',
        parent: 'والد/ة',
        spouse: 'زوج/ة',
        sibling: 'أخ/أخت',
        save: 'حفظ',
        cancel: 'إلغاء',
      },
      delete: 'حذف',
      confirmDelete: 'هل أنت متأكد؟',
    },
    en: {
      title: 'Your Tree',
      addPerson: 'Add Person',
      addRelationship: 'Add Relationship',
      registerToSave: 'Register to Save',
      noTree: "You haven't created a tree yet",
      startTree: 'Start Your Tree',
      members: 'Family Members',
      noMembers: 'No members yet. Add your first person!',
      relationships: 'Relationships',
      noRelationships: 'No relationships yet.',
      viewTree: 'View Tree',
      guestWarning: "You're in trial mode. Register to save your tree permanently.",
      personForm: {
        title: 'Add Person',
        givenName: 'First Name',
        familyName: 'Family Name',
        gender: 'Gender',
        male: 'Male',
        female: 'Female',
        birthDate: 'Birth Date',
        birthPlace: 'Birth Place',
        save: 'Save',
        cancel: 'Cancel',
      },
      relForm: {
        title: 'Add Relationship',
        person1: 'First Person',
        person2: 'Second Person',
        type: 'Relationship Type',
        parent: 'Parent',
        spouse: 'Spouse',
        sibling: 'Sibling',
        save: 'Save',
        cancel: 'Cancel',
      },
      delete: 'Delete',
      confirmDelete: 'Are you sure?',
    },
  };

  const text = t[locale as 'ar' | 'en'] || t.en;

  // Redirect if no tree
  useEffect(() => {
    if (!isLoading && !tree) {
      router.push(`/${locale}/try`);
    }
  }, [isLoading, tree, router, locale]);

  if (isLoading || !tree) {
    return (
      <div className="min-h-screen bg-warm-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-heritage-turquoise"></div>
      </div>
    );
  }

  const handleAddPerson = (data: {
    given_name: string;
    family_name: string;
    gender: 'male' | 'female';
    birth_date?: string;
    birth_place?: string;
  }) => {
    addPerson({
      tree_id: tree.id,
      given_name: data.given_name,
      family_name: data.family_name || null,
      gender: data.gender,
      birth_date: data.birth_date || null,
      birth_place: data.birth_place || null,
      // Fill in required fields with defaults
      patronymic_chain: null,
      full_name_ar: null,
      full_name_en: null,
      kunya: null,
      laqab: null,
      nisba: null,
      nasab_chain: null,
      nasab_chain_en: null,
      tribe_id: null,
      tribal_branch: null,
      tribal_verified: false,
      is_sayyid: false,
      sayyid_verified: false,
      sayyid_lineage: null,
      birth_date_hijri: null,
      birth_place_lat: null,
      birth_place_lng: null,
      death_date: null,
      death_date_hijri: null,
      death_place: null,
      death_place_lat: null,
      death_place_lng: null,
      is_living: true,
      photo_url: null,
      notes: null,
    });
    setShowAddPerson(false);
  };

  const handleAddRelationship = (data: {
    person1_id: string;
    person2_id: string;
    relationship_type: 'parent' | 'spouse' | 'sibling';
  }) => {
    addRelationship({
      tree_id: tree.id,
      person1_id: data.person1_id,
      person2_id: data.person2_id,
      relationship_type: data.relationship_type,
      marriage_date: null,
      marriage_date_hijri: null,
      marriage_place: null,
      divorce_date: null,
      divorce_date_hijri: null,
      divorce_place: null,
    });
    setShowAddRelationship(false);
  };

  return (
    <div className="min-h-screen bg-warm-100">
      {/* Warning Banner */}
      <div className="bg-gold-100 border-b border-gold-200 py-3">
        <div className="container mx-auto px-4 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2 text-gold-800">
            <AlertTriangle className="w-5 h-5" />
            <span className="text-sm">{text.guestWarning}</span>
          </div>
          <Link
            href={`/${locale}/register`}
            className="inline-flex items-center gap-2 bg-gold-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gold-600 transition-colors"
          >
            <LogIn className="w-4 h-4" />
            {text.registerToSave}
          </Link>
        </div>
      </div>

      {/* Header */}
      <div className="bg-white border-b border-warm-200">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-heritage-turquoise/10 rounded-lg">
                <TreeDeciduous className="w-6 h-6 text-heritage-turquoise" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-heritage-navy">
                  {tree.name}
                </h1>
                <p className="text-warm-500 text-sm">
                  {persons.length} {text.members.toLowerCase()}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowAddPerson(true)}
                className="inline-flex items-center gap-2 bg-heritage-turquoise text-white px-4 py-2 rounded-lg font-medium hover:bg-heritage-turquoise/90 transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                {text.addPerson}
              </button>
              {persons.length >= 2 && (
                <button
                  onClick={() => setShowAddRelationship(true)}
                  className="inline-flex items-center gap-2 bg-white text-heritage-navy border border-warm-300 px-4 py-2 rounded-lg font-medium hover:bg-warm-50 transition-colors"
                >
                  <Link2 className="w-4 h-4" />
                  {text.addRelationship}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Members List */}
          <div className="bg-white rounded-2xl shadow-card-warm p-6">
            <h2 className="text-xl font-bold text-heritage-navy mb-4 flex items-center gap-2">
              <Users className="w-5 h-5" />
              {text.members}
            </h2>

            {persons.length === 0 ? (
              <div className="text-center py-8 text-warm-500">
                <UserPlus className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>{text.noMembers}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {persons.map((person) => (
                  <PersonCard
                    key={person.id}
                    person={person}
                    onDelete={() => removePerson(person.id)}
                    locale={locale as 'ar' | 'en'}
                    text={text}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Relationships List */}
          <div className="bg-white rounded-2xl shadow-card-warm p-6">
            <h2 className="text-xl font-bold text-heritage-navy mb-4 flex items-center gap-2">
              <Link2 className="w-5 h-5" />
              {text.relationships}
            </h2>

            {relationships.length === 0 ? (
              <div className="text-center py-8 text-warm-500">
                <Link2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>{text.noRelationships}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {relationships.map((rel) => {
                  const person1 = persons.find(p => p.id === rel.person1_id);
                  const person2 = persons.find(p => p.id === rel.person2_id);
                  return (
                    <RelationshipCard
                      key={rel.id}
                      relationship={rel}
                      person1={person1}
                      person2={person2}
                      locale={locale as 'ar' | 'en'}
                      text={text}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Person Modal */}
      {showAddPerson && (
        <AddPersonModal
          onAdd={handleAddPerson}
          onClose={() => setShowAddPerson(false)}
          text={text.personForm}
          isRTL={isRTL}
        />
      )}

      {/* Add Relationship Modal */}
      {showAddRelationship && (
        <AddRelationshipModal
          persons={persons}
          onAdd={handleAddRelationship}
          onClose={() => setShowAddRelationship(false)}
          text={text.relForm}
          isRTL={isRTL}
        />
      )}
    </div>
  );
}

// Person Card Component
function PersonCard({
  person,
  onDelete,
  locale,
  text,
}: {
  person: Person;
  onDelete: () => void;
  locale: 'ar' | 'en';
  text: any;
}) {
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <div className={`border rounded-xl p-4 ${
      person.gender === 'male'
        ? 'border-heritage-blue/30 bg-gradient-card-male'
        : 'border-heritage-rose/30 bg-gradient-card-female'
    }`}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-heritage-navy">
            {person.given_name} {person.family_name || ''}
          </h3>
          {person.birth_date && (
            <p className="text-sm text-warm-500">{person.birth_date}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-1 rounded-full ${
            person.gender === 'male'
              ? 'bg-heritage-blue/10 text-heritage-blue'
              : 'bg-heritage-rose/10 text-heritage-rose'
          }`}>
            {person.gender === 'male' ? (locale === 'ar' ? 'ذكر' : 'Male') : (locale === 'ar' ? 'أنثى' : 'Female')}
          </span>
          {!showConfirm ? (
            <button
              onClick={() => setShowConfirm(true)}
              className="p-1 text-warm-400 hover:text-red-500 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={onDelete}
              className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
            >
              {text.confirmDelete}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Relationship Card Component
function RelationshipCard({
  relationship,
  person1,
  person2,
  locale,
  text,
}: {
  relationship: Relationship;
  person1?: Person;
  person2?: Person;
  locale: 'ar' | 'en';
  text: any;
}) {
  const typeLabels = {
    parent: locale === 'ar' ? 'والد/ة' : 'Parent of',
    spouse: locale === 'ar' ? 'زوج/ة' : 'Spouse of',
    sibling: locale === 'ar' ? 'أخ/أخت' : 'Sibling of',
  };

  return (
    <div className="border border-warm-200 rounded-xl p-4 bg-warm-50">
      <div className="flex items-center gap-2 text-sm">
        <span className="font-medium text-heritage-navy">
          {person1?.given_name || '?'}
        </span>
        <span className="text-warm-500 px-2 py-0.5 bg-warm-200 rounded-full text-xs">
          {typeLabels[relationship.relationship_type]}
        </span>
        <span className="font-medium text-heritage-navy">
          {person2?.given_name || '?'}
        </span>
      </div>
    </div>
  );
}

// Add Person Modal
function AddPersonModal({
  onAdd,
  onClose,
  text,
  isRTL,
}: {
  onAdd: (data: any) => void;
  onClose: () => void;
  text: any;
  isRTL: boolean;
}) {
  const [formData, setFormData] = useState({
    given_name: '',
    family_name: '',
    gender: 'male' as 'male' | 'female',
    birth_date: '',
    birth_place: '',
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6">
        <h3 className="text-xl font-bold text-heritage-navy mb-6">{text.title}</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-warm-700 mb-1">
              {text.givenName} *
            </label>
            <input
              type="text"
              value={formData.given_name}
              onChange={(e) => setFormData({ ...formData, given_name: e.target.value })}
              className="w-full px-4 py-2 border border-warm-300 rounded-lg focus:ring-2 focus:ring-heritage-turquoise focus:border-heritage-turquoise"
              dir={isRTL ? 'rtl' : 'ltr'}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-warm-700 mb-1">
              {text.familyName}
            </label>
            <input
              type="text"
              value={formData.family_name}
              onChange={(e) => setFormData({ ...formData, family_name: e.target.value })}
              className="w-full px-4 py-2 border border-warm-300 rounded-lg focus:ring-2 focus:ring-heritage-turquoise focus:border-heritage-turquoise"
              dir={isRTL ? 'rtl' : 'ltr'}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-warm-700 mb-1">
              {text.gender} *
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={formData.gender === 'male'}
                  onChange={() => setFormData({ ...formData, gender: 'male' })}
                  className="text-heritage-turquoise"
                />
                {text.male}
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={formData.gender === 'female'}
                  onChange={() => setFormData({ ...formData, gender: 'female' })}
                  className="text-heritage-turquoise"
                />
                {text.female}
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-warm-700 mb-1">
              {text.birthDate}
            </label>
            <input
              type="date"
              value={formData.birth_date}
              onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
              className="w-full px-4 py-2 border border-warm-300 rounded-lg focus:ring-2 focus:ring-heritage-turquoise focus:border-heritage-turquoise"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-warm-700 mb-1">
              {text.birthPlace}
            </label>
            <input
              type="text"
              value={formData.birth_place}
              onChange={(e) => setFormData({ ...formData, birth_place: e.target.value })}
              className="w-full px-4 py-2 border border-warm-300 rounded-lg focus:ring-2 focus:ring-heritage-turquoise focus:border-heritage-turquoise"
              dir={isRTL ? 'rtl' : 'ltr'}
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-2 border border-warm-300 rounded-lg text-warm-600 hover:bg-warm-50"
          >
            {text.cancel}
          </button>
          <button
            onClick={() => onAdd(formData)}
            disabled={!formData.given_name.trim()}
            className="flex-1 py-2 bg-heritage-turquoise text-white rounded-lg hover:bg-heritage-turquoise/90 disabled:opacity-50"
          >
            {text.save}
          </button>
        </div>
      </div>
    </div>
  );
}

// Add Relationship Modal
function AddRelationshipModal({
  persons,
  onAdd,
  onClose,
  text,
  isRTL,
}: {
  persons: Person[];
  onAdd: (data: any) => void;
  onClose: () => void;
  text: any;
  isRTL: boolean;
}) {
  const [formData, setFormData] = useState({
    person1_id: '',
    person2_id: '',
    relationship_type: 'parent' as 'parent' | 'spouse' | 'sibling',
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6">
        <h3 className="text-xl font-bold text-heritage-navy mb-6">{text.title}</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-warm-700 mb-1">
              {text.person1} *
            </label>
            <select
              value={formData.person1_id}
              onChange={(e) => setFormData({ ...formData, person1_id: e.target.value })}
              className="w-full px-4 py-2 border border-warm-300 rounded-lg focus:ring-2 focus:ring-heritage-turquoise focus:border-heritage-turquoise"
            >
              <option value="">--</option>
              {persons.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.given_name} {p.family_name || ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-warm-700 mb-1">
              {text.type} *
            </label>
            <select
              value={formData.relationship_type}
              onChange={(e) => setFormData({ ...formData, relationship_type: e.target.value as any })}
              className="w-full px-4 py-2 border border-warm-300 rounded-lg focus:ring-2 focus:ring-heritage-turquoise focus:border-heritage-turquoise"
            >
              <option value="parent">{text.parent}</option>
              <option value="spouse">{text.spouse}</option>
              <option value="sibling">{text.sibling}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-warm-700 mb-1">
              {text.person2} *
            </label>
            <select
              value={formData.person2_id}
              onChange={(e) => setFormData({ ...formData, person2_id: e.target.value })}
              className="w-full px-4 py-2 border border-warm-300 rounded-lg focus:ring-2 focus:ring-heritage-turquoise focus:border-heritage-turquoise"
            >
              <option value="">--</option>
              {persons
                .filter((p) => p.id !== formData.person1_id)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.given_name} {p.family_name || ''}
                  </option>
                ))}
            </select>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-2 border border-warm-300 rounded-lg text-warm-600 hover:bg-warm-50"
          >
            {text.cancel}
          </button>
          <button
            onClick={() => onAdd(formData)}
            disabled={!formData.person1_id || !formData.person2_id}
            className="flex-1 py-2 bg-heritage-turquoise text-white rounded-lg hover:bg-heritage-turquoise/90 disabled:opacity-50"
          >
            {text.save}
          </button>
        </div>
      </div>
    </div>
  );
}
