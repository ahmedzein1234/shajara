'use server';

/**
 * Server Actions for database operations
 * Uses Cloudflare D1 for production, compatible with edge runtime
 */

import { getRequestContext } from '@cloudflare/next-on-pages';
import type { Tree, Person, Relationship, DbTree, DbPerson } from './schema';
import { dbToTree, dbToPerson } from './schema';

// Default user ID for development
const DEV_USER_ID = 'dev-user-001';

function getDB() {
  const ctx = getRequestContext();
  return ctx.env.DB;
}

// =====================================================
// TREE ACTIONS
// =====================================================

export async function getTrees(): Promise<Tree[]> {
  const db = getDB();
  const stmt = db.prepare('SELECT * FROM trees ORDER BY created_at DESC');
  const result = await stmt.all<DbTree>();
  return result.results.map(dbToTree);
}

export async function getTreeById(id: string): Promise<Tree | null> {
  const db = getDB();
  const stmt = db.prepare('SELECT * FROM trees WHERE id = ?');
  const result = await stmt.bind(id).first<DbTree>();
  return result ? dbToTree(result) : null;
}

export async function getTreeWithData(treeId: string): Promise<{
  tree: Tree | null;
  persons: Person[];
  relationships: Relationship[];
}> {
  const db = getDB();

  // Get tree
  const treeStmt = db.prepare('SELECT * FROM trees WHERE id = ?');
  const treeResult = await treeStmt.bind(treeId).first<DbTree>();

  if (!treeResult) {
    return { tree: null, persons: [], relationships: [] };
  }

  // Get persons
  const personsStmt = db.prepare('SELECT * FROM persons WHERE tree_id = ? ORDER BY created_at DESC');
  const personsResult = await personsStmt.bind(treeId).all<DbPerson>();

  // Get relationships
  const relStmt = db.prepare('SELECT * FROM relationships WHERE tree_id = ? ORDER BY created_at DESC');
  const relResult = await relStmt.bind(treeId).all<Relationship>();

  return {
    tree: dbToTree(treeResult),
    persons: personsResult.results.map(dbToPerson),
    relationships: relResult.results,
  };
}

export async function createTree(input: {
  name: string;
  description?: string;
  is_public?: boolean;
}): Promise<Tree> {
  const db = getDB();
  const id = crypto.randomUUID();
  const now = Math.floor(Date.now() / 1000);

  const stmt = db.prepare(`
    INSERT INTO trees (id, user_id, name, description, is_public, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  await stmt.bind(
    id,
    DEV_USER_ID,
    input.name,
    input.description || null,
    input.is_public ? 1 : 0,
    now,
    now
  ).run();

  return {
    id,
    user_id: DEV_USER_ID,
    name: input.name,
    description: input.description || null,
    is_public: input.is_public || false,
    created_at: now,
    updated_at: now,
  };
}

// =====================================================
// PERSON ACTIONS
// =====================================================

export async function createPerson(input: {
  tree_id: string;
  given_name: string;
  patronymic_chain?: string;
  family_name?: string;
  full_name_ar?: string;
  full_name_en?: string;
  gender: 'male' | 'female';
  birth_date?: string;
  birth_place?: string;
  death_date?: string;
  death_place?: string;
  is_living?: boolean;
  notes?: string;
}): Promise<Person> {
  const db = getDB();
  const id = crypto.randomUUID();
  const now = Math.floor(Date.now() / 1000);

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
    input.patronymic_chain || null,
    input.family_name || null,
    input.full_name_ar || null,
    input.full_name_en || null,
    input.gender,
    input.birth_date || null,
    input.birth_place || null,
    null, // birth_place_lat
    null, // birth_place_lng
    input.death_date || null,
    input.death_place || null,
    null, // death_place_lat
    null, // death_place_lng
    input.is_living !== false ? 1 : 0,
    null, // photo_url
    input.notes || null,
    now,
    now
  ).run();

  return {
    id,
    tree_id: input.tree_id,
    given_name: input.given_name,
    patronymic_chain: input.patronymic_chain || null,
    family_name: input.family_name || null,
    full_name_ar: input.full_name_ar || null,
    full_name_en: input.full_name_en || null,
    gender: input.gender,
    birth_date: input.birth_date || null,
    birth_place: input.birth_place || null,
    birth_place_lat: null,
    birth_place_lng: null,
    death_date: input.death_date || null,
    death_place: input.death_place || null,
    death_place_lat: null,
    death_place_lng: null,
    is_living: input.is_living !== false,
    photo_url: null,
    notes: input.notes || null,
    created_at: now,
    updated_at: now,
  };
}

// =====================================================
// RELATIONSHIP ACTIONS
// =====================================================

export async function createRelationship(input: {
  tree_id: string;
  person1_id: string;
  person2_id: string;
  relationship_type: 'parent' | 'spouse' | 'sibling';
  marriage_date?: string;
  marriage_place?: string;
}): Promise<Relationship> {
  const db = getDB();
  const id = crypto.randomUUID();
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
    input.marriage_date || null,
    input.marriage_place || null,
    null, // divorce_date
    null, // divorce_place
    now
  ).run();

  return {
    id,
    tree_id: input.tree_id,
    person1_id: input.person1_id,
    person2_id: input.person2_id,
    relationship_type: input.relationship_type,
    marriage_date: input.marriage_date || null,
    marriage_place: input.marriage_place || null,
    divorce_date: null,
    divorce_place: null,
    created_at: now,
  };
}

// =====================================================
// QUERY ACTIONS (for tree listing page)
// =====================================================

export async function getPersonsByTreeId(treeId: string): Promise<Person[]> {
  const db = getDB();
  const stmt = db.prepare('SELECT * FROM persons WHERE tree_id = ? ORDER BY created_at DESC');
  const result = await stmt.bind(treeId).all<DbPerson>();
  return result.results.map(dbToPerson);
}

export async function getRelationshipsByTreeId(treeId: string): Promise<Relationship[]> {
  const db = getDB();
  const stmt = db.prepare('SELECT * FROM relationships WHERE tree_id = ? ORDER BY created_at DESC');
  const result = await stmt.bind(treeId).all<Relationship>();
  return result.results;
}

