/**
 * Single Tree API Route
 * GET /api/trees/[id] - Get tree with all persons (with KV caching)
 * PUT /api/trees/[id] - Update tree metadata
 * DELETE /api/trees/[id] - Delete tree
 */

import { NextRequest } from 'next/server';
import {
  getDatabase,
  getTreeById,
  getTreeWithRelationships,
  updateTree,
  deleteTree,
} from '@/lib/api/db';
import { validateUpdateTree } from '@/lib/api/validation';
import {
  handleError,
  successResponse,
  noContentResponse,
  parseJsonBody,
  NotFoundError,
  ForbiddenError,
  UnauthorizedError,
} from '@/lib/api/errors';
import { getCurrentUserId } from '@/lib/auth/session';
import {
  getCachedTree,
  setCachedTree,
  invalidateTreeCache,
  getKVFromEnv,
  type CachedTreeData,
} from '@/lib/cache/kv';
import { getUserTreePermissions, requireTreePermission } from '@/lib/permissions/api';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/trees/[id]
 * Get tree metadata with all persons and relationships
 * Uses KV caching for improved performance (cache hit returns in ~10ms vs ~200ms for DB)
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const db = getDatabase(request);
    const env = (request as unknown as { env?: unknown }).env;
    const kv = getKVFromEnv(env);

    // Check if tree is public or user is owner (this check is fast)
    const userId = await getCurrentUserId(db);

    // Try to get from cache first
    const cached = await getCachedTree(kv, id);
    if (cached) {
      // Verify access for cached data using permissions
      if (!cached.tree.is_public) {
        if (!userId) {
          throw new ForbiddenError('You do not have access to this tree');
        }
        const { permissions } = await getUserTreePermissions(db, userId, id);
        if (!permissions) {
          throw new ForbiddenError('You do not have access to this tree');
        }
      }

      // Return cached data with cache hit indicator
      return successResponse({
        ...cached,
        _cached: true,
        _cachedAt: cached.cachedAt,
      });
    }

    // Cache miss - fetch from database
    const treeData = await getTreeWithRelationships(db, id);
    if (!treeData) {
      throw new NotFoundError('Tree not found');
    }

    // Verify access using permissions
    if (!treeData.tree.is_public) {
      if (!userId) {
        throw new ForbiddenError('You do not have access to this tree');
      }
      const { permissions } = await getUserTreePermissions(db, userId, id);
      if (!permissions) {
        throw new ForbiddenError('You do not have access to this tree');
      }
    }

    // Prepare response data
    const responseData: Omit<CachedTreeData, 'cachedAt'> = {
      tree: treeData.tree,
      persons: treeData.persons,
      relationships: treeData.relationships,
      relationshipMaps: {
        parents: Object.fromEntries(treeData.parentMap),
        children: Object.fromEntries(treeData.childMap),
        spouses: Object.fromEntries(treeData.spouseMap),
      },
    };

    // Cache the result for future requests (non-blocking)
    setCachedTree(kv, id, responseData).catch(console.error);

    return successResponse({
      ...responseData,
      _cached: false,
    });
  } catch (error) {
    return handleError(error);
  }
}

/**
 * PUT /api/trees/[id]
 * Update tree metadata
 *
 * Request body:
 * {
 *   "name": "Updated name",
 *   "description": "Updated description",
 *   "is_public": true
 * }
 */
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const db = getDatabase(request);
    const env = (request as unknown as { env?: unknown }).env;
    const kv = getKVFromEnv(env);
    const userId = await getCurrentUserId(db);
    if (!userId) {
      throw new UnauthorizedError('Authentication required');
    }

    // Check permission to manage tree settings
    await requireTreePermission(db, userId, id, 'canManageSettings');

    const body = await parseJsonBody(request);
    const validatedInput = validateUpdateTree(body);

    const updatedTree = await updateTree(db, id, validatedInput);

    if (!updatedTree) {
      throw new NotFoundError('Tree not found');
    }

    // Invalidate cache after update (non-blocking)
    invalidateTreeCache(kv, id).catch(console.error);

    return successResponse(updatedTree);
  } catch (error) {
    return handleError(error);
  }
}

/**
 * DELETE /api/trees/[id]
 * Delete a tree and all associated data
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const db = getDatabase(request);
    const env = (request as unknown as { env?: unknown }).env;
    const kv = getKVFromEnv(env);
    const userId = await getCurrentUserId(db);
    if (!userId) {
      throw new UnauthorizedError('Authentication required');
    }

    // Check permission to delete tree
    await requireTreePermission(db, userId, id, 'canDeleteTree');

    const deleted = await deleteTree(db, id);

    if (!deleted) {
      throw new NotFoundError('Tree not found');
    }

    // Invalidate cache after delete (non-blocking)
    invalidateTreeCache(kv, id).catch(console.error);

    return noContentResponse();
  } catch (error) {
    return handleError(error);
  }
}
