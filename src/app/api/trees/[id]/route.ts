/**
 * Single Tree API Route
 * GET /api/trees/[id] - Get tree with all persons
 * PUT /api/trees/[id] - Update tree metadata
 * DELETE /api/trees/[id] - Delete tree
 */

import { NextRequest } from 'next/server';
import {
  getDatabase,
  getTreeById,
  getPersonsByTreeId,
  updateTree,
  deleteTree,
  verifyTreeOwnership,
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
 * GET /api/trees/[id]
 * Get tree metadata and all persons in the tree
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const db = getDatabase(request);

    const tree = await getTreeById(db, id);
    if (!tree) {
      throw new NotFoundError('Tree not found');
    }

    // Check if tree is public or user is owner
    const userId = getCurrentUserId(request);
    const isOwner = userId && (await verifyTreeOwnership(db, id, userId));

    if (!tree.is_public && !isOwner) {
      throw new ForbiddenError('You do not have access to this tree');
    }

    // Get all persons in the tree
    const persons = await getPersonsByTreeId(db, id);

    return successResponse({
      tree,
      persons,
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
    const userId = getCurrentUserId(request);
    if (!userId) {
      throw new UnauthorizedError('User ID is required');
    }

    const { id } = await context.params;
    const db = getDatabase(request);

    // Verify ownership
    const isOwner = await verifyTreeOwnership(db, id, userId);
    if (!isOwner) {
      throw new ForbiddenError('You do not have permission to update this tree');
    }

    const body = await parseJsonBody(request);
    const validatedInput = validateUpdateTree(body);

    const updatedTree = await updateTree(db, id, validatedInput);

    if (!updatedTree) {
      throw new NotFoundError('Tree not found');
    }

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
    const userId = getCurrentUserId(request);
    if (!userId) {
      throw new UnauthorizedError('User ID is required');
    }

    const { id } = await context.params;
    const db = getDatabase(request);

    // Verify ownership
    const isOwner = await verifyTreeOwnership(db, id, userId);
    if (!isOwner) {
      throw new ForbiddenError('You do not have permission to delete this tree');
    }

    const deleted = await deleteTree(db, id);

    if (!deleted) {
      throw new NotFoundError('Tree not found');
    }

    return noContentResponse();
  } catch (error) {
    return handleError(error);
  }
}

// Removed edge runtime for OpenNext compatibility
export const runtime = 'edge';
