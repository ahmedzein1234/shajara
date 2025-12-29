/**
 * ConnectionLine Component
 * Renders elegant SVG lines connecting family members with smooth curves
 */

'use client';

import React, { memo, useCallback, useState } from 'react';
import { ConnectionLine as ConnectionLineType } from '@/types/tree';

interface ConnectionLineProps {
  connection: ConnectionLineType;
  isHighlighted?: boolean;
  onClick?: (connection: ConnectionLineType) => void;
}

// Memoized for performance
export const ConnectionLine = memo(function ConnectionLine({
  connection,
  isHighlighted = false,
  onClick
}: ConnectionLineProps) {
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onClick?.(connection);
  }, [onClick, connection]);

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
  }, []);

  // Dynamic styling based on connection type - warm heritage colors
  const getStrokeColor = () => {
    if (isHighlighted) return '#D4AF37'; // Gold for highlighted
    if (isHovered) return connection.type === 'spouse' ? '#B85C6C' : '#2B5B84'; // Heritage rose/blue
    return connection.color || '#8C7A60'; // Warm brown default
  };

  const getStrokeWidth = () => {
    const base = connection.type === 'parent-child' ? 2.5 : 2;
    if (isHovered) return base + 1;
    if (isHighlighted) return base + 0.5;
    return base;
  };

  return (
    <g className="connection-line">
      {/* Glow effect for highlighted lines */}
      {(isHighlighted || isHovered) && (
        <path
          d={connection.path}
          fill="none"
          stroke={getStrokeColor()}
          strokeWidth={getStrokeWidth() + 4}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.2}
          className="pointer-events-none"
        />
      )}

      {/* Main line */}
      <path
        d={connection.path}
        fill="none"
        stroke={getStrokeColor()}
        strokeWidth={getStrokeWidth()}
        strokeDasharray={connection.isDashed ? '8,4' : 'none'}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="transition-all duration-200"
        style={{
          opacity: isHighlighted ? 1 : isHovered ? 0.9 : 0.7,
        }}
      />

      {/* Invisible wider path for easier clicking */}
      <path
        d={connection.path}
        fill="none"
        stroke="transparent"
        strokeWidth={15}
        className="cursor-pointer"
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      />

      {/* Arrow indicator for parent-child */}
      {connection.type === 'parent-child' && (
        <ArrowIndicator connection={connection} isHighlighted={isHighlighted || isHovered} />
      )}

      {/* Marriage indicator for spouse connections */}
      {connection.type === 'spouse' && connection.relationship && (
        <MarriageIndicator connection={connection} isHighlighted={isHighlighted || isHovered} />
      )}
    </g>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.connection.id === nextProps.connection.id &&
    prevProps.connection.path === nextProps.connection.path &&
    prevProps.isHighlighted === nextProps.isHighlighted
  );
});

/**
 * Arrow indicator at the end of parent-child connections
 */
function ArrowIndicator({ connection, isHighlighted }: { connection: ConnectionLineType; isHighlighted: boolean }) {
  // Parse path to find end point
  const pathParts = connection.path.split(/[MLCQZ\s,]+/).filter(Boolean);
  if (pathParts.length < 2) return null;

  const endX = parseFloat(pathParts[pathParts.length - 2]);
  const endY = parseFloat(pathParts[pathParts.length - 1]);

  if (isNaN(endX) || isNaN(endY)) return null;

  // Small downward arrow
  const arrowSize = 6;
  const arrowPath = `M ${endX - arrowSize} ${endY - arrowSize} L ${endX} ${endY} L ${endX + arrowSize} ${endY - arrowSize}`;

  return (
    <path
      d={arrowPath}
      fill="none"
      stroke={isHighlighted ? '#D4AF37' : connection.color || '#8C7A60'}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity={isHighlighted ? 1 : 0.7}
    />
  );
}

/**
 * Marriage indicator (heart or ring icon) for spouse connections
 */
