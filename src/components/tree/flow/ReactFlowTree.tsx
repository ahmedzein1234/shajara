/**
 * ReactFlowTree Component
 * Modern infinite canvas family tree using React Flow
 * Features: smooth pan/zoom, minimap, keyboard navigation, touch support, search
 */

'use client';

import React, { useCallback, useMemo, useState, useEffect, useRef, memo } from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  BackgroundVariant,
  ConnectionMode,
  Panel,
  useOnViewportChange,
  Viewport,
  getNodesBounds,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { Person, Relationship } from '@/lib/db/schema';
import { cn } from '@/lib/utils';
import { FlowPersonNode, PersonNodeData } from './FlowPersonNode';
import { edgeTypes } from './FlowEdges';
import { TreeSearch } from './TreeSearch';
import {
  ZoomIn,
  ZoomOut,
  Maximize,
  Grid3X3,
  Map as MapIcon,
  Users,
  Keyboard,
  HelpCircle,
} from 'lucide-react';

// Node types registration
const nodeTypes = {
  person: FlowPersonNode,
};

// Layout constants
const NODE_WIDTH = 220;
const NODE_HEIGHT = 130;
const HORIZONTAL_SPACING = 100;
const VERTICAL_SPACING = 180;
const SPOUSE_SPACING = 50;

// Performance: Virtualization threshold
// Only enable heavy virtualization for large trees
const LARGE_TREE_THRESHOLD = 100;
const VIEWPORT_PADDING = 200; // Extra pixels around viewport for smoother scrolling

interface ReactFlowTreeProps {
  persons: Person[];
  relationships: Relationship[];
  rootPersonId?: string;
  locale?: 'ar' | 'en';
  onPersonClick?: (person: Person) => void;
  onPersonDoubleClick?: (person: Person) => void;
  onAddParent?: (person: Person) => void;
  onAddSpouse?: (person: Person) => void;
  onAddChild?: (person: Person) => void;
  className?: string;
}

