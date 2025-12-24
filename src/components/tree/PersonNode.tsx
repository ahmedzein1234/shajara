/**
 * PersonNode Component
 * Renders an individual person node in the family tree
 */

'use client';

import React, { useState } from 'react';
import { TreeNode } from '@/types/tree';
import { cn, getInitials, generateAvatarColor } from '@/lib/utils';
import { User, Calendar, MapPin } from 'lucide-react';

interface PersonNodeProps {
  node: TreeNode;
  isSelected?: boolean;
  isHighlighted?: boolean;
  locale?: 'ar' | 'en';
  onClick?: (node: TreeNode) => void;
  onDoubleClick?: (node: TreeNode) => void;
  onHover?: (node: TreeNode | null) => void;
  showPhotos?: boolean;
  showDates?: boolean;
  showPatronymic?: boolean;
}

export function PersonNode({
  node,
  isSelected = false,
  isHighlighted = false,
  locale = 'ar',
  onClick,
  onDoubleClick,
  onHover,
  showPhotos = true,
  showDates = true,
  showPatronymic = true,
}: PersonNodeProps) {
  const [isHovered, setIsHovered] = useState(false);
  const { person } = node;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick?.(node);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDoubleClick?.(node);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
    onHover?.(node);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    onHover?.(null);
  };

  // Get display name based on locale
  const displayName = locale === 'ar'
    ? (person.full_name_ar || person.given_name)
    : (person.full_name_en || person.given_name);

  const shortName = showPatronymic ? displayName : person.given_name;

  // Birth/death years
  const birthYear = person.birth_date ? new Date(person.birth_date).getFullYear() : null;
  const deathYear = person.death_date ? new Date(person.death_date).getFullYear() : null;
  const lifespan = birthYear
    ? `${birthYear}${person.is_living ? ' - ' : deathYear ? ` - ${deathYear}` : ''}`
    : '';

  // Gender color
  const genderColor = person.gender === 'male'
    ? 'border-blue-500 bg-blue-50'
    : person.gender === 'female'
    ? 'border-pink-500 bg-pink-50'
    : 'border-gray-500 bg-gray-50';

  const avatarColor = generateAvatarColor(person.id);

  return (
    <g
      transform={`translate(${node.x}, ${node.y})`}
      className="person-node cursor-pointer"
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Node container */}
      <rect
        width="200"
        height="120"
        rx="8"
        className={cn(
          'transition-all duration-200',
          isSelected && 'stroke-[4]',
          isHighlighted && 'stroke-[3]'
        )}
        fill="white"
        stroke={isSelected ? '#3b82f6' : isHighlighted ? '#10b981' : '#e5e7eb'}
        strokeWidth={isSelected ? '4' : isHighlighted ? '3' : '2'}
        filter={isHovered ? 'drop-shadow(0 4px 12px rgba(0,0,0,0.15))' : 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'}
      />

      {/* Gender indicator bar */}
      <rect
        width="200"
        height="4"
        rx="8"
        fill={person.gender === 'male' ? '#3b82f6' : person.gender === 'female' ? '#ec4899' : '#6b7280'}
      />

      {/* Photo or avatar */}
      {showPhotos && (
        <g transform="translate(16, 16)">
          {person.photo_url ? (
            <image
              href={person.photo_url}
              width="60"
              height="60"
              clipPath="circle(30px at 30px 30px)"
              preserveAspectRatio="xMidYMid slice"
            />
          ) : (
            <>
              {/* Avatar circle */}
              <circle cx="30" cy="30" r="30" fill={avatarColor} opacity="0.2" />
              <circle cx="30" cy="30" r="28" fill="none" stroke={avatarColor} strokeWidth="2" />

              {/* Initials */}
              <text
                x="30"
                y="30"
                textAnchor="middle"
                dominantBaseline="central"
                className="select-none"
                style={{
                  fontSize: '20px',
                  fontWeight: 'bold',
                  fill: avatarColor,
                  fontFamily: locale === 'ar' ? 'Noto Sans Arabic' : 'system-ui',
                }}
              >
                {getInitials(person.given_name)}
              </text>
            </>
          )}
        </g>
      )}

      {/* Name */}
      <text
        x={showPhotos ? '92' : '100'}
        y="30"
        textAnchor={showPhotos ? 'start' : 'middle'}
        className="select-none"
        style={{
          fontSize: '14px',
          fontWeight: 'bold',
          fill: '#1f2937',
          fontFamily: locale === 'ar' ? 'Noto Sans Arabic' : 'system-ui',
        }}
      >
        {truncateText(shortName, showPhotos ? 12 : 18)}
      </text>

      {/* Dates */}
      {showDates && lifespan && (
        <g transform={`translate(${showPhotos ? 92 : 100}, 50)`}>
          <text
            x="0"
            y="0"
            textAnchor={showPhotos ? 'start' : 'middle'}
            className="select-none"
            style={{
              fontSize: '11px',
              fill: '#6b7280',
              fontFamily: 'system-ui',
            }}
          >
            {lifespan}
          </text>
        </g>
      )}

      {/* Location indicator if available */}
      {person.birth_place && (
        <g transform={`translate(${showPhotos ? 92 : 100}, ${showDates ? 68 : 50})`}>
          <text
            x="0"
            y="0"
            textAnchor={showPhotos ? 'start' : 'middle'}
            className="select-none"
            style={{
              fontSize: '10px',
              fill: '#9ca3af',
              fontFamily: locale === 'ar' ? 'Noto Sans Arabic' : 'system-ui',
            }}
          >
            {truncateText(person.birth_place, 15)}
          </text>
        </g>
      )}

      {/* Living indicator */}
      {person.is_living && (
        <circle
          cx="190"
          cy="15"
          r="5"
          fill="#10b981"
          className="animate-pulse"
        />
      )}

      {/* Children count indicator */}
      {node.children.length > 0 && (
        <g transform="translate(16, 100)">
          <circle cx="10" cy="10" r="10" fill="#f3f4f6" stroke="#d1d5db" strokeWidth="1" />
          <text
            x="10"
            y="10"
            textAnchor="middle"
            dominantBaseline="central"
            className="select-none"
            style={{
              fontSize: '10px',
              fontWeight: 'bold',
              fill: '#6b7280',
            }}
          >
            {node.children.length}
          </text>
        </g>
      )}

      {/* Hover overlay with more details */}
      {isHovered && <HoverTooltip node={node} locale={locale} />}
    </g>
  );
}