function MarriageIndicator({ connection, isHighlighted }: { connection: ConnectionLineType; isHighlighted: boolean }) {
  if (!connection.relationship) return null;

  // Parse path to find midpoint - handle both straight and curved paths
  const pathParts = connection.path.split(/[MLCQZ\s,]+/).filter(Boolean);
  if (pathParts.length < 4) return null;

  // Get start and end points
  const x1 = parseFloat(pathParts[0]);
  const y1 = parseFloat(pathParts[1]);
  const x2 = parseFloat(pathParts[pathParts.length - 2]);
  const y2 = parseFloat(pathParts[pathParts.length - 1]);

  if (isNaN(x1) || isNaN(y1) || isNaN(x2) || isNaN(y2)) return null;

  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2 - 5; // Offset up for curved lines

  const isDivorced = !!connection.relationship.divorce_date;
  // Heritage colors: gold for highlighted, terracotta for divorced, rose for married
  const indicatorColor = isHighlighted ? '#D4AF37' : isDivorced ? '#B85C3C' : '#B85C6C';

  return (
    <g transform={`translate(${midX}, ${midY})`}>
      {/* Background circle with subtle shadow - warm cream */}
      <circle r="14" fill="#FAF8F5" filter="drop-shadow(0 2px 4px rgba(140,122,96,0.15))" />
      <circle r="12" fill="#FAF8F5" stroke={indicatorColor} strokeWidth="2" />

      {/* Icon */}
      {isDivorced ? (
        // Broken heart for divorced
        <>
          <path
            d="M-1,-4 C-1,-6 -3,-7 -5,-5 C-7,-3 -5,-1 -1,3"
            fill="none"
            stroke={indicatorColor}
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M1,-4 C1,-6 3,-7 5,-5 C7,-3 5,-1 1,3"
            fill="none"
            stroke={indicatorColor}
            strokeWidth="2"
            strokeLinecap="round"
          />
          <line x1="-1" y1="-2" x2="1" y2="2" stroke={indicatorColor} strokeWidth="1.5" strokeLinecap="round" />
        </>
      ) : (
        // Solid heart for married
        <>
          <path
            d="M0,-2 C0,-5 -3,-6 -5,-4 C-7,-1 -5,1 0,5 C5,1 7,-1 5,-4 C3,-6 0,-5 0,-2 Z"
            fill={indicatorColor}
          />
          {/* Ring icons on either side */}
          <circle cx="-7" cy="0" r="3" fill="none" stroke={indicatorColor} strokeWidth="1" opacity="0.5" />
          <circle cx="7" cy="0" r="3" fill="none" stroke={indicatorColor} strokeWidth="1" opacity="0.5" />
        </>
      )}

      {/* Marriage year if available */}
      {connection.relationship.marriage_date && !isDivorced && (
        <text
          y="22"
          textAnchor="middle"
          fontSize="8"
          fill="#6b7280"
          fontWeight="500"
        >
          {new Date(connection.relationship.marriage_date).getFullYear()}
        </text>
      )}
    </g>
  );
}

/**
 * Component to render all connection lines
 * Memoized for performance
 */
interface ConnectionLinesProps {
  connections: ConnectionLineType[];
  highlightedNodeIds?: Set<string>;
  onConnectionClick?: (connection: ConnectionLineType) => void;
}

export const ConnectionLines = memo(function ConnectionLines({
  connections,
  highlightedNodeIds = new Set(),
  onConnectionClick,
}: ConnectionLinesProps) {
  // Group connections by type for proper z-ordering
  const parentChildConnections = connections.filter((c) => c.type === 'parent-child');
  const spouseConnections = connections.filter((c) => c.type === 'spouse');
  const siblingConnections = connections.filter((c) => c.type === 'sibling');

  return (
    <g className="connection-lines">
      {/* Render in order: parent-child first (back), then sibling, then spouse (front) */}
      {parentChildConnections.map((connection) => (
        <ConnectionLine
          key={connection.id}
          connection={connection}
          isHighlighted={
            highlightedNodeIds.has(connection.from.id) || highlightedNodeIds.has(connection.to.id)
          }
          onClick={onConnectionClick}
        />
      ))}

      {siblingConnections.map((connection) => (
        <ConnectionLine
          key={connection.id}
          connection={connection}
          isHighlighted={
            highlightedNodeIds.has(connection.from.id) || highlightedNodeIds.has(connection.to.id)
          }
          onClick={onConnectionClick}
        />
      ))}

      {spouseConnections.map((connection) => (
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
});

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
