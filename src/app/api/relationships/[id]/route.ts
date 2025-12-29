/**
 * Single Relationship API Route
 * DELETE /api/relationships/[id] - Remove relationship
 */

import { NextRequest } from 'next/server';
import {
  getDatabase,
  deleteRelationship,
  verifyRelationshipOwnership,
  getRelationshipById,
} from '@/lib/api/db';
import {
  handleError,
  noContentResponse,
  NotFoundError,
  ForbiddenError,
  UnauthorizedError,
} from '@/lib/api/errors';
import { getCurrentUserId } from '@/lib/auth/session';
import { invalidateTreeCache, getKVFromEnv } from '@/lib/cache/kv';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * DELETE /api/relationships/[id]
 * Remove a relationship between two persons
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

    // Get relationship first to know tree_id for cache invalidation
    const relationship = await getRelationshipById(db, id);
    if (!relationship) {
      throw new NotFoundError('Relationship not found');
    }

    // Verify ownership
    const isOwner = await verifyRelationshipOwnership(db, id, userId);
    if (!isOwner) {
      throw new ForbiddenError('You do not have permission to delete this relationship');
    }

    const deleted = await deleteRelationship(db, id);

    if (!deleted) {
      throw new NotFoundError('Relationship not found');
    }

    // Invalidate tree cache since relationships changed
    invalidateTreeCache(kv, relationship.tree_id).catch(console.error);

    return noContentResponse();
  } catch (error) {
    return handleError(error);
  }
}
