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

// Mock user ID - replace with actual authentication
function getCurrentUserId(request: NextRequest): string | null {
  const authHeader = request.headers.get('x-user-id');
  const url = new URL(request.url);
  const queryUserId = url.searchParams.get('user_id');

  return authHeader || queryUserId;
}

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
    const userId = getCurrentUserId(request);
    if (!userId) {
      throw new UnauthorizedError('User ID is required');
    }

    const body = await parseJsonBody(request);
    const validatedInput = validateCreatePerson(body);

    const db = getDatabase(request);

    // Verify user owns the tree
    const isOwner = await verifyTreeOwnership(db, validatedInput.tree_id, userId);
    if (!isOwner) {
      throw new ForbiddenError('You do not have permission to add persons to this tree');
    }

    const person = await createPerson(db, validatedInput);

    return createdResponse(person);
  } catch (error) {
    return handleError(error);
  }
}

// Removed edge runtime for OpenNext compatibility
export const runtime = 'edge';
