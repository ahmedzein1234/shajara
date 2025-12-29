/**
 * GenerationSlider Component
 * Control how many generations are visible in the tree
 */

'use client';

import React, { useCallback } from 'react';
import { ChevronUp, ChevronDown, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GenerationSliderProps {
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
  locale?: 'ar' | 'en';
  className?: string;
}

const translations = {
  ar: {
    generations: 'الأجيال',
    all: 'الكل',
  },
  en: {
    generations: 'Generations',
    all: 'All',
  },
};

export function GenerationSlider({
  value,
  min = 1,
  max = 10,
  onChange,
  locale = 'ar',
  className,
}: GenerationSliderProps) {
  const t = translations[locale];

  const handleIncrease = useCallback(() => {
    if (value < max) onChange(value + 1);
  }, [value, max, onChange]);

  const handleDecrease = useCallback(() => {
    if (value > min) onChange(value - 1);
  }, [value, min, onChange]);

  const displayValue = value >= max ? t.all : value.toString();

  return (
    <div
      className={cn(
        'flex flex-col items-center gap-1 bg-white rounded-xl shadow-lg border border-gray-200 p-2',
        className
      )}
    >
      {/* Increase button */}
      <button
        onClick={handleIncrease}
        disabled={value >= max}
        className={cn(
          'p-1.5 rounded-lg transition-colors',
          value >= max
            ? 'text-gray-300 cursor-not-allowed'
            : 'text-gray-600 hover:bg-gray-100'
        )}
        aria-label="Show more generations"
      >
        <ChevronUp size={18} />
      </button>

      {/* Value display */}
      <div className="flex flex-col items-center py-2">
        <Layers size={16} className="text-gray-400 mb-1" />
        <span className="text-lg font-bold text-gray-900 min-w-[32px] text-center">
          {displayValue}
        </span>
        <span className="text-[10px] text-gray-500 uppercase tracking-wide">
          {t.generations}
        </span>
      </div>

      {/* Decrease button */}
      <button
        onClick={handleDecrease}
        disabled={value <= min}
        className={cn(
          'p-1.5 rounded-lg transition-colors',
          value <= min
            ? 'text-gray-300 cursor-not-allowed'
            : 'text-gray-600 hover:bg-gray-100'
        )}
        aria-label="Show fewer generations"
      >
        <ChevronDown size={18} />
      </button>

      {/* Quick select buttons */}
      <div className="flex gap-1 pt-2 border-t border-gray-100 mt-1">
        {[2, 4, max].map((gen) => (
          <button
            key={gen}
            onClick={() => onChange(gen)}
            className={cn(
              'px-2 py-1 text-xs rounded transition-colors',
              value === gen
                ? 'bg-blue-100 text-blue-700 font-medium'
                : 'text-gray-500 hover:bg-gray-100'
            )}
          >
            {gen >= max ? t.all : gen}
          </button>
        ))}
      </div>
    </div>
  );
}

export default GenerationSlider;
