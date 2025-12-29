/**
 * PersonNode Component
 * Modern, polished family tree person cards with gradients, badges, and hover effects
 */

'use client';

import React, { useState, useCallback, memo } from 'react';
import { TreeNode } from '@/types/tree';
import { cn, getInitials, generateAvatarColor } from '@/lib/utils';

// Constants for card dimensions
const CARD_WIDTH = 220;
const CARD_HEIGHT = 140;

interface PersonNodeProps {
  node: TreeNode;
  isSelected?: boolean;
  isHighlighted?: boolean;
  locale?: 'ar' | 'en';
  onClick?: (node: TreeNode) => void;
  onDoubleClick?: (node: TreeNode) => void;
  onHover?: (node: TreeNode | null) => void;
  onContextMenu?: (node: TreeNode, event: React.MouseEvent) => void;
  showPhotos?: boolean;
  showDates?: boolean;
  showPatronymic?: boolean;
  branchColor?: string; // Color coding by family branch
}

// Memoized PersonNode for performance
export const PersonNode = memo(function PersonNode({
  node,
  isSelected = false,
  isHighlighted = false,
  locale = 'ar',
  onClick,
  onDoubleClick,
  onHover,
  onContextMenu,
  showPhotos = true,
  showDates = true,
  showPatronymic = true,
  branchColor,
}: PersonNodeProps) {
  const [isHovered, setIsHovered] = useState(false);
  const { person } = node;

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onClick?.(node);
  }, [onClick, node]);

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onDoubleClick?.(node);
  }, [onDoubleClick, node]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onContextMenu?.(node, e);
  }, [onContextMenu, node]);

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
    onHover?.(node);
  }, [onHover, node]);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    onHover?.(null);
  }, [onHover]);

  // Get display name based on locale
  const displayName = locale === 'ar'
    ? (person.full_name_ar || person.given_name)
    : (person.full_name_en || person.given_name);

  const shortName = showPatronymic ? displayName : person.given_name;
  const familyName = person.family_name || '';

  // Birth/death years
  const birthYear = person.birth_date ? new Date(person.birth_date).getFullYear() : null;
  const deathYear = person.death_date ? new Date(person.death_date).getFullYear() : null;
  const lifespan = birthYear
    ? `${birthYear}${person.is_living ? ' - ' : deathYear ? ` - ${deathYear}` : ''}`
    : '';

  // Gender-based gradients - warm heritage colors
  const genderGradientId = `gradient-${person.gender}-${node.id}`;
  const genderColors = {
    male: { start: '#2B5B84', end: '#1A3A4A', light: '#EBF4FF', card: '#FAFBFD' },
    female: { start: '#B85C6C', end: '#8B4555', light: '#FDF2F4', card: '#FDFAFB' },
    unknown: { start: '#8C7A60', end: '#5C4A3A', light: '#F5F0E8', card: '#FAF8F5' },
  };
  const colors = genderColors[person.gender as keyof typeof genderColors] || genderColors.unknown;

  // Deceased styling - sepia tint
  const isDeceased = !person.is_living;
  const cardBackground = isDeceased ? '#F9F6F2' : colors.card;

  const avatarColor = generateAvatarColor(person.id);

  // Calculate age if living
  const currentAge = person.is_living && birthYear
    ? new Date().getFullYear() - birthYear
    : null;

  // Determine border color (branch color takes precedence) - gold for selected
  const borderColor = branchColor || (isSelected ? '#D4AF37' : isHighlighted ? '#1B7F7E' : colors.start);

  // Shadow based on state - warm tones
  const shadowColor = isSelected ? 'rgba(212, 175, 55, 0.3)' : isDeceased ? 'rgba(140, 122, 96, 0.15)' : 'rgba(0, 0, 0, 0.1)';

  return (
    <g
      transform={`translate(${node.x}, ${node.y})`}
      className="person-node cursor-pointer"
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onContextMenu={handleContextMenu}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{ transition: 'transform 0.2s ease' }}
    >
      {/* Definitions for gradients and filters */}
      <defs>
        <linearGradient id={genderGradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={colors.start} />
          <stop offset="100%" stopColor={colors.end} />
        </linearGradient>
        <filter id={`shadow-${node.id}`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy={isHovered ? "8" : "4"} stdDeviation={isHovered ? "8" : "4"} floodColor={shadowColor} floodOpacity={isHovered ? "0.25" : "0.15"} />
        </filter>
        <filter id="gold-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feFlood floodColor="#D4AF37" floodOpacity="0.3" />
          <feComposite in2="blur" operator="in" />
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <clipPath id={`photo-clip-${node.id}`}>
          <circle cx="36" cy="36" r="32" />
        </clipPath>
      </defs>

      {/* Card shadow and background - warm cream */}
      <rect
        width={CARD_WIDTH}
        height={CARD_HEIGHT}
        rx="12"
        fill={cardBackground}
        filter={`url(#shadow-${node.id})`}
        style={{
          transform: isHovered ? 'scale(1.02)' : 'scale(1)',
          transformOrigin: `${CARD_WIDTH / 2}px ${CARD_HEIGHT / 2}px`,
          transition: 'all 0.2s ease'
        }}
      />

      {/* Main card - warm background */}
      <rect
        width={CARD_WIDTH}
        height={CARD_HEIGHT}
        rx="12"
        fill={cardBackground}
        stroke={borderColor}
        strokeWidth={isSelected ? '3' : isHighlighted ? '2.5' : '1.5'}
        style={{
          transition: 'stroke 0.2s ease, stroke-width 0.2s ease'
        }}
      />

      {/* Gold glow for selected - warm accent */}
      {isSelected && (
        <rect
          x="-3"
          y="-3"
          width={CARD_WIDTH + 6}
          height={CARD_HEIGHT + 6}
          rx="15"
          fill="none"
          stroke="#D4AF37"
          strokeWidth="1"
          opacity="0.4"
          filter="url(#gold-glow)"
        />
      )}

      {/* Memorial border for deceased - gold accent */}
      {isDeceased && (
        <rect
          x="2"
          y="2"
          width={CARD_WIDTH - 4}
          height={CARD_HEIGHT - 4}
          rx="10"
          fill="none"
          stroke="#D4AF37"
          strokeWidth="1"
          strokeDasharray="4 2"
          opacity="0.4"
        />
      )}

      {/* Gradient header */}
      <rect
        width={CARD_WIDTH}
        height="8"
        rx="12"
        fill={`url(#${genderGradientId})`}
      />
      <rect
        x="0"
        y="6"
        width={CARD_WIDTH}
        height="2"
        fill={`url(#${genderGradientId})`}
      />

      {/* Left color accent bar for branch */}
      {branchColor && (
        <rect
          x="0"
          y="8"
          width="4"
          height={CARD_HEIGHT - 20}
          rx="0"
          fill={branchColor}
        />
      )}

      {/* Photo or avatar - larger circular frame */}
      {showPhotos && (
        <g transform="translate(12, 20)">
          {person.photo_url ? (
            <>
              {/* Photo ring */}
              <circle cx="36" cy="36" r="35" fill="none" stroke={colors.light} strokeWidth="3" />
              <circle cx="36" cy="36" r="32" fill={colors.light} />
              <image
                href={person.photo_url}
                x="4"
                y="4"
                width="64"
                height="64"
                clipPath={`url(#photo-clip-${node.id})`}
                preserveAspectRatio="xMidYMid slice"
              />
              {/* Online-style ring for living members - heritage turquoise */}
              {person.is_living && (
                <circle
                  cx="36"
                  cy="36"
                  r="36"
                  fill="none"
                  stroke="#1B7F7E"
                  strokeWidth="3"
                  strokeDasharray="8 4"
                  className="animate-spin"
                  style={{ animationDuration: '20s' }}
                />
              )}
            </>
          ) : (
            <>
              {/* Avatar background */}
              <circle cx="36" cy="36" r="35" fill={colors.light} />
              <circle cx="36" cy="36" r="32" fill={avatarColor} opacity="0.15" />
              <circle cx="36" cy="36" r="32" fill="none" stroke={avatarColor} strokeWidth="2" />

              {/* Initials */}
              <text
                x="36"
                y="36"
                textAnchor="middle"
                dominantBaseline="central"
                className="select-none"
                style={{
                  fontSize: '22px',
                  fontWeight: 'bold',
                  fill: avatarColor,
                  fontFamily: locale === 'ar' ? 'Noto Sans Arabic' : 'system-ui',
                }}
              >
                {getInitials(person.given_name)}
              </text>

              {/* Living indicator ring - heritage turquoise */}
              {person.is_living && (
                <circle
                  cx="36"
                  cy="36"
                  r="36"
                  fill="none"
                  stroke="#1B7F7E"
                  strokeWidth="2"
                  strokeDasharray="6 4"
                  opacity="0.6"
                />
              )}
            </>
          )}
        </g>
      )}

      {/* Name section */}
      <g transform={showPhotos ? 'translate(96, 24)' : 'translate(110, 24)'}>
        {/* Given name - larger and bold */}
        <text
          x="0"
          y="0"
          textAnchor={showPhotos ? 'start' : 'middle'}
          className="select-none"
          style={{
            fontSize: '15px',
            fontWeight: '700',
            fill: '#1f2937',
            fontFamily: locale === 'ar' ? 'Noto Sans Arabic' : 'system-ui',
          }}
        >
          {truncateText(shortName, showPhotos ? 13 : 20)}
        </text>

        {/* Family name - smaller, muted */}
        {familyName && (
          <text
            x="0"
            y="18"
            textAnchor={showPhotos ? 'start' : 'middle'}
            className="select-none"
            style={{
              fontSize: '11px',
              fontWeight: '500',
              fill: '#6b7280',
              fontFamily: locale === 'ar' ? 'Noto Sans Arabic' : 'system-ui',
            }}
          >
            {truncateText(familyName, 15)}
          </text>
        )}

        {/* Dates with elegant styling */}
        {showDates && lifespan && (
          <text
            x="0"
            y={familyName ? '38' : '22'}
            textAnchor={showPhotos ? 'start' : 'middle'}
            className="select-none"
            style={{
              fontSize: '11px',
              fill: '#9ca3af',
              fontFamily: 'system-ui',
              letterSpacing: '0.5px',
            }}
          >
            {lifespan}
          </text>
        )}

        {/* Location with icon-like indicator */}
        {person.birth_place && (
          <g transform={`translate(0, ${familyName ? (showDates ? 54 : 38) : (showDates ? 40 : 22)})`}>
            <circle cx="3" cy="-3" r="2" fill="#9ca3af" />
            <text
              x="8"
              y="0"
              textAnchor="start"
              className="select-none"
              style={{
                fontSize: '10px',
                fill: '#9ca3af',
                fontFamily: locale === 'ar' ? 'Noto Sans Arabic' : 'system-ui',
              }}
            >
              {truncateText(person.birth_place, 12)}
            </text>
          </g>
        )}
      </g>

      {/* Status badges row */}
      <g transform={`translate(${CARD_WIDTH - 12}, 16)`}>
        {/* Living indicator badge - heritage turquoise */}
        {person.is_living && (
          <g transform="translate(-20, 0)">
            <rect x="-16" y="-4" width="32" height="16" rx="8" fill="#E0F5F4" />
            <circle cx="-8" cy="4" r="4" fill="#1B7F7E">
              <animate attributeName="opacity" values="1;0.5;1" dur="2s" repeatCount="indefinite" />
            </circle>
            <text x="4" y="8" fontSize="8" fill="#0F5E5E" fontWeight="600">
              {locale === 'ar' ? 'حي' : 'Live'}
            </text>
          </g>
        )}

        {/* Photo badge if has photo */}
        {person.photo_url && (
          <g transform={`translate(${person.is_living ? -56 : -20}, 0)`}>
            <rect x="-8" y="-4" width="16" height="16" rx="8" fill="#dbeafe" />
            <circle cx="0" cy="4" r="3" fill="#3b82f6" />
          </g>
        )}
      </g>

      {/* Generation level badge */}
      <g transform={`translate(12, ${CARD_HEIGHT - 24})`}>
        <rect x="0" y="0" width="24" height="18" rx="4" fill="#f1f5f9" stroke="#e2e8f0" strokeWidth="1" />
        <text
          x="12"
          y="13"
          textAnchor="middle"
          className="select-none"
          style={{
            fontSize: '10px',
            fontWeight: '600',
            fill: '#64748b',
          }}
        >
          G{Math.abs(node.level)}
        </text>
      </g>

      {/* Children count badge */}
      {node.children.length > 0 && (
        <g transform={`translate(42, ${CARD_HEIGHT - 24})`}>
          <rect x="0" y="0" width="28" height="18" rx="4" fill="#fef3c7" stroke="#fcd34d" strokeWidth="1" />
          <text
            x="14"
            y="13"
            textAnchor="middle"
            className="select-none"
            style={{
              fontSize: '10px',
              fontWeight: '600',
              fill: '#92400e',
            }}
          >
            +{node.children.length}
          </text>
        </g>
      )}

      {/* Spouse count badge */}
      {node.spouses.length > 0 && (
        <g transform={`translate(${node.children.length > 0 ? 76 : 42}, ${CARD_HEIGHT - 24})`}>
          <rect x="0" y="0" width="22" height="18" rx="4" fill="#fce7f3" stroke="#f9a8d4" strokeWidth="1" />
          <text
            x="11"
            y="13"
            textAnchor="middle"
            className="select-none"
            style={{
              fontSize: '10px',
              fontWeight: '600',
              fill: '#9d174d',
            }}
          >
            {node.spouses.length > 1 ? `${node.spouses.length}` : ''}
          </text>
        </g>
      )}

      {/* Current age badge (for living) */}
      {currentAge && (
        <g transform={`translate(${CARD_WIDTH - 40}, ${CARD_HEIGHT - 24})`}>
          <rect x="0" y="0" width="28" height="18" rx="4" fill="#e0e7ff" stroke="#a5b4fc" strokeWidth="1" />
          <text
            x="14"
            y="13"
            textAnchor="middle"
            className="select-none"
            style={{
              fontSize: '10px',
              fontWeight: '600',
              fill: '#4338ca',
            }}
          >
            {currentAge}
          </text>
        </g>
      )}

      {/* Quick action buttons on hover - warm heritage colors */}
      {isHovered && (
        <g transform={`translate(${CARD_WIDTH - 8}, 40)`} className="quick-actions">
          {/* Edit button - heritage blue */}
          <g transform="translate(0, 0)" className="cursor-pointer" opacity="0.9">
            <circle cx="0" cy="0" r="14" fill="#FAF8F5" stroke="#D4C4A8" strokeWidth="1" />
            <path d="M-5,-5 L5,5 M-3,-5 L5,3" stroke="#5C4A3A" strokeWidth="1.5" strokeLinecap="round" />
          </g>

          {/* Add child button - heritage turquoise */}
          <g transform="translate(0, 34)" className="cursor-pointer" opacity="0.9">
            <circle cx="0" cy="0" r="14" fill="#FAF8F5" stroke="#1B7F7E" strokeWidth="1" />
            <path d="M-5,0 L5,0 M0,-5 L0,5" stroke="#1B7F7E" strokeWidth="2" strokeLinecap="round" />
          </g>

          {/* View profile button - heritage navy */}
          <g transform="translate(0, 68)" className="cursor-pointer" opacity="0.9">
            <circle cx="0" cy="0" r="14" fill="#FAF8F5" stroke="#1A3A4A" strokeWidth="1" />
            <circle cx="0" cy="0" r="4" fill="none" stroke="#2B5B84" strokeWidth="1.5" />
            <circle cx="0" cy="0" r="1.5" fill="#2B5B84" />
          </g>
        </g>
      )}

      {/* Selection glow effect - golden warmth */}
      {isSelected && (
        <rect
          x="-4"
          y="-4"
          width={CARD_WIDTH + 8}
          height={CARD_HEIGHT + 8}
          rx="16"
          fill="none"
          stroke="#D4AF37"
          strokeWidth="2"
          strokeDasharray="4 2"
          opacity="0.6"
        >
          <animate attributeName="stroke-dashoffset" values="0;6" dur="0.5s" repeatCount="indefinite" />
        </rect>
      )}

      {/* Highlight glow effect - heritage turquoise */}
      {isHighlighted && !isSelected && (
        <rect
          x="-2"
          y="-2"
          width={CARD_WIDTH + 4}
          height={CARD_HEIGHT + 4}
          rx="14"
          fill="none"
          stroke="#1B7F7E"
          strokeWidth="2"
          opacity="0.6"
        />
      )}

      {/* Hover tooltip with more details */}
      {isHovered && <HoverTooltip node={node} locale={locale} />}
    </g>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for memo - only re-render if these change
  return (
    prevProps.node.id === nextProps.node.id &&
    prevProps.node.x === nextProps.node.x &&
    prevProps.node.y === nextProps.node.y &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isHighlighted === nextProps.isHighlighted &&
    prevProps.locale === nextProps.locale &&
    prevProps.showPhotos === nextProps.showPhotos &&
    prevProps.showDates === nextProps.showDates &&
    prevProps.branchColor === nextProps.branchColor
  );
});

