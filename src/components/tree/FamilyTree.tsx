/**
 * FamilyTree Component
 * Main component for rendering and interacting with the family tree visualization
 *
 * Enhanced with:
 * - Details side panel for viewing person info
 * - Relationship finder for discovering connections
 * - Generation slider for controlling tree depth
 * - Keyboard shortcuts panel
 * - Viewport culling for performance
 * - Skeleton loading states
 * - Smooth animations
 */

'use client';

import React, { useRef, useState, useEffect, useCallback, useReducer } from 'react';
import { Person, Relationship } from '@/lib/db/schema';
import { TreeData, TreeViewState, TreeViewAction, LayoutType, ExportFormat, TreeNode as TreeNodeType } from '@/types/tree';
import { useTreeLayout, useCenterTransform } from '@/hooks/useTreeLayout';
import { useBranchColors } from '@/hooks/useBranchColors';
import { useViewportCulling } from '@/hooks/useViewportCulling';
import { PersonNode, CompactPersonNode } from './PersonNode';
import { ConnectionLines } from './ConnectionLine';
import { TreeControls } from './TreeControls';
import { TreeLegend } from './TreeLegend';
import { Minimap } from './Minimap';
import { ContextMenu } from './ContextMenu';
import { FanChart } from './FanChart';
import { DetailsSidePanel } from './DetailsSidePanel';
import { RelationshipFinder } from './RelationshipFinder';
import { GenerationSlider } from './GenerationSlider';
import { KeyboardShortcuts } from './KeyboardShortcuts';
import { TreeSkeleton } from './TreeSkeleton';
import { cn } from '@/lib/utils';

interface FamilyTreeProps {
  persons: Person[];
  relationships: Relationship[];
  rootPersonId?: string;
  locale?: 'ar' | 'en';
  onPersonClick?: (person: Person) => void;
  onPersonDoubleClick?: (person: Person) => void;
  onAddChild?: (person: Person) => void;
  onAddSpouse?: (person: Person) => void;
  onAddParent?: (person: Person) => void;
  onEdit?: (person: Person) => void;
  onDelete?: (person: Person) => void;
  className?: string;
}

// Context menu state
interface ContextMenuState {
  isOpen: boolean;
  x: number;
  y: number;
  node: TreeNodeType | null;
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
  onAddChild,
  onAddSpouse,
  onAddParent,
  onEdit,
  onDelete,
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

