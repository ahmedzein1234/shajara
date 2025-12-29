/**
 * FanChart Component
 * A radial/semicircular ancestor chart visualization
 */

'use client';

import React, { memo, useCallback, useState, useMemo } from 'react';
import { Person } from '@/lib/db/schema';
import { TreeNode } from '@/types/tree';
import { getInitials, generateAvatarColor } from '@/lib/utils';

interface FanChartProps {
  nodes: TreeNode[];
  rootPersonId: string;
  locale?: 'ar' | 'en';
  onPersonClick?: (person: Person) => void;
  onPersonDoubleClick?: (person: Person) => void;
  maxGenerations?: number;
  size?: number;
  startAngle?: number;
  endAngle?: number;
}

// Color palette for generations
const GENERATION_COLORS = [
  { bg: '#3b82f6', text: '#ffffff' }, // Gen 0 - Blue (focal person)
  { bg: '#8b5cf6', text: '#ffffff' }, // Gen 1 - Purple (parents)
  { bg: '#ec4899', text: '#ffffff' }, // Gen 2 - Pink (grandparents)
  { bg: '#f97316', text: '#ffffff' }, // Gen 3 - Orange
  { bg: '#eab308', text: '#1f2937' }, // Gen 4 - Yellow
  { bg: '#22c55e', text: '#ffffff' }, // Gen 5 - Green
  { bg: '#06b6d4', text: '#ffffff' }, // Gen 6 - Cyan
];

interface AncestorPosition {
  node: TreeNode;
  generation: number;
  position: number; // Position within generation (0-indexed)
  totalInGeneration: number;
  startAngle: number;
  endAngle: number;
  innerRadius: number;
  outerRadius: number;
  midRadius: number;
  midAngle: number;
}

