/**
 * TreeSearch Component
 * Smart search with live filtering and auto-focus on results
 * Supports fuzzy matching for Arabic names
 */

'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Person } from '@/lib/db/schema';
import {
  Search,
  X,
  User,
  Calendar,
  MapPin,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TreeSearchProps {
  persons: Person[];
  locale?: 'ar' | 'en';
  onSelectPerson: (person: Person) => void;
  onHighlightPerson?: (personId: string | null) => void;
}

export function TreeSearch({
  persons,
  locale = 'ar',
  onSelectPerson,
  onHighlightPerson,
}: TreeSearchProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Fuzzy search implementation
  const searchResults = useMemo(() => {
    if (!query.trim()) return [];

    const normalizedQuery = query.toLowerCase().trim();

    return persons
      .filter(person => {
        const nameAr = (person.full_name_ar || '').toLowerCase();
        const nameEn = (person.full_name_en || '').toLowerCase();
        const givenName = (person.given_name || '').toLowerCase();
        const familyName = (person.family_name || '').toLowerCase();
        const birthPlace = (person.birth_place || '').toLowerCase();

        return (
          nameAr.includes(normalizedQuery) ||
          nameEn.includes(normalizedQuery) ||
          givenName.includes(normalizedQuery) ||
          familyName.includes(normalizedQuery) ||
          birthPlace.includes(normalizedQuery)
        );
      })
      .slice(0, 8); // Limit results
  }, [query, persons]);

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchResults]);

  // Highlight the first result
  useEffect(() => {
    if (searchResults.length > 0 && onHighlightPerson) {
      onHighlightPerson(searchResults[selectedIndex]?.id || null);
    } else if (onHighlightPerson) {
      onHighlightPerson(null);
    }
  }, [searchResults, selectedIndex, onHighlightPerson]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || searchResults.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev =>
          prev < searchResults.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev =>
          prev > 0 ? prev - 1 : searchResults.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (searchResults[selectedIndex]) {
          handleSelect(searchResults[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setQuery('');
        inputRef.current?.blur();
        break;
    }
  };

  const handleSelect = (person: Person) => {
    onSelectPerson(person);
    setIsOpen(false);
    setQuery('');
  };

  const getDisplayName = (person: Person) => {
    return locale === 'ar'
      ? person.full_name_ar || person.given_name
      : person.full_name_en || person.given_name;
  };

  const getBirthYear = (person: Person) => {
    return person.birth_date ? new Date(person.birth_date).getFullYear() : null;
  };

  return (
    <div className="relative">
      {/* Search input */}
      <div className={cn(
        'relative flex items-center',
        'bg-white/95 backdrop-blur-sm rounded-xl',
        'border border-gray-200 shadow-lg',
        'transition-all duration-200',
        isOpen && searchResults.length > 0 && 'rounded-b-none border-b-0'
      )}>
        <Search
          size={18}
          className={cn(
            'absolute left-3 transition-colors',
            isOpen ? 'text-emerald-500' : 'text-gray-400'
          )}
        />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={locale === 'ar' ? 'ابحث عن شخص...' : 'Search for a person...'}
          className={cn(
            'w-64 py-2.5 pl-10 pr-10 bg-transparent',
            'outline-none text-sm',
            locale === 'ar' && 'font-arabic'
          )}
          dir={locale === 'ar' ? 'rtl' : 'ltr'}
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              inputRef.current?.focus();
            }}
            className="absolute right-3 p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={14} className="text-gray-400" />
          </button>
        )}
      </div>

      {/* Results dropdown */}
      {isOpen && searchResults.length > 0 && (
        <div
          ref={resultsRef}
          className={cn(
            'absolute top-full left-0 right-0 z-50',
            'bg-white/95 backdrop-blur-sm',
            'border border-t-0 border-gray-200 rounded-b-xl shadow-lg',
            'max-h-80 overflow-y-auto'
          )}
        >
          {searchResults.map((person, index) => {
            const isMale = person.gender === 'male';
            const birthYear = getBirthYear(person);
            const isSelected = index === selectedIndex;

            return (
              <button
                key={person.id}
                onClick={() => handleSelect(person)}
                onMouseEnter={() => setSelectedIndex(index)}
                className={cn(
                  'w-full flex items-center gap-3 p-3',
                  'text-left transition-colors',
                  isSelected ? 'bg-emerald-50' : 'hover:bg-gray-50',
                  index === searchResults.length - 1 && 'rounded-b-xl'
                )}
              >
                {/* Avatar */}
                <div
                  className={cn(
                    'w-10 h-10 rounded-xl flex-shrink-0',
                    'flex items-center justify-center',
                    'text-white font-bold text-sm',
                    isMale
                      ? 'bg-gradient-to-br from-blue-400 to-indigo-500'
                      : 'bg-gradient-to-br from-pink-400 to-rose-500'
                  )}
                >
                  {person.photo_url ? (
                    <img
                      src={person.photo_url}
                      alt={getDisplayName(person)}
                      className="w-full h-full object-cover rounded-xl"
                    />
                  ) : (
                    <span>{person.given_name.charAt(0).toUpperCase()}</span>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    'font-medium text-gray-900 truncate',
                    locale === 'ar' && 'font-arabic'
                  )}>
                    {getDisplayName(person)}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    {birthYear && (
                      <span className="flex items-center gap-1">
                        <Calendar size={10} />
                        {birthYear}
                      </span>
                    )}
                    {person.birth_place && (
                      <span className="flex items-center gap-1 truncate">
                        <MapPin size={10} />
                        {person.birth_place}
                      </span>
                    )}
                  </div>
                </div>

                {/* Arrow */}
                <ChevronRight
                  size={16}
                  className={cn(
                    'text-gray-300 transition-transform',
                    isSelected && 'text-emerald-500 translate-x-1'
                  )}
                />
              </button>
            );
          })}
        </div>
      )}

      {/* No results */}
      {isOpen && query && searchResults.length === 0 && (
        <div className={cn(
          'absolute top-full left-0 right-0 z-50',
          'bg-white/95 backdrop-blur-sm',
          'border border-t-0 border-gray-200 rounded-b-xl shadow-lg',
          'p-4 text-center'
        )}>
          <User size={24} className="mx-auto text-gray-300 mb-2" />
          <p className="text-sm text-gray-500">
            {locale === 'ar' ? 'لا توجد نتائج' : 'No results found'}
          </p>
        </div>
      )}

      {/* Backdrop to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}

export default TreeSearch;
