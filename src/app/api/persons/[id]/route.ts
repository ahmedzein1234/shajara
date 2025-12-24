/**
 * Single Person API Route
 * GET /api/persons/[id] - Get person details
 * PUT /api/persons/[id] - Update person
 * DELETE /api/persons/[id] - Delete person
 */

import { NextRequest } from 'next/server';
import {
  getDatabase,
  getPersonById,
  updatePerson,
  deletePerson,
  verifyPersonOwnership,
  getRelationshipsByPersonId,
} from '@/lib/api/db';
import { validateUpdatePerson } from '@/lib/api/validation';
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
 * GET /api/persons/[id]
 * Get person details with relationships
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const db = getDatabase(request);

    const person = await getPersonById(db, id);
    if (!person) {
      throw new NotFoundError('Person not found');
    }

    // Get relationships for this person
    const relationships = await getRelationshipsByPersonId(db, id);

    return successResponse({
      person,
      relationships,
    });
  } catch (error) {
    return handleError(error);
  }
}

/**
 * PUT /api/persons/[id]
 * Update person information
 *
 * Request body (all fields optional):
 * {
 *   "given_name": "محمد",
 *   "patronymic_chain": "بن خالد بن محمد",
 *   "family_name": "القحطاني",
 *   "full_name_ar": "محمد بن خالد بن محمد القحطاني",
 *   "full_name_en": "Mohammed bin Khaled bin Mohammed Al-Qahtani",
 *   "gender": "male",
 *   "birth_date": "1990-05-15",
 *   "birth_place": "الرياض",
 *   "birth_place_lat": 24.7136,
 *   "birth_place_lng": 46.6753,
 *   "death_date": null,
 *   "death_place": null,
 *   "is_living": true,
 *   "photo_url": "https://...",
 *   "notes": "Updated notes"
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
    const isOwner = await verifyPersonOwnership(db, id, userId);
    if (!isOwner) {
      throw new ForbiddenError('You do not have permission to update this person');
    }

    const body = await parseJsonBody(request);
    const validatedInput = validateUpdatePerson(body);

    const updatedPerson = await updatePerson(db, id, validatedInput);

    if (!updatedPerson) {
      throw new NotFoundError('Person not found');
    }

    return successResponse(updatedPerson);
  } catch (error) {
    return handleError(error);
  }
}

/**
 * DELETE /api/persons/[id]
 * Delete a person
 * Note: This will also delete all relationships involving this person (CASCADE)
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
    const isOwner = await verifyPersonOwnership(db, id, userId);
    if (!isOwner) {
      throw new ForbiddenError('You do not have permission to delete this person');
    }

    const deleted = await deletePerson(db, id);

    if (!deleted) {
      throw new NotFoundError('Person not found');
    }

    return noContentResponse();
  } catch (error) {
    return handleError(error);
  }
}

// Removed edge runtime for OpenNext compatibility
