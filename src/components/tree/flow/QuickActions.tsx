/**
 * QuickActions Component
 * Floating action buttons that appear around a person node
 * Allows quick adding of parents, spouses, and children
 */

'use client';

import React from 'react';
import { Person } from '@/lib/db/schema';
import {
  UserPlus,
  Heart,
  Baby,
  Crown,
  Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickActionsProps {
  person: Person;
  position: { x: number; y: number };
  nodeWidth: number;
  nodeHeight: number;
  locale?: 'ar' | 'en';
  hasParents?: boolean;
  onAddParent?: () => void;
  onAddSpouse?: () => void;
  onAddChild?: () => void;
}

export function QuickActions({
  person,
  position,
  nodeWidth,
  nodeHeight,
  locale = 'ar',
  hasParents = false,
  onAddParent,
  onAddSpouse,
  onAddChild,
}: QuickActionsProps) {
  const buttonClass = cn(
    'group relative flex items-center justify-center',
    'w-10 h-10 rounded-full',
    'bg-white shadow-lg border-2 border-gray-200',
    'hover:scale-110 hover:shadow-xl',
    'transition-all duration-200',
    'cursor-pointer'
  );

  const iconClass = 'w-5 h-5';

  return (
    <>
      {/* Add Parent - Top */}
      {!hasParents && (
        <div
          className="absolute z-50 animate-in fade-in-0 zoom-in-50 duration-200"
          style={{
            left: position.x + nodeWidth / 2,
            top: position.y - 20,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <button
            onClick={onAddParent}
            className={cn(buttonClass, 'hover:border-amber-400 hover:bg-amber-50')}
            title={locale === 'ar' ? 'إضافة والد/والدة' : 'Add Parent'}
          >
            <Crown className={cn(iconClass, 'text-amber-500')} />
            <Plus className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-white rounded-full p-0.5" />

            {/* Tooltip */}
            <span className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
              {locale === 'ar' ? 'إضافة والد' : 'Add Parent'}
            </span>
          </button>

          {/* Connection line preview */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0.5 h-5 bg-amber-300 opacity-50" />
        </div>
      )}

      {/* Add Spouse - Right */}
      <div
        className="absolute z-50 animate-in fade-in-0 slide-in-from-left-2 duration-200"
        style={{
          left: position.x + nodeWidth + 20,
          top: position.y + nodeHeight / 2,
          transform: 'translateY(-50%)',
        }}
      >
        <button
          onClick={onAddSpouse}
          className={cn(buttonClass, 'hover:border-rose-400 hover:bg-rose-50')}
          title={locale === 'ar' ? 'إضافة زوج/زوجة' : 'Add Spouse'}
        >
          <Heart className={cn(iconClass, 'text-rose-500')} />
          <Plus className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full p-0.5" />

          {/* Tooltip */}
          <span className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
            {locale === 'ar' ? 'إضافة زوج' : 'Add Spouse'}
          </span>
        </button>

        {/* Connection line preview */}
        <div className="absolute right-full top-1/2 -translate-y-1/2 w-5 h-0.5 bg-rose-300 opacity-50" />
      </div>

      {/* Add Child - Bottom */}
      <div
        className="absolute z-50 animate-in fade-in-0 zoom-in-50 duration-200"
        style={{
          left: position.x + nodeWidth / 2,
          top: position.y + nodeHeight + 20,
          transform: 'translate(-50%, 0)',
        }}
      >
        <button
          onClick={onAddChild}
          className={cn(buttonClass, 'hover:border-emerald-400 hover:bg-emerald-50')}
          title={locale === 'ar' ? 'إضافة ابن/ابنة' : 'Add Child'}
        >
          <Baby className={cn(iconClass, 'text-emerald-500')} />
          <Plus className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 text-white rounded-full p-0.5" />

          {/* Tooltip */}
          <span className="absolute top-full mt-1 left-1/2 -translate-x-1/2 whitespace-nowrap bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
            {locale === 'ar' ? 'إضافة ابن' : 'Add Child'}
          </span>
        </button>

        {/* Connection line preview */}
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 w-0.5 h-5 bg-emerald-300 opacity-50" />
      </div>
    </>
  );
}

export default QuickActions;
