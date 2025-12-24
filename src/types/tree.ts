/**
 * TypeScript types for Family Tree Visualization
 * Shajara - Arabic Family Tree Application
 */

import { Person, Relationship } from '@/lib/db/schema';

// =====================================================
// TREE NODE TYPES
// =====================================================

/**
 * Tree node representing a person in the family tree visualization
 */
export interface TreeNode {
  id: string;
  person: Person;

  // Position in tree
  x: number;
  y: number;
  level: number; // Generation level (0 = root, positive = descendants, negative = ancestors)

  // Relationships
  parents: TreeNode[];
  children: TreeNode[];
  spouses: SpouseInfo[];

  // Layout metadata
  subtreeWidth: number; // Width of this person's subtree
  isCollapsed: boolean; // Whether descendants are hidden
  isHighlighted: boolean; // For search/selection
}

/**
 * Spouse information with relationship details
 */
export interface SpouseInfo {
  node: TreeNode;
  relationship: Relationship;
  children: TreeNode[]; // Children from this specific relationship
}

// =====================================================
// CONNECTION LINE TYPES
// =====================================================

/**
 * Types of connections between nodes
 */
export type ConnectionType = 'parent-child' | 'spouse' | 'sibling';

/**
 * Line segment connecting two nodes
 */
export interface ConnectionLine {
  id: string;
  type: ConnectionType;
  from: TreeNode;
  to: TreeNode;
  relationship?: Relationship;

  // Path coordinates for SVG
  path: string; // SVG path data
  color: string;
  strokeWidth: number;
  isDashed: boolean; // For divorced spouses, etc.
}

// =====================================================
// TREE LAYOUT TYPES
// =====================================================

/**
 * Layout algorithm type
 */
export type LayoutType = 'descendants' | 'ancestors' | 'hourglass' | 'full';

/**
 * Layout direction for RTL support
 */
export type LayoutDirection = 'ltr' | 'rtl';

/**
 * Configuration for tree layout calculation
 */
export interface TreeLayoutConfig {
  // Layout settings
  layoutType: LayoutType;
  direction: LayoutDirection;

  // Spacing
  nodeWidth: number;
  nodeHeight: number;
  horizontalSpacing: number; // Space between siblings
  verticalSpacing: number; // Space between generations
  spouseSpacing: number; // Space between spouses

  // Behavior
  maxGenerations?: number; // Limit tree depth
  centerOnPerson?: string; // Person ID to center on
  showSiblings: boolean;
}

/**
 * Calculated layout result
 */
export interface TreeLayout {
  nodes: TreeNode[];
  connections: ConnectionLine[];

  // Bounding box
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  width: number;
  height: number;

  // Root node
  rootNode: TreeNode;
}

// =====================================================
// TREE VIEW STATE
// =====================================================

/**
 * State for the tree view component
 */
export interface TreeViewState {
  // Selection
  selectedPersonId: string | null;
  highlightedPersonIds: Set<string>;

  // View transform
  scale: number; // Zoom level (0.1 to 3.0)
  translateX: number;
  translateY: number;

  // Layout
  layoutType: LayoutType;
  direction: LayoutDirection;

  // Collapsed nodes
  collapsedNodeIds: Set<string>;

  // Search
  searchQuery: string;
  searchResults: TreeNode[];
}

/**
 * Actions for tree view state
 */
export type TreeViewAction =
  | { type: 'SELECT_PERSON'; personId: string | null }
  | { type: 'HIGHLIGHT_PERSONS'; personIds: string[] }
  | { type: 'CLEAR_HIGHLIGHTS' }
  | { type: 'SET_ZOOM'; scale: number }
  | { type: 'SET_TRANSFORM'; translateX: number; translateY: number; scale: number }
  | { type: 'ZOOM_IN' }
  | { type: 'ZOOM_OUT' }
  | { type: 'RESET_VIEW' }
  | { type: 'TOGGLE_LAYOUT'; layoutType: LayoutType }
  | { type: 'TOGGLE_DIRECTION' }
  | { type: 'TOGGLE_COLLAPSE'; nodeId: string }
  | { type: 'SEARCH'; query: string }
  | { type: 'CLEAR_SEARCH' };

// =====================================================
// TREE DATA PREPARATION
// =====================================================

/**
 * Raw tree data from database
 */
export interface TreeData {
  persons: Person[];
  relationships: Relationship[];
  rootPersonId?: string; // Optional starting person
}

/**
 * Options for building tree from data
 */
export interface BuildTreeOptions {
  rootPersonId?: string;
  maxGenerations?: number;
  includeAncestors?: boolean;
  includeDescendants?: boolean;
  includeSiblings?: boolean;
}

// =====================================================
// EXPORT TYPES
// =====================================================

/**
 * Export format for tree images
 */
export type ExportFormat = 'png' | 'jpeg' | 'svg' | 'pdf';

/**
 * Export options
 */
export interface ExportOptions {
  format: ExportFormat;
  quality?: number; // 0-1 for jpeg
  backgroundColor?: string;
  scale?: number; // Resolution multiplier
  includeWatermark?: boolean;
}

// =====================================================
// INTERACTION TYPES
// =====================================================

/**
 * Event handlers for tree interactions
 */
export interface TreeInteractionHandlers {
  onPersonClick?: (person: Person) => void;
  onPersonHover?: (person: Person | null) => void;
  onPersonDoubleClick?: (person: Person) => void;
  onRelationshipClick?: (relationship: Relationship) => void;
  onBackgroundClick?: () => void;
}

// =====================================================
// ANIMATION TYPES
// =====================================================

/**
 * Animation configuration
 */
export interface AnimationConfig {
  enabled: boolean;
  duration: number; // milliseconds
  easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
}

// =====================================================
// STYLING TYPES
// =====================================================

/**
 * Color scheme for gender/relationship types
 */
export interface TreeColorScheme {
  male: string;
  female: string;
  unknown: string;
  parentChildLine: string;
  spouseLine: string;
  siblingLine: string;
  divorcedLine: string;
  background: string;
  highlight: string;
  selection: string;
}

/**
 * Custom styling options for tree
 */
export interface TreeStyleConfig {
  colorScheme: TreeColorScheme;
  fontFamily: string;
  fontSize: number;
  showPhotos: boolean;
  showDates: boolean;
  showPatronymic: boolean;
  nodeShape: 'rectangle' | 'rounded' | 'circle' | 'hexagon';
  lineStyle: 'straight' | 'curved' | 'stepped';
}

// =====================================================
// HELPER TYPES
// =====================================================

/**
 * Position in 2D space
 */
export interface Position {
  x: number;
  y: number;
}

/**
 * Size dimensions
 */
export interface Dimensions {
  width: number;
  height: number;
}

/**
 * Bounding box
 */
export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}
