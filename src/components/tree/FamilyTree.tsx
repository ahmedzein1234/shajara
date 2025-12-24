/**
 * FamilyTree Component
 * Main component for rendering and interacting with the family tree visualization
 */

'use client';

import React, { useRef, useState, useEffect, useCallback, useReducer } from 'react';
import { Person, Relationship } from '@/lib/db/schema';
import { TreeData, TreeViewState, TreeViewAction, LayoutType, ExportFormat, TreeNode as TreeNodeType } from '@/types/tree';
import { useTreeLayout, useCenterTransform } from '@/hooks/useTreeLayout';
import { PersonNode, CompactPersonNode } from './PersonNode';
import { ConnectionLines } from './ConnectionLine';
import { TreeControls } from './TreeControls';
import { TreeLegend } from './TreeLegend';
import { cn } from '@/lib/utils';

interface FamilyTreeProps {
  persons: Person[];
  relationships: Relationship[];
  rootPersonId?: string;
  locale?: 'ar' | 'en';
  onPersonClick?: (person: Person) => void;
  onPersonDoubleClick?: (person: Person) => void;
  className?: string;
}

/**
 * Tree view state reducer
 */
function treeViewReducer(state: TreeViewState, action: TreeViewAction): TreeViewState {
  switch (action.type) {
    case 'SELECT_PERSON':
      return { ...state, selectedPersonId: action.personId };

    case 'HIGHLIGHT_PERSONS':
      return { ...state, highlightedPersonIds: new Set(action.personIds) };

    case 'CLEAR_HIGHLIGHTS':
      return { ...state, highlightedPersonIds: new Set() };

    case 'SET_ZOOM':
      return { ...state, scale: Math.max(0.1, Math.min(3.0, action.scale)) };

    case 'SET_TRANSFORM':
      return {
        ...state,
        translateX: action.translateX,
        translateY: action.translateY,
        scale: Math.max(0.1, Math.min(3.0, action.scale)),
      };

    case 'ZOOM_IN':
      return { ...state, scale: Math.min(3.0, state.scale * 1.2) };

    case 'ZOOM_OUT':
      return { ...state, scale: Math.max(0.1, state.scale / 1.2) };

    case 'RESET_VIEW':
      return { ...state, scale: 1, translateX: 0, translateY: 0 };

    case 'TOGGLE_LAYOUT':
      return { ...state, layoutType: action.layoutType };

    case 'TOGGLE_DIRECTION':
      return { ...state, direction: state.direction === 'rtl' ? 'ltr' : 'rtl' };

    case 'TOGGLE_COLLAPSE':
      const newCollapsed = new Set(state.collapsedNodeIds);
      if (newCollapsed.has(action.nodeId)) {
        newCollapsed.delete(action.nodeId);
      } else {
        newCollapsed.add(action.nodeId);
      }
      return { ...state, collapsedNodeIds: newCollapsed };

    case 'SEARCH':
      return { ...state, searchQuery: action.query };

    case 'CLEAR_SEARCH':
      return { ...state, searchQuery: '', searchResults: [], highlightedPersonIds: new Set() };

    default:
      return state;
  }
}

/**
 * Initial state
 */
const initialState: TreeViewState = {
  selectedPersonId: null,
  highlightedPersonIds: new Set(),
  scale: 1,
  translateX: 0,
  translateY: 0,
  layoutType: 'descendants',
  direction: 'rtl',
  collapsedNodeIds: new Set(),
  searchQuery: '',
  searchResults: [],
};

