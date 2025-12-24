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

// Mock user ID - replace with actual authentication
// TODO: Implement proper authentication with Cloudflare Access or custom auth
function getCurrentUserId(request: NextRequest): string | null {
  // For now, return a mock user ID from header or query param
  // In production, this should verify a JWT token or session
  const authHeader = request.headers.get('x-user-id');
  const url = new URL(request.url);
  const queryUserId = url.searchParams.get('user_id');

  return authHeader || queryUserId;
}

/**
 * GET /api/trees
 * List all trees owned by the current user
 */
export async function GET(request: NextRequest) {
  try {
    const userId = getCurrentUserId(request);
    if (!userId) {
      throw new UnauthorizedError('User ID is required');
    }

    const db = getDatabase(request);
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
    const userId = getCurrentUserId(request);
    if (!userId) {
      throw new UnauthorizedError('User ID is required');
    }

    const body = await parseJsonBody(request) as Record<string, unknown>;

    // Add user_id to the input
    const inputWithUser = { ...body, user_id: userId };
    const validatedInput = validateCreateTree(inputWithUser);

    const db = getDatabase(request);
    const tree = await createTree(db, validatedInput);

    return createdResponse(tree);
  } catch (error) {
    return handleError(error);
  }
}

// Removed edge runtime for OpenNext compatibility
export const runtime = 'edge';
