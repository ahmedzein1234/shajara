/**
 * useViewportCulling Hook
 * Filters tree nodes to only render those visible in the current viewport
 * Significantly improves performance for large trees (100+ nodes)
 */

import { useMemo } from 'react';
import { TreeNode, ConnectionLine } from '@/types/tree';

interface ViewportBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

interface ViewportCullingOptions {
  /** Buffer zone around viewport to pre-render nearby nodes (in pixels) */
  buffer?: number;
  /** Node width for bounds calculation */
  nodeWidth?: number;
  /** Node height for bounds calculation */
  nodeHeight?: number;
  /** Minimum zoom level to apply culling (at high zoom, cull aggressively) */
  minScaleForCulling?: number;
  /** Maximum nodes before enabling culling */
  maxNodesWithoutCulling?: number;
}

interface CullingResult {
  visibleNodes: TreeNode[];
  visibleConnections: ConnectionLine[];
  totalNodes: number;
  renderedNodes: number;
  cullingEnabled: boolean;
}

const DEFAULT_OPTIONS: Required<ViewportCullingOptions> = {
  buffer: 200, // Render nodes 200px outside viewport for smooth panning
  nodeWidth: 220,
  nodeHeight: 140,
  minScaleForCulling: 0.1,
  maxNodesWithoutCulling: 50, // Only cull when > 50 nodes
};

/**
 * Calculate viewport bounds in tree coordinate space
 */
function calculateViewportBounds(
  viewportWidth: number,
  viewportHeight: number,
  translateX: number,
  translateY: number,
  scale: number,
  buffer: number
): ViewportBounds {
  // Convert viewport coordinates to tree space
  const minX = (-translateX - buffer) / scale;
  const maxX = (viewportWidth - translateX + buffer) / scale;
  const minY = (-translateY - buffer) / scale;
  const maxY = (viewportHeight - translateY + buffer) / scale;

  return { minX, maxX, minY, maxY };
}

/**
 * Check if a node is within the viewport bounds
 */
function isNodeVisible(
  node: TreeNode,
  bounds: ViewportBounds,
  nodeWidth: number,
  nodeHeight: number
): boolean {
  // Node is visible if any part of it overlaps with viewport
  const nodeRight = node.x + nodeWidth;
  const nodeBottom = node.y + nodeHeight;

  return (
    node.x < bounds.maxX &&
    nodeRight > bounds.minX &&
    node.y < bounds.maxY &&
    nodeBottom > bounds.minY
  );
}

/**
 * Check if a connection line is within the viewport bounds
 * Uses simplified bounding box check
 */
function isConnectionVisible(
  connection: ConnectionLine,
  bounds: ViewportBounds,
  nodeWidth: number,
  nodeHeight: number
): boolean {
  // Check if either endpoint is visible
  const fromVisible = isNodeVisible(connection.from, bounds, nodeWidth, nodeHeight);
  const toVisible = isNodeVisible(connection.to, bounds, nodeWidth, nodeHeight);

  if (fromVisible || toVisible) return true;

  // Check if line passes through viewport
  // Simple bounding box check for the line
  const lineMinX = Math.min(connection.from.x, connection.to.x);
  const lineMaxX = Math.max(connection.from.x + nodeWidth, connection.to.x + nodeWidth);
  const lineMinY = Math.min(connection.from.y, connection.to.y);
  const lineMaxY = Math.max(connection.from.y + nodeHeight, connection.to.y + nodeHeight);

  return (
    lineMinX < bounds.maxX &&
    lineMaxX > bounds.minX &&
    lineMinY < bounds.maxY &&
    lineMaxY > bounds.minY
  );
}

/**
 * Main hook for viewport culling
 */
export function useViewportCulling(
  nodes: TreeNode[] | undefined,
  connections: ConnectionLine[] | undefined,
  viewportWidth: number,
  viewportHeight: number,
  translateX: number,
  translateY: number,
  scale: number,
  options: ViewportCullingOptions = {}
): CullingResult {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  return useMemo(() => {
    // Handle undefined/null nodes or connections
    const safeNodes = nodes || [];
    const safeConnections = connections || [];
    const totalNodes = safeNodes.length;

    // Skip culling for small trees or when zoomed out significantly
    if (totalNodes <= opts.maxNodesWithoutCulling || scale < opts.minScaleForCulling) {
      return {
        visibleNodes: safeNodes,
        visibleConnections: safeConnections,
        totalNodes,
        renderedNodes: totalNodes,
        cullingEnabled: false,
      };
    }

    // Calculate viewport bounds with buffer
    const bounds = calculateViewportBounds(
      viewportWidth,
      viewportHeight,
      translateX,
      translateY,
      scale,
      opts.buffer
    );

    // Filter visible nodes
    const visibleNodes = safeNodes.filter((node) =>
      isNodeVisible(node, bounds, opts.nodeWidth, opts.nodeHeight)
    );

    // Create set of visible node IDs for quick lookup
    const visibleNodeIds = new Set(visibleNodes.map((n) => n.id));

    // Filter connections where at least one endpoint is visible
    // or the connection passes through the viewport
    const filteredConnections = safeConnections.filter((connection) => {
      // Quick check: both endpoints visible
      if (visibleNodeIds.has(connection.from.id) && visibleNodeIds.has(connection.to.id)) {
        return true;
      }

      // At least one endpoint visible
      if (visibleNodeIds.has(connection.from.id) || visibleNodeIds.has(connection.to.id)) {
        return true;
      }

      // Check if connection passes through viewport
      return isConnectionVisible(connection, bounds, opts.nodeWidth, opts.nodeHeight);
    });

    return {
      visibleNodes,
      visibleConnections: filteredConnections,
      totalNodes,
      renderedNodes: visibleNodes.length,
      cullingEnabled: true,
    };
  }, [
    nodes,
    connections,
    viewportWidth,
    viewportHeight,
    translateX,
    translateY,
    scale,
    opts.buffer,
    opts.nodeWidth,
    opts.nodeHeight,
    opts.minScaleForCulling,
    opts.maxNodesWithoutCulling,
  ]);
}

/**
 * Lightweight hook to just check if culling should be enabled
 */
export function useShouldCull(
  nodeCount: number,
  scale: number,
  threshold: number = 50
): boolean {
  return useMemo(() => {
    return nodeCount > threshold && scale >= 0.1;
  }, [nodeCount, scale, threshold]);
}

/**
 * Debug info for development
 */
export function useViewportDebug(
  viewportWidth: number,
  viewportHeight: number,
  translateX: number,
  translateY: number,
  scale: number,
  buffer: number = 200
): {
  bounds: ViewportBounds;
  center: { x: number; y: number };
  visibleArea: { width: number; height: number };
} {
  return useMemo(() => {
    const bounds = calculateViewportBounds(
      viewportWidth,
      viewportHeight,
      translateX,
      translateY,
      scale,
      buffer
    );

    return {
      bounds,
      center: {
        x: (bounds.minX + bounds.maxX) / 2,
        y: (bounds.minY + bounds.maxY) / 2,
      },
      visibleArea: {
        width: bounds.maxX - bounds.minX,
        height: bounds.maxY - bounds.minY,
      },
    };
  }, [viewportWidth, viewportHeight, translateX, translateY, scale, buffer]);
}

export default useViewportCulling;
