/**
 * GEDCOM Imports History API Route
 * GET /api/gedcom/imports - Get import history for a tree
 * POST /api/gedcom/imports/new-tree - Create new tree from GEDCOM file
 */

import { NextRequest } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import type { D1Database } from '@cloudflare/workers-types';
import {
  handleError,
  successResponse,
  createdResponse,
  UnauthorizedError,
  BadRequestError,
} from '@/lib/api/errors';
import { getCurrentUserId } from '@/lib/auth/session';
import { parseGedcom } from '@/lib/gedcom';

// Get D1 database from request context
function getDatabase(request: NextRequest): D1Database {
  const env = (request as unknown as { env?: { DB?: D1Database } }).env;
  if (!env?.DB) {
    throw new Error('D1 database not configured');
  }
  return env.DB;
}

interface GedcomImportRecord {
  id: string;
  tree_id: string;
  user_id: string;
  filename: string;
  file_size: number;
  persons_imported: number;
  relationships_imported: number;
  errors: string;
  warnings: string;
  import_date: number;
  created_at: number;
}

/**
 * GET /api/gedcom/imports
 * Get GEDCOM import history for current user
 *
 * Query params:
 * - tree_id: Filter by specific tree (optional)
 * - limit: Number of records (default: 20, max: 100)
 * - offset: Pagination offset (default: 0)
 */
export async function GET(request: NextRequest) {
  try {
    const db = getDatabase(request);
    const userId = await getCurrentUserId(db);
    if (!userId) {
      throw new UnauthorizedError('Authentication required');
    }

    const url = new URL(request.url);
    const treeId = url.searchParams.get('tree_id');
    const limit = Math.min(
      parseInt(url.searchParams.get('limit') || '20', 10),
      100
    );
    const offset = parseInt(url.searchParams.get('offset') || '0', 10);

    let query: string;
    let params: (string | number)[];

    if (treeId) {
      query = `
        SELECT gi.*, t.name as tree_name
        FROM gedcom_imports gi
        JOIN trees t ON gi.tree_id = t.id
        WHERE gi.user_id = ? AND gi.tree_id = ?
        ORDER BY gi.import_date DESC
        LIMIT ? OFFSET ?
      `;
      params = [userId, treeId, limit, offset];
    } else {
      query = `
        SELECT gi.*, t.name as tree_name
        FROM gedcom_imports gi
        JOIN trees t ON gi.tree_id = t.id
        WHERE gi.user_id = ?
        ORDER BY gi.import_date DESC
        LIMIT ? OFFSET ?
      `;
      params = [userId, limit, offset];
    }

    const stmt = db.prepare(query);
    const boundStmt = params.reduce(
      (s, p, i) => s.bind(...params.slice(0, i + 1)),
      stmt
    );
    const results = await db.prepare(query).bind(...params).all<GedcomImportRecord & { tree_name: string }>();

    // Parse JSON fields
    const imports = results.results.map((record) => ({
      ...record,
      errors: JSON.parse(record.errors || '[]'),
      warnings: JSON.parse(record.warnings || '[]'),
      import_date: new Date(record.import_date * 1000).toISOString(),
      created_at: new Date(record.created_at * 1000).toISOString(),
    }));

    return successResponse({
      imports,
      pagination: {
        limit,
        offset,
        has_more: imports.length === limit,
      },
    });
  } catch (error) {
    return handleError(error);
  }
}

/**
 * POST /api/gedcom/imports
 * Create a new tree from GEDCOM file
 *
 * Content-Type: multipart/form-data
 * Form fields:
 * - file: The GEDCOM file (required)
 * - tree_name: Name for the new tree (optional, defaults to filename)
 * - description: Tree description (optional)
 */