/**
 * Enhanced Hover tooltip with glassmorphism effect
 */
function HoverTooltip({ node, locale }: { node: TreeNode; locale: 'ar' | 'en' }) {
  const { person } = node;

  const birthDate = person.birth_date ? new Date(person.birth_date) : null;
  const deathDate = person.death_date ? new Date(person.death_date) : null;

  // Calculate age at death or current age
  let ageDisplay = '';
  if (birthDate) {
    if (person.is_living) {
      const age = new Date().getFullYear() - birthDate.getFullYear();
      ageDisplay = locale === 'ar' ? `${age} سنة` : `${age} years old`;
    } else if (deathDate) {
      const ageAtDeath = deathDate.getFullYear() - birthDate.getFullYear();
      ageDisplay = locale === 'ar' ? `توفي عن ${ageAtDeath} سنة` : `Died at ${ageAtDeath}`;
    }
  }

  return (
    <g transform={`translate(0, -${CARD_HEIGHT + 20})`} className="hover-tooltip">
      {/* Glassmorphism background */}
      <defs>
        <filter id="tooltip-blur">
          <feGaussianBlur stdDeviation="2" />
        </filter>
      </defs>

      {/* Backdrop */}
      <rect
        x="-10"
        y="-5"
        width={CARD_WIDTH + 20}
        height="130"
        rx="12"
        fill="rgba(255,255,255,0.95)"
        stroke="rgba(59, 130, 246, 0.3)"
        strokeWidth="1"
        filter="drop-shadow(0 8px 24px rgba(0,0,0,0.15))"
      />

      {/* Accent line */}
      <rect
        x="-10"
        y="-5"
        width={CARD_WIDTH + 20}
        height="4"
        rx="12"
        fill={person.gender === 'male' ? '#3b82f6' : person.gender === 'female' ? '#ec4899' : '#6b7280'}
      />

      {/* Full name */}
      <text
        x={CARD_WIDTH / 2}
        y="20"
        textAnchor="middle"
        className="select-none"
        style={{
          fontSize: '14px',
          fontWeight: '700',
          fill: '#1f2937',
          fontFamily: locale === 'ar' ? 'Noto Sans Arabic' : 'system-ui',
        }}
      >
        {truncateText(locale === 'ar' ? (person.full_name_ar || person.given_name) : (person.full_name_en || person.given_name), 28)}
      </text>

      {/* Patronymic */}
      {person.patronymic_chain && (
        <text
          x={CARD_WIDTH / 2}
          y="38"
          textAnchor="middle"
          className="select-none"
          style={{
            fontSize: '11px',
            fill: '#6b7280',
            fontFamily: locale === 'ar' ? 'Noto Sans Arabic' : 'system-ui',
          }}
        >
          {truncateText(person.patronymic_chain, 32)}
        </text>
      )}

      {/* Family name badge */}
      {person.family_name && (
        <g transform={`translate(${CARD_WIDTH / 2 - 40}, 48)`}>
          <rect x="0" y="0" width="80" height="20" rx="10" fill="#f1f5f9" />
          <text
            x="40"
            y="14"
            textAnchor="middle"
            className="select-none"
            style={{
              fontSize: '10px',
              fontWeight: '600',
              fill: '#475569',
              fontFamily: locale === 'ar' ? 'Noto Sans Arabic' : 'system-ui',
            }}
          >
            {truncateText(person.family_name, 12)}
          </text>
        </g>
      )}

      {/* Birth and death info with icons */}
      <g transform={`translate(10, ${person.family_name ? 78 : 58})`}>
        {birthDate && (
          <g>
            <circle cx="6" cy="6" r="6" fill="#dcfce7" />
            <text x="6" y="10" textAnchor="middle" fontSize="8" fill="#16a34a">+</text>
            <text
              x="18"
              y="10"
              className="select-none"
              style={{
                fontSize: '10px',
                fill: '#059669',
                fontFamily: 'system-ui',
              }}
            >
              {birthDate.toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
            </text>
          </g>
        )}

        {deathDate && (
          <g transform="translate(0, 18)">
            <circle cx="6" cy="6" r="6" fill="#fee2e2" />
            <text x="6" y="9" textAnchor="middle" fontSize="10" fill="#dc2626">-</text>
            <text
              x="18"
              y="10"
              className="select-none"
              style={{
                fontSize: '10px',
                fill: '#dc2626',
                fontFamily: 'system-ui',
              }}
            >
              {deathDate.toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
            </text>
          </g>
        )}
      </g>

      {/* Age display */}
      {ageDisplay && (
        <text
          x={CARD_WIDTH - 10}
          y={person.family_name ? 88 : 68}
          textAnchor="end"
          className="select-none"
          style={{
            fontSize: '10px',
            fontWeight: '600',
            fill: person.is_living ? '#059669' : '#6b7280',
            fontFamily: 'system-ui',
          }}
        >
          {ageDisplay}
        </text>
      )}

      {/* Location if available */}
      {person.birth_place && (
        <g transform={`translate(10, ${person.family_name ? (person.death_date ? 112 : 96) : (person.death_date ? 92 : 78)})`}>
          <circle cx="4" cy="4" r="4" fill="#dbeafe" />
          <text
            x="12"
            y="8"
            className="select-none"
            style={{
              fontSize: '9px',
              fill: '#3b82f6',
              fontFamily: locale === 'ar' ? 'Noto Sans Arabic' : 'system-ui',
            }}
          >
            {truncateText(person.birth_place, 25)}
          </text>
        </g>
      )}

      {/* Triangle pointer */}
      <path
        d={`M ${CARD_WIDTH / 2 - 8} 125 L ${CARD_WIDTH / 2} 135 L ${CARD_WIDTH / 2 + 8} 125 Z`}
        fill="rgba(255,255,255,0.95)"
        stroke="rgba(59, 130, 246, 0.3)"
        strokeWidth="1"
      />
    </g>
  );
}

/**
 * Helper to truncate text
 */
function truncateText(text: string, maxLength: number): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Compact version for zoomed out view - enhanced with better visibility
 */
export const CompactPersonNode = memo(function CompactPersonNode({
  node,
  isSelected,
  isHighlighted,
  onClick
}: {
  node: TreeNode;
  isSelected?: boolean;
  isHighlighted?: boolean;
  onClick?: (node: TreeNode) => void;
}) {
  const { person } = node;

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onClick?.(node);
  }, [onClick, node]);

  // Gender colors - warm heritage palette
  const colors = {
    male: { fill: '#2B5B84', light: '#EBF4FF' },
    female: { fill: '#B85C6C', light: '#FDF2F4' },
    unknown: { fill: '#8C7A60', light: '#F5F0E8' },
  };
  const color = colors[person.gender as keyof typeof colors] || colors.unknown;
  const isDeceased = !person.is_living;

  return (
    <g
      transform={`translate(${node.x}, ${node.y})`}
      className="person-node cursor-pointer"
      onClick={handleClick}
    >
      {/* Outer ring for selected/highlighted - gold for selected */}
      {(isSelected || isHighlighted) && (
        <circle
          cx="12"
          cy="12"
          r="14"
          fill="none"
          stroke={isSelected ? '#D4AF37' : '#1B7F7E'}
          strokeWidth="2"
        />
      )}

      {/* Main circle with warm tones */}
      <circle
        cx="12"
        cy="12"
        r="10"
        fill={isDeceased ? '#F5F0E8' : color.light}
        stroke={isDeceased ? '#D4AF37' : color.fill}
        strokeWidth="2"
        strokeDasharray={isDeceased ? "2 1" : "none"}
        className="transition-all duration-200"
      />

      {/* Inner circle */}
      <circle
        cx="12"
        cy="12"
        r="6"
        fill={isDeceased ? '#B8A88C' : color.fill}
        opacity={isDeceased ? 0.7 : 1}
      />

      {/* Living indicator - heritage turquoise */}
      {person.is_living && (
        <circle
          cx="18"
          cy="6"
          r="4"
          fill="#1B7F7E"
          stroke="#FAF8F5"
          strokeWidth="1"
        >
          <animate attributeName="opacity" values="1;0.5;1" dur="2s" repeatCount="indefinite" />
        </circle>
      )}
    </g>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.node.id === nextProps.node.id &&
    prevProps.node.x === nextProps.node.x &&
    prevProps.node.y === nextProps.node.y &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isHighlighted === nextProps.isHighlighted
  );
});

// Export constants for use in layout calculations
export { CARD_WIDTH, CARD_HEIGHT };