// Calculate tree layout positions
function calculateLayout(
  persons: Person[],
  relationships: Relationship[],
  rootPersonId?: string
): { nodes: Node<PersonNodeData>[]; edges: Edge[] } {
  if (!persons || persons.length === 0) {
    return { nodes: [], edges: [] };
  }

  const personMap = new Map<string, Person>();
  persons.forEach(p => personMap.set(p.id, p));

  // Build relationship maps
  const childrenMap = new Map<string, string[]>();
  const parentsMap = new Map<string, string[]>();
  const spousesMap = new Map<string, Array<{ personId: string; rel: Relationship }>>();

  relationships.forEach(rel => {
    if (rel.relationship_type === 'parent') {
      const children = childrenMap.get(rel.person1_id) || [];
      children.push(rel.person2_id);
      childrenMap.set(rel.person1_id, children);

      const parents = parentsMap.get(rel.person2_id) || [];
      parents.push(rel.person1_id);
      parentsMap.set(rel.person2_id, parents);
    } else if (rel.relationship_type === 'spouse') {
      const spouses1 = spousesMap.get(rel.person1_id) || [];
      spouses1.push({ personId: rel.person2_id, rel });
      spousesMap.set(rel.person1_id, spouses1);

      const spouses2 = spousesMap.get(rel.person2_id) || [];
      spouses2.push({ personId: rel.person1_id, rel });
      spousesMap.set(rel.person2_id, spouses2);
    }
  });

  // Find root person
  let rootId = rootPersonId;
  if (!rootId || !personMap.has(rootId)) {
    const noParents = persons.filter(p => !parentsMap.has(p.id) || parentsMap.get(p.id)!.length === 0);
    if (noParents.length > 0) {
      noParents.sort((a, b) => {
        if (!a.birth_date) return 1;
        if (!b.birth_date) return -1;
        return new Date(a.birth_date).getTime() - new Date(b.birth_date).getTime();
      });
      rootId = noParents[0].id;
    } else {
      rootId = persons[0].id;
    }
  }

  const nodes: Node<PersonNodeData>[] = [];
  const edges: Edge[] = [];
  const positioned = new Set<string>();
  const levelMap = new Map<string, number>();

  function positionSubtree(personId: string, x: number, level: number): number {
    if (positioned.has(personId)) return 0;
    positioned.add(personId);
    levelMap.set(personId, level);

    const person = personMap.get(personId);
    if (!person) return 0;

    const children = childrenMap.get(personId) || [];
    const spouses = spousesMap.get(personId) || [];

    let totalWidth = NODE_WIDTH;
    const unpositionedSpouses = spouses.filter(s => !positioned.has(s.personId));
    totalWidth += unpositionedSpouses.length * (NODE_WIDTH + SPOUSE_SPACING);

    let childrenWidth = 0;
    const childWidths: number[] = [];
    children.forEach(childId => {
      if (!positioned.has(childId)) {
        const width = calculateSubtreeWidth(childId, positioned);
        childWidths.push(width);
        childrenWidth += width;
      }
    });

    if (children.length > 1) {
      childrenWidth += (children.length - 1) * HORIZONTAL_SPACING;
    }

    totalWidth = Math.max(totalWidth, childrenWidth);

    nodes.push({
      id: personId,
      type: 'person',
      position: { x, y: level * VERTICAL_SPACING },
      data: {
        person,
        isRoot: personId === rootId,
        locale: 'ar',
      },
    });

    let spouseX = x + NODE_WIDTH + SPOUSE_SPACING;
    unpositionedSpouses.forEach(spouse => {
      const spousePerson = personMap.get(spouse.personId);
      if (spousePerson) {
        positioned.add(spouse.personId);
        levelMap.set(spouse.personId, level);

        nodes.push({
          id: spouse.personId,
          type: 'person',
          position: { x: spouseX, y: level * VERTICAL_SPACING },
          data: {
            person: spousePerson,
            locale: 'ar',
          },
        });

        edges.push({
          id: `spouse-${personId}-${spouse.personId}`,
          source: personId,
          target: spouse.personId,
          sourceHandle: 'spouse-right',
          targetHandle: 'spouse-left',
          type: 'spouse',
          data: {
            marriageYear: spouse.rel.marriage_date
              ? new Date(spouse.rel.marriage_date).getFullYear()
              : undefined,
            isDivorced: !!spouse.rel.divorce_date,
          },
        });

        spouseX += NODE_WIDTH + SPOUSE_SPACING;
      }
    });

    let childX = x + totalWidth / 2 - childrenWidth / 2;
    children.forEach((childId, idx) => {
      if (!positioned.has(childId)) {
        const childWidth = childWidths[idx] || NODE_WIDTH;
        positionSubtree(childId, childX, level + 1);

        edges.push({
          id: `parent-${personId}-${childId}`,
          source: personId,
          target: childId,
          type: 'parentChild',
        });

        childX += childWidth + HORIZONTAL_SPACING;
      }
    });

    return totalWidth;
  }

  function calculateSubtreeWidth(personId: string, skip: Set<string>): number {
    if (skip.has(personId)) return 0;

    const children = childrenMap.get(personId) || [];
    const spouses = spousesMap.get(personId) || [];

    let width = NODE_WIDTH;
    width += spouses.filter(s => !skip.has(s.personId)).length * (NODE_WIDTH + SPOUSE_SPACING);

    let childrenWidth = 0;
    children.forEach(childId => {
      if (!skip.has(childId)) {
        childrenWidth += calculateSubtreeWidth(childId, new Set([...skip, personId]));
      }
    });

    if (children.length > 1) {
      childrenWidth += (children.length - 1) * HORIZONTAL_SPACING;
    }

    return Math.max(width, childrenWidth);
  }

  if (rootId) {
    positionSubtree(rootId, 0, 0);
  }

  let disconnectedX = 0;
  const maxLevel = levelMap.size > 0 ? Math.max(...Array.from(levelMap.values())) : 0;
  let disconnectedY = (maxLevel + 2) * VERTICAL_SPACING;

  persons.forEach(person => {
    if (!positioned.has(person.id)) {
      nodes.push({
        id: person.id,
        type: 'person',
        position: { x: disconnectedX, y: disconnectedY },
        data: {
          person,
          locale: 'ar',
        },
      });
      disconnectedX += NODE_WIDTH + HORIZONTAL_SPACING;
    }
  });

  return { nodes, edges };
}

