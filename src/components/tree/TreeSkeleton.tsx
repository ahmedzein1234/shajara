/**
 * TreeSkeleton Component
 * Loading skeleton for family tree visualization
 * Shows animated placeholder nodes while data is loading
 */

'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface TreeSkeletonProps {
  locale?: 'ar' | 'en';
  variant?: 'full' | 'compact' | 'minimal';
  className?: string;
}

interface SkeletonNodeProps {
  x: number;
  y: number;
  delay?: number;
  compact?: boolean;
}

// Individual skeleton node
function SkeletonNode({ x, y, delay = 0, compact = false }: SkeletonNodeProps) {
  const width = compact ? 160 : 220;
  const height = compact ? 100 : 140;

  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Card background */}
      <rect
        x="0"
        y="0"
        width={width}
        height={height}
        rx="16"
        className="fill-gray-100 animate-pulse"
        style={{ animationDelay: `${delay}ms` }}
      />

      {/* Header gradient placeholder */}
      <rect
        x="0"
        y="0"
        width={width}
        height={compact ? 28 : 36}
        rx="16"
        clipPath="url(#headerClip)"
        className="fill-gray-200 animate-pulse"
        style={{ animationDelay: `${delay + 100}ms` }}
      />

      {/* Photo placeholder */}
      <circle
        cx={width / 2}
        cy={compact ? 50 : 65}
        r={compact ? 20 : 28}
        className="fill-gray-200 animate-pulse"
        style={{ animationDelay: `${delay + 200}ms` }}
      />

      {/* Name placeholder */}
      <rect
        x={(width - (compact ? 80 : 120)) / 2}
        y={compact ? 78 : 100}
        width={compact ? 80 : 120}
        height={compact ? 10 : 14}
        rx="4"
        className="fill-gray-200 animate-pulse"
        style={{ animationDelay: `${delay + 300}ms` }}
      />

      {/* Date placeholder */}
      {!compact && (
        <rect
          x={(width - 80) / 2}
          y="120"
          width="80"
          height="10"
          rx="4"
          className="fill-gray-200 animate-pulse"
          style={{ animationDelay: `${delay + 400}ms` }}
        />
      )}
    </g>
  );
}

// Skeleton connection line
function SkeletonLine({ x1, y1, x2, y2, delay = 0 }: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  delay?: number;
}) {
  const midY = (y1 + y2) / 2;

  return (
    <path
      d={`M ${x1} ${y1} L ${x1} ${midY} L ${x2} ${midY} L ${x2} ${y2}`}
      fill="none"
      strokeWidth="2"
      className="stroke-gray-200 animate-pulse"
      style={{ animationDelay: `${delay}ms` }}
    />
  );
}

