'use server';

/**
 * Server Actions for database operations
 * Uses Cloudflare D1 for production, compatible with edge runtime
 */

import { getCloudflareContext } from '@opennextjs/cloudflare';
import type { Tree, Person, Relationship, DbTree, DbPerson } from './schema';
import { dbToTree, dbToPerson } from './schema';
import { getSession } from '@/lib/auth/actions';

async function getDB() {
  const { env } = await getCloudflareContext();
  return env.DB;
}

// =====================================================
// TREE ACTIONS
// =====================================================

export async function getTrees(): Promise<Tree[]> {
  const db = await getDB();
  const stmt = db.prepare('SELECT * FROM trees ORDER BY created_at DESC');
  const result = await stmt.all<DbTree>();
  return result.results.map(dbToTree);
}

export async function getTreeById(id: string): Promise<Tree | null> {
  const db = await getDB();
  const stmt = db.prepare('SELECT * FROM trees WHERE id = ?');
  const result = await stmt.bind(id).first<DbTree>();
  return result ? dbToTree(result) : null;
}

export async function getTreeWithData(treeId: string): Promise<{
  tree: Tree | null;
  persons: Person[];
  relationships: Relationship[];
}> {
  const db = await getDB();

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
  const session = await getSession();
  if (!session?.user) {
    throw new Error('Not authenticated');
  }

  const db = await getDB();
  const id = crypto.randomUUID();
  const now = Math.floor(Date.now() / 1000);
  const userId = session.user.id;

  const stmt = db.prepare(`
    INSERT INTO trees (id, user_id, name, description, is_public, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  await stmt.bind(
    id,
    userId,
    input.name,
    input.description || null,
    input.is_public ? 1 : 0,
    now,
    now
  ).run();

  // Also add the user as owner in tree_collaborators
  await db.prepare(`
    INSERT INTO tree_collaborators (id, tree_id, user_id, role)
    VALUES (?, ?, ?, 'owner')
  `).bind(crypto.randomUUID(), id, userId).run();

  return {
    id,
    user_id: userId,
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
  // Arabic name components
  kunya?: string;
  laqab?: string;
  nisba?: string;
  nasab_chain?: string;
  nasab_chain_en?: string;
  // Tribal affiliation
  tribe_id?: string;
  tribal_branch?: string;
  tribal_verified?: boolean;
  // Sayyid lineage
  is_sayyid?: boolean;
  sayyid_verified?: boolean;
  sayyid_lineage?: string;
  // Dates
  birth_date?: string;
  birth_date_hijri?: string;
  birth_place?: string;
  death_date?: string;
  death_date_hijri?: string;
  death_place?: string;
  is_living?: boolean;
  notes?: string;
}): Promise<Person> {
  const db = await getDB();
  const id = crypto.randomUUID();
  const now = Math.floor(Date.now() / 1000);

  const stmt = db.prepare(`
    INSERT INTO persons (
      id, tree_id, given_name, patronymic_chain, family_name,
      full_name_ar, full_name_en, gender,
      kunya, laqab, nisba, nasab_chain, nasab_chain_en,
      tribe_id, tribal_branch, tribal_verified,
      is_sayyid, sayyid_verified, sayyid_lineage,
      birth_date, birth_date_hijri, birth_place, birth_place_lat, birth_place_lng,
      death_date, death_date_hijri, death_place, death_place_lat, death_place_lng,
      is_living, photo_url, notes, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
    input.kunya || null,
    input.laqab || null,
    input.nisba || null,
    input.nasab_chain || null,
    input.nasab_chain_en || null,
    input.tribe_id || null,
    input.tribal_branch || null,
    input.tribal_verified ? 1 : 0,
    input.is_sayyid ? 1 : 0,
    input.sayyid_verified ? 1 : 0,
    input.sayyid_lineage || null,
    input.birth_date || null,
    input.birth_date_hijri || null,
    input.birth_place || null,
    null, // birth_place_lat
    null, // birth_place_lng
    input.death_date || null,
    input.death_date_hijri || null,
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
    kunya: input.kunya || null,
    laqab: input.laqab || null,
    nisba: input.nisba || null,
    nasab_chain: input.nasab_chain || null,
    nasab_chain_en: input.nasab_chain_en || null,
    tribe_id: input.tribe_id || null,
    tribal_branch: input.tribal_branch || null,
    tribal_verified: input.tribal_verified || false,
    is_sayyid: input.is_sayyid || false,
    sayyid_verified: input.sayyid_verified || false,
    sayyid_lineage: input.sayyid_lineage || null,
    birth_date: input.birth_date || null,
    birth_date_hijri: input.birth_date_hijri || null,
    birth_place: input.birth_place || null,
    birth_place_lat: null,
    birth_place_lng: null,
    death_date: input.death_date || null,
    death_date_hijri: input.death_date_hijri || null,
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
  marriage_date_hijri?: string;
  marriage_place?: string;
  divorce_date?: string;
  divorce_date_hijri?: string;
  divorce_place?: string;
}): Promise<Relationship> {
  const db = await getDB();
  const id = crypto.randomUUID();
  const now = Math.floor(Date.now() / 1000);

  const stmt = db.prepare(`
    INSERT INTO relationships (
      id, tree_id, person1_id, person2_id, relationship_type,
      marriage_date, marriage_date_hijri, marriage_place,
      divorce_date, divorce_date_hijri, divorce_place, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  await stmt.bind(
    id,
    input.tree_id,
    input.person1_id,
    input.person2_id,
    input.relationship_type,
    input.marriage_date || null,
    input.marriage_date_hijri || null,
    input.marriage_place || null,
    input.divorce_date || null,
    input.divorce_date_hijri || null,
    input.divorce_place || null,
    now
  ).run();

  return {
    id,
    tree_id: input.tree_id,
    person1_id: input.person1_id,
    person2_id: input.person2_id,
    relationship_type: input.relationship_type,
    marriage_date: input.marriage_date || null,
    marriage_date_hijri: input.marriage_date_hijri || null,
    marriage_place: input.marriage_place || null,
    divorce_date: input.divorce_date || null,
    divorce_date_hijri: input.divorce_date_hijri || null,
    divorce_place: input.divorce_place || null,
    created_at: now,
  };
}

// =====================================================
// QUERY ACTIONS (for tree listing page)
// =====================================================

export async function getPersonsByTreeId(treeId: string): Promise<Person[]> {
  const db = await getDB();
  const stmt = db.prepare('SELECT * FROM persons WHERE tree_id = ? ORDER BY created_at DESC');
  const result = await stmt.bind(treeId).all<DbPerson>();
  return result.results.map(dbToPerson);
}

export async function getRelationshipsByTreeId(treeId: string): Promise<Relationship[]> {
  const db = await getDB();
  const stmt = db.prepare('SELECT * FROM relationships WHERE tree_id = ? ORDER BY created_at DESC');
  const result = await stmt.bind(treeId).all<Relationship>();
  return result.results;
}

export async function getPersonById(id: string): Promise<Person | null> {
  const db = await getDB();
  const stmt = db.prepare('SELECT * FROM persons WHERE id = ?');
  const result = await stmt.bind(id).first<DbPerson>();
  return result ? dbToPerson(result) : null;
}

export async function updatePerson(id: string, input: {
  given_name?: string;
  patronymic_chain?: string;
  family_name?: string;
  full_name_ar?: string;
  full_name_en?: string;
  gender?: 'male' | 'female';
  birth_date?: string;
  birth_place?: string;
  birth_place_lat?: number;
  birth_place_lng?: number;
  death_date?: string;
  death_place?: string;
  death_place_lat?: number;
  death_place_lng?: number;
  is_living?: boolean;
  photo_url?: string;
  notes?: string;
}): Promise<Person | null> {
  const db = await getDB();
  const now = Math.floor(Date.now() / 1000);

  const updates: string[] = [];
  const values: (string | number | null)[] = [];

  if (input.given_name !== undefined) {
    updates.push('given_name = ?');
    values.push(input.given_name);
  }
  if (input.patronymic_chain !== undefined) {
    updates.push('patronymic_chain = ?');
    values.push(input.patronymic_chain || null);
  }
  if (input.family_name !== undefined) {
    updates.push('family_name = ?');
    values.push(input.family_name || null);
  }
  if (input.full_name_ar !== undefined) {
    updates.push('full_name_ar = ?');
    values.push(input.full_name_ar || null);
  }
  if (input.full_name_en !== undefined) {
    updates.push('full_name_en = ?');
    values.push(input.full_name_en || null);
  }
  if (input.gender !== undefined) {
    updates.push('gender = ?');
    values.push(input.gender);
  }
  if (input.birth_date !== undefined) {
    updates.push('birth_date = ?');
    values.push(input.birth_date || null);
  }
  if (input.birth_place !== undefined) {
    updates.push('birth_place = ?');
    values.push(input.birth_place || null);
  }
  if (input.death_date !== undefined) {
    updates.push('death_date = ?');
    values.push(input.death_date || null);
  }
  if (input.death_place !== undefined) {
    updates.push('death_place = ?');
    values.push(input.death_place || null);
  }
  if (input.is_living !== undefined) {
    updates.push('is_living = ?');
    values.push(input.is_living ? 1 : 0);
  }
  if (input.photo_url !== undefined) {
    updates.push('photo_url = ?');
    values.push(input.photo_url || null);
  }
  if (input.notes !== undefined) {
    updates.push('notes = ?');
    values.push(input.notes || null);
  }

  if (updates.length === 0) {
    return getPersonById(id);
  }

  updates.push('updated_at = ?');
  values.push(now);
  values.push(id);

  const stmt = db.prepare(`UPDATE persons SET ${updates.join(', ')} WHERE id = ?`);
  await stmt.bind(...values).run();

  return getPersonById(id);
}

export async function deletePerson(id: string): Promise<boolean> {
  const db = await getDB();
  const stmt = db.prepare('DELETE FROM persons WHERE id = ?');
  const result = await stmt.bind(id).run();
  return result.success;
}

export async function deleteRelationship(id: string): Promise<boolean> {
  const db = await getDB();
  const stmt = db.prepare('DELETE FROM relationships WHERE id = ?');
  const result = await stmt.bind(id).run();
  return result.success;
}

export async function updateRelationship(id: string, input: {
  marriage_date?: string;
  marriage_place?: string;
  divorce_date?: string;
  divorce_place?: string;
}): Promise<Relationship | null> {
  const db = await getDB();

  const updates: string[] = [];
  const values: (string | null)[] = [];

  if (input.marriage_date !== undefined) {
    updates.push('marriage_date = ?');
    values.push(input.marriage_date || null);
  }
  if (input.marriage_place !== undefined) {
    updates.push('marriage_place = ?');
    values.push(input.marriage_place || null);
  }
  if (input.divorce_date !== undefined) {
    updates.push('divorce_date = ?');
    values.push(input.divorce_date || null);
  }
  if (input.divorce_place !== undefined) {
    updates.push('divorce_place = ?');
    values.push(input.divorce_place || null);
  }

  if (updates.length === 0) {
    const stmt = db.prepare('SELECT * FROM relationships WHERE id = ?');
    return await stmt.bind(id).first<Relationship>();
  }

  values.push(id);

  const stmt = db.prepare(`UPDATE relationships SET ${updates.join(', ')} WHERE id = ?`);
  await stmt.bind(...values).run();

  const selectStmt = db.prepare('SELECT * FROM relationships WHERE id = ?');
  return await selectStmt.bind(id).first<Relationship>();
}