// Inner component with React Flow hooks access
function ReactFlowTreeInner({
  persons,
  relationships,
  rootPersonId,
  locale = 'ar',
  onPersonClick,
  onPersonDoubleClick,
  onAddParent,
  onAddSpouse,
  onAddChild,
  className,
}: ReactFlowTreeProps) {
  const { fitView, zoomIn, zoomOut, setCenter, getNode } = useReactFlow();
  const [showMinimap, setShowMinimap] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [showHelp, setShowHelp] = useState(false);
  const [highlightedPersonId, setHighlightedPersonId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Performance: Check if this is a large tree that needs virtualization
  const isLargeTree = persons.length > LARGE_TREE_THRESHOLD;

  // Calculate initial layout
  const initialLayout = useMemo(
    () => calculateLayout(persons, relationships, rootPersonId),
    [persons, relationships, rootPersonId]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialLayout.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialLayout.edges);

  // Update nodes with handlers and highlight state
  useEffect(() => {
    setNodes(prevNodes =>
      prevNodes.map(node => ({
        ...node,
        data: {
          ...node.data,
          locale,
          onViewDetails: onPersonClick,
          onAddParent,
          onAddSpouse,
          onAddChild,
          isHighlighted: node.id === highlightedPersonId,
        },
      }))
    );
  }, [locale, onPersonClick, onAddParent, onAddSpouse, onAddChild, setNodes, highlightedPersonId]);

  // Fit view on initial load
  useEffect(() => {
    setTimeout(() => {
      fitView({ padding: 0.2, duration: 500 });
    }, 100);
  }, [fitView]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key) {
        case '=':
        case '+':
          e.preventDefault();
          zoomIn({ duration: 200 });
          break;
        case '-':
          e.preventDefault();
          zoomOut({ duration: 200 });
          break;
        case '0':
          e.preventDefault();
          fitView({ duration: 300, padding: 0.2 });
          break;
        case 'g':
          e.preventDefault();
          setShowGrid(prev => !prev);
          break;
        case 'm':
          e.preventDefault();
          setShowMinimap(prev => !prev);
          break;
        case '?':
          e.preventDefault();
          setShowHelp(prev => !prev);
          break;
        case 'Escape':
          setShowHelp(false);
          setHighlightedPersonId(null);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [zoomIn, zoomOut, fitView]);

  // Handle node double click
  const onNodeDoubleClick = useCallback(
    (_: React.MouseEvent, node: Node<PersonNodeData>) => {
      onPersonDoubleClick?.(node.data.person);
    },
    [onPersonDoubleClick]
  );

  // Handle search selection - focus on selected person
  const handleSearchSelect = useCallback((person: Person) => {
    const node = getNode(person.id);
    if (node) {
      setCenter(
        node.position.x + NODE_WIDTH / 2,
        node.position.y + NODE_HEIGHT / 2,
        { zoom: 1.2, duration: 500 }
      );
      setHighlightedPersonId(person.id);

      // Clear highlight after animation
      setTimeout(() => {
        setHighlightedPersonId(null);
      }, 2000);
    }

    onPersonClick?.(person);
  }, [getNode, setCenter, onPersonClick]);

  return (
    <div ref={containerRef} className={cn('w-full h-full relative', className)} data-tour="tree-view">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDoubleClick={onNodeDoubleClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        connectionMode={ConnectionMode.Loose}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={2}
        defaultEdgeOptions={{
          animated: false,
        }}
        proOptions={{ hideAttribution: true }}
        className="bg-gradient-to-br from-slate-50 via-white to-slate-100"
        // Performance optimizations for large trees
        onlyRenderVisibleElements={isLargeTree}
        nodesDraggable={false} // Disable dragging for better performance (tree is auto-positioned)
        nodesConnectable={false} // Disable connections (we manage relationships via forms)
        elementsSelectable={true}
        selectNodesOnDrag={false}
        panOnScroll={true}
        zoomOnScroll={true}
        zoomOnDoubleClick={false} // Disable to use double-click for viewing details
      >
        {/* Background grid */}
        {showGrid && (
          <Background
            variant={BackgroundVariant.Dots}
            gap={24}
            size={1.5}
            color="#cbd5e1"
          />
        )}

        {/* Search panel - top left */}
        <Panel position="top-left" className="m-4">
          <TreeSearch
            persons={persons}
            locale={locale}
            onSelectPerson={handleSearchSelect}
            onHighlightPerson={setHighlightedPersonId}
          />
        </Panel>

        {/* Controls panel - top right */}
        {/* WCAG 2.1 AA: All touch targets are min 44x44px */}
        <Panel position="top-right" className="m-4">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200 p-1.5 flex flex-col gap-1" data-tour="nav-controls">
            <button
              onClick={() => zoomIn({ duration: 200 })}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-gray-100 rounded-xl transition-colors group"
              title={locale === 'ar' ? 'تكبير (+)' : 'Zoom in (+)'}
              aria-label={locale === 'ar' ? 'تكبير' : 'Zoom in'}
            >
              <ZoomIn size={20} className="text-gray-600 group-hover:text-emerald-600" />
            </button>
            <button
              onClick={() => zoomOut({ duration: 200 })}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-gray-100 rounded-xl transition-colors group"
              title={locale === 'ar' ? 'تصغير (-)' : 'Zoom out (-)'}
              aria-label={locale === 'ar' ? 'تصغير' : 'Zoom out'}
            >
              <ZoomOut size={20} className="text-gray-600 group-hover:text-emerald-600" />
            </button>
            <button
              onClick={() => fitView({ duration: 500, padding: 0.2 })}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-gray-100 rounded-xl transition-colors group"
              title={locale === 'ar' ? 'ملائمة العرض (0)' : 'Fit view (0)'}
              aria-label={locale === 'ar' ? 'ملائمة العرض' : 'Fit view'}
            >
              <Maximize size={20} className="text-gray-600 group-hover:text-emerald-600" />
            </button>

            <div className="h-px bg-gray-200 my-1" />

            <button
              onClick={() => setShowGrid(!showGrid)}
              className={cn(
                'min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl transition-colors',
                showGrid ? 'bg-emerald-100 text-emerald-600' : 'hover:bg-gray-100 text-gray-600'
              )}
              title={locale === 'ar' ? 'إظهار الشبكة (G)' : 'Toggle grid (G)'}
              aria-label={locale === 'ar' ? 'إظهار الشبكة' : 'Toggle grid'}
              aria-pressed={showGrid}
            >
              <Grid3X3 size={20} />
            </button>
            <button
              onClick={() => setShowMinimap(!showMinimap)}
              className={cn(
                'min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl transition-colors',
                showMinimap ? 'bg-emerald-100 text-emerald-600' : 'hover:bg-gray-100 text-gray-600'
              )}
              title={locale === 'ar' ? 'إظهار الخريطة (M)' : 'Toggle minimap (M)'}
              aria-label={locale === 'ar' ? 'إظهار الخريطة' : 'Toggle minimap'}
              aria-pressed={showMinimap}
            >
              <MapIcon size={20} />
            </button>

            <div className="h-px bg-gray-200 my-1" />

            <button
              onClick={() => setShowHelp(!showHelp)}
              className={cn(
                'min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl transition-colors',
                showHelp ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100 text-gray-600'
              )}
              title={locale === 'ar' ? 'اختصارات لوحة المفاتيح (?)' : 'Keyboard shortcuts (?)'}
              aria-label={locale === 'ar' ? 'اختصارات لوحة المفاتيح' : 'Keyboard shortcuts'}
              aria-pressed={showHelp}
            >
              <Keyboard size={20} />
            </button>
          </div>
        </Panel>

        {/* Stats panel - bottom left */}
        <Panel position="bottom-left" className="m-4">
          <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 px-4 py-2.5 flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-emerald-500" />
              <span className="text-sm font-medium text-gray-700">
                {persons.length} {locale === 'ar' ? 'فرد' : 'members'}
              </span>
            </div>
            <div className="w-px h-4 bg-gray-200" />
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className="w-3 h-3 rounded bg-blue-400" />
              <span>{locale === 'ar' ? 'ذكور' : 'Male'}</span>
              <span className="w-3 h-3 rounded bg-pink-400 ml-2" />
              <span>{locale === 'ar' ? 'إناث' : 'Female'}</span>
            </div>
            {/* Performance mode indicator for large trees */}
            {isLargeTree && (
              <>
                <div className="w-px h-4 bg-gray-200" />
                <div className="flex items-center gap-1 text-xs text-emerald-600" title={locale === 'ar' ? 'وضع الأداء العالي مُفعّل' : 'Performance mode enabled'}>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>{locale === 'ar' ? 'أداء عالي' : 'Optimized'}</span>
                </div>
              </>
            )}
          </div>
        </Panel>

        {/* Minimap */}
        {showMinimap && (
          <MiniMap
            nodeColor={(node) => {
              const data = node.data as PersonNodeData;
              if (node.id === highlightedPersonId) return '#fbbf24';
              return data?.person?.gender === 'male' ? '#3b82f6' : '#ec4899';
            }}
            nodeStrokeWidth={3}
            zoomable
            pannable
            className="!bg-white/90 !backdrop-blur-sm !border !border-gray-200 !rounded-2xl !shadow-lg !m-4"
            style={{ width: 180, height: 120 }}
          />
        )}
      </ReactFlow>

      {/* Keyboard shortcuts help overlay */}
      {showHelp && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md mx-4 animate-in fade-in-0 zoom-in-95">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Keyboard size={20} className="text-emerald-500" />
                {locale === 'ar' ? 'اختصارات لوحة المفاتيح' : 'Keyboard Shortcuts'}
              </h3>
              <button
                onClick={() => setShowHelp(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-sm">
              {[
                { key: '+', desc: locale === 'ar' ? 'تكبير' : 'Zoom in' },
                { key: '-', desc: locale === 'ar' ? 'تصغير' : 'Zoom out' },
                { key: '0', desc: locale === 'ar' ? 'ملائمة العرض' : 'Fit view' },
                { key: 'G', desc: locale === 'ar' ? 'إظهار/إخفاء الشبكة' : 'Toggle grid' },
                { key: 'M', desc: locale === 'ar' ? 'إظهار/إخفاء الخريطة' : 'Toggle minimap' },
                { key: '/', desc: locale === 'ar' ? 'البحث' : 'Focus search' },
                { key: 'Esc', desc: locale === 'ar' ? 'إغلاق' : 'Close / Clear' },
              ].map(({ key, desc }) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-gray-600">{desc}</span>
                  <kbd className="px-2 py-1 bg-gray-100 rounded text-xs font-mono text-gray-700">
                    {key}
                  </kbd>
                </div>
              ))}
            </div>

            <p className="mt-4 text-xs text-gray-400 text-center">
              {locale === 'ar' ? 'اضغط ? لفتح هذه النافذة' : 'Press ? to open this dialog'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// Main component wrapped with provider
export function ReactFlowTree(props: ReactFlowTreeProps) {
  return (
    <ReactFlowProvider>
      <ReactFlowTreeInner {...props} />
    </ReactFlowProvider>
  );
}

export default ReactFlowTree;
