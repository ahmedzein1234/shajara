/**
 * useTreeLayout Hook
 * Calculates positions for family tree nodes using a hierarchical layout algorithm
 * Supports RTL layout and multiple spouses
 */

import { useMemo } from 'react';
import { Person, Relationship } from '@/lib/db/schema';
import {
  TreeNode,
  TreeLayout,
  TreeLayoutConfig,
  TreeData,
  BuildTreeOptions,
  ConnectionLine,
  SpouseInfo,
} from '@/types/tree';

/**
 * Default layout configuration
 */
const DEFAULT_CONFIG: TreeLayoutConfig = {
  layoutType: 'descendants',
  direction: 'rtl', // Arabic default
  nodeWidth: 200,
  nodeHeight: 120,
  horizontalSpacing: 60,
  verticalSpacing: 100,
  spouseSpacing: 40,
  showSiblings: true,
};

/**
 * Hook to calculate tree layout from raw data
 */
export function useTreeLayout(
  treeData: TreeData,
  config: Partial<TreeLayoutConfig> = {},
  buildOptions: BuildTreeOptions = {}
): TreeLayout | null {
  const fullConfig = useMemo(() => ({ ...DEFAULT_CONFIG, ...config }), [config]);

  return useMemo(() => {
    if (!treeData.persons.length) return null;

    try {
      // Build tree structure from raw data
      const nodes = buildTreeStructure(treeData, buildOptions);
      if (!nodes.length) return null;

      // Find root node
      const rootNode = findRootNode(nodes, treeData.rootPersonId);
      if (!rootNode) return null;

      // Calculate positions based on layout type
      calculateNodePositions(rootNode, fullConfig);

      // Generate connection lines
      const connections = generateConnections(nodes, fullConfig);

      // Calculate bounding box
      const boundingBox = calculateBoundingBox(nodes, fullConfig);

      return {
        nodes,
        connections,
        rootNode,
        ...boundingBox,
      };
    } catch (error) {
      console.error('Error calculating tree layout:', error);
      return null;
    }
  }, [treeData, fullConfig, buildOptions]);
}

/**
 * Build tree structure from raw persons and relationships
 */
function buildTreeStructure(data: TreeData, options: BuildTreeOptions): TreeNode[] {
  const { persons, relationships } = data;
  const nodeMap = new Map<string, TreeNode>();

  // Create nodes for all persons
  persons.forEach((person) => {
    nodeMap.set(person.id, {
      id: person.id,
      person,
      x: 0,
      y: 0,
      level: 0,
      parents: [],
      children: [],
      spouses: [],
      subtreeWidth: 0,
      isCollapsed: false,
      isHighlighted: false,
    });
  });

  // Build relationships
  relationships.forEach((rel) => {
    const person1 = nodeMap.get(rel.person1_id);
    const person2 = nodeMap.get(rel.person2_id);

    if (!person1 || !person2) return;

    if (rel.relationship_type === 'parent') {
      // person1 is parent of person2
      if (!person1.children.some((c) => c.id === person2.id)) {
        person1.children.push(person2);
      }
      if (!person2.parents.some((p) => p.id === person1.id)) {
        person2.parents.push(person1);
      }
    } else if (rel.relationship_type === 'spouse') {
      // Add spouse relationship
      const spouse1Info: SpouseInfo = {
        node: person2,
        relationship: rel,
        children: [],
      };
      const spouse2Info: SpouseInfo = {
        node: person1,
        relationship: rel,
        children: [],
      };

      if (!person1.spouses.some((s) => s.node.id === person2.id)) {
        person1.spouses.push(spouse1Info);
      }
      if (!person2.spouses.some((s) => s.node.id === person1.id)) {
        person2.spouses.push(spouse2Info);
      }

      // Find common children
      const commonChildren = Array.from(nodeMap.values()).filter(
        (node) =>
          node.parents.some((p) => p.id === person1.id) &&
          node.parents.some((p) => p.id === person2.id)
      );

      spouse1Info.children = commonChildren;
      spouse2Info.children = commonChildren;
    }
  });

  return Array.from(nodeMap.values());
}

/**
 * Find root node for the tree
 */
