/**
 * GEDCOM Import API Route
 * POST /api/gedcom/import - Import GEDCOM file into a tree
 */

import { NextRequest } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import type { D1Database } from '@cloudflare/workers-types';
import {
  handleError,
  createdResponse,
  UnauthorizedError,
  BadRequestError,
  NotFoundError,
} from '@/lib/api/errors';
import { getCurrentUserId } from '@/lib/auth/session';
import { parseGedcom } from '@/lib/gedcom';
import type { Person, Relationship } from '@/lib/db/schema';
import { requireTreePermission } from '@/lib/permissions/api';

// Get D1 database from request context
function getDatabase(request: NextRequest): D1Database {
  const env = (request as unknown as { env?: { DB?: D1Database } }).env;
  if (!env?.DB) {
    throw new Error('D1 database not configured');
  }
  return env.DB;
}

// Get tree by ID
async function getTreeById(
  db: D1Database,
  treeId: string
): Promise<{ id: string; name: string; user_id: string } | null> {
  return db
    .prepare('SELECT id, name, user_id FROM trees WHERE id = ?')
    .bind(treeId)
    .first();
}

// Create person in database
async function createPerson(
  db: D1Database,
  person: Partial<Person>
): Promise<void> {
  const now = Math.floor(Date.now() / 1000);

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
}

// Create relationship in database
async function createRelationship(
  db: D1Database,
  relationship: Partial<Relationship>
): Promise<void> {
  const now = Math.floor(Date.now() / 1000);

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
}

// Record GEDCOM import in database
async function recordGedcomImport(
  db: D1Database,
  data: {
    id: string;
    tree_id: string;
    user_id: string;
    filename: string;
    file_size: number;
    persons_imported: number;
    relationships_imported: number;
    errors: string[];
    warnings: string[];
  }
): Promise<void> {
  const now = Math.floor(Date.now() / 1000);

  await db
    .prepare(
      `INSERT INTO gedcom_imports (
        id, tree_id, user_id, filename, file_size,
        persons_imported, relationships_imported, errors, warnings,
        import_date, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      data.id,
      data.tree_id,
      data.user_id,
      data.filename,
      data.file_size,
      data.persons_imported,
      data.relationships_imported,
      JSON.stringify(data.errors),
      JSON.stringify(data.warnings),
      now,
      now
    )
    .run();
}

/**
 * POST /api/gedcom/import
 * Import a GEDCOM file into an existing tree
 *
 * Content-Type: multipart/form-data
 * Form fields:
 * - file: The GEDCOM file to import (required)
 * - tree_id: The tree to import into (required)
 * - merge_mode: 'replace' | 'append' (default: 'append')
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "import_id": "uuid",
 *     "persons_imported": 45,
 *     "relationships_imported": 38,
 *     "errors": [],
 *     "warnings": ["Line 123: Unknown tag _CUSTOM"]
 *   }
 * }
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
    const treeId = formData.get('tree_id') as string | null;
    const mergeMode = (formData.get('merge_mode') as string) || 'append';

    if (!file) {
      throw new BadRequestError('GEDCOM file is required');
    }

    if (!treeId) {
      throw new BadRequestError('tree_id is required');
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

    // Verify tree exists and user has permission to import
    const tree = await getTreeById(db, treeId);
    if (!tree) {
      throw new NotFoundError('Tree not found');
    }

    // Check permission to add persons (GEDCOM import adds persons and relationships)
    await requireTreePermission(db, userId, treeId, 'canAddPerson');

    // Read file content
    const content = await file.text();

    // Parse GEDCOM
    const parseResult = parseGedcom(content, treeId);

    // If replace mode, delete existing persons and relationships
    if (mergeMode === 'replace') {
      await db
        .prepare('DELETE FROM relationships WHERE tree_id = ?')
        .bind(treeId)
        .run();
      await db
        .prepare('DELETE FROM persons WHERE tree_id = ?')
        .bind(treeId)
        .run();
    }

    // Import persons
    let personsImported = 0;
    for (const person of parseResult.persons) {
      try {
        await createPerson(db, person);
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
        await createRelationship(db, relationship);
        relationshipsImported++;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Unknown error';
        parseResult.errors.push(
          `Failed to import relationship: ${message}`
        );
      }
    }

    // Record the import
    const importId = uuidv4();
    await recordGedcomImport(db, {
      id: importId,
      tree_id: treeId,
      user_id: userId,
      filename: file.name,
      file_size: file.size,
      persons_imported: personsImported,
      relationships_imported: relationshipsImported,
      errors: parseResult.errors,
      warnings: parseResult.warnings,
    });

    return createdResponse({
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
