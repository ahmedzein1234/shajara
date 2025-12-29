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
import { buildSafeUpdate } from '../db/safe-update';

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
  const dbInput = personToDB(input);

  // Add updated_at to input
  const now = Math.floor(Date.now() / 1000);
  const inputWithTimestamp = { ...dbInput, updated_at: now };

  // Use safe update helper to validate column names
  const safeUpdate = buildSafeUpdate('persons', inputWithTimestamp);

  if (!safeUpdate) {
    return getPersonById(db, id);
  }

  const { setParts, values } = safeUpdate;
  values.push(id);

  const stmt = db.prepare(`
    UPDATE persons
    SET ${setParts.join(', ')}
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

// =====================================================
// OPTIMIZED TREE LOADING (2 QUERIES INSTEAD OF N+1)
// =====================================================

/**
 * Person with pre-computed relationship data
 */
export interface PersonWithRelations extends Person {
  parentIds: string[];
  childIds: string[];
  spouseIds: string[];
}

/**
 * Complete tree data with all persons and relationships
 * Loaded in just 2 queries instead of N+1
 */
export interface TreeData {
  tree: Tree;
  persons: Person[];
  relationships: Relationship[];
  // Pre-computed maps for efficient traversal
  personMap: Map<string, Person>;
  parentMap: Map<string, string[]>;    // personId -> parentIds
  childMap: Map<string, string[]>;     // personId -> childIds
  spouseMap: Map<string, string[]>;    // personId -> spouseIds
}

/**
 * Get complete tree data with all persons and relationships in 2 queries
 * This replaces the N+1 query pattern used by getAncestors/getDescendants
 */
export async function getTreeWithRelationships(
  db: D1Database,
  treeId: string
): Promise<TreeData | null> {
  // Query 1: Get tree
  const tree = await getTreeById(db, treeId);
  if (!tree) {
    return null;
  }

  // Query 2: Get all persons (batch)
  const persons = await getPersonsByTreeId(db, treeId);

  // Query 3: Get all relationships (batch)
  const relationships = await getRelationshipsByTreeId(db, treeId);

  // Build person lookup map
  const personMap = new Map<string, Person>();
  for (const person of persons) {
    personMap.set(person.id, person);
  }

  // Build relationship maps
  const parentMap = new Map<string, string[]>();
  const childMap = new Map<string, string[]>();
  const spouseMap = new Map<string, string[]>();

  // Initialize empty arrays for all persons
  for (const person of persons) {
    parentMap.set(person.id, []);
    childMap.set(person.id, []);
    spouseMap.set(person.id, []);
  }

  // Populate relationship maps from relationships
  for (const rel of relationships) {
    if (rel.relationship_type === 'parent') {
      // person1 is parent of person2
      // Add person1 to person2's parents
      const parents = parentMap.get(rel.person2_id) || [];
      if (!parents.includes(rel.person1_id)) {
        parents.push(rel.person1_id);
        parentMap.set(rel.person2_id, parents);
      }

      // Add person2 to person1's children
      const children = childMap.get(rel.person1_id) || [];
      if (!children.includes(rel.person2_id)) {
        children.push(rel.person2_id);
        childMap.set(rel.person1_id, children);
      }
    } else if (rel.relationship_type === 'spouse') {
      // Bidirectional spouse relationship
      const spouses1 = spouseMap.get(rel.person1_id) || [];
      if (!spouses1.includes(rel.person2_id)) {
        spouses1.push(rel.person2_id);
        spouseMap.set(rel.person1_id, spouses1);
      }

      const spouses2 = spouseMap.get(rel.person2_id) || [];
      if (!spouses2.includes(rel.person1_id)) {
        spouses2.push(rel.person1_id);
        spouseMap.set(rel.person2_id, spouses2);
      }
    }
  }

  return {
    tree,
    persons,
    relationships,
    personMap,
    parentMap,
    childMap,
    spouseMap,
  };
}

/**
 * Get ancestors using pre-loaded tree data (no additional queries)
 */
export function getAncestorsFromTreeData(
  treeData: TreeData,
  personId: string,
  maxGenerations: number = 10
): Person[] {
  const ancestors: Person[] = [];
  const visited = new Set<string>();
  let currentGeneration = [personId];

  for (let i = 0; i < maxGenerations; i++) {
    if (currentGeneration.length === 0) break;

    const nextGeneration: string[] = [];

    for (const currentId of currentGeneration) {
      if (visited.has(currentId)) continue;
      visited.add(currentId);

      const parentIds = treeData.parentMap.get(currentId) || [];
      for (const parentId of parentIds) {
        const parent = treeData.personMap.get(parentId);
        if (parent && !visited.has(parentId)) {
          ancestors.push(parent);
          nextGeneration.push(parentId);
        }
      }
    }

    currentGeneration = nextGeneration;
  }

  return ancestors;
}

/**
 * Get descendants using pre-loaded tree data (no additional queries)
 */
export function getDescendantsFromTreeData(
  treeData: TreeData,
  personId: string,
  maxGenerations: number = 10
): Person[] {
  const descendants: Person[] = [];
  const visited = new Set<string>();
  let currentGeneration = [personId];

  for (let i = 0; i < maxGenerations; i++) {
    if (currentGeneration.length === 0) break;

    const nextGeneration: string[] = [];

    for (const currentId of currentGeneration) {
      if (visited.has(currentId)) continue;
      visited.add(currentId);

      const childIds = treeData.childMap.get(currentId) || [];
      for (const childId of childIds) {
        const child = treeData.personMap.get(childId);
        if (child && !visited.has(childId)) {
          descendants.push(child);
          nextGeneration.push(childId);
        }
      }
    }

    currentGeneration = nextGeneration;
  }

  return descendants;
}

/**
 * Get siblings using pre-loaded tree data (no additional queries)
 */
export function getSiblingsFromTreeData(
  treeData: TreeData,
  personId: string
): Person[] {
  const parentIds = treeData.parentMap.get(personId) || [];
  if (parentIds.length === 0) return [];

  const siblingIds = new Set<string>();

  for (const parentId of parentIds) {
    const childIds = treeData.childMap.get(parentId) || [];
    for (const childId of childIds) {
      if (childId !== personId) {
        siblingIds.add(childId);
      }
    }
  }

  const siblings: Person[] = [];
  for (const siblingId of siblingIds) {
    const sibling = treeData.personMap.get(siblingId);
    if (sibling) {
      siblings.push(sibling);
    }
  }

  return siblings;
}

/**
 * Get spouses using pre-loaded tree data (no additional queries)
 */
export function getSpousesFromTreeData(
  treeData: TreeData,
  personId: string
): Person[] {
  const spouseIds = treeData.spouseMap.get(personId) || [];
  const spouses: Person[] = [];

  for (const spouseId of spouseIds) {
    const spouse = treeData.personMap.get(spouseId);
    if (spouse) {
      spouses.push(spouse);
    }
  }

  return spouses;
}

/**
 * Get parents using pre-loaded tree data (no additional queries)
 */
export function getParentsFromTreeData(
  treeData: TreeData,
  personId: string
): Person[] {
  const parentIds = treeData.parentMap.get(personId) || [];
  const parents: Person[] = [];

  for (const parentId of parentIds) {
    const parent = treeData.personMap.get(parentId);
    if (parent) {
      parents.push(parent);
    }
  }

  return parents;
}

/**
 * Get children using pre-loaded tree data (no additional queries)
 */
export function getChildrenFromTreeData(
  treeData: TreeData,
  personId: string
): Person[] {
  const childIds = treeData.childMap.get(personId) || [];
  const children: Person[] = [];

  for (const childId of childIds) {
    const child = treeData.personMap.get(childId);
    if (child) {
      children.push(child);
    }
  }

  return children;
}