  // Context menu state
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    isOpen: false,
    x: 0,
    y: 0,
    node: null,
  });

  // Show minimap state (hidden by default on mobile)
  const [showMinimap, setShowMinimap] = useState(true);

  // Color coding toggle
  const [colorCodingEnabled, setColorCodingEnabled] = useState(true);

  // Details side panel state
  const [selectedPersonForDetails, setSelectedPersonForDetails] = useState<Person | null>(null);
  const [isDetailsPanelOpen, setIsDetailsPanelOpen] = useState(false);

  // Convert selected person to TreeNode for DetailsSidePanel
  const selectedNodeForDetails: TreeNodeType | null = selectedPersonForDetails ? {
    id: selectedPersonForDetails.id,
    person: selectedPersonForDetails,
    x: 0,
    y: 0,
    level: 0,
    parents: [],
    children: [],
    spouses: [],
    subtreeWidth: 0,
    isCollapsed: false,
    isHighlighted: false,
  } : null;

  // Relationship finder state
  const [isRelationshipFinderOpen, setIsRelationshipFinderOpen] = useState(false);

  // Keyboard shortcuts panel state
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  // Generation slider value
  const [maxGenerations, setMaxGenerations] = useState(10);

  // Loading state
  const [isLoading, setIsLoading] = useState(false);

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

  // Calculate branch colors
  const { colorMap: branchColors, legend: branchLegend } = useBranchColors(
    layout?.nodes || [],
    rootPersonId,
    colorCodingEnabled
  );

  // Apply viewport culling for performance
  const {
    visibleNodes,
    visibleConnections,
    cullingEnabled,
    renderedNodes,
    totalNodes,
  } = useViewportCulling(
    layout?.nodes || [],
    layout?.connections || [],
    viewportSize.width,
    viewportSize.height,
    state.translateX,
    state.translateY,
    state.scale
  );

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

  // Open details panel for a person
  const handleViewDetails = useCallback((person: Person) => {
    setSelectedPersonForDetails(person);
    setIsDetailsPanelOpen(true);
  }, []);

  // Navigate to person in tree
  const handleNavigateToPerson = useCallback((personId: string) => {
    const node = layout?.nodes.find(n => n.id === personId);
    if (node) {
      dispatch({ type: 'SELECT_PERSON', personId: node.id });
      const newTranslateX = viewportSize.width / 2 - (node.x + 110) * state.scale;
      const newTranslateY = viewportSize.height / 2 - (node.y + 70) * state.scale;
      dispatch({
        type: 'SET_TRANSFORM',
        translateX: newTranslateX,
        translateY: newTranslateY,
        scale: state.scale,
      });
    }
  }, [layout, viewportSize, state.scale]);

  // Highlight a path of person IDs
  const handleHighlightPath = useCallback((personIds: string[]) => {
    dispatch({ type: 'HIGHLIGHT_PERSONS', personIds });
  }, []);

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

  // Touch state for pinch-to-zoom
  const [touchState, setTouchState] = useState<{
    initialDistance: number | null;
    initialScale: number;
    initialCenter: { x: number; y: number } | null;
  }>({
    initialDistance: null,
    initialScale: 1,
    initialCenter: null,
  });

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

      // Zoom towards mouse position
      const rect = (e.target as Element).getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const newScale = Math.max(0.1, Math.min(3.0, state.scale * delta));
      const scaleFactor = newScale / state.scale;

      const newTranslateX = mouseX - (mouseX - state.translateX) * scaleFactor;
      const newTranslateY = mouseY - (mouseY - state.translateY) * scaleFactor;

      dispatch({
        type: 'SET_TRANSFORM',
        translateX: newTranslateX,
        translateY: newTranslateY,
        scale: newScale,
      });
    },
    [state.scale, state.translateX, state.translateY]
  );

  // Touch handlers for mobile
  const handleTouchStart = useCallback((e: React.TouchEvent<SVGSVGElement>) => {
    if (e.touches.length === 2) {
      // Pinch start
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      const centerX = (touch1.clientX + touch2.clientX) / 2;
      const centerY = (touch1.clientY + touch2.clientY) / 2;

      setTouchState({
        initialDistance: distance,
        initialScale: state.scale,
        initialCenter: { x: centerX, y: centerY },
      });
    } else if (e.touches.length === 1) {
      // Pan start
      setIsPanning(true);
      setPanStart({
        x: e.touches[0].clientX - state.translateX,
        y: e.touches[0].clientY - state.translateY,
      });
    }
  }, [state.scale, state.translateX, state.translateY]);

  const handleTouchMove = useCallback((e: React.TouchEvent<SVGSVGElement>) => {
    if (e.touches.length === 2 && touchState.initialDistance && touchState.initialCenter) {
      // Pinch zoom
      e.preventDefault();
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );

      const scaleFactor = distance / touchState.initialDistance;
      const newScale = Math.max(0.1, Math.min(3.0, touchState.initialScale * scaleFactor));

      // Zoom towards pinch center
      const centerX = (touch1.clientX + touch2.clientX) / 2;
      const centerY = (touch1.clientY + touch2.clientY) / 2;

      const scaleRatio = newScale / state.scale;
      const newTranslateX = centerX - (centerX - state.translateX) * scaleRatio;
      const newTranslateY = centerY - (centerY - state.translateY) * scaleRatio;

      dispatch({
        type: 'SET_TRANSFORM',
        translateX: newTranslateX,
        translateY: newTranslateY,
        scale: newScale,
      });
    } else if (e.touches.length === 1 && isPanning) {
      // Pan
      const newTranslateX = e.touches[0].clientX - panStart.x;
      const newTranslateY = e.touches[0].clientY - panStart.y;
      dispatch({
        type: 'SET_TRANSFORM',
        translateX: newTranslateX,
        translateY: newTranslateY,
        scale: state.scale,
      });
    }
  }, [touchState, state.scale, state.translateX, state.translateY, isPanning, panStart]);

  const handleTouchEnd = useCallback(() => {
    setIsPanning(false);
    setTouchState({
      initialDistance: null,
      initialScale: 1,
      initialCenter: null,
    });
  }, []);

  const handleBackgroundClick = useCallback(() => {
    dispatch({ type: 'SELECT_PERSON', personId: null });
    dispatch({ type: 'CLEAR_HIGHLIGHTS' });
    setContextMenu({ isOpen: false, x: 0, y: 0, node: null });
  }, []);

  // Context menu handlers
  const handleContextMenuOpen = useCallback((node: TreeNodeType, event: React.MouseEvent) => {
    setContextMenu({
      isOpen: true,
      x: event.clientX,
      y: event.clientY,
      node,
    });
  }, []);

  const handleContextMenuClose = useCallback(() => {
    setContextMenu({ isOpen: false, x: 0, y: 0, node: null });
  }, []);

  // Minimap navigation
  const handleMinimapNavigate = useCallback((newTranslateX: number, newTranslateY: number) => {
    dispatch({
      type: 'SET_TRANSFORM',
      translateX: newTranslateX,
      translateY: newTranslateY,
      scale: state.scale,
    });
  }, [state.scale]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in an input
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }

      // Only handle if this component is focused
      if (!containerRef.current?.contains(document.activeElement) && document.activeElement !== document.body) {
        return;
      }

      switch (e.key) {
        case '+':
        case '=':
          e.preventDefault();
          dispatch({ type: 'ZOOM_IN' });
          break;
        case '-':
          e.preventDefault();
          dispatch({ type: 'ZOOM_OUT' });
          break;
        case '0':
          e.preventDefault();
          handleFitView();
          break;
        case 'Escape':
          dispatch({ type: 'SELECT_PERSON', personId: null });
          dispatch({ type: 'CLEAR_HIGHLIGHTS' });
          handleContextMenuClose();
          setIsDetailsPanelOpen(false);
          setIsRelationshipFinderOpen(false);
          setIsShortcutsOpen(false);
          break;
        case '?':
          e.preventDefault();
          setIsShortcutsOpen(prev => !prev);
          break;
        case 'r':
        case 'R':
          if (e.ctrlKey || e.metaKey) break; // Don't override browser refresh
          e.preventDefault();
          setIsRelationshipFinderOpen(prev => !prev);
          break;
        case 'Enter':
          if (state.selectedPersonId) {
            const node = layout?.nodes.find(n => n.id === state.selectedPersonId);
            if (node) {
              handleViewDetails(node.person);
            }
          }
          break;
        case 'ArrowUp':
        case 'ArrowDown':
        case 'ArrowLeft':
        case 'ArrowRight':
          if (state.selectedPersonId && layout) {
            e.preventDefault();
            navigateToAdjacentNode(e.key);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.selectedPersonId, layout, handleFitView, handleContextMenuClose, handleViewDetails]);

  // Navigate to adjacent node
  const navigateToAdjacentNode = useCallback((direction: string) => {
    if (!layout || !state.selectedPersonId) return;

    const currentNode = layout.nodes.find(n => n.id === state.selectedPersonId);
    if (!currentNode) return;

    let targetNode: TreeNodeType | null = null;

    switch (direction) {
      case 'ArrowUp':
        // Go to parent
        if (currentNode.parents.length > 0) {
          targetNode = currentNode.parents[0];
        }
        break;
      case 'ArrowDown':
        // Go to first child
        if (currentNode.children.length > 0) {
          targetNode = currentNode.children[0];
        }
        break;
      case 'ArrowLeft':
      case 'ArrowRight':
        // Go to sibling or spouse
        const isRight = (direction === 'ArrowRight') !== (locale === 'ar');
        if (currentNode.spouses.length > 0) {
          targetNode = currentNode.spouses[0].node;
        } else if (currentNode.parents.length > 0) {
          const parent = currentNode.parents[0];
          const siblingIndex = parent.children.findIndex(c => c.id === currentNode.id);
          const nextIndex = isRight ? siblingIndex + 1 : siblingIndex - 1;
          if (nextIndex >= 0 && nextIndex < parent.children.length) {
            targetNode = parent.children[nextIndex];
          }
        }
        break;
    }

    if (targetNode) {
      dispatch({ type: 'SELECT_PERSON', personId: targetNode.id });
      // Center view on the new node
      const newTranslateX = viewportSize.width / 2 - (targetNode.x + 110) * state.scale;
      const newTranslateY = viewportSize.height / 2 - (targetNode.y + 70) * state.scale;
      dispatch({
        type: 'SET_TRANSFORM',
        translateX: newTranslateX,
        translateY: newTranslateY,
        scale: state.scale,
      });
    }
  }, [layout, state.selectedPersonId, state.scale, viewportSize, locale]);

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
  const isFanLayout = state.layoutType === 'fan';

  return (
    <div
      ref={containerRef}
      className={cn('relative w-full h-full bg-gray-50 overflow-hidden', className)}
      dir={state.direction}
    >
      {/* Fan Chart View */}
      {isFanLayout ? (
        <div className="w-full h-full flex items-center justify-center overflow-auto p-4">
          <FanChart
            nodes={layout.nodes}
            rootPersonId={rootPersonId || layout.rootNode.id}
            locale={locale}
            onPersonClick={onPersonClick}
            onPersonDoubleClick={onPersonDoubleClick}
            maxGenerations={5}
            size={Math.min(viewportSize.width, viewportSize.height) - 40}
          />
        </div>
      ) : (
        /* Standard Tree SVG Canvas */
        <svg
          ref={svgRef}
          className="w-full h-full cursor-move select-none"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
          style={{ touchAction: 'none' }}
          tabIndex={0}
          aria-label={locale === 'ar' ? 'شجرة العائلة' : 'Family Tree'}
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

            {/* Connection lines - using culled connections for performance */}
            <ConnectionLines
              connections={visibleConnections}
              highlightedNodeIds={state.highlightedPersonIds}
            />

            {/* Person nodes - using culled nodes for performance */}
            <g className="person-nodes">
              {visibleNodes.map((node) =>
                useCompactNodes ? (
                  <CompactPersonNode
                    key={node.id}
                    node={node}
                    isSelected={state.selectedPersonId === node.id}
                    isHighlighted={state.highlightedPersonIds.has(node.id)}
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
                    onContextMenu={handleContextMenuOpen}
                    showPhotos={state.scale >= 0.6}
                    showDates={state.scale >= 0.45}
                    showPatronymic={state.scale >= 0.7}
                    branchColor={colorCodingEnabled ? branchColors[node.id] : undefined}
                  />
                )
              )}
            </g>
          </g>
        </svg>
      )}

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

      {/* Minimap */}
      {showMinimap && viewportSize.width > 768 && (
        <Minimap
          layout={layout}
          viewportWidth={viewportSize.width}
          viewportHeight={viewportSize.height}
          translateX={state.translateX}
          translateY={state.translateY}
          scale={state.scale}
          onNavigate={handleMinimapNavigate}
          locale={locale}
          selectedPersonId={state.selectedPersonId}
        />
      )}

      {/* Context Menu */}
      {contextMenu.isOpen && contextMenu.node && (
        <ContextMenu
          node={contextMenu.node}
          x={contextMenu.x}
          y={contextMenu.y}
          locale={locale}
          onClose={handleContextMenuClose}
          onAddChild={onAddChild ? (node) => onAddChild(node.person) : undefined}
          onAddSpouse={onAddSpouse ? (node) => onAddSpouse(node.person) : undefined}
          onAddParent={onAddParent ? (node) => onAddParent(node.person) : undefined}
          onEdit={onEdit ? (node) => onEdit(node.person) : undefined}
          onViewProfile={(node) => handleViewDetails(node.person)}
          onSetAsRoot={(node) => {
            dispatch({ type: 'SELECT_PERSON', personId: node.id });
            // Could dispatch a root change here if needed
          }}
          onCopyLink={(node) => {
            const url = `${window.location.origin}/${locale}/tree/${node.person.tree_id}?person=${node.id}`;
            navigator.clipboard.writeText(url);
          }}
          onDelete={onDelete ? (node) => onDelete(node.person) : undefined}
        />
      )}

      {/* Loading overlay for large trees */}
      {layout.nodes.length > 100 && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-white px-4 py-2 rounded-full shadow-lg text-xs text-gray-600">
          {locale === 'ar' ? `${layout.nodes.length} شخص` : `${layout.nodes.length} people`}
        </div>
      )}

      {/* Keyboard shortcuts hint */}
      <div className="absolute bottom-4 left-4 text-xs text-gray-400 hidden md:block">
        {locale === 'ar' ? (
          <span>اختصارات: ? للمساعدة • R للعلاقات • +/- للتكبير • Enter للتفاصيل</span>
        ) : (
          <span>Shortcuts: ? for help • R for relationships • +/- zoom • Enter for details</span>
        )}
      </div>

      {/* Generation Slider */}
      <GenerationSlider
        value={maxGenerations}
        min={1}
        max={10}
        onChange={setMaxGenerations}
        locale={locale}
        className="absolute top-4 left-4"
      />

      {/* Performance indicator for large trees */}
      {cullingEnabled && (
        <div className="absolute bottom-20 right-4 bg-white/90 px-3 py-1.5 rounded-full shadow text-xs text-gray-500">
          {locale === 'ar'
            ? `${renderedNodes}/${totalNodes} معروض`
            : `${renderedNodes}/${totalNodes} visible`}
        </div>
      )}

      {/* Details Side Panel */}
      <DetailsSidePanel
        node={selectedNodeForDetails}
        isOpen={isDetailsPanelOpen}
        onClose={() => setIsDetailsPanelOpen(false)}
        onSelectPerson={handleNavigateToPerson}
        onEdit={onEdit}
        locale={locale}
      />

      {/* Relationship Finder */}
      <RelationshipFinder
        nodes={layout?.nodes || []}
        isOpen={isRelationshipFinderOpen}
        onClose={() => setIsRelationshipFinderOpen(false)}
        onSelectPerson={handleNavigateToPerson}
        onHighlightPath={handleHighlightPath}
        locale={locale}
      />

      {/* Keyboard Shortcuts Panel */}
      <KeyboardShortcuts
        locale={locale}
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />
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
