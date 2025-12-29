/**
 * AI Preview Modal Component
 * Shows extracted information for user confirmation before adding to tree
 */

'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import {
  X,
  Check,
  Edit3,
  User,
  Calendar,
  MapPin,
  Users,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from 'lucide-react';
import {
  AIExtractionResult,
  ExtractedPerson,
  ExtractedRelationship,
} from '@/lib/ai/openrouter';

interface AIPreviewModalProps {
  extraction: AIExtractionResult;
  locale: 'ar' | 'en';
  onConfirm: (persons: ExtractedPerson[], relationships: ExtractedRelationship[]) => void;
  onCancel: () => void;
}

export function AIPreviewModal({
  extraction,
  locale,
  onConfirm,
  onCancel,
}: AIPreviewModalProps) {
  const [editedPersons, setEditedPersons] = useState<ExtractedPerson[]>(extraction.persons);
  const [editedRelationships, setEditedRelationships] = useState<ExtractedRelationship[]>(
    extraction.relationships
  );
  const [expandedPersonIndex, setExpandedPersonIndex] = useState<number | null>(0);

  const t = locale === 'ar' ? translations.ar : translations.en;

  // Escape key handler to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onCancel]);

  const handlePersonChange = (index: number, field: keyof ExtractedPerson, value: string | boolean) => {
    setEditedPersons(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleRelationshipChange = (index: number, field: keyof ExtractedRelationship, value: string) => {
    setEditedRelationships(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleConfirm = () => {
    onConfirm(editedPersons, editedRelationships);
  };

  const confidenceColor = extraction.confidence >= 0.8
    ? 'text-green-600 bg-green-50'
    : extraction.confidence >= 0.5
    ? 'text-yellow-600 bg-yellow-50'
    : 'text-red-600 bg-red-50';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="preview-modal-title"
    >
      <div
        className={cn(
          'bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-hidden',
          'flex flex-col'
        )}
        dir={locale === 'ar' ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles size={24} />
            <div>
              <h2 id="preview-modal-title" className="font-bold text-lg">{t.title}</h2>
              <p className="text-violet-200 text-sm">{t.subtitle}</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label={locale === 'ar' ? 'إغلاق' : 'Close'}
          >
            <X size={20} />
          </button>
        </div>

        {/* Confidence indicator */}
        <div className="px-6 py-3 border-b border-gray-100 flex items-center justify-between">
          <span className="text-sm text-gray-600">{t.aiConfidence}</span>
          <span className={cn('px-3 py-1 rounded-full text-sm font-medium', confidenceColor)}>
            {Math.round(extraction.confidence * 100)}%
          </span>
        </div>

        {/* AI Interpretation */}
        {extraction.raw_interpretation && (
          <div className="px-6 py-3 bg-violet-50 border-b border-violet-100">
            <p className="text-sm text-violet-700">
              <strong>{t.interpretation}:</strong> {extraction.raw_interpretation}
            </p>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* Extracted Persons */}
          {editedPersons.map((person, index) => (
            <div
              key={index}
              className="border border-gray-200 rounded-xl overflow-hidden"
            >
              {/* Person header */}
              <button
                onClick={() => setExpandedPersonIndex(expandedPersonIndex === index ? null : index)}
                className="w-full px-4 py-3 bg-gray-50 flex items-center justify-between hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center',
                    person.gender === 'male'
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-pink-100 text-pink-600'
                  )}>
                    <User size={20} />
                  </div>
                  <div className="text-start">
                    <p className="font-semibold text-gray-900">
                      {person.given_name}
                      {person.family_name && ` ${person.family_name}`}
                    </p>
                    <p className="text-xs text-gray-500">
                      {person.gender === 'male' ? t.male : t.female}
                      {person.birth_date && ` • ${person.birth_date}`}
                    </p>
                  </div>
                </div>
                {expandedPersonIndex === index ? (
                  <ChevronUp size={20} className="text-gray-400" />
                ) : (
                  <ChevronDown size={20} className="text-gray-400" />
                )}
              </button>

              {/* Expanded details */}
              {expandedPersonIndex === index && (
                <div className="p-4 space-y-4 border-t border-gray-100">
                  {/* Name fields */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">{t.givenName}</label>
                      <input
                        type="text"
                        value={person.given_name}
                        onChange={(e) => handlePersonChange(index, 'given_name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">{t.familyName}</label>
                      <input
                        type="text"
                        value={person.family_name || ''}
                        onChange={(e) => handlePersonChange(index, 'family_name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Patronymic */}
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">{t.patronymic}</label>
                    <input
                      type="text"
                      value={person.patronymic_chain || ''}
                      onChange={(e) => handlePersonChange(index, 'patronymic_chain', e.target.value)}
                      placeholder={locale === 'ar' ? 'مثال: بن خالد بن محمد' : 'e.g., bin Khaled bin Mohammed'}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    />
                  </div>

                  {/* Gender */}
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">{t.gender}</label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handlePersonChange(index, 'gender', 'male')}
                        className={cn(
                          'flex-1 py-2 rounded-lg text-sm font-medium transition-colors',
                          person.gender === 'male'
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        )}
                      >
                        {t.male}
                      </button>
                      <button
                        onClick={() => handlePersonChange(index, 'gender', 'female')}
                        className={cn(
                          'flex-1 py-2 rounded-lg text-sm font-medium transition-colors',
                          person.gender === 'female'
                            ? 'bg-pink-500 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        )}
                      >
                        {t.female}
                      </button>
                    </div>
                  </div>

                  {/* Birth info */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1 flex items-center gap-1">
                        <Calendar size={12} />
                        {t.birthDate}
                      </label>
                      <input
                        type="text"
                        value={person.birth_date || ''}
                        onChange={(e) => handlePersonChange(index, 'birth_date', e.target.value)}
                        placeholder="YYYY-MM-DD"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1 flex items-center gap-1">
                        <MapPin size={12} />
                        {t.birthPlace}
                      </label>
                      <input
                        type="text"
                        value={person.birth_place || ''}
                        onChange={(e) => handlePersonChange(index, 'birth_place', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Death info (if applicable) */}
                  {!person.is_living && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">{t.deathDate}</label>
                        <input
                          type="text"
                          value={person.death_date || ''}
                          onChange={(e) => handlePersonChange(index, 'death_date', e.target.value)}
                          placeholder="YYYY-MM-DD"
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">{t.deathPlace}</label>
                        <input
                          type="text"
                          value={person.death_place || ''}
                          onChange={(e) => handlePersonChange(index, 'death_place', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  )}

                  {/* Living toggle */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handlePersonChange(index, 'is_living', !person.is_living)}
                      className={cn(
                        'w-12 h-6 rounded-full transition-colors relative',
                        person.is_living ? 'bg-green-500' : 'bg-gray-300'
                      )}
                    >
                      <span
                        className={cn(
                          'absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform',
                          person.is_living
                            ? (locale === 'ar' ? 'left-1' : 'right-1')
                            : (locale === 'ar' ? 'right-1' : 'left-1')
                        )}
                      />
                    </button>
                    <span className="text-sm text-gray-600">{t.isLiving}</span>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Relationships */}
          {editedRelationships.length > 0 && (
            <div className="border border-gray-200 rounded-xl p-4">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Users size={18} />
                {t.relationships}
              </h3>
              <div className="space-y-3">
                {editedRelationships.map((rel, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        {t.relationshipTypes[rel.role] || rel.role}
                      </span>
                      {rel.to_person_name && (
                        <span className="text-xs text-violet-600 bg-violet-50 px-2 py-1 rounded-full">
                          → {rel.to_person_name}
                        </span>
                      )}
                    </div>
                    <select
                      value={rel.role}
                      onChange={(e) => handleRelationshipChange(index, 'role', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-violet-500"
                    >
                      <option value="parent">{t.relationshipTypes.parent}</option>
                      <option value="child">{t.relationshipTypes.child}</option>
                      <option value="spouse">{t.relationshipTypes.spouse}</option>
                      <option value="sibling">{t.relationshipTypes.sibling}</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Suggestions */}
          {extraction.suggestions && extraction.suggestions.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <h3 className="font-semibold text-yellow-800 mb-2 flex items-center gap-2">
                <AlertTriangle size={18} />
                {t.suggestions}
              </h3>
              <ul className="text-sm text-yellow-700 space-y-1">
                {extraction.suggestions.map((suggestion, i) => (
                  <li key={i}>• {suggestion}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 min-h-[48px] border border-gray-200 rounded-xl text-gray-600 font-medium hover:bg-gray-50 transition-colors"
            aria-label={locale === 'ar' ? 'إلغاء والعودة' : 'Cancel and go back'}
          >
            {t.cancel}
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 py-3 min-h-[48px] bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            aria-label={locale === 'ar' ? 'تأكيد وإضافة إلى الشجرة' : 'Confirm and add to tree'}
          >
            <Check size={18} />
            {t.confirm}
          </button>
        </div>
      </div>
    </div>
  );
}

const translations = {
  ar: {
    title: 'مراجعة المعلومات',
    subtitle: 'تحقق من البيانات المستخرجة قبل الإضافة',
    aiConfidence: 'دقة الذكاء الاصطناعي',
    interpretation: 'التفسير',
    givenName: 'الاسم الأول',
    familyName: 'اسم العائلة',
    patronymic: 'سلسلة النسب',
    gender: 'الجنس',
    male: 'ذكر',
    female: 'أنثى',
    birthDate: 'تاريخ الميلاد',
    birthPlace: 'مكان الميلاد',
    deathDate: 'تاريخ الوفاة',
    deathPlace: 'مكان الوفاة',
    isLiving: 'على قيد الحياة',
    relationships: 'العلاقات',
    relationshipTypes: {
      parent: 'أب/أم',
      child: 'ابن/ابنة',
      spouse: 'زوج/زوجة',
      sibling: 'أخ/أخت',
    },
    suggestions: 'اقتراحات',
    cancel: 'إلغاء',
    confirm: 'تأكيد الإضافة',
  },
  en: {
    title: 'Review Information',
    subtitle: 'Verify extracted data before adding',
    aiConfidence: 'AI Confidence',
    interpretation: 'Interpretation',
    givenName: 'Given Name',
    familyName: 'Family Name',
    patronymic: 'Patronymic Chain',
    gender: 'Gender',
    male: 'Male',
    female: 'Female',
    birthDate: 'Birth Date',
    birthPlace: 'Birth Place',
    deathDate: 'Death Date',
    deathPlace: 'Death Place',
    isLiving: 'Living',
    relationships: 'Relationships',
    relationshipTypes: {
      parent: 'Parent',
      child: 'Child',
      spouse: 'Spouse',
      sibling: 'Sibling',
    },
    suggestions: 'Suggestions',
    cancel: 'Cancel',
    confirm: 'Confirm & Add',
  },
};

export default AIPreviewModal;
