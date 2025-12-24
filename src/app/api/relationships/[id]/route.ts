/**
 * Single Relationship API Route
 * DELETE /api/relationships/[id] - Remove relationship
 */

import { NextRequest } from 'next/server';
import {
  getDatabase,
  deleteRelationship,
  verifyRelationshipOwnership,
} from '@/lib/api/db';
import {
  handleError,
  noContentResponse,
  NotFoundError,
  ForbiddenError,
  UnauthorizedError,
} from '@/lib/api/errors';

// Mock user ID - replace with actual authentication
function getCurrentUserId(request: NextRequest): string | null {
  const authHeader = request.headers.get('x-user-id');
  const url = new URL(request.url);
  const queryUserId = url.searchParams.get('user_id');

  return authHeader || queryUserId;
}

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * DELETE /api/relationships/[id]
 * Remove a relationship between two persons
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const userId = getCurrentUserId(request);
    if (!userId) {
      throw new UnauthorizedError('User ID is required');
    }

    const { id } = await context.params;
    const db = getDatabase(request);

    // Verify ownership
    const isOwner = await verifyRelationshipOwnership(db, id, userId);
    if (!isOwner) {
      throw new ForbiddenError('You do not have permission to delete this relationship');
    }

    const deleted = await deleteRelationship(db, id);

    if (!deleted) {
      throw new NotFoundError('Relationship not found');
    }

    return noContentResponse();
  } catch (error) {
    return handleError(error);
  }
}

// Removed edge runtime for OpenNext compatibility
export const runtime = 'edge';
