/**
 * Trees API Route
 * GET /api/trees - List user's trees
 * POST /api/trees - Create new tree
 */

import { NextRequest } from 'next/server';
import { getDatabase, createTree, getTreesByUserId } from '@/lib/api/db';
import { validateCreateTree } from '@/lib/api/validation';
import {
  handleError,
  successResponse,
  createdResponse,
  parseJsonBody,
  UnauthorizedError,
} from '@/lib/api/errors';
import { getCurrentUserId } from '@/lib/auth/session';

/**
 * GET /api/trees
 * List all trees owned by the current user
 */
export async function GET(request: NextRequest) {
  try {
    const db = getDatabase(request);
    const userId = await getCurrentUserId(db);
    if (!userId) {
      throw new UnauthorizedError('Authentication required');
    }

    const trees = await getTreesByUserId(db, userId);

    return successResponse(trees);
  } catch (error) {
    return handleError(error);
  }
}

/**
 * POST /api/trees
 * Create a new tree
 *
 * Request body:
 * {
 *   "name": "My Family Tree",
 *   "description": "Optional description",
 *   "is_public": false
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const db = getDatabase(request);
    const userId = await getCurrentUserId(db);
    if (!userId) {
      throw new UnauthorizedError('Authentication required');
    }

    const body = await parseJsonBody(request) as Record<string, unknown>;

    // Add user_id to the input
    const inputWithUser = { ...body, user_id: userId };
    const validatedInput = validateCreateTree(inputWithUser);

    const tree = await createTree(db, validatedInput);

    return createdResponse(tree);
  } catch (error) {
    return handleError(error);
  }
}
