/**
 * QuickAddForm Component
 * Inline form for quickly adding a family member without leaving the tree
 * Minimal friction - just name and gender to start
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Check,
  User,
  Crown,
  Heart,
  Baby,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type RelationType = 'parent' | 'spouse' | 'child';

interface QuickAddFormProps {
  relationType: RelationType;
  relatedToName: string;
  position: { x: number; y: number };
  locale?: 'ar' | 'en';
  onSubmit: (data: { givenName: string; gender: 'male' | 'female' }) => void;
  onCancel: () => void;
}

export function QuickAddForm({
  relationType,
  relatedToName,
  position,
  locale = 'ar',
  onSubmit,
  onCancel,
}: QuickAddFormProps) {
  const [givenName, setGivenName] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (givenName.trim()) {
      onSubmit({ givenName: givenName.trim(), gender });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCancel();
    }
  };

  const getIcon = () => {
    switch (relationType) {
      case 'parent': return Crown;
      case 'spouse': return Heart;
      case 'child': return Baby;
      default: return User;
    }
  };

  const getColor = () => {
    switch (relationType) {
      case 'parent': return 'amber';
      case 'spouse': return 'rose';
      case 'child': return 'emerald';
      default: return 'gray';
    }
  };

  const getTitle = () => {
    const titles = {
      parent: { ar: 'إضافة والد/والدة', en: 'Add Parent' },
      spouse: { ar: 'إضافة زوج/زوجة', en: 'Add Spouse' },
      child: { ar: 'إضافة ابن/ابنة', en: 'Add Child' },
    };
    return titles[relationType][locale];
  };

  const getSubtitle = () => {
    const templates = {
      parent: { ar: `والد/والدة ${relatedToName}`, en: `Parent of ${relatedToName}` },
      spouse: { ar: `زوج/زوجة ${relatedToName}`, en: `Spouse of ${relatedToName}` },
      child: { ar: `ابن/ابنة ${relatedToName}`, en: `Child of ${relatedToName}` },
    };
    return templates[relationType][locale];
  };

  const Icon = getIcon();
  const color = getColor();

  return (
    <div
      className="fixed z-[1000] animate-in fade-in-0 zoom-in-95 duration-200"
      style={{
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -50%)',
      }}
      onKeyDown={handleKeyDown}
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden w-80">
        {/* Header */}
        <div className={cn(
          'px-4 py-3 flex items-center gap-3',
          `bg-${color}-50 border-b border-${color}-100`
        )} style={{
          backgroundColor: color === 'amber' ? '#fffbeb' : color === 'rose' ? '#fff1f2' : '#ecfdf5',
          borderColor: color === 'amber' ? '#fef3c7' : color === 'rose' ? '#ffe4e6' : '#d1fae5',
        }}>
          <div className={cn(
            'w-10 h-10 rounded-xl flex items-center justify-center',
          )} style={{
            backgroundColor: color === 'amber' ? '#fbbf24' : color === 'rose' ? '#f43f5e' : '#10b981',
          }}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-gray-900">{getTitle()}</h3>
            <p className="text-xs text-gray-500">{getSubtitle()}</p>
          </div>
          <button
            onClick={onCancel}
            className="p-1.5 hover:bg-white/50 rounded-lg transition-colors"
          >
            <X size={18} className="text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Name input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {locale === 'ar' ? 'الاسم الأول' : 'First Name'}
            </label>
            <input
              ref={inputRef}
              type="text"
              value={givenName}
              onChange={(e) => setGivenName(e.target.value)}
              placeholder={locale === 'ar' ? 'أدخل الاسم...' : 'Enter name...'}
              className={cn(
                'w-full px-4 py-2.5 rounded-xl border border-gray-200',
                'focus:outline-none focus:ring-2 focus:border-transparent',
                'placeholder:text-gray-400',
                locale === 'ar' && 'text-right font-arabic',
                color === 'amber' && 'focus:ring-amber-400',
                color === 'rose' && 'focus:ring-rose-500',
                color !== 'amber' && color !== 'rose' && 'focus:ring-emerald-500'
              )}
              dir={locale === 'ar' ? 'rtl' : 'ltr'}
            />
          </div>

          {/* Gender selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {locale === 'ar' ? 'الجنس' : 'Gender'}
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setGender('male')}
                className={cn(
                  'flex-1 py-2.5 px-4 rounded-xl border-2 transition-all',
                  'flex items-center justify-center gap-2',
                  gender === 'male'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-600'
                )}
              >
                <div className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                  gender === 'male' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'
                )}>
                  ♂
                </div>
                <span className="font-medium">{locale === 'ar' ? 'ذكر' : 'Male'}</span>
              </button>
              <button
                type="button"
                onClick={() => setGender('female')}
                className={cn(
                  'flex-1 py-2.5 px-4 rounded-xl border-2 transition-all',
                  'flex items-center justify-center gap-2',
                  gender === 'female'
                    ? 'border-pink-500 bg-pink-50 text-pink-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-600'
                )}
              >
                <div className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                  gender === 'female' ? 'bg-pink-500 text-white' : 'bg-gray-200 text-gray-500'
                )}>
                  ♀
                </div>
                <span className="font-medium">{locale === 'ar' ? 'أنثى' : 'Female'}</span>
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-2.5 px-4 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors font-medium"
            >
              {locale === 'ar' ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={!givenName.trim()}
              className={cn(
                'flex-1 py-2.5 px-4 rounded-xl text-white font-medium',
                'flex items-center justify-center gap-2',
                'transition-all',
                givenName.trim()
                  ? 'hover:opacity-90'
                  : 'opacity-50 cursor-not-allowed'
              )}
              style={{
                backgroundColor: color === 'amber' ? '#f59e0b' : color === 'rose' ? '#f43f5e' : '#10b981',
              }}
            >
              <Check size={18} />
              <span>{locale === 'ar' ? 'إضافة' : 'Add'}</span>
            </button>
          </div>

          {/* Hint */}
          <p className="text-xs text-gray-400 text-center">
            {locale === 'ar'
              ? 'يمكنك إضافة المزيد من التفاصيل لاحقاً'
              : 'You can add more details later'}
          </p>
        </form>
      </div>
    </div>
  );
}

export default QuickAddForm;
