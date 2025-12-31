'use client';

/**
 * Tribal Hierarchy Selector
 *
 * Displays and allows selection of tribal affiliations in a hierarchical format:
 * Qabila (قبيلة) → Fakhdh (فخذ) → Hamula (حمولة) → Bayt (بيت)
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Search,
  Plus,
  X,
  Users,
  MapPin,
  Crown,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Tribe } from '@/lib/db/schema';

interface TribeWithChildren extends Tribe {
  children?: TribeWithChildren[];
  level?: 'qabila' | 'fakhdh' | 'hamula' | 'bayt';
}

interface TribalSelectorProps {
  value?: string; // tribe_id
  tribalBranch?: string; // custom branch text
  onChange: (tribeId: string | undefined, tribalBranch?: string) => void;
  locale: 'ar' | 'en';
  disabled?: boolean;
}

const translations = {
  ar: {
    title: 'الانتماء القبلي',
    searchPlaceholder: 'ابحث عن قبيلة...',
    selectTribe: 'اختر القبيلة',
    levels: {
      qabila: 'قبيلة',
      fakhdh: 'فخذ',
      hamula: 'حمولة',
      bayt: 'بيت/عشيرة',
    },
    origin: {
      qahtani: 'قحطانية',
      adnani: 'عدنانية',
      other: 'أخرى',
    },
    regions: {
      gulf: 'الخليج',
      levant: 'الشام',
      maghreb: 'المغرب',
      egypt: 'مصر',
    },
    noTribes: 'لا توجد قبائل',
    loading: 'جاري التحميل...',
    customBranch: 'فرع مخصص (اختياري)',
    customBranchPlaceholder: 'مثال: آل فلان',
    addTribe: 'إضافة قبيلة جديدة',
    selectedTribe: 'القبيلة المختارة',
    clear: 'مسح',
    qahtani: 'قحطانية',
    adnani: 'عدنانية',
  },
  en: {
    title: 'Tribal Affiliation',
    searchPlaceholder: 'Search for tribe...',
    selectTribe: 'Select Tribe',
    levels: {
      qabila: 'Tribe (Qabila)',
      fakhdh: 'Clan (Fakhdh)',
      hamula: 'Sub-clan (Hamula)',
      bayt: 'House (Bayt)',
    },
    origin: {
      qahtani: 'Qahtanite',
      adnani: 'Adnanite',
      other: 'Other',
    },
    regions: {
      gulf: 'Gulf',
      levant: 'Levant',
      maghreb: 'Maghreb',
      egypt: 'Egypt',
    },
    noTribes: 'No tribes found',
    loading: 'Loading...',
    customBranch: 'Custom Branch (Optional)',
    customBranchPlaceholder: 'e.g., Al-Flan clan',
    addTribe: 'Add New Tribe',
    selectedTribe: 'Selected Tribe',
    clear: 'Clear',
    qahtani: 'Qahtanite',
    adnani: 'Adnanite',
  },
};

export function TribalSelector({
  value,
  tribalBranch: initialBranch,
  onChange,
  locale,
  disabled = false,
}: TribalSelectorProps) {
  const t = translations[locale];
  const [tribes, setTribes] = useState<TribeWithChildren[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedTribes, setExpandedTribes] = useState<Set<string>>(new Set());
  const [selectedTribe, setSelectedTribe] = useState<Tribe | null>(null);
  const [customBranch, setCustomBranch] = useState(initialBranch || '');

  // Fetch tribes on mount
  useEffect(() => {
    fetchTribes();
  }, []);

  // Update selected tribe when value changes
  useEffect(() => {
    if (value && tribes.length > 0) {
      const tribe = findTribeById(tribes, value);
      setSelectedTribe(tribe || null);
    } else {
      setSelectedTribe(null);
    }
  }, [value, tribes]);

  const fetchTribes = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/tribes');
      const data = await response.json();
      setTribes(data.tribes || []);
    } catch (error) {
      console.error('Error fetching tribes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const findTribeById = (tribeList: TribeWithChildren[], id: string): Tribe | undefined => {
    for (const tribe of tribeList) {
      if (tribe.id === id) return tribe;
      if (tribe.children) {
        const found = findTribeById(tribe.children, id);
        if (found) return found;
      }
    }
    return undefined;
  };

  const toggleExpand = (tribeId: string) => {
    setExpandedTribes(prev => {
      const next = new Set(prev);
      if (next.has(tribeId)) {
        next.delete(tribeId);
      } else {
        next.add(tribeId);
      }
      return next;
    });
  };

  const handleSelect = (tribe: Tribe) => {
    setSelectedTribe(tribe);
    onChange(tribe.id, customBranch);
    setIsOpen(false);
  };

  const handleClear = () => {
    setSelectedTribe(null);
    setCustomBranch('');
    onChange(undefined, undefined);
  };

  const handleBranchChange = (branch: string) => {
    setCustomBranch(branch);
    onChange(selectedTribe?.id, branch);
  };

  const filterTribes = (tribeList: TribeWithChildren[], query: string): TribeWithChildren[] => {
    if (!query) return tribeList;

    const lowerQuery = query.toLowerCase();
    return tribeList.reduce<TribeWithChildren[]>((acc, tribe) => {
      const matchesName =
        tribe.name_ar.toLowerCase().includes(lowerQuery) ||
        (tribe.name_en && tribe.name_en.toLowerCase().includes(lowerQuery));

      const filteredChildren = tribe.children ? filterTribes(tribe.children, query) : [];

      if (matchesName || filteredChildren.length > 0) {
        acc.push({
          ...tribe,
          children: matchesName ? tribe.children : filteredChildren,
        });
      }

      return acc;
    }, []);
  };

  const getLevelColor = (level: string | undefined) => {
    switch (level) {
      case 'qabila':
        return 'bg-heritage-navy text-white';
      case 'fakhdh':
        return 'bg-heritage-turquoise text-white';
      case 'hamula':
        return 'bg-gold-500 text-white';
      case 'bayt':
        return 'bg-heritage-terracotta text-white';
      default:
        return 'bg-warm-200 text-warm-700';
    }
  };

  const getOriginBadge = (origin: string | null) => {
    if (!origin) return null;
    return (
      <span className={cn(
        'text-xs px-1.5 py-0.5 rounded',
        origin === 'qahtani' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
      )}>
        {t.origin[origin as keyof typeof t.origin] || origin}
      </span>
    );
  };

  const renderTribe = (tribe: TribeWithChildren, depth: number = 0) => {
    const hasChildren = tribe.children && tribe.children.length > 0;
    const isExpanded = expandedTribes.has(tribe.id);
    const isSelected = selectedTribe?.id === tribe.id;

    return (
      <div key={tribe.id}>
        <div
          className={cn(
            'flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors',
            isSelected
              ? 'bg-heritage-turquoise/10 border-s-2 border-heritage-turquoise'
              : 'hover:bg-warm-50',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
          style={{ paddingInlineStart: `${depth * 16 + 12}px` }}
          onClick={() => !disabled && handleSelect(tribe)}
        >
          {/* Expand/collapse button */}
          {hasChildren && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleExpand(tribe.id);
              }}
              className="p-0.5 hover:bg-warm-100 rounded"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-warm-500" />
              ) : (
                <ChevronRight className="w-4 h-4 text-warm-500" />
              )}
            </button>
          )}

          {/* Level indicator */}
          <span className={cn(
            'text-xs px-1.5 py-0.5 rounded font-medium',
            getLevelColor(tribe.level)
          )}>
            {t.levels[tribe.level as keyof typeof t.levels] || t.levels.qabila}
          </span>

          {/* Tribe name */}
          <div className="flex-1 min-w-0">
            <span className="font-medium text-heritage-navy truncate">
              {tribe.name_ar}
            </span>
            {tribe.name_en && (
              <span className="text-warm-500 text-sm ms-2">
                ({tribe.name_en})
              </span>
            )}
          </div>

          {/* Origin badge */}
          {tribe.origin_type && getOriginBadge(tribe.origin_type)}

          {/* Selection indicator */}
          {isSelected && (
            <div className="w-2 h-2 rounded-full bg-heritage-turquoise" />
          )}
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div>
            {tribe.children!.map(child => renderTribe(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const filteredTribes = filterTribes(tribes, searchQuery);

  return (
    <div className="space-y-4">
      {/* Title */}
      <h4 className="text-sm font-medium text-slate-900 dark:text-white flex items-center gap-2">
        <Crown className="w-4 h-4 text-gold-500" />
        {t.title}
      </h4>

      {/* Selected Tribe Display */}
      {selectedTribe && (
        <div className="flex items-center gap-2 p-3 bg-heritage-turquoise/5 border border-heritage-turquoise/20 rounded-lg">
          <Users className="w-5 h-5 text-heritage-turquoise" />
          <div className="flex-1">
            <p className="text-sm text-warm-500">{t.selectedTribe}</p>
            <p className="font-medium text-heritage-navy">
              {selectedTribe.name_ar}
              {selectedTribe.name_en && ` (${selectedTribe.name_en})`}
            </p>
          </div>
          {!disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-warm-400 hover:text-red-500 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* Dropdown trigger */}
      <div className="relative">
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={cn(
            'w-full flex items-center justify-between px-4 py-3 text-start',
            'bg-white dark:bg-slate-800',
            'border border-warm-300 dark:border-slate-600 rounded-lg',
            'text-warm-700 dark:text-slate-300',
            'hover:border-heritage-turquoise focus:ring-2 focus:ring-heritage-turquoise focus:border-heritage-turquoise',
            disabled && 'opacity-50 cursor-not-allowed',
            isOpen && 'ring-2 ring-heritage-turquoise border-heritage-turquoise'
          )}
        >
          <span className={cn(!selectedTribe && 'text-warm-400')}>
            {selectedTribe ? selectedTribe.name_ar : t.selectTribe}
          </span>
          <ChevronDown className={cn(
            'w-5 h-5 text-warm-400 transition-transform',
            isOpen && 'rotate-180'
          )} />
        </button>

        {/* Dropdown panel */}
        {isOpen && (
          <div className="absolute z-50 w-full mt-2 bg-white dark:bg-slate-800 border border-warm-200 dark:border-slate-600 rounded-lg shadow-lg max-h-80 overflow-hidden">
            {/* Search */}
            <div className="p-2 border-b border-warm-200">
              <div className="relative">
                <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t.searchPlaceholder}
                  className="w-full ps-9 pe-3 py-2 text-sm border border-warm-200 rounded-lg focus:ring-2 focus:ring-heritage-turquoise focus:border-heritage-turquoise"
                />
              </div>
            </div>

            {/* Tribe list */}
            <div className="max-h-60 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center gap-2 py-8 text-warm-500">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {t.loading}
                </div>
              ) : filteredTribes.length === 0 ? (
                <div className="py-8 text-center text-warm-500">
                  {t.noTribes}
                </div>
              ) : (
                filteredTribes.map(tribe => renderTribe(tribe))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Custom branch input */}
      <div>
        <label className="block text-sm font-medium text-warm-700 dark:text-slate-300 mb-2">
          {t.customBranch}
        </label>
        <input
          type="text"
          value={customBranch}
          onChange={(e) => handleBranchChange(e.target.value)}
          placeholder={t.customBranchPlaceholder}
          disabled={disabled}
          className={cn(
            'w-full px-4 py-2 text-base',
            'bg-white dark:bg-slate-800',
            'border border-warm-300 dark:border-slate-600 rounded-lg',
            'text-warm-900 dark:text-slate-100',
            'placeholder:text-warm-400',
            'focus:outline-none focus:ring-2 focus:ring-heritage-turquoise focus:border-transparent',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        />
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 text-xs">
        <span className={cn('px-2 py-1 rounded', getLevelColor('qabila'))}>
          {t.levels.qabila}
        </span>
        <span className={cn('px-2 py-1 rounded', getLevelColor('fakhdh'))}>
          {t.levels.fakhdh}
        </span>
        <span className={cn('px-2 py-1 rounded', getLevelColor('hamula'))}>
          {t.levels.hamula}
        </span>
        <span className={cn('px-2 py-1 rounded', getLevelColor('bayt'))}>
          {t.levels.bayt}
        </span>
      </div>
    </div>
  );
}
