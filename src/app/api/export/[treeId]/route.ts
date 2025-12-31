/**
 * Export API Route
 * GET /api/export/[treeId] - Export tree as GEDCOM format
 */

import { NextRequest } from 'next/server';
import {
  getDatabase,
  getTreeById,
  getPersonsByTreeId,
  getRelationshipsByTreeId,
} from '@/lib/api/db';
import {
  handleError,
  NotFoundError,
  UnauthorizedError,
} from '@/lib/api/errors';
import { getCurrentUserId } from '@/lib/auth/session';
import { exportToGedcom } from '@/lib/gedcom';
import { requireTreePermission } from '@/lib/permissions/api';

interface RouteContext {
  params: Promise<{ treeId: string }>;
}

/**
 * GET /api/export/[treeId]
 * Export tree as GEDCOM file
 *
 * Query params:
 * - includeNotes: boolean (default: true)
 * - includePhotos: boolean (default: true)
 * - includeHijriDates: boolean (default: true)
 *
 * Returns a text file in GEDCOM 5.5 format with Arabic name support
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { treeId } = await context.params;
    const db = getDatabase(request);
    const userId = await getCurrentUserId(db);
    if (!userId) {
      throw new UnauthorizedError('Authentication required');
    }

    // Get tree
    const tree = await getTreeById(db, treeId);
    if (!tree) {
      throw new NotFoundError('Tree not found');
    }

    // Check permission to export
    await requireTreePermission(db, userId, treeId, 'canExportTree');

    // Get all persons and relationships
    const persons = await getPersonsByTreeId(db, treeId);
    const relationships = await getRelationshipsByTreeId(db, treeId);

    // Parse export options from query params
    const url = new URL(request.url);
    const options = {
      includeNotes: url.searchParams.get('includeNotes') !== 'false',
      includePhotos: url.searchParams.get('includePhotos') !== 'false',
      includeHijriDates: url.searchParams.get('includeHijriDates') !== 'false',
    };

    // Generate GEDCOM using enhanced exporter with Arabic support
    const result = exportToGedcom(tree, persons, relationships, options);

    // Return as downloadable file
    return new Response(result.content, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': `attachment; filename="${result.filename}"`,
        'X-Export-Stats': JSON.stringify(result.stats),
      },
    });
  } catch (error) {
    return handleError(error);
  }
}
