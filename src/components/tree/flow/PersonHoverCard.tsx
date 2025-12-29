/**
 * PersonHoverCard Component
 * Shows a rich preview when hovering over a person node
 * Inspired by LinkedIn profile hover cards
 */

'use client';

import React from 'react';
import { Person } from '@/lib/db/schema';
import {
  Calendar,
  MapPin,
  Users,
  Heart,
  Baby,
  Crown,
  Eye,
  Edit3,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PersonHoverCardProps {
  person: Person;
  position: { x: number; y: number };
  locale?: 'ar' | 'en';
  parentsCount?: number;
  childrenCount?: number;
  spousesCount?: number;
  onViewDetails?: () => void;
  onEdit?: () => void;
}

export function PersonHoverCard({
  person,
  position,
  locale = 'ar',
  parentsCount = 0,
  childrenCount = 0,
  spousesCount = 0,
  onViewDetails,
  onEdit,
}: PersonHoverCardProps) {
  const isMale = person.gender === 'male';
  const isLiving = person.is_living !== false;

  const displayName = locale === 'ar'
    ? person.full_name_ar || person.given_name
    : person.full_name_en || person.given_name;

  const birthYear = person.birth_date ? new Date(person.birth_date).getFullYear() : null;
  const deathYear = person.death_date ? new Date(person.death_date).getFullYear() : null;

  const age = birthYear
    ? (deathYear || (isLiving ? new Date().getFullYear() : null))
      ? `${(deathYear || new Date().getFullYear()) - birthYear} ${locale === 'ar' ? 'سنة' : 'years'}`
      : null
    : null;

  return (
    <div
      className={cn(
        'fixed z-[1000] pointer-events-auto',
        'animate-in fade-in-0 zoom-in-95 duration-200'
      )}
      style={{
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -100%) translateY(-16px)',
      }}
    >
      {/* Main card */}
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden w-72">
        {/* Header with gradient */}
        <div
          className={cn(
            'h-16 relative',
            isMale
              ? 'bg-gradient-to-br from-blue-400 via-blue-500 to-indigo-600'
              : 'bg-gradient-to-br from-pink-400 via-rose-500 to-pink-600'
          )}
        >
          {/* Decorative pattern */}
          <div className="absolute inset-0 opacity-20">
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <pattern id="pattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                <circle cx="10" cy="10" r="1.5" fill="white" />
              </pattern>
              <rect width="100" height="100" fill="url(#pattern)" />
            </svg>
          </div>

          {/* Living badge */}
          {isLiving && (
            <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-white/20 backdrop-blur-sm rounded-full px-2 py-0.5">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-white text-xs font-medium">
                {locale === 'ar' ? 'على قيد الحياة' : 'Living'}
              </span>
            </div>
          )}
        </div>

        {/* Avatar - overlapping header */}
        <div className="relative -mt-10 px-4">
          <div
            className={cn(
              'w-20 h-20 rounded-2xl border-4 border-white shadow-lg',
              'flex items-center justify-center',
              'text-white font-bold text-2xl',
              isMale
                ? 'bg-gradient-to-br from-blue-500 to-indigo-600'
                : 'bg-gradient-to-br from-pink-500 to-rose-600'
            )}
          >
            {person.photo_url ? (
              <img
                src={person.photo_url}
                alt={displayName}
                className="w-full h-full object-cover rounded-xl"
              />
            ) : (
              <span>{person.given_name.charAt(0).toUpperCase()}</span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-4 pt-2">
          {/* Name */}
          <h3 className={cn(
            'text-lg font-bold text-gray-900',
            locale === 'ar' && 'font-arabic text-right'
          )}>
            {displayName}
          </h3>

          {/* Family name */}
          {person.family_name && (
            <p className="text-sm text-gray-500">{person.family_name}</p>
          )}

          {/* Life info */}
          <div className="mt-3 space-y-2">
            {birthYear && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar size={14} className="text-gray-400" />
                <span>
                  {birthYear}{deathYear ? ` - ${deathYear}` : ''}
                  {age && <span className="text-gray-400 ml-1">({age})</span>}
                </span>
              </div>
            )}

            {person.birth_place && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin size={14} className="text-gray-400" />
                <span className="truncate">{person.birth_place}</span>
              </div>
            )}
          </div>

          {/* Family stats */}
          <div className="mt-4 flex items-center justify-between py-3 px-4 bg-gray-50 rounded-xl">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-gray-400 mb-0.5">
                <Crown size={12} />
              </div>
              <span className="text-lg font-bold text-gray-900">{parentsCount}</span>
              <p className="text-[10px] text-gray-500">
                {locale === 'ar' ? 'والدين' : 'Parents'}
              </p>
            </div>
            <div className="w-px h-8 bg-gray-200" />
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-gray-400 mb-0.5">
                <Heart size={12} />
              </div>
              <span className="text-lg font-bold text-gray-900">{spousesCount}</span>
              <p className="text-[10px] text-gray-500">
                {locale === 'ar' ? 'أزواج' : 'Spouses'}
              </p>
            </div>
            <div className="w-px h-8 bg-gray-200" />
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-gray-400 mb-0.5">
                <Baby size={12} />
              </div>
              <span className="text-lg font-bold text-gray-900">{childrenCount}</span>
              <p className="text-[10px] text-gray-500">
                {locale === 'ar' ? 'أبناء' : 'Children'}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-4 flex gap-2">
            <button
              onClick={onViewDetails}
              className="flex-1 flex items-center justify-center gap-2 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-colors text-sm font-medium"
            >
              <Eye size={16} />
              <span>{locale === 'ar' ? 'عرض الملف' : 'View Profile'}</span>
            </button>
            <button
              onClick={onEdit}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <Edit3 size={18} className="text-gray-500" />
            </button>
          </div>
        </div>
      </div>

      {/* Arrow pointing down */}
      <div className="absolute left-1/2 -translate-x-1/2 bottom-0 translate-y-full">
        <div className="w-4 h-4 bg-white rotate-45 border-r border-b border-gray-100 -mt-2" />
      </div>
    </div>
  );
}

export default PersonHoverCard;
