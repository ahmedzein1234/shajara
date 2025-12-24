/**
 * Local database helper for development
 * Uses better-sqlite3 to read from wrangler's local D1 database
 */

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import type { Tree, Person, Relationship, DbTree, DbPerson } from './schema';
import { dbToTree, dbToPerson } from './schema';

let db: Database.Database | null = null;

function findLocalDatabase(): string | null {
  const wranglerDir = path.join(process.cwd(), '.wrangler', 'state', 'v3', 'd1', 'miniflare-D1DatabaseObject');

  if (!fs.existsSync(wranglerDir)) {
    return null;
  }

  const files = fs.readdirSync(wranglerDir);
  const sqliteFile = files.find(f => f.endsWith('.sqlite'));

  if (!sqliteFile) {
    return null;
  }

  return path.join(wranglerDir, sqliteFile);
}

function getDatabase(): Database.Database {
  if (db) {
    return db;
  }

  const dbPath = findLocalDatabase();

  if (!dbPath) {
    throw new Error(
      'Local D1 database not found. Run "npm run db:migrate" first to create it.'
    );
  }

  db = new Database(dbPath, { readonly: false });
  return db;
}

// =====================================================
// TREE OPERATIONS
// =====================================================

export function getTreesByUserIdLocal(userId: string): Tree[] {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM trees WHERE user_id = ? ORDER BY created_at DESC');
  const results = stmt.all(userId) as DbTree[];
  return results.map(dbToTree);
}

export function getAllTreesLocal(): Tree[] {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM trees ORDER BY created_at DESC');
  const results = stmt.all() as DbTree[];
  return results.map(dbToTree);
}

export function getTreeByIdLocal(id: string): Tree | null {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM trees WHERE id = ?');
  const result = stmt.get(id) as DbTree | undefined;
  return result ? dbToTree(result) : null;
}

export function createTreeLocal(input: {
  id?: string;
  user_id: string;
  name: string;
  description?: string | null;
  is_public?: boolean;
}): Tree {
  const db = getDatabase();
  const id = input.id || crypto.randomUUID();
  const now = Math.floor(Date.now() / 1000);

  const stmt = db.prepare(`
    INSERT INTO trees (id, user_id, name, description, is_public, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id,
    input.user_id,
    input.name,
    input.description || null,
    input.is_public ? 1 : 0,
    now,
    now
  );

  return {
    id,
    user_id: input.user_id,
    name: input.name,
    description: input.description || null,
    is_public: input.is_public || false,
    created_at: now,
    updated_at: now,
  };
}

// =====================================================
// PERSON OPERATIONS
// =====================================================

export function getPersonsByTreeIdLocal(treeId: string): Person[] {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM persons WHERE tree_id = ? ORDER BY created_at DESC');
  const results = stmt.all(treeId) as DbPerson[];
  return results.map(dbToPerson);
}

export function getPersonByIdLocal(id: string): Person | null {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM persons WHERE id = ?');
  const result = stmt.get(id) as DbPerson | undefined;
  return result ? dbToPerson(result) : null;
}

export function createPersonLocal(input: {
  id?: string;
  tree_id: string;
  given_name: string;
  patronymic_chain?: string | null;
  family_name?: string | null;
  full_name_ar?: string | null;
  full_name_en?: string | null;
  gender: 'male' | 'female';
  birth_date?: string | null;
  birth_place?: string | null;
  birth_place_lat?: number | null;
  birth_place_lng?: number | null;
  death_date?: string | null;
  death_place?: string | null;
  death_place_lat?: number | null;
  death_place_lng?: number | null;
  is_living?: boolean;
  photo_url?: string | null;
  notes?: string | null;
}): Person {
  const db = getDatabase();
  const id = input.id || crypto.randomUUID();
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

  stmt.run(
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
    input.birth_place_lat || null,
    input.birth_place_lng || null,
    input.death_date || null,
    input.death_place || null,
    input.death_place_lat || null,
    input.death_place_lng || null,
    input.is_living !== false ? 1 : 0,
    input.photo_url || null,
    input.notes || null,
    now,
    now
  );

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
    birth_place_lat: input.birth_place_lat || null,
    birth_place_lng: input.birth_place_lng || null,
    death_date: input.death_date || null,
    death_place: input.death_place || null,
    death_place_lat: input.death_place_lat || null,
    death_place_lng: input.death_place_lng || null,
    is_living: input.is_living !== false,
    photo_url: input.photo_url || null,
    notes: input.notes || null,
    created_at: now,
    updated_at: now,
  };
}

// =====================================================
// RELATIONSHIP OPERATIONS
// =====================================================

export function getRelationshipsByTreeIdLocal(treeId: string): Relationship[] {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM relationships WHERE tree_id = ? ORDER BY created_at DESC');
  const results = stmt.all(treeId) as Relationship[];
  return results;
}

export function createRelationshipLocal(input: {
  id?: string;
  tree_id: string;
  person1_id: string;
  person2_id: string;
  relationship_type: 'parent' | 'spouse' | 'sibling';
  marriage_date?: string | null;
  marriage_place?: string | null;
  divorce_date?: string | null;
  divorce_place?: string | null;
}): Relationship {
  const db = getDatabase();
  const id = input.id || crypto.randomUUID();
  const now = Math.floor(Date.now() / 1000);

  const stmt = db.prepare(`
    INSERT INTO relationships (
      id, tree_id, person1_id, person2_id, relationship_type,
      marriage_date, marriage_place, divorce_date, divorce_place, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id,
    input.tree_id,
    input.person1_id,
    input.person2_id,
    input.relationship_type,
    input.marriage_date || null,
    input.marriage_place || null,
    input.divorce_date || null,
    input.divorce_place || null,
    now
  );

  return {
    id,
    tree_id: input.tree_id,
    person1_id: input.person1_id,
    person2_id: input.person2_id,
    relationship_type: input.relationship_type,
    marriage_date: input.marriage_date || null,
    marriage_place: input.marriage_place || null,
    divorce_date: input.divorce_date || null,
    divorce_place: input.divorce_place || null,
    created_at: now,
  };
}

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

export function getTreeWithDataLocal(treeId: string): {
  tree: Tree | null;
  persons: Person[];
  relationships: Relationship[];
} {
  const tree = getTreeByIdLocal(treeId);
  if (!tree) {
    return { tree: null, persons: [], relationships: [] };
  }

  const persons = getPersonsByTreeIdLocal(treeId);
  const relationships = getRelationshipsByTreeIdLocal(treeId);

  return { tree, persons, relationships };
}

export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}
