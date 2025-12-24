/**
 * Database helper utilities for Cloudflare D1
 * Provides type-safe database operations with proper error handling
 */

import type { D1Database } from '@cloudflare/workers-types';
import type {
  Tree,
  Person,
  Relationship,
  CreateTreeInput,
  CreatePersonInput,
  CreateRelationshipInput,
  DbTree,
  DbPerson,
  UpdateTreeInput,
  UpdatePersonInput,
} from '../db/schema';
import { dbToTree, dbToPerson, treeToDB, personToDB } from '../db/schema';

// =====================================================
// DATABASE CONTEXT
// =====================================================

export interface DatabaseContext {
  DB: D1Database;
}

export function getDatabase(request: Request): D1Database {
  // Access Cloudflare D1 binding from the request context
  const env = (request as any).env;
  if (!env?.DB) {
    throw new Error('Database not configured');
  }
  return env.DB;
}

// =====================================================
// UUID GENERATION
// =====================================================

export function generateUUID(): string {
  return crypto.randomUUID();
}

// =====================================================
// TREE OPERATIONS
// =====================================================

export async function createTree(db: D1Database, input: CreateTreeInput): Promise<Tree> {
  const id = input.id || generateUUID();
  const now = Math.floor(Date.now() / 1000);
  const dbTree = treeToDB({ ...input, id });

  const stmt = db.prepare(`
    INSERT INTO trees (id, user_id, name, description, is_public, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  await stmt.bind(
    id,
    input.user_id,
    input.name,
    input.description,
    dbTree.is_public ?? 0,
    now,
    now
  ).run();

  return {
    id,
    user_id: input.user_id,
    name: input.name,
    description: input.description,
    is_public: input.is_public,
    created_at: now,
    updated_at: now,
  };
}

export async function getTreeById(db: D1Database, id: string): Promise<Tree | null> {
  const stmt = db.prepare('SELECT * FROM trees WHERE id = ?');
  const result = await stmt.bind(id).first<DbTree>();

  if (!result) {
    return null;
  }

  return dbToTree(result);
}

export async function getTreesByUserId(db: D1Database, userId: string): Promise<Tree[]> {
  const stmt = db.prepare('SELECT * FROM trees WHERE user_id = ? ORDER BY created_at DESC');
  const result = await stmt.bind(userId).all<DbTree>();

  return result.results.map(dbToTree);
}

export async function updateTree(
  db: D1Database,
  id: string,
  input: UpdateTreeInput
): Promise<Tree | null> {
  const updates: string[] = [];
  const values: any[] = [];

  const dbInput = treeToDB(input);

  if (dbInput.name !== undefined) {
    updates.push('name = ?');
    values.push(dbInput.name);
  }

  if (dbInput.description !== undefined) {
    updates.push('description = ?');
    values.push(dbInput.description);
  }

  if (dbInput.is_public !== undefined) {
    updates.push('is_public = ?');
    values.push(dbInput.is_public);
  }

  if (updates.length === 0) {
    return getTreeById(db, id);
  }

  const now = Math.floor(Date.now() / 1000);
  updates.push('updated_at = ?');
  values.push(now);

  values.push(id);

  const stmt = db.prepare(`
    UPDATE trees
    SET ${updates.join(', ')}
    WHERE id = ?
  `);

  await stmt.bind(...values).run();

  return getTreeById(db, id);
}

export async function deleteTree(db: D1Database, id: string): Promise<boolean> {
  const stmt = db.prepare('DELETE FROM trees WHERE id = ?');
  const result = await stmt.bind(id).run();

  return result.meta.changes > 0;
}

// =====================================================
// PERSON OPERATIONS
// =====================================================

export async function createPerson(db: D1Database, input: CreatePersonInput): Promise<Person> {
  const id = input.id || generateUUID();
  const now = Math.floor(Date.now() / 1000);
  const dbPerson = personToDB({ ...input, id });

  const stmt = db.prepare(`
    INSERT INTO persons (
      id, tree_id, given_name, patronymic_chain, family_name,
      full_name_ar, full_name_en, gender,
      birth_date, birth_place, birth_place_lat, birth_place_lng,
      death_date, death_place, death_place_lat, death_place_lng,
      is_living, photo_url, notes, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  await stmt.bind(
    id,
    input.tree_id,
    input.given_name,
    input.patronymic_chain,
    input.family_name,
    input.full_name_ar,
    input.full_name_en,
    input.gender,
    input.birth_date,
    input.birth_place,
    input.birth_place_lat,
    input.birth_place_lng,
    input.death_date,
    input.death_place,
    input.death_place_lat,
    input.death_place_lng,
    dbPerson.is_living ?? 1,
    input.photo_url,
    input.notes,
    now,
    now
  ).run();

  return {
    id,
    ...input,
    created_at: now,
    updated_at: now,
  };
}

export async function getPersonById(db: D1Database, id: string): Promise<Person | null> {
  const stmt = db.prepare('SELECT * FROM persons WHERE id = ?');
  const result = await stmt.bind(id).first<DbPerson>();

  if (!result) {
    return null;
  }

  return dbToPerson(result);
}

export async function getPersonsByTreeId(db: D1Database, treeId: string): Promise<Person[]> {
  const stmt = db.prepare('SELECT * FROM persons WHERE tree_id = ? ORDER BY created_at DESC');
  const result = await stmt.bind(treeId).all<DbPerson>();

  return result.results.map(dbToPerson);
}

export async function updatePerson(
  db: D1Database,
  id: string,
  input: UpdatePersonInput
): Promise<Person | null> {
  const updates: string[] = [];
  const values: any[] = [];

  const dbInput = personToDB(input);

  // Build dynamic update query
  for (const [key, value] of Object.entries(dbInput)) {
    if (value !== undefined) {
      updates.push(`${key} = ?`);
      values.push(value);
    }
  }

  if (updates.length === 0) {
    return getPersonById(db, id);
  }

  const now = Math.floor(Date.now() / 1000);
  updates.push('updated_at = ?');
  values.push(now);

  values.push(id);

  const stmt = db.prepare(`
    UPDATE persons
    SET ${updates.join(', ')}
    WHERE id = ?
  `);

  await stmt.bind(...values).run();

  return getPersonById(db, id);
}

export async function deletePerson(db: D1Database, id: string): Promise<boolean> {
  const stmt = db.prepare('DELETE FROM persons WHERE id = ?');
  const result = await stmt.bind(id).run();

  return result.meta.changes > 0;
}

// =====================================================
// RELATIONSHIP OPERATIONS
// =====================================================

export async function createRelationship(
  db: D1Database,
  input: CreateRelationshipInput
): Promise<Relationship> {
  const id = input.id || generateUUID();
  const now = Math.floor(Date.now() / 1000);

  const stmt = db.prepare(`
    INSERT INTO relationships (
      id, tree_id, person1_id, person2_id, relationship_type,
      marriage_date, marriage_place, divorce_date, divorce_place, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  await stmt.bind(
    id,
    input.tree_id,
    input.person1_id,
    input.person2_id,
    input.relationship_type,
    input.marriage_date,
    input.marriage_place,
    input.divorce_date,
    input.divorce_place,
    now
  ).run();

  return {
    id,
    ...input,
    created_at: now,
  };
}

export async function getRelationshipById(db: D1Database, id: string): Promise<Relationship | null> {
  const stmt = db.prepare('SELECT * FROM relationships WHERE id = ?');
  const result = await stmt.bind(id).first<Relationship>();

  return result || null;
}

export async function getRelationshipsByTreeId(db: D1Database, treeId: string): Promise<Relationship[]> {
  const stmt = db.prepare('SELECT * FROM relationships WHERE tree_id = ? ORDER BY created_at DESC');
  const result = await stmt.bind(treeId).all<Relationship>();

  return result.results;
}

export async function getRelationshipsByPersonId(db: D1Database, personId: string): Promise<Relationship[]> {
  const stmt = db.prepare(`
    SELECT * FROM relationships
    WHERE person1_id = ? OR person2_id = ?
    ORDER BY created_at DESC
  `);
  const result = await stmt.bind(personId, personId).all<Relationship>();

  return result.results;
}

export async function deleteRelationship(db: D1Database, id: string): Promise<boolean> {
  const stmt = db.prepare('DELETE FROM relationships WHERE id = ?');
  const result = await stmt.bind(id).run();

  return result.meta.changes > 0;
}

// =====================================================
// SEARCH OPERATIONS
// =====================================================

export interface SearchPersonsParams {
  tree_id?: string;
  query?: string;
  gender?: string;
  is_living?: boolean;
  limit?: number;
  offset?: number;
}

export async function searchPersons(
  db: D1Database,
  params: SearchPersonsParams
): Promise<{ persons: Person[]; total: number }> {
  const conditions: string[] = [];
  const values: any[] = [];

  if (params.tree_id) {
    conditions.push('tree_id = ?');
    values.push(params.tree_id);
  }

  if (params.gender) {
    conditions.push('gender = ?');
    values.push(params.gender);
  }

  if (params.is_living !== undefined) {
    conditions.push('is_living = ?');
    values.push(params.is_living ? 1 : 0);
  }

  // Build WHERE clause
  let whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Handle text search
  let query: string;
  if (params.query) {
    // Use FTS5 for text search
    const searchStmt = db.prepare(`
      SELECT person_id FROM persons_fts
      WHERE persons_fts MATCH ?
    `);
    const searchResults = await searchStmt.bind(params.query).all<{ person_id: string }>();
    const personIds = searchResults.results.map(r => r.person_id);

    if (personIds.length === 0) {
      return { persons: [], total: 0 };
    }

    const personIdsCondition = `id IN (${personIds.map(() => '?').join(',')})`;
    if (whereClause) {
      whereClause += ` AND ${personIdsCondition}`;
    } else {
      whereClause = `WHERE ${personIdsCondition}`;
    }
    values.push(...personIds);
  }

  // Get total count
  const countStmt = db.prepare(`SELECT COUNT(*) as count FROM persons ${whereClause}`);
  const countResult = await countStmt.bind(...values).first<{ count: number }>();
  const total = countResult?.count || 0;

  // Get paginated results
  const limit = params.limit || 50;
  const offset = params.offset || 0;

  query = `
    SELECT * FROM persons
    ${whereClause}
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `;

  const stmt = db.prepare(query);
  const result = await stmt.bind(...values, limit, offset).all<DbPerson>();

  return {
    persons: result.results.map(dbToPerson),
    total,
  };
}

// =====================================================
// AUTHORIZATION HELPERS
// =====================================================

export async function verifyTreeOwnership(
  db: D1Database,
  treeId: string,
  userId: string
): Promise<boolean> {
  const stmt = db.prepare('SELECT user_id FROM trees WHERE id = ?');
  const result = await stmt.bind(treeId).first<{ user_id: string }>();

  return result?.user_id === userId;
}

export async function verifyPersonOwnership(
  db: D1Database,
  personId: string,
  userId: string
): Promise<boolean> {
  const stmt = db.prepare(`
    SELECT t.user_id
    FROM persons p
    JOIN trees t ON p.tree_id = t.id
    WHERE p.id = ?
  `);
  const result = await stmt.bind(personId).first<{ user_id: string }>();

  return result?.user_id === userId;
}

export async function verifyRelationshipOwnership(
  db: D1Database,
  relationshipId: string,
  userId: string
): Promise<boolean> {
  const stmt = db.prepare(`
    SELECT t.user_id
    FROM relationships r
    JOIN trees t ON r.tree_id = t.id
    WHERE r.id = ?
  `);
  const result = await stmt.bind(relationshipId).first<{ user_id: string }>();

  return result?.user_id === userId;
}
