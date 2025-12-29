/**
 * Persons API Route
 * POST /api/persons - Create new person
 */

import { NextRequest } from 'next/server';
import { getDatabase, createPerson, verifyTreeOwnership } from '@/lib/api/db';
import { validateCreatePerson } from '@/lib/api/validation';
import {
  handleError,
  createdResponse,
  parseJsonBody,
  ForbiddenError,
  UnauthorizedError,
} from '@/lib/api/errors';
import { getCurrentUserId } from '@/lib/auth/session';
import { invalidateTreeCache, getKVFromEnv } from '@/lib/cache/kv';

/**
 * POST /api/persons
 * Create a new person in a tree
 *
 * Request body:
 * {
 *   "tree_id": "uuid",
 *   "given_name": "محمد",
 *   "patronymic_chain": "بن خالد بن محمد",
 *   "family_name": "القحطاني",
 *   "full_name_ar": "محمد بن خالد بن محمد القحطاني",
 *   "full_name_en": "Mohammed bin Khaled bin Mohammed Al-Qahtani",
 *   "gender": "male",
 *   "birth_date": "1990-05-15",
 *   "birth_place": "الرياض",
 *   "is_living": true,
 *   "photo_url": "https://...",
 *   "notes": "Additional notes"
 * }
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
    const validatedInput = validateCreatePerson(body);

    // Verify user owns the tree
    const isOwner = await verifyTreeOwnership(db, validatedInput.tree_id, userId);
    if (!isOwner) {
      throw new ForbiddenError('You do not have permission to add persons to this tree');
    }

    const person = await createPerson(db, validatedInput);

    // Invalidate tree cache since persons list changed
    invalidateTreeCache(kv, validatedInput.tree_id).catch(console.error);

    return createdResponse(person);
  } catch (error) {
    return handleError(error);
  }
}
