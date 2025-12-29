/**
 * FlowPersonNode Component
 * Custom React Flow node for displaying a person in the family tree
 * Beautiful card design with smooth interactions
 */

'use client';

import React, { memo, useState, useCallback } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Calendar, MapPin, Crown, Camera, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Person } from '@/lib/db/schema';

export interface PersonNodeData extends Record<string, unknown> {
  person: Person;
  isRoot?: boolean;
  isSelected?: boolean;
  isHighlighted?: boolean;
  hasPhoto?: boolean;
  locale?: 'ar' | 'en';
  onViewDetails?: (person: Person) => void;
  onAddParent?: (person: Person) => void;
  onAddSpouse?: (person: Person) => void;
  onAddChild?: (person: Person) => void;
}

function FlowPersonNodeComponent({ data, selected }: NodeProps) {
  const { person, isRoot, isSelected, isHighlighted, locale = 'ar', onViewDetails } = data as PersonNodeData;
  const [isHovered, setIsHovered] = useState(false);

  const isMale = person.gender === 'male';
  const isLiving = person.is_living !== false;

  // Get display name
  const displayName = locale === 'ar'
    ? person.full_name_ar || person.given_name
    : person.full_name_en || person.given_name;

  // Format life dates
  const birthYear = person.birth_date ? new Date(person.birth_date).getFullYear() : null;
  const deathYear = person.death_date ? new Date(person.death_date).getFullYear() : null;
  const lifeSpan = birthYear
    ? `${birthYear}${deathYear ? ` - ${deathYear}` : isLiving ? '' : ' - ?'}`
    : '';

  const handleClick = useCallback(() => {
    onViewDetails?.(person);
  }, [onViewDetails, person]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onViewDetails?.(person);
    }
  }, [onViewDetails, person]);

  // Generate accessible label
  const genderLabel = locale === 'ar'
    ? (isMale ? 'ذكر' : 'أنثى')
    : (isMale ? 'male' : 'female');

  const ariaLabel = locale === 'ar'
    ? `${displayName}، ${genderLabel}${lifeSpan ? `، ${lifeSpan}` : ''}${person.birth_place ? `، من ${person.birth_place}` : ''}${isRoot ? '، جذر الشجرة' : ''}`
    : `${displayName}, ${genderLabel}${lifeSpan ? `, born ${lifeSpan}` : ''}${person.birth_place ? `, from ${person.birth_place}` : ''}${isRoot ? ', tree root' : ''}`;

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={ariaLabel}
      aria-selected={selected || isSelected}
      className={cn(
        // Base styles
        'relative group cursor-pointer',
        'w-[220px]',
        'rounded-2xl overflow-visible',
        'transition-all duration-300 ease-out',
        // Focus styles for keyboard navigation
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2',
      )}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Main card */}
      <div className={cn(
        'relative overflow-hidden rounded-2xl',
        'shadow-lg',
        'border-2 transition-all duration-300',
        selected || isSelected
          ? 'border-emerald-400 shadow-emerald-200/50 shadow-xl scale-105'
          : isHighlighted
          ? 'border-amber-400 shadow-amber-200/50 shadow-xl'
          : 'border-white/80 hover:border-white hover:shadow-xl hover:scale-[1.02]',
        'bg-white'
      )}>
        {/* Top gradient bar - gender colored */}
        <div
          className={cn(
            'h-2.5 w-full',
            isMale
              ? 'bg-gradient-to-r from-blue-400 via-blue-500 to-indigo-500'
              : 'bg-gradient-to-r from-pink-400 via-rose-500 to-pink-500'
          )}
        />

        {/* Root badge */}
        {isRoot && (
          <div className="absolute -top-2 -right-2 z-20">
            <div className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-full p-2 shadow-lg ring-2 ring-white">
              <Crown size={14} className="text-white" />
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-4 flex gap-4">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div
              className={cn(
                'w-16 h-16 rounded-xl',
                'flex items-center justify-center',
                'text-white font-bold text-xl',
                'shadow-inner ring-2 ring-white/50',
                isMale
                  ? 'bg-gradient-to-br from-blue-400 to-indigo-600'
                  : 'bg-gradient-to-br from-pink-400 to-rose-600'
              )}
            >
              {person.photo_url ? (
                <img
                  src={person.photo_url}
                  alt={displayName}
                  className="w-full h-full object-cover rounded-xl"
                />
              ) : (
                <span className="drop-shadow-sm">{person.given_name.charAt(0).toUpperCase()}</span>
              )}
            </div>

            {/* Living indicator */}
            {isLiving && (
              <div className="absolute -bottom-1 -right-1">
                <div className="w-4 h-4 bg-emerald-400 rounded-full border-2 border-white shadow-sm">
                  <div className="w-full h-full bg-emerald-400 rounded-full animate-ping opacity-75" />
                </div>
              </div>
            )}

            {/* Has photo indicator */}
            {person.photo_url && (
              <div className="absolute -top-1 -left-1 bg-white rounded-full p-1 shadow-sm">
                <Camera size={10} className="text-gray-400" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 py-0.5">
            {/* Name with gender symbol */}
            <div className="flex items-center gap-1.5">
              <h3 className={cn(
                'font-bold text-gray-900 truncate leading-tight text-base',
                locale === 'ar' && 'font-arabic'
              )}>
                {displayName}
              </h3>
              <span
                className={cn(
                  'text-xs flex-shrink-0',
                  isMale ? 'text-blue-500' : 'text-pink-500'
                )}
                aria-hidden="true"
              >
                {isMale ? '♂' : '♀'}
              </span>
            </div>

            {/* Family name */}
            {person.family_name && (
              <p className="text-sm text-gray-500 truncate mt-0.5">
                {person.family_name}
              </p>
            )}

            {/* Life span */}
            {lifeSpan && (
              <div className="flex items-center gap-1.5 mt-2 text-xs text-gray-400">
                <Calendar size={12} />
                <span>{lifeSpan}</span>
              </div>
            )}

            {/* Location */}
            {person.birth_place && (
              <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-400 truncate">
                <MapPin size={12} className="flex-shrink-0" />
                <span className="truncate">{person.birth_place}</span>
              </div>
            )}
          </div>
        </div>

        {/* Hover overlay with hint */}
        <div className={cn(
          'absolute inset-0 bg-gradient-to-t from-black/5 to-transparent',
          'flex items-end justify-center pb-2',
          'opacity-0 group-hover:opacity-100 transition-opacity duration-200',
          'pointer-events-none'
        )}>
          <span className="text-[10px] text-gray-600 bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded-full shadow-sm">
            {locale === 'ar' ? 'انقر للتفاصيل' : 'Click for details'}
          </span>
        </div>
      </div>

      {/* Connection handles - styled and positioned */}
      {/* Top handle - for parent connections */}
      <Handle
        type="target"
        position={Position.Top}
        className={cn(
          '!w-4 !h-4 !rounded-full !border-2',
          '!bg-white !-top-2',
          isMale ? '!border-blue-400' : '!border-pink-400',
          'transition-transform hover:scale-125',
          '!opacity-0 group-hover:!opacity-100'
        )}
        style={{ opacity: isHovered ? 1 : 0 }}
      />

      {/* Bottom handle - for child connections */}
      <Handle
        type="source"
        position={Position.Bottom}
        className={cn(
          '!w-4 !h-4 !rounded-full !border-2',
          '!bg-white !-bottom-2',
          isMale ? '!border-blue-400' : '!border-pink-400',
          'transition-transform hover:scale-125',
          '!opacity-0 group-hover:!opacity-100'
        )}
        style={{ opacity: isHovered ? 1 : 0 }}
      />

      {/* Spouse handles on sides */}
      <Handle
        type="source"
        position={Position.Right}
        id="spouse-right"
        className={cn(
          '!w-3 !h-3 !rounded-full',
          '!bg-rose-400 !border-2 !border-white',
          'transition-transform hover:scale-125',
          '!opacity-0 group-hover:!opacity-100'
        )}
        style={{ opacity: isHovered ? 1 : 0 }}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="spouse-left"
        className={cn(
          '!w-3 !h-3 !rounded-full',
          '!bg-rose-400 !border-2 !border-white',
          'transition-transform hover:scale-125',
          '!opacity-0 group-hover:!opacity-100'
        )}
        style={{ opacity: isHovered ? 1 : 0 }}
      />
    </div>
  );
}

export const FlowPersonNode = memo(FlowPersonNodeComponent);
export default FlowPersonNode;