export function TreeSkeleton({
  locale = 'ar',
  variant = 'full',
  className,
}: TreeSkeletonProps) {
  const isCompact = variant === 'compact' || variant === 'minimal';
  const nodeWidth = isCompact ? 160 : 220;
  const nodeHeight = isCompact ? 100 : 140;
  const spacing = isCompact ? 30 : 50;

  // Generate skeleton tree structure
  const nodes = [
    // Root (grandparent)
    { x: 300, y: 0, delay: 0 },
    // Parents row
    { x: 150, y: 180, delay: 100 },
    { x: 450, y: 180, delay: 150 },
    // Children row
    { x: 0, y: 360, delay: 200 },
    { x: 200, y: 360, delay: 250 },
    { x: 400, y: 360, delay: 300 },
    { x: 600, y: 360, delay: 350 },
  ];

  const minimalNodes = [
    { x: 200, y: 0, delay: 0 },
    { x: 100, y: 150, delay: 100 },
    { x: 300, y: 150, delay: 150 },
  ];

  const displayNodes = variant === 'minimal' ? minimalNodes : nodes;

  // Connection lines
  const connections = variant === 'minimal' ? [
    { x1: 310, y1: nodeHeight, x2: 210, y2: 150, delay: 50 },
    { x1: 310, y1: nodeHeight, x2: 410, y2: 150, delay: 75 },
  ] : [
    // Root to parents
    { x1: 410, y1: nodeHeight, x2: 260, y2: 180, delay: 50 },
    { x1: 410, y1: nodeHeight, x2: 560, y2: 180, delay: 75 },
    // Parents to children
    { x1: 260, y1: 180 + nodeHeight, x2: 110, y2: 360, delay: 100 },
    { x1: 260, y1: 180 + nodeHeight, x2: 310, y2: 360, delay: 125 },
    { x1: 560, y1: 180 + nodeHeight, x2: 510, y2: 360, delay: 150 },
    { x1: 560, y1: 180 + nodeHeight, x2: 710, y2: 360, delay: 175 },
  ];

  const t = locale === 'ar' ? translations.ar : translations.en;

  return (
    <div
      className={cn(
        'relative w-full h-full bg-gray-50 overflow-hidden',
        className
      )}
      role="status"
      aria-label={t.loading}
    >
      {/* Centered SVG */}
      <svg
        className="w-full h-full"
        viewBox={variant === 'minimal' ? '-50 -20 600 350' : '-50 -20 900 550'}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <clipPath id="headerClip">
            <rect x="0" y="0" width={nodeWidth} height="16" rx="16" />
            <rect x="0" y="16" width={nodeWidth} height="20" rx="0" />
          </clipPath>
        </defs>

        {/* Connection lines */}
        <g className="connections">
          {connections.map((conn, i) => (
            <SkeletonLine
              key={i}
              x1={conn.x1}
              y1={conn.y1}
              x2={conn.x2}
              y2={conn.y2}
              delay={conn.delay}
            />
          ))}
        </g>

        {/* Nodes */}
        <g className="nodes">
          {displayNodes.map((node, i) => (
            <SkeletonNode
              key={i}
              x={node.x}
              y={node.y}
              delay={node.delay}
              compact={isCompact}
            />
          ))}
        </g>
      </svg>

      {/* Loading text overlay */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
        <div className="bg-white rounded-full px-6 py-3 shadow-lg flex items-center gap-3">
          <div className="flex gap-1">
            <span
              className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"
              style={{ animationDelay: '0ms' }}
            />
            <span
              className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"
              style={{ animationDelay: '150ms' }}
            />
            <span
              className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"
              style={{ animationDelay: '300ms' }}
            />
          </div>
          <span className="text-sm text-gray-600 font-medium">
            {t.loadingTree}
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * Inline skeleton node for use within the tree
 */
export function InlineNodeSkeleton({
  compact = false,
  className,
}: {
  compact?: boolean;
  className?: string;
}) {
  const width = compact ? 160 : 220;
  const height = compact ? 100 : 140;

  return (
    <div
      className={cn(
        'rounded-2xl overflow-hidden animate-pulse',
        'bg-gray-100 border border-gray-200',
        className
      )}
      style={{ width, height }}
    >
      {/* Header */}
      <div className="h-9 bg-gray-200" />

      {/* Content */}
      <div className="p-3 flex flex-col items-center gap-2">
        {/* Avatar */}
        <div
          className="rounded-full bg-gray-200"
          style={{ width: compact ? 40 : 56, height: compact ? 40 : 56 }}
        />

        {/* Name */}
        <div className="h-4 w-24 bg-gray-200 rounded" />

        {/* Date */}
        {!compact && <div className="h-3 w-16 bg-gray-200 rounded" />}
      </div>
    </div>
  );
}

/**
 * Loading progress indicator
 */
export function TreeLoadingProgress({
  progress,
  locale = 'ar',
}: {
  progress: number;
  locale?: 'ar' | 'en';
}) {
  const t = locale === 'ar' ? translations.ar : translations.en;

  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-64">
      <div className="bg-white rounded-2xl px-6 py-4 shadow-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600">{t.loadingTree}</span>
          <span className="text-sm font-medium text-emerald-600">
            {Math.round(progress)}%
          </span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}

const translations = {
  ar: {
    loading: 'جاري التحميل',
    loadingTree: 'جاري تحميل شجرة العائلة...',
  },
  en: {
    loading: 'Loading',
    loadingTree: 'Loading family tree...',
  },
};

export default TreeSkeleton;
