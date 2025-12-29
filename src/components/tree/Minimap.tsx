/**
 * Minimap Component
 * A small overview of the family tree for easy navigation
 */

'use client';

import React, { memo, useCallback, useRef, useState } from 'react';
import { TreeLayout, TreeNode } from '@/types/tree';
import { ChevronDown, ChevronUp, Map } from 'lucide-react';

interface MinimapProps {
  layout: TreeLayout;
  viewportWidth: number;
  viewportHeight: number;
  translateX: number;
  translateY: number;
  scale: number;
  onNavigate: (translateX: number, translateY: number) => void;
  locale?: 'ar' | 'en';
  selectedPersonId?: string | null;
}

const MINIMAP_WIDTH = 200;
const MINIMAP_HEIGHT = 150;

export const Minimap = memo(function Minimap({
  layout,
  viewportWidth,
  viewportHeight,
  translateX,
  translateY,
  scale,
  onNavigate,
  locale = 'ar',
  selectedPersonId,
}: MinimapProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const minimapRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  // Calculate the scale factor to fit the tree in the minimap
  const minimapScale = Math.min(
    MINIMAP_WIDTH / layout.width,
    MINIMAP_HEIGHT / layout.height
  ) * 0.9;

  // Calculate viewport rectangle in minimap coordinates
  const viewportRect = {
    x: (-translateX / scale - layout.minX) * minimapScale,
    y: (-translateY / scale - layout.minY) * minimapScale,
    width: (viewportWidth / scale) * minimapScale,
    height: (viewportHeight / scale) * minimapScale,
  };

  // Handle click/drag on minimap to navigate
  const handleMinimapClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!minimapRef.current) return;

    const rect = minimapRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Convert minimap coordinates to tree coordinates
    const treeX = (clickX / minimapScale) + layout.minX;
    const treeY = (clickY / minimapScale) + layout.minY;

    // Calculate new translate to center on clicked point
    const newTranslateX = viewportWidth / 2 - treeX * scale;
    const newTranslateY = viewportHeight / 2 - treeY * scale;

    onNavigate(newTranslateX, newTranslateY);
  }, [minimapScale, layout.minX, layout.minY, scale, viewportWidth, viewportHeight, onNavigate]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    isDragging.current = true;
    handleMinimapClick(e);
  }, [handleMinimapClick]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging.current) {
      handleMinimapClick(e);
    }
  }, [handleMinimapClick]);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  if (isCollapsed) {
    return (
      <button
        onClick={() => setIsCollapsed(false)}
        className="fixed bottom-6 right-6 z-20 bg-white rounded-lg shadow-lg border border-gray-200 p-2 hover:bg-gray-50 transition-colors flex items-center gap-2"
        style={{ direction: locale === 'ar' ? 'rtl' : 'ltr' }}
      >
        <Map size={18} className="text-gray-600" />
        <ChevronUp size={16} className="text-gray-400" />
      </button>
    );
  }

  return (
    <div
      className="fixed bottom-6 right-6 z-20 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden"
      style={{
        width: MINIMAP_WIDTH + 16,
        direction: locale === 'ar' ? 'rtl' : 'ltr'
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Map size={14} className="text-gray-500" />
          <span className="text-xs font-medium text-gray-600">
            {locale === 'ar' ? 'الخريطة' : 'Map'}
          </span>
        </div>
        <button
          onClick={() => setIsCollapsed(true)}
          className="p-1 hover:bg-gray-200 rounded transition-colors"
        >
          <ChevronDown size={14} className="text-gray-400" />
        </button>
      </div>

      {/* Minimap canvas */}
      <div
        ref={minimapRef}
        className="relative cursor-crosshair bg-slate-50"
        style={{ width: MINIMAP_WIDTH, height: MINIMAP_HEIGHT, margin: 8 }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Render simplified nodes */}
        <svg
          width={MINIMAP_WIDTH}
          height={MINIMAP_HEIGHT}
          viewBox={`0 0 ${MINIMAP_WIDTH} ${MINIMAP_HEIGHT}`}
          className="absolute inset-0"
        >
          {/* Connection lines (simplified) */}
          <g opacity="0.3">
            {layout.connections.map((conn) => {
              const fromX = (conn.from.x + 110 - layout.minX) * minimapScale;
              const fromY = (conn.from.y + 70 - layout.minY) * minimapScale;
              const toX = (conn.to.x + 110 - layout.minX) * minimapScale;
              const toY = (conn.to.y + 70 - layout.minY) * minimapScale;

              return (
                <line
                  key={conn.id}
                  x1={fromX}
                  y1={fromY}
                  x2={toX}
                  y2={toY}
                  stroke="#94a3b8"
                  strokeWidth="0.5"
                />
              );
            })}
          </g>

          {/* Nodes as dots */}
          {layout.nodes.map((node) => {
            const x = (node.x + 110 - layout.minX) * minimapScale;
            const y = (node.y + 70 - layout.minY) * minimapScale;
            const isSelected = node.id === selectedPersonId;

            return (
              <circle
                key={node.id}
                cx={x}
                cy={y}
                r={isSelected ? 4 : 2}
                fill={
                  isSelected
                    ? '#3b82f6'
                    : node.person.gender === 'male'
                    ? '#60a5fa'
                    : node.person.gender === 'female'
                    ? '#f472b6'
                    : '#94a3b8'
                }
                stroke={isSelected ? '#1d4ed8' : 'none'}
                strokeWidth={isSelected ? 1 : 0}
              />
            );
          })}

          {/* Viewport rectangle */}
          <rect
            x={Math.max(0, viewportRect.x)}
            y={Math.max(0, viewportRect.y)}
            width={Math.min(viewportRect.width, MINIMAP_WIDTH - Math.max(0, viewportRect.x))}
            height={Math.min(viewportRect.height, MINIMAP_HEIGHT - Math.max(0, viewportRect.y))}
            fill="rgba(59, 130, 246, 0.1)"
            stroke="#3b82f6"
            strokeWidth="1.5"
            rx="2"
            className="pointer-events-none"
          />
        </svg>
      </div>

      {/* Stats footer */}
      <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-t border-gray-100 text-xs text-gray-500">
        <span>{layout.nodes.length} {locale === 'ar' ? 'شخص' : 'people'}</span>
        <span>{Math.round(scale * 100)}%</span>
      </div>
    </div>
  );
});

export default Minimap;
