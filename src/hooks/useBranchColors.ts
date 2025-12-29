/**
 * useBranchColors Hook
 * Calculates unique colors for different family branches
 * Paternal lines get blue-ish colors, maternal lines get pink-ish colors
 */

import { useMemo } from 'react';
import { TreeNode } from '@/types/tree';

// Color palettes for different branches
const PATERNAL_COLORS = [
  '#3b82f6', // Blue 500
  '#2563eb', // Blue 600
  '#1d4ed8', // Blue 700
  '#4f46e5', // Indigo 600
  '#7c3aed', // Violet 600
  '#6366f1', // Indigo 500
  '#0ea5e9', // Sky 500
  '#06b6d4', // Cyan 500
];

const MATERNAL_COLORS = [
  '#ec4899', // Pink 500
  '#db2777', // Pink 600
  '#be185d', // Pink 700
  '#e11d48', // Rose 600
  '#f43f5e', // Rose 500
  '#f97316', // Orange 500
  '#ef4444', // Red 500
  '#f59e0b', // Amber 500
];

const NEUTRAL_COLORS = [
  '#6b7280', // Gray 500
  '#8b5cf6', // Violet 500
  '#22c55e', // Green 500
  '#14b8a6', // Teal 500
];

export interface BranchColorMap {
  [personId: string]: string;
}

export interface UseBranchColorsResult {
  colorMap: BranchColorMap;
  getBranchColor: (personId: string) => string | undefined;
  legend: Array<{ branch: string; color: string }>;
}

/**
 * Determines branch colors based on ancestral lineage
 */
export function useBranchColors(
  nodes: TreeNode[] | undefined,
  rootPersonId?: string,
  enabled: boolean = true
): UseBranchColorsResult {
  const result = useMemo(() => {
    // Handle undefined nodes
    if (!enabled || !nodes || nodes.length === 0) {
      return {
        colorMap: {},
        getBranchColor: () => undefined,
        legend: [],
      };
    }

    const colorMap: BranchColorMap = {};
    const legend: Array<{ branch: string; color: string }> = [];

    // Find root node
    const rootNode = rootPersonId
      ? nodes.find(n => n.id === rootPersonId)
      : nodes.find(n => n.parents.length === 0) || nodes[0];

    if (!rootNode) {
      return {
        colorMap: {},
        getBranchColor: () => undefined,
        legend: [],
      };
    }

    // Assign colors based on lineage
    const paternalColorIndex = { current: 0 };
    const maternalColorIndex = { current: 0 };
    const neutralColorIndex = { current: 0 };
    const visited = new Set<string>();

    // Helper to get next color from palette
    const getNextColor = (palette: string[], indexRef: { current: number }) => {
      const color = palette[indexRef.current % palette.length];
      indexRef.current++;
      return color;
    };

    // Assign color to root
    colorMap[rootNode.id] = '#3b82f6'; // Root gets primary blue
    visited.add(rootNode.id);

    // Process ancestors (paternal/maternal distinction)
    const processAncestors = (
      node: TreeNode,
      isPaternal: boolean | null,
      ancestorColor?: string
    ) => {
      // Safety check for undefined parents
      if (!node.parents) return;
      node.parents.forEach((parent, index) => {
        if (visited.has(parent.id)) return;
        visited.add(parent.id);

        let color: string;
        if (isPaternal === null) {
          // Direct parents of root - determine paternal/maternal by gender or position
          if (parent.person.gender === 'male') {
            color = getNextColor(PATERNAL_COLORS, paternalColorIndex);
            legend.push({
              branch: parent.person.family_name || parent.person.given_name,
              color,
            });
            processAncestors(parent, true, color);
          } else if (parent.person.gender === 'female') {
            color = getNextColor(MATERNAL_COLORS, maternalColorIndex);
            legend.push({
              branch: parent.person.family_name || parent.person.given_name,
              color,
            });
            processAncestors(parent, false, color);
          } else {
            color = getNextColor(NEUTRAL_COLORS, neutralColorIndex);
            processAncestors(parent, null, color);
          }
        } else {
          // Inherit parent's color or get new one from same palette
          color = ancestorColor || (isPaternal
            ? getNextColor(PATERNAL_COLORS, paternalColorIndex)
            : getNextColor(MATERNAL_COLORS, maternalColorIndex));
          processAncestors(parent, isPaternal, color);
        }

        colorMap[parent.id] = color;
      });
    };

    // Start processing from root
    processAncestors(rootNode, null);

    // Process descendants (inherit from parents or get neutral color)
    const processDescendants = (node: TreeNode, inheritedColor?: string) => {
      // Safety check for undefined children
      if (!node.children) return;
      node.children.forEach(child => {
        if (visited.has(child.id)) return;
        visited.add(child.id);

        // Children can inherit color from parents or get neutral
        const childParents = child.parents || [];
        const color = inheritedColor ||
          (childParents.length > 0 ? colorMap[childParents[0].id] : undefined) ||
          getNextColor(NEUTRAL_COLORS, neutralColorIndex);

        colorMap[child.id] = color;
        processDescendants(child, color);
      });
    };

    processDescendants(rootNode);

    // Process spouses
    nodes.forEach(node => {
      if (visited.has(node.id)) return;
      visited.add(node.id);

      // Spouses get their own color based on gender
      if (node.person.gender === 'male') {
        colorMap[node.id] = getNextColor(PATERNAL_COLORS, paternalColorIndex);
      } else if (node.person.gender === 'female') {
        colorMap[node.id] = getNextColor(MATERNAL_COLORS, maternalColorIndex);
      } else {
        colorMap[node.id] = getNextColor(NEUTRAL_COLORS, neutralColorIndex);
      }
    });

    return {
      colorMap,
      getBranchColor: (personId: string) => colorMap[personId],
      legend: legend.slice(0, 8), // Limit legend items
    };
  }, [nodes, rootPersonId, enabled]);

  return result;
}

/**
 * Generate a color based on string hash (for consistent colors per person)
 */
export function generateBranchColor(input: string, seed: number = 0): string {
  let hash = seed;
  for (let i = 0; i < input.length; i++) {
    hash = input.charCodeAt(i) + ((hash << 5) - hash);
  }

  const allColors = [...PATERNAL_COLORS, ...MATERNAL_COLORS, ...NEUTRAL_COLORS];
  return allColors[Math.abs(hash) % allColors.length];
}

export default useBranchColors;
