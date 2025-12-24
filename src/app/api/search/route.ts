/**
 * Search API Route
 * GET /api/search - Search persons by name (Arabic-aware search)
 */

import { NextRequest } from 'next/server';
import { getDatabase, searchPersons } from '@/lib/api/db';
import { validateSearchParams } from '@/lib/api/validation';
import { handleError, successResponse, getSearchParams } from '@/lib/api/errors';

/**
 * GET /api/search?query=محمد&tree_id=uuid&gender=male&is_living=true&limit=20&offset=0
 * Search for persons using full-text search
 *
 * Query parameters:
 * - query: Search text (searches across all name fields using FTS5)
 * - tree_id: Optional, filter by tree
 * - gender: Optional, filter by gender ("male" or "female")
 * - is_living: Optional, filter by living status (true or false)
 * - limit: Optional, number of results per page (1-100, default 50)
 * - offset: Optional, offset for pagination (default 0)
 *
 * The search uses SQLite FTS5 for Arabic-aware full-text search across:
 * - given_name (الاسم الأول)
 * - patronymic_chain (سلسلة النسب)
 * - family_name (اسم العائلة)
 * - full_name_ar (الاسم الكامل بالعربية)
 * - full_name_en (Full name in English)
 *
 * Example searches:
 * - "محمد" - finds all persons with محمد in any name field
 * - "Mohammed" - finds all persons with Mohammed in English name
 * - "القحطاني" - finds all persons from Al-Qahtani family
 * - "بن خالد" - finds all persons with خالد in their patronymic chain
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = getSearchParams(request);
    const validatedParams = validateSearchParams(searchParams);

    const db = getDatabase(request);
    const result = await searchPersons(db, validatedParams);

    return successResponse({
      persons: result.persons,
      total: result.total,
      limit: validatedParams.limit || 50,
      offset: validatedParams.offset || 0,
      has_more: result.total > (validatedParams.offset || 0) + result.persons.length,
    });
  } catch (error) {
    return handleError(error);
  }
}

// Removed edge runtime for OpenNext compatibility
export const runtime = 'edge';