export function FamilyTree({
  persons,
  relationships,
  rootPersonId,
  locale = 'ar',
  onPersonClick,
  onPersonDoubleClick,
  className,
}: FamilyTreeProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [state, dispatch] = useReducer(treeViewReducer, {
    ...initialState,
    direction: locale === 'ar' ? 'rtl' : 'ltr',
  });

  const [viewportSize, setViewportSize] = useState({ width: 1000, height: 800 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Prepare tree data
  const treeData: TreeData = {
    persons,
    relationships,
    rootPersonId,
  };

  // Calculate layout
  const layout = useTreeLayout(
    treeData,
    {
      layoutType: state.layoutType,
      direction: state.direction,
      showSiblings: true,
    },
    {
      rootPersonId,
      includeDescendants: state.layoutType !== 'ancestors',
      includeAncestors: state.layoutType === 'ancestors' || state.layoutType === 'hourglass',
    }
  );

  // Calculate center transform for fit view
  const centerTransform = useCenterTransform(layout, viewportSize.width, viewportSize.height);

  // Update viewport size on mount and resize
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setViewportSize({ width: rect.width, height: rect.height });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Center tree on initial load
  useEffect(() => {
    if (layout && centerTransform) {
      dispatch({
        type: 'SET_TRANSFORM',
        translateX: centerTransform.translateX,
        translateY: centerTransform.translateY,
        scale: centerTransform.scale,
      });
    }
  }, [layout?.rootNode.id]); // Only run when tree changes

  // Handlers
  const handleZoomIn = useCallback(() => {
    dispatch({ type: 'ZOOM_IN' });
  }, []);

  const handleZoomOut = useCallback(() => {
    dispatch({ type: 'ZOOM_OUT' });
  }, []);

  const handleResetView = useCallback(() => {
    dispatch({ type: 'RESET_VIEW' });
  }, []);

  const handleFitView = useCallback(() => {
    if (centerTransform) {
      dispatch({
        type: 'SET_TRANSFORM',
        translateX: centerTransform.translateX,
        translateY: centerTransform.translateY,
        scale: centerTransform.scale,
      });
    }
  }, [centerTransform]);

  const handleLayoutChange = useCallback((layoutType: LayoutType) => {
    dispatch({ type: 'TOGGLE_LAYOUT', layoutType });
  }, []);

  const handleDirectionToggle = useCallback(() => {
    dispatch({ type: 'TOGGLE_DIRECTION' });
  }, []);

  const handleNodeClick = useCallback(
    (node: TreeNodeType) => {
      dispatch({ type: 'SELECT_PERSON', personId: node.id });
      onPersonClick?.(node.person);
    },
    [onPersonClick]
  );

  const handleNodeDoubleClick = useCallback(
    (node: TreeNodeType) => {
      dispatch({ type: 'TOGGLE_COLLAPSE', nodeId: node.id });
      onPersonDoubleClick?.(node.person);
    },
    [onPersonDoubleClick]
  );

  const handleSearch = useCallback((results: TreeNodeType[]) => {
    dispatch({
      type: 'HIGHLIGHT_PERSONS',
      personIds: results.map((n) => n.id),
    });
  }, []);

  const handleExport = useCallback(
    async (format: ExportFormat) => {
      if (!svgRef.current) return;

      try {
        // Clone SVG for export
        const svgClone = svgRef.current.cloneNode(true) as SVGSVGElement;

        // Set proper dimensions
        if (layout) {
          svgClone.setAttribute('width', String(layout.width));
          svgClone.setAttribute('height', String(layout.height));
          svgClone.setAttribute('viewBox', `${layout.minX} ${layout.minY} ${layout.width} ${layout.height}`);
        }

        const svgData = new XMLSerializer().serializeToString(svgClone);
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });

        if (format === 'svg') {
          // Direct SVG download
          const url = URL.createObjectURL(svgBlob);
          downloadFile(url, `family-tree.${format}`);
          URL.revokeObjectURL(url);
        } else {
          // Convert to image format
          const url = URL.createObjectURL(svgBlob);
          const img = new Image();

          img.onload = () => {
            const canvas = document.createElement('canvas');
            const scale = format === 'pdf' ? 2 : 1;
            canvas.width = (layout?.width || 1000) * scale;
            canvas.height = (layout?.height || 800) * scale;

            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.fillStyle = 'white';
              ctx.fillRect(0, 0, canvas.width, canvas.height);
              ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

              canvas.toBlob(
                (blob) => {
                  if (blob) {
                    const blobUrl = URL.createObjectURL(blob);
                    downloadFile(blobUrl, `family-tree.${format}`);
                    URL.revokeObjectURL(blobUrl);
                  }
                },
                format === 'png' ? 'image/png' : 'image/jpeg',
                0.95
              );
            }

            URL.revokeObjectURL(url);
          };

          img.src = url;
        }
      } catch (error) {
        console.error('Export failed:', error);
      }
    },
    [layout]
  );

  // Pan and zoom handlers
  const handleMouseDown = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (e.button === 0) {
      // Left click
      setIsPanning(true);
      setPanStart({ x: e.clientX - state.translateX, y: e.clientY - state.translateY });
    }
  }, [state.translateX, state.translateY]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (isPanning) {
        const newTranslateX = e.clientX - panStart.x;
        const newTranslateY = e.clientY - panStart.y;
        dispatch({
          type: 'SET_TRANSFORM',
          translateX: newTranslateX,
          translateY: newTranslateY,
          scale: state.scale,
        });
      }
    },
    [isPanning, panStart, state.scale]
  );

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  const handleWheel = useCallback(
    (e: React.WheelEvent<SVGSVGElement>) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      dispatch({ type: 'SET_ZOOM', scale: state.scale * delta });
    },
    [state.scale]
  );

  const handleBackgroundClick = useCallback(() => {
    dispatch({ type: 'SELECT_PERSON', personId: null });
    dispatch({ type: 'CLEAR_HIGHLIGHTS' });
  }, []);

  if (!layout) {
    return (
      <div className={cn('w-full h-full flex items-center justify-center bg-gray-50', className)}>
        <div className="text-center">
          <div className="text-gray-400 mb-2">
            {locale === 'ar' ? 'لا توجد بيانات لعرضها' : 'No data to display'}
          </div>
        </div>
      </div>
    );
  }

  const useCompactNodes = state.scale < 0.5;

  return (
    <div
      ref={containerRef}
      className={cn('relative w-full h-full bg-gray-50 overflow-hidden', className)}
      dir={state.direction}
    >
      {/* SVG Canvas */}
      <svg
        ref={svgRef}
        className="w-full h-full cursor-move"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        style={{ touchAction: 'none' }}
      >
        <defs>
          {/* Patterns and filters */}
          <filter id="shadow">
            <feDropShadow dx="0" dy="2" stdDeviation="4" floodOpacity="0.1" />
          </filter>
        </defs>

        {/* Main group with transform */}
        <g transform={`translate(${state.translateX}, ${state.translateY}) scale(${state.scale})`}>
          {/* Background click area */}
          <rect
            x={layout.minX}
            y={layout.minY}
            width={layout.width}
            height={layout.height}
            fill="transparent"
            onClick={handleBackgroundClick}
          />

          {/* Connection lines */}
          <ConnectionLines
            connections={layout.connections}
            highlightedNodeIds={state.highlightedPersonIds}
          />

          {/* Person nodes */}
          <g className="person-nodes">
            {layout.nodes.map((node) =>
              useCompactNodes ? (
                <CompactPersonNode
                  key={node.id}
                  node={node}
                  isSelected={state.selectedPersonId === node.id}
                  onClick={handleNodeClick}
                />
              ) : (
                <PersonNode
                  key={node.id}
                  node={node}
                  isSelected={state.selectedPersonId === node.id}
                  isHighlighted={state.highlightedPersonIds.has(node.id)}
                  locale={locale}
                  onClick={handleNodeClick}
                  onDoubleClick={handleNodeDoubleClick}
                  showPhotos={state.scale >= 0.7}
                  showDates={state.scale >= 0.5}
                  showPatronymic={state.scale >= 0.8}
                />
              )
            )}
          </g>
        </g>
      </svg>

      {/* Controls */}
      <TreeControls
        scale={state.scale}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetView={handleResetView}
        onFitView={handleFitView}
        layoutType={state.layoutType}
        onLayoutChange={handleLayoutChange}
        nodes={layout.nodes}
        onSearch={handleSearch}
        onSelectNode={handleNodeClick}
        onExport={handleExport}
        direction={state.direction}
        onDirectionToggle={handleDirectionToggle}
        locale={locale}
      />

      {/* Legend */}
      <TreeLegend locale={locale} />

      {/* Loading overlay for large trees */}
      {layout.nodes.length > 100 && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-white px-4 py-2 rounded-full shadow-lg text-xs text-gray-600">
          {locale === 'ar' ? `${layout.nodes.length} شخص` : `${layout.nodes.length} people`}
        </div>
      )}
    </div>
  );
}

/**
 * Helper to download file
 */
function downloadFile(url: string, filename: string) {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/**
 * Export the component as default
 */
export default FamilyTree;
