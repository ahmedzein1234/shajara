/**
 * Relationships API Route
 * GET /api/relationships - List relationships for a tree
 * POST /api/relationships - Create relationship
 */

import { NextRequest } from 'next/server';
import {
  getDatabase,
  createRelationship,
  getRelationshipsByTreeId,
} from '@/lib/api/db';
import { validateCreateRelationship } from '@/lib/api/validation';
import {
  handleError,
  successResponse,
  createdResponse,
  parseJsonBody,
  getSearchParams,
  UnauthorizedError,
  BadRequestError,
} from '@/lib/api/errors';
import { getCurrentUserId } from '@/lib/auth/session';
import { invalidateTreeCache, getKVFromEnv } from '@/lib/cache/kv';
import { requireTreePermission } from '@/lib/permissions/api';

/**
 * GET /api/relationships?tree_id=uuid
 * List all relationships in a tree
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = getSearchParams(request);
    const treeId = searchParams.get('tree_id');

    if (!treeId) {
      throw new BadRequestError('tree_id parameter is required');
    }

    const db = getDatabase(request);
    const relationships = await getRelationshipsByTreeId(db, treeId);

    return successResponse(relationships);
  } catch (error) {
    return handleError(error);
  }
}

/**
 * POST /api/relationships
 * Create a new relationship between two persons
 *
 * Request body:
 * {
 *   "tree_id": "uuid",
 *   "person1_id": "uuid",
 *   "person2_id": "uuid",
 *   "relationship_type": "parent" | "spouse" | "sibling",
 *   "marriage_date": "2010-06-15",  // Optional, for spouse relationships
 *   "marriage_place": "الرياض",      // Optional, for spouse relationships
 *   "divorce_date": null,            // Optional, for spouse relationships
 *   "divorce_place": null            // Optional, for spouse relationships
 * }
 *
 * Relationship types:
 * - "parent": person1 is parent of person2
 * - "spouse": person1 is spouse of person2 (bidirectional)
 * - "sibling": person1 is sibling of person2 (bidirectional)
 */
export async function POST(request: NextRequest) {
  try {
    const db = getDatabase(request);
    const env = (request as unknown as { env?: unknown }).env;
    const kv = getKVFromEnv(env);
    const userId = await getCurrentUserId(db);
    if (!userId) {
      throw new UnauthorizedError('Authentication required');
    }

    const body = await parseJsonBody(request);
    const validatedInput = validateCreateRelationship(body);

    // Check permission to add relationships to this tree
    await requireTreePermission(db, userId, validatedInput.tree_id, 'canAddRelationship');

    const relationship = await createRelationship(db, validatedInput);

    // Invalidate tree cache since relationships changed
    invalidateTreeCache(kv, validatedInput.tree_id).catch(console.error);

    return createdResponse(relationship);
  } catch (error) {
    return handleError(error);
  }
}