export async function POST(request: NextRequest) {
  try {
    const db = getDatabase(request);
    const userId = await getCurrentUserId(db);
    if (!userId) {
      throw new UnauthorizedError('Authentication required');
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const treeName = (formData.get('tree_name') as string) || null;
    const description = (formData.get('description') as string) || null;

    if (!file) {
      throw new BadRequestError('GEDCOM file is required');
    }

    // Validate file extension
    const filename = file.name.toLowerCase();
    if (!filename.endsWith('.ged') && !filename.endsWith('.gedcom')) {
      throw new BadRequestError(
        'Invalid file type. Please upload a .ged or .gedcom file'
      );
    }

    // Check file size (max 10MB)
    const MAX_FILE_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestError('File size exceeds 10MB limit');
    }

    // Read file content
    const content = await file.text();

    // Create new tree
    const treeId = uuidv4();
    const now = Math.floor(Date.now() / 1000);
    const finalTreeName =
      treeName || file.name.replace(/\.(ged|gedcom)$/i, '');

    await db
      .prepare(
        `INSERT INTO trees (id, user_id, name, description, is_public, created_at, updated_at)
         VALUES (?, ?, ?, ?, 0, ?, ?)`
      )
      .bind(treeId, userId, finalTreeName, description, now, now)
      .run();

    // Parse GEDCOM
    const parseResult = parseGedcom(content, treeId);

    // Import persons
    let personsImported = 0;
    for (const person of parseResult.persons) {
      try {
        await db
          .prepare(
            `INSERT INTO persons (
              id, tree_id, given_name, family_name, full_name_ar, full_name_en,
              gender, birth_date, birth_date_hijri, birth_place,
              death_date, death_date_hijri, death_place, is_living,
              notes, kunya, laqab, nisba, patronymic_chain,
              created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
          )
          .bind(
            person.id,
            person.tree_id,
            person.given_name,
            person.family_name || null,
            person.full_name_ar || null,
            person.full_name_en || null,
            person.gender,
            person.birth_date || null,
            person.birth_date_hijri || null,
            person.birth_place || null,
            person.death_date || null,
            person.death_date_hijri || null,
            person.death_place || null,
            person.is_living ? 1 : 0,
            person.notes || null,
            person.kunya || null,
            person.laqab || null,
            person.nisba || null,
            person.patronymic_chain || null,
            now,
            now
          )
          .run();
        personsImported++;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Unknown error';
        parseResult.errors.push(
          `Failed to import person ${person.given_name}: ${message}`
        );
      }
    }

    // Import relationships
    let relationshipsImported = 0;
    for (const relationship of parseResult.relationships) {
      try {
        await db
          .prepare(
            `INSERT INTO relationships (
              id, tree_id, person1_id, person2_id, relationship_type,
              marriage_date, marriage_date_hijri, divorce_date,
              created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
          )
          .bind(
            relationship.id,
            relationship.tree_id,
            relationship.person1_id,
            relationship.person2_id,
            relationship.relationship_type,
            relationship.marriage_date || null,
            relationship.marriage_date_hijri || null,
            relationship.divorce_date || null,
            now,
            now
          )
          .run();
        relationshipsImported++;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Unknown error';
        parseResult.errors.push(`Failed to import relationship: ${message}`);
      }
    }

    // Record the import
    const importId = uuidv4();
    await db
      .prepare(
        `INSERT INTO gedcom_imports (
          id, tree_id, user_id, filename, file_size,
          persons_imported, relationships_imported, errors, warnings,
          import_date, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        importId,
        treeId,
        userId,
        file.name,
        file.size,
        personsImported,
        relationshipsImported,
        JSON.stringify(parseResult.errors),
        JSON.stringify(parseResult.warnings),
        now,
        now
      )
      .run();

    return createdResponse({
      tree: {
        id: treeId,
        name: finalTreeName,
        description,
      },
      import_id: importId,
      persons_imported: personsImported,
      relationships_imported: relationshipsImported,
      persons_found: parseResult.stats.individualsFound,
      families_found: parseResult.stats.familiesFound,
      errors: parseResult.errors,
      warnings: parseResult.warnings,
    });
  } catch (error) {
    return handleError(error);
  }
}