function findRootNode(nodes: TreeNode[], preferredRootId?: string): TreeNode | null {
  if (preferredRootId) {
    const preferred = nodes.find((n) => n.id === preferredRootId);
    if (preferred) return preferred;
  }

  // Find oldest ancestor (person with no parents)
  const nodesWithoutParents = nodes.filter((n) => n.parents.length === 0);
  if (nodesWithoutParents.length > 0) {
    return nodesWithoutParents[0];
  }

  // Fallback to first person
  return nodes[0] || null;
}

/**
 * Calculate positions for all nodes using Walker's algorithm (modified for RTL)
 */
function calculateNodePositions(rootNode: TreeNode, config: TreeLayoutConfig): void {
  // Assign levels (generation depth)
  assignLevels(rootNode, 0);

  // Calculate subtree widths
  calculateSubtreeWidths(rootNode, config);

  // Position nodes
  positionNodes(rootNode, 0, 0, config);
}

/**
 * Assign generation levels to nodes (BFS)
 */
function assignLevels(node: TreeNode, level: number, visited = new Set<string>()): void {
  if (visited.has(node.id)) return;
  visited.add(node.id);

  node.level = level;

  // Process children
  node.children.forEach((child) => assignLevels(child, level + 1, visited));

  // Process spouses at same level
  node.spouses.forEach((spouse) => assignLevels(spouse.node, level, visited));
}

/**
 * Calculate width of subtree for each node
 */
function calculateSubtreeWidths(node: TreeNode, config: TreeLayoutConfig): number {
  if (node.isCollapsed || node.children.length === 0) {
    node.subtreeWidth = config.nodeWidth;
    return config.nodeWidth;
  }

  // Calculate total width needed for all children
  let totalWidth = 0;
  node.children.forEach((child) => {
    totalWidth += calculateSubtreeWidths(child, config);
  });

  // Add spacing between children
  if (node.children.length > 1) {
    totalWidth += (node.children.length - 1) * config.horizontalSpacing;
  }

  // Account for spouses
  const spouseWidth = node.spouses.length * (config.nodeWidth + config.spouseSpacing);
  node.subtreeWidth = Math.max(totalWidth, config.nodeWidth + spouseWidth);

  return node.subtreeWidth;
}

/**
 * Position nodes in 2D space
 */
function positionNodes(
  node: TreeNode,
  x: number,
  y: number,
  config: TreeLayoutConfig,
  visited = new Set<string>()
): void {
  if (visited.has(node.id)) return;
  visited.add(node.id);

  // Position this node
  node.x = x;
  node.y = y;

  // Position spouses next to this person
  let spouseX = x;
  node.spouses.forEach((spouse, index) => {
    spouseX += config.nodeWidth + config.spouseSpacing;
    spouse.node.x = spouseX;
    spouse.node.y = y;
    visited.add(spouse.node.id);
  });

  // Position children below
  if (node.children.length > 0 && !node.isCollapsed) {
    const childrenY = y + config.nodeHeight + config.verticalSpacing;

    // Calculate starting X for children (center them under parent)
    const totalChildrenWidth = node.children.reduce(
      (sum, child, idx) =>
        sum + child.subtreeWidth + (idx > 0 ? config.horizontalSpacing : 0),
      0
    );

    let childX = x + node.subtreeWidth / 2 - totalChildrenWidth / 2;

    // Position each child
    node.children.forEach((child) => {
      positionNodes(child, childX, childrenY, config, visited);
      childX += child.subtreeWidth + config.horizontalSpacing;
    });
  }
}

/**
 * Generate connection lines between nodes
 */