export const FanChart = memo(function FanChart({
  nodes,
  rootPersonId,
  locale = 'ar',
  onPersonClick,
  onPersonDoubleClick,
  maxGenerations = 5,
  size = 600,
  startAngle = -90,
  endAngle = 90,
}: FanChartProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Find root node
  const rootNode = useMemo(() => {
    return nodes.find(n => n.id === rootPersonId) || nodes[0];
  }, [nodes, rootPersonId]);

  // Build ancestor positions
  const ancestorPositions = useMemo(() => {
    if (!rootNode) return [];

    const positions: AncestorPosition[] = [];
    const centerX = size / 2;
    const centerY = size / 2;
    const maxRadius = (size / 2) - 20;
    const minRadius = 60;
    const ringWidth = (maxRadius - minRadius) / (maxGenerations + 1);

    // Add root at center
    positions.push({
      node: rootNode,
      generation: 0,
      position: 0,
      totalInGeneration: 1,
      startAngle: 0,
      endAngle: 360,
      innerRadius: 0,
      outerRadius: minRadius,
      midRadius: minRadius / 2,
      midAngle: 0,
    });

    // BFS to build generations
    const processGeneration = (currentNodes: TreeNode[], gen: number) => {
      if (gen > maxGenerations) return;

      const parents: TreeNode[] = [];
      currentNodes.forEach(node => {
        // Safety check for undefined parents
        const nodeParents = node.parents || [];
        nodeParents.forEach(parent => {
          if (!parents.some(p => p.id === parent.id)) {
            parents.push(parent);
          }
        });
      });

      if (parents.length === 0) return;

      // Calculate arc for each parent
      const angleRange = endAngle - startAngle;
      const anglePerPerson = angleRange / Math.max(parents.length, Math.pow(2, gen));
      const innerR = minRadius + (gen) * ringWidth;
      const outerR = minRadius + (gen + 1) * ringWidth;

      parents.forEach((parent, idx) => {
        const arcStart = startAngle + idx * anglePerPerson;
        const arcEnd = arcStart + anglePerPerson;

        positions.push({
          node: parent,
          generation: gen,
          position: idx,
          totalInGeneration: parents.length,
          startAngle: arcStart,
          endAngle: arcEnd,
          innerRadius: innerR,
          outerRadius: outerR,
          midRadius: (innerR + outerR) / 2,
          midAngle: (arcStart + arcEnd) / 2,
        });
      });

      processGeneration(parents, gen + 1);
    };

    processGeneration([rootNode], 1);
    return positions;
  }, [rootNode, maxGenerations, size, startAngle, endAngle]);

  const handleClick = useCallback((node: TreeNode) => {
    setSelectedId(node.id);
    onPersonClick?.(node.person);
  }, [onPersonClick]);

  const handleDoubleClick = useCallback((node: TreeNode) => {
    onPersonDoubleClick?.(node.person);
  }, [onPersonDoubleClick]);

  if (!rootNode) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        {locale === 'ar' ? 'لا توجد بيانات' : 'No data available'}
      </div>
    );
  }

  const centerX = size / 2;
  const centerY = size / 2;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="fan-chart"
    >
      <defs>
        {/* Gradient definitions for each generation */}
        {GENERATION_COLORS.map((color, idx) => (
          <linearGradient key={`gen-gradient-${idx}`} id={`gen-gradient-${idx}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={color.bg} stopOpacity="0.9" />
            <stop offset="100%" stopColor={color.bg} stopOpacity="0.7" />
          </linearGradient>
        ))}

        {/* Drop shadow */}
        <filter id="arc-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.15" />
        </filter>
      </defs>

      {/* Background circle */}
      <circle cx={centerX} cy={centerY} r={size / 2 - 10} fill="#f8fafc" />

      {/* Generation rings (background) */}
      {Array.from({ length: maxGenerations + 1 }, (_, i) => {
        const innerR = 60 + i * ((size / 2 - 80) / (maxGenerations + 1));
        return (
          <circle
            key={`ring-${i}`}
            cx={centerX}
            cy={centerY}
            r={innerR}
            fill="none"
            stroke="#e2e8f0"
            strokeWidth="1"
            strokeDasharray="4,4"
          />
        );
      })}

      {/* Render ancestor arcs (excluding root) */}
      {ancestorPositions.filter(p => p.generation > 0).map((pos) => (
        <AncestorArc
          key={pos.node.id}
          position={pos}
          centerX={centerX}
          centerY={centerY}
          locale={locale}
          isHovered={hoveredId === pos.node.id}
          isSelected={selectedId === pos.node.id}
          onHover={() => setHoveredId(pos.node.id)}
          onHoverEnd={() => setHoveredId(null)}
          onClick={() => handleClick(pos.node)}
          onDoubleClick={() => handleDoubleClick(pos.node)}
        />
      ))}

      {/* Root person (center) */}
      <CenterPerson
        node={rootNode}
        centerX={centerX}
        centerY={centerY}
        radius={55}
        locale={locale}
        isSelected={selectedId === rootNode.id}
        onClick={() => handleClick(rootNode)}
        onDoubleClick={() => handleDoubleClick(rootNode)}
      />

      {/* Generation labels */}
      {Array.from({ length: maxGenerations }, (_, i) => {
        const r = 60 + (i + 0.5) * ((size / 2 - 80) / (maxGenerations + 1));
        const labels = locale === 'ar'
          ? ['الوالدين', 'الأجداد', 'أجداد الأجداد', 'الجيل الرابع', 'الجيل الخامس']
          : ['Parents', 'Grandparents', 'Great-grandparents', 'G-G-Grandparents', 'G-G-G-Grandparents'];

        return (
          <text
            key={`label-${i}`}
            x={centerX}
            y={centerY - r}
            textAnchor="middle"
            fontSize="9"
            fill="#94a3b8"
            className="select-none pointer-events-none"
          >
            {labels[i] || `Gen ${i + 1}`}
          </text>
        );
      })}
    </svg>
  );
});

/**
 * Individual ancestor arc segment
 */
const AncestorArc = memo(function AncestorArc({
  position,
  centerX,
  centerY,
  locale,
  isHovered,
  isSelected,
  onHover,
  onHoverEnd,
  onClick,
  onDoubleClick,
}: {
  position: AncestorPosition;
  centerX: number;
  centerY: number;
  locale: 'ar' | 'en';
  isHovered: boolean;
  isSelected: boolean;
  onHover: () => void;
  onHoverEnd: () => void;
  onClick: () => void;
  onDoubleClick: () => void;
}) {
  const { node, generation, startAngle, endAngle, innerRadius, outerRadius, midRadius, midAngle } = position;
  const { person } = node;

  // Convert angles to radians
  const startRad = (startAngle * Math.PI) / 180;
  const endRad = (endAngle * Math.PI) / 180;
  const midRad = (midAngle * Math.PI) / 180;

  // Calculate arc path
  const x1 = centerX + innerRadius * Math.cos(startRad);
  const y1 = centerY + innerRadius * Math.sin(startRad);
  const x2 = centerX + outerRadius * Math.cos(startRad);
  const y2 = centerY + outerRadius * Math.sin(startRad);
  const x3 = centerX + outerRadius * Math.cos(endRad);
  const y3 = centerY + outerRadius * Math.sin(endRad);
  const x4 = centerX + innerRadius * Math.cos(endRad);
  const y4 = centerY + innerRadius * Math.sin(endRad);

  const largeArc = endAngle - startAngle > 180 ? 1 : 0;

  const arcPath = `
    M ${x1} ${y1}
    L ${x2} ${y2}
    A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${x3} ${y3}
    L ${x4} ${y4}
    A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x1} ${y1}
    Z
  `;

  // Text position
  const textX = centerX + midRadius * Math.cos(midRad);
  const textY = centerY + midRadius * Math.sin(midRad);

  // Text rotation to follow arc
  let textRotation = midAngle + 90;
  if (textRotation > 90 && textRotation < 270) {
    textRotation += 180;
  }

  const color = GENERATION_COLORS[Math.min(generation, GENERATION_COLORS.length - 1)];
  const arcWidth = endAngle - startAngle;
  const showText = arcWidth > 15;
  const showFullName = arcWidth > 30;

  const displayName = locale === 'ar'
    ? (person.full_name_ar || person.given_name)
    : (person.full_name_en || person.given_name);

  return (
    <g
      className="ancestor-arc cursor-pointer"
      onMouseEnter={onHover}
      onMouseLeave={onHoverEnd}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
    >
      {/* Arc segment */}
      <path
        d={arcPath}
        fill={`url(#gen-gradient-${Math.min(generation, GENERATION_COLORS.length - 1)})`}
        stroke={isSelected ? '#1d4ed8' : isHovered ? '#3b82f6' : 'white'}
        strokeWidth={isSelected ? 3 : isHovered ? 2 : 1}
        filter={isHovered ? 'url(#arc-shadow)' : undefined}
        style={{
          transform: isHovered ? 'scale(1.02)' : 'scale(1)',
          transformOrigin: `${centerX}px ${centerY}px`,
          transition: 'all 0.2s ease',
        }}
      />

      {/* Gender indicator line */}
      <path
        d={`
          M ${x1} ${y1}
          A ${innerRadius} ${innerRadius} 0 ${largeArc} 1 ${x4} ${y4}
        `}
        fill="none"
        stroke={person.gender === 'male' ? '#3b82f6' : person.gender === 'female' ? '#ec4899' : '#6b7280'}
        strokeWidth="3"
      />

      {/* Name text */}
      {showText && (
        <text
          x={textX}
          y={textY}
          textAnchor="middle"
          dominantBaseline="central"
          transform={`rotate(${textRotation}, ${textX}, ${textY})`}
          fontSize={showFullName ? 11 : 9}
          fontWeight="500"
          fill={color.text}
          className="select-none pointer-events-none"
          style={{
            fontFamily: locale === 'ar' ? 'Noto Sans Arabic' : 'system-ui',
          }}
        >
          {showFullName ? displayName.slice(0, 15) : getInitials(person.given_name)}
        </text>
      )}

      {/* Birth year */}
      {showFullName && person.birth_date && (
        <text
          x={textX}
          y={textY + 14}
          textAnchor="middle"
          dominantBaseline="central"
          transform={`rotate(${textRotation}, ${textX}, ${textY + 14})`}
          fontSize="8"
          fill={color.text}
          opacity="0.8"
          className="select-none pointer-events-none"
        >
          {new Date(person.birth_date).getFullYear()}
        </text>
      )}
    </g>
  );
});

/**
 * Center person (focal point of the fan chart)
 */
const CenterPerson = memo(function CenterPerson({
  node,
  centerX,
  centerY,
  radius,
  locale,
  isSelected,
  onClick,
  onDoubleClick,
}: {
  node: TreeNode;
  centerX: number;
  centerY: number;
  radius: number;
  locale: 'ar' | 'en';
  isSelected: boolean;
  onClick: () => void;
  onDoubleClick: () => void;
}) {
  const { person } = node;
  const avatarColor = generateAvatarColor(person.id);

  const displayName = locale === 'ar'
    ? (person.full_name_ar || person.given_name)
    : (person.full_name_en || person.given_name);

  const birthYear = person.birth_date ? new Date(person.birth_date).getFullYear() : null;

  return (
    <g
      className="center-person cursor-pointer"
      onClick={onClick}
      onDoubleClick={onDoubleClick}
    >
      {/* Outer ring */}
      <circle
        cx={centerX}
        cy={centerY}
        r={radius + 5}
        fill="none"
        stroke={isSelected ? '#3b82f6' : '#e2e8f0'}
        strokeWidth={isSelected ? 3 : 2}
      />

      {/* Main circle */}
      <circle
        cx={centerX}
        cy={centerY}
        r={radius}
        fill="url(#gen-gradient-0)"
        filter="url(#arc-shadow)"
      />

      {/* Photo or initials */}
      {person.photo_url ? (
        <>
          <clipPath id="center-photo-clip">
            <circle cx={centerX} cy={centerY} r={radius - 5} />
          </clipPath>
          <image
            href={person.photo_url}
            x={centerX - radius + 5}
            y={centerY - radius + 5}
            width={(radius - 5) * 2}
            height={(radius - 5) * 2}
            clipPath="url(#center-photo-clip)"
            preserveAspectRatio="xMidYMid slice"
          />
        </>
      ) : (
        <text
          x={centerX}
          y={centerY - 5}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize="24"
          fontWeight="bold"
          fill="white"
          className="select-none pointer-events-none"
          style={{
            fontFamily: locale === 'ar' ? 'Noto Sans Arabic' : 'system-ui',
          }}
        >
          {getInitials(person.given_name)}
        </text>
      )}

      {/* Name below initials */}
      <text
        x={centerX}
        y={centerY + 20}
        textAnchor="middle"
        fontSize="10"
        fontWeight="500"
        fill="white"
        className="select-none pointer-events-none"
        style={{
          fontFamily: locale === 'ar' ? 'Noto Sans Arabic' : 'system-ui',
        }}
      >
        {displayName.slice(0, 12)}
      </text>

      {/* Birth year */}
      {birthYear && (
        <text
          x={centerX}
          y={centerY + 32}
          textAnchor="middle"
          fontSize="8"
          fill="white"
          opacity="0.8"
          className="select-none pointer-events-none"
        >
          {birthYear}
        </text>
      )}
    </g>
  );
});

export default FanChart;