/**
 * Hover tooltip showing more details
 */
function HoverTooltip({ node, locale }: { node: TreeNode; locale: 'ar' | 'en' }) {
  const { person } = node;

  return (
    <g transform="translate(0, -120)" className="hover-tooltip">
      {/* Tooltip background */}
      <rect
        x="0"
        y="0"
        width="200"
        height="110"
        rx="8"
        fill="white"
        stroke="#3b82f6"
        strokeWidth="2"
        filter="drop-shadow(0 4px 16px rgba(0,0,0,0.2))"
      />

      {/* Full name */}
      <text
        x="100"
        y="20"
        textAnchor="middle"
        className="select-none"
        style={{
          fontSize: '12px',
          fontWeight: 'bold',
          fill: '#1f2937',
          fontFamily: locale === 'ar' ? 'Noto Sans Arabic' : 'system-ui',
        }}
      >
        {truncateText(locale === 'ar' ? (person.full_name_ar || person.given_name) : (person.full_name_en || person.given_name), 24)}
      </text>

      {/* Patronymic */}
      {person.patronymic_chain && (
        <text
          x="100"
          y="38"
          textAnchor="middle"
          className="select-none"
          style={{
            fontSize: '10px',
            fill: '#6b7280',
            fontFamily: locale === 'ar' ? 'Noto Sans Arabic' : 'system-ui',
          }}
        >
          {truncateText(person.patronymic_chain, 28)}
        </text>
      )}

      {/* Family name */}
      {person.family_name && (
        <text
          x="100"
          y="52"
          textAnchor="middle"
          className="select-none"
          style={{
            fontSize: '10px',
            fill: '#6b7280',
            fontFamily: locale === 'ar' ? 'Noto Sans Arabic' : 'system-ui',
          }}
        >
          {person.family_name}
        </text>
      )}

      {/* Birth info */}
      {person.birth_date && (
        <text
          x="100"
          y="70"
          textAnchor="middle"
          className="select-none"
          style={{
            fontSize: '10px',
            fill: '#059669',
            fontFamily: 'system-ui',
          }}
        >
          {locale === 'ar' ? 'ولد' : 'Born'}: {new Date(person.birth_date).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US')}
        </text>
      )}

      {/* Death info */}
      {person.death_date && (
        <text
          x="100"
          y="85"
          textAnchor="middle"
          className="select-none"
          style={{
            fontSize: '10px',
            fill: '#dc2626',
            fontFamily: 'system-ui',
          }}
        >
          {locale === 'ar' ? 'توفي' : 'Died'}: {new Date(person.death_date).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US')}
        </text>
      )}

      {/* Triangle pointer */}
      <path
        d="M 95 110 L 100 118 L 105 110 Z"
        fill="white"
        stroke="#3b82f6"
        strokeWidth="2"
      />
    </g>
  );
}

/**
 * Helper to truncate text
 */
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Compact version for zoomed out view
 */
export function CompactPersonNode({ node, isSelected, onClick }: {
  node: TreeNode;
  isSelected?: boolean;
  onClick?: (node: TreeNode) => void;
}) {
  const { person } = node;

  return (
    <g
      transform={`translate(${node.x}, ${node.y})`}
      className="person-node cursor-pointer"
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(node);
      }}
    >
      <circle
        cx="10"
        cy="10"
        r="8"
        fill={person.gender === 'male' ? '#3b82f6' : person.gender === 'female' ? '#ec4899' : '#6b7280'}
        stroke={isSelected ? '#10b981' : '#fff'}
        strokeWidth={isSelected ? '2' : '1'}
        className="transition-all duration-200"
      />
    </g>
  );
}
