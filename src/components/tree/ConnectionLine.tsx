/**
 * ConnectionLine Component
 * Renders SVG lines connecting family members (parent-child, spouse relationships)
 */

'use client';

import React from 'react';
import { ConnectionLine as ConnectionLineType } from '@/types/tree';

interface ConnectionLineProps {
  connection: ConnectionLineType;
  isHighlighted?: boolean;
  onClick?: (connection: ConnectionLineType) => void;
}

export function ConnectionLine({ connection, isHighlighted = false, onClick }: ConnectionLineProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick?.(connection);
  };

  const handleMouseEnter = (e: React.MouseEvent<SVGPathElement>) => {
    const target = e.currentTarget;
    target.style.strokeWidth = String(connection.strokeWidth + 1);
    target.style.filter = 'drop-shadow(0 0 4px rgba(0,0,0,0.3))';
  };

  const handleMouseLeave = (e: React.MouseEvent<SVGPathElement>) => {
    const target = e.currentTarget;
    target.style.strokeWidth = String(connection.strokeWidth);
    target.style.filter = 'none';
  };

  return (
    <g className="connection-line">
      {/* Main line */}
      <path
        d={connection.path}
        fill="none"
        stroke={isHighlighted ? '#3b82f6' : connection.color}
        strokeWidth={connection.strokeWidth}
        strokeDasharray={connection.isDashed ? '5,5' : 'none'}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="transition-all duration-200 cursor-pointer hover:opacity-80"
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          opacity: isHighlighted ? 1 : 0.7,
        }}
      />

      {/* Invisible wider path for easier clicking */}
      <path
        d={connection.path}
        fill="none"
        stroke="transparent"
        strokeWidth={connection.strokeWidth + 10}
        className="cursor-pointer"
        onClick={handleClick}
      />

      {/* Marriage indicator for spouse connections */}
      {connection.type === 'spouse' && connection.relationship && (
        <MarriageIndicator connection={connection} />
      )}
    </g>
  );
}

/**
 * Marriage indicator (heart or ring icon) for spouse connections
 */
function MarriageIndicator({ connection }: { connection: ConnectionLineType }) {
  if (!connection.relationship) return null;

  // Parse path to find midpoint
  const pathMatch = connection.path.match(/M ([\d.]+) ([\d.]+) L ([\d.]+) ([\d.]+)/);
  if (!pathMatch) return null;

  const [, x1Str, y1Str, x2Str, y2Str] = pathMatch;
  const x1 = parseFloat(x1Str);
  const y1 = parseFloat(y1Str);
  const x2 = parseFloat(x2Str);
  const y2 = parseFloat(y2Str);

  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;

  const isDivorced = !!connection.relationship.divorce_date;

  return (
    <g transform={`translate(${midX}, ${midY})`}>
      {/* Background circle */}
      <circle r="12" fill="white" stroke={connection.color} strokeWidth="2" />

      {/* Icon */}
      {isDivorced ? (
        // X for divorced
        <>
          <line x1="-6" y1="-6" x2="6" y2="6" stroke={connection.color} strokeWidth="2" strokeLinecap="round" />
          <line x1="6" y1="-6" x2="-6" y2="6" stroke={connection.color} strokeWidth="2" strokeLinecap="round" />
        </>
      ) : (
        // Heart for married
        <path
          d="M0,-3 C0,-5 -2,-6 -4,-4 C-6,-2 -4,0 0,4 C4,0 6,-2 4,-4 C2,-6 0,-5 0,-3 Z"
          fill={connection.color}
        />
      )}
    </g>
  );
}

/**
 * Component to render all connection lines
 */
interface ConnectionLinesProps {
  connections: ConnectionLineType[];
  highlightedNodeIds?: Set<string>;
  onConnectionClick?: (connection: ConnectionLineType) => void;
}

export function ConnectionLines({
  connections,
  highlightedNodeIds = new Set(),
  onConnectionClick,
}: ConnectionLinesProps) {
  return (
    <g className="connection-lines">
      {/* Render in order: parent-child first, then spouse, then sibling */}
      {connections
        .filter((c) => c.type === 'parent-child')
        .map((connection) => (
          <ConnectionLine
            key={connection.id}
            connection={connection}
            isHighlighted={
              highlightedNodeIds.has(connection.from.id) || highlightedNodeIds.has(connection.to.id)
            }
            onClick={onConnectionClick}
          />
        ))}

      {connections
        .filter((c) => c.type === 'spouse')
        .map((connection) => (
          <ConnectionLine
            key={connection.id}
            connection={connection}
            isHighlighted={
              highlightedNodeIds.has(connection.from.id) || highlightedNodeIds.has(connection.to.id)
            }
            onClick={onConnectionClick}
          />
        ))}

      {connections
        .filter((c) => c.type === 'sibling')
        .map((connection) => (
          <ConnectionLine
            key={connection.id}
            connection={connection}
            isHighlighted={
              highlightedNodeIds.has(connection.from.id) || highlightedNodeIds.has(connection.to.id)
            }
            onClick={onConnectionClick}
          />
        ))}
    </g>
  );
}

/**
 * Helper to create curved path (Bezier curve)
 */
export function createCurvedPath(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  curvature: number = 0.5
): string {
  const midY = (y1 + y2) / 2;
  const controlY1 = y1 + (midY - y1) * curvature;
  const controlY2 = y2 - (y2 - midY) * curvature;

  return `M ${x1} ${y1} C ${x1} ${controlY1}, ${x2} ${controlY2}, ${x2} ${y2}`;
}

/**
 * Helper to create stepped path (Manhattan routing)
 */
export function createSteppedPath(x1: number, y1: number, x2: number, y2: number): string {
  const midX = (x1 + x2) / 2;
  return `M ${x1} ${y1} L ${midX} ${y1} L ${midX} ${y2} L ${x2} ${y2}`;
}