function generateConnections(nodes: TreeNode[], config: TreeLayoutConfig): ConnectionLine[] {
  const connections: ConnectionLine[] = [];
  const processedPairs = new Set<string>();

  nodes.forEach((node) => {
    // Parent-child connections
    node.children.forEach((child) => {
      const pairKey = `${node.id}-${child.id}`;
      if (processedPairs.has(pairKey)) return;
      processedPairs.add(pairKey);

      connections.push({
        id: `pc-${node.id}-${child.id}`,
        type: 'parent-child',
        from: node,
        to: child,
        path: generateParentChildPath(node, child, config),
        color: '#64748b', // Slate color
        strokeWidth: 2,
        isDashed: false,
      });
    });

    // Spouse connections
    node.spouses.forEach((spouse) => {
      const pairKey = [node.id, spouse.node.id].sort().join('-');
      if (processedPairs.has(pairKey)) return;
      processedPairs.add(pairKey);

      const isDivorced = !!spouse.relationship.divorce_date;

      connections.push({
        id: `sp-${pairKey}`,
        type: 'spouse',
        from: node,
        to: spouse.node,
        relationship: spouse.relationship,
        path: generateSpousePath(node, spouse.node, config),
        color: isDivorced ? '#ef4444' : '#10b981', // Red if divorced, green otherwise
        strokeWidth: 2,
        isDashed: isDivorced,
      });
    });
  });

  return connections;
}

/**
 * Generate SVG path for parent-child connection
 */
function generateParentChildPath(parent: TreeNode, child: TreeNode, config: TreeLayoutConfig): string {
  const startX = parent.x + config.nodeWidth / 2;
  const startY = parent.y + config.nodeHeight;
  const endX = child.x + config.nodeWidth / 2;
  const endY = child.y;

  const midY = (startY + endY) / 2;

  // Curved path
  return `M ${startX} ${startY} L ${startX} ${midY} L ${endX} ${midY} L ${endX} ${endY}`;
}

/**
 * Generate SVG path for spouse connection
 */
function generateSpousePath(person1: TreeNode, person2: TreeNode, config: TreeLayoutConfig): string {
  const x1 = person1.x + config.nodeWidth;
  const y1 = person1.y + config.nodeHeight / 2;
  const x2 = person2.x;
  const y2 = person2.y + config.nodeHeight / 2;

  // Straight horizontal line
  return `M ${x1} ${y1} L ${x2} ${y2}`;
}

/**
 * Calculate bounding box for the tree
 */
function calculateBoundingBox(
  nodes: TreeNode[],
  config: TreeLayoutConfig
): { minX: number; maxX: number; minY: number; maxY: number; width: number; height: number } {
  if (nodes.length === 0) {
    return { minX: 0, maxX: 0, minY: 0, maxY: 0, width: 0, height: 0 };
  }

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  nodes.forEach((node) => {
    minX = Math.min(minX, node.x);
    maxX = Math.max(maxX, node.x + config.nodeWidth);
    minY = Math.min(minY, node.y);
    maxY = Math.max(maxY, node.y + config.nodeHeight);
  });

  const padding = 50;
  return {
    minX: minX - padding,
    maxX: maxX + padding,
    minY: minY - padding,
    maxY: maxY + padding,
    width: maxX - minX + 2 * padding,
    height: maxY - minY + 2 * padding,
  };
}

/**
 * Hook to calculate transform for centering tree
 */
export function useCenterTransform(
  layout: TreeLayout | null,
  viewportWidth: number,
  viewportHeight: number
): { translateX: number; translateY: number; scale: number } {
  return useMemo(() => {
    if (!layout) return { translateX: 0, translateY: 0, scale: 1 };

    // Calculate scale to fit tree in viewport
    const scaleX = viewportWidth / layout.width;
    const scaleY = viewportHeight / layout.height;
    const scale = Math.min(scaleX, scaleY, 1.0); // Don't scale up

    // Center the tree
    const translateX = (viewportWidth - layout.width * scale) / 2 - layout.minX * scale;
    const translateY = (viewportHeight - layout.height * scale) / 2 - layout.minY * scale;

    return { translateX, translateY, scale };
  }, [layout, viewportWidth, viewportHeight]);
}

/**
 * Search nodes by name
 */
export function searchNodes(nodes: TreeNode[], query: string): TreeNode[] {
  if (!query.trim()) return [];

  const lowerQuery = query.toLowerCase();
  return nodes.filter((node) => {
    const person = node.person;
    return (
      person.given_name.toLowerCase().includes(lowerQuery) ||
      person.full_name_ar?.toLowerCase().includes(lowerQuery) ||
      person.full_name_en?.toLowerCase().includes(lowerQuery) ||
      person.family_name?.toLowerCase().includes(lowerQuery)
    );
  });
}
