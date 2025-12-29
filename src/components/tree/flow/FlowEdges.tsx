/**
 * FlowEdges Components
 * Custom React Flow edges for family relationships
 * Animated, styled connections between family members
 */

'use client';

import React from 'react';
import {
  BaseEdge,
  EdgeProps,
  getBezierPath,
  getSmoothStepPath,
  EdgeLabelRenderer,
} from '@xyflow/react';
import { Heart, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

// Parent-Child Edge - Smooth step path
export function ParentChildEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
}: EdgeProps) {
  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 16,
  });

  const isHighlighted = data?.isHighlighted;

  return (
    <>
      {/* Glow effect for highlighted */}
      {isHighlighted && (
        <path
          d={edgePath}
          fill="none"
          stroke="#10b981"
          strokeWidth={8}
          strokeOpacity={0.3}
          className="animate-pulse"
        />
      )}

      {/* Main path */}
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          ...style,
          stroke: isHighlighted ? '#10b981' : '#94a3b8',
          strokeWidth: isHighlighted ? 3 : 2,
          strokeLinecap: 'round',
        }}
        markerEnd={markerEnd}
      />

      {/* Animated dot traveling along path */}
      <circle r="3" fill="#10b981" className="opacity-0 group-hover:opacity-100">
        <animateMotion dur="2s" repeatCount="indefinite" path={edgePath} />
      </circle>
    </>
  );
}

// Spouse Edge - Horizontal connection with heart
export function SpouseEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  data,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    curvature: 0.25,
  });

  const isHighlighted = data?.isHighlighted;
  const isDivorced = data?.isDivorced;
  const marriageYear = data?.marriageYear as string | undefined;

  return (
    <>
      {/* Glow for highlighted */}
      {isHighlighted && (
        <path
          d={edgePath}
          fill="none"
          stroke="#f43f5e"
          strokeWidth={8}
          strokeOpacity={0.3}
          className="animate-pulse"
        />
      )}

      {/* Main path */}
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          ...style,
          stroke: isDivorced ? '#ef4444' : isHighlighted ? '#f43f5e' : '#f472b6',
          strokeWidth: 2,
          strokeDasharray: isDivorced ? '8,4' : undefined,
          strokeLinecap: 'round',
        }}
      />

      {/* Heart icon at center */}
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
        >
          <div
            className={cn(
              'rounded-full p-1.5 shadow-md transition-transform hover:scale-110',
              isDivorced
                ? 'bg-red-100'
                : 'bg-gradient-to-br from-rose-100 to-pink-100'
            )}
          >
            <Heart
              size={12}
              className={cn(
                isDivorced ? 'text-red-400' : 'text-rose-500',
                !isDivorced && 'fill-rose-500'
              )}
            />
          </div>
          {marriageYear && (
            <div className="text-[9px] text-gray-400 text-center mt-0.5">
              {marriageYear}
            </div>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

// Sibling Edge - Dashed horizontal connection
export function SiblingEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  data,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    curvature: 0.5,
  });

  const isHighlighted = data?.isHighlighted;

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          ...style,
          stroke: isHighlighted ? '#8b5cf6' : '#c4b5fd',
          strokeWidth: 2,
          strokeDasharray: '4,4',
          strokeLinecap: 'round',
        }}
      />

      {/* Siblings icon */}
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
        >
          <div className="bg-violet-100 rounded-full p-1 shadow-sm">
            <Users size={10} className="text-violet-500" />
          </div>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

// Animated flowing edge for highlighted paths
export function HighlightedEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
}: EdgeProps) {
  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 20,
  });

  return (
    <>
      {/* Glowing background */}
      <path
        d={edgePath}
        fill="none"
        stroke="#10b981"
        strokeWidth={12}
        strokeOpacity={0.2}
        className="animate-pulse"
      />

      {/* Main animated path */}
      <path
        d={edgePath}
        fill="none"
        stroke="url(#highlightGradient)"
        strokeWidth={4}
        strokeLinecap="round"
        className="animate-flow"
      />

      {/* Traveling dot */}
      <circle r="4" fill="#10b981">
        <animateMotion dur="1.5s" repeatCount="indefinite" path={edgePath} />
      </circle>

      {/* Gradient definition */}
      <defs>
        <linearGradient id="highlightGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="50%" stopColor="#34d399" />
          <stop offset="100%" stopColor="#10b981" />
        </linearGradient>
      </defs>
    </>
  );
}

// Export edge types for React Flow
export const edgeTypes = {
  parentChild: ParentChildEdge,
  spouse: SpouseEdge,
  sibling: SiblingEdge,
  highlighted: HighlightedEdge,
};

export default edgeTypes;
