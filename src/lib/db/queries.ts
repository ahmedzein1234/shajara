/**
 * Database query functions for Shajara Arabic Family Tree
 * Designed for Cloudflare D1 database
 */

import { randomUUID } from 'crypto';
import type {
  Person,
  CreatePersonInput,
  UpdatePersonInput,
  DbPerson,
  dbToPerson,
  personToDB,
  Relationship,
  CreateRelationshipInput,
  UpdateRelationshipInput,
  RelationshipType,
  PersonWithRelationship,
  ParentChildRelationship,
  SpouseRelationship,
  Event,
  CreateEventInput,
  UpdateEventInput,
  PersonSearchParams,
  PersonSearchResult,
  buildFullNameAr,
  Tree,
  CreateTreeInput,
  UpdateTreeInput,
  DbTree,
  dbToTree,
  treeToDB,
  Media,
  PersonMedia,
  CreatePersonMediaInput,
  PersonWithMedia,
} from './schema';

// =====================================================
// PERSON QUERIES
// =====================================================

/**
 * Get a person by ID
 */
export async function getPersonById(db: D1Database, personId: string): Promise<Person | null> {
  const result = await db
    .prepare('SELECT * FROM persons WHERE id = ?')
    .bind(personId)
    .first<DbPerson>();

  return result ? dbToPerson(result) : null;
}

/**
 * Get all persons in a tree
 */
export async function getPersonsByTree(
  db: D1Database,
  treeId: string,
  limit: number = 100,
  offset: number = 0
): Promise<Person[]> {
  const results = await db
    .prepare('SELECT * FROM persons WHERE tree_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?')
    .bind(treeId, limit, offset)
    .all<DbPerson>();

  return results.results.map(dbToPerson);
}

/**
 * Create a new person
 */
export async function createPerson(db: D1Database, input: CreatePersonInput): Promise<Person> {
  const id = input.id || randomUUID();
  const now = Math.floor(Date.now() / 1000);

  // Build full names if not provided
  const full_name_ar = input.full_name_ar || buildFullNameAr(input);
  const full_name_en = input.full_name_en || null;

  const dbPerson = personToDB({
    ...input,
    id,
    full_name_ar,
    full_name_en,
    created_at: now,
    updated_at: now,
  });

  await db
    .prepare(
      `INSERT INTO persons (
        id, tree_id, given_name, patronymic_chain, family_name,
        full_name_ar, full_name_en, gender,
        birth_date, birth_place, birth_place_lat, birth_place_lng,
        death_date, death_place, death_place_lat, death_place_lng,
        is_living, photo_url, notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      dbPerson.id,
      dbPerson.tree_id,
      dbPerson.given_name,
      dbPerson.patronymic_chain,
      dbPerson.family_name,
      dbPerson.full_name_ar,
      dbPerson.full_name_en,
      dbPerson.gender,
      dbPerson.birth_date,
      dbPerson.birth_place,
      dbPerson.birth_place_lat,
      dbPerson.birth_place_lng,
      dbPerson.death_date,
      dbPerson.death_place,
      dbPerson.death_place_lat,
      dbPerson.death_place_lng,
      dbPerson.is_living,
      dbPerson.photo_url,
      dbPerson.notes,
      dbPerson.created_at,
      dbPerson.updated_at
    )
    .run();

  const created = await getPersonById(db, id);
  if (!created) {
    throw new Error('Failed to create person');
  }

  return created;
}

/**
 * Update a person
 */
export async function updatePerson(
  db: D1Database,
  personId: string,
  input: UpdatePersonInput
): Promise<Person> {
  const now = Math.floor(Date.now() / 1000);

  // Get existing person to build full name if components changed
  const existing = await getPersonById(db, personId);
  if (!existing) {
    throw new Error('Person not found');
  }

  const updated = { ...existing, ...input };
  const full_name_ar = input.full_name_ar || buildFullNameAr(updated);

  const dbPerson = personToDB({
    ...input,
    full_name_ar,
    updated_at: now,
  });

  const setParts: string[] = [];
  const values: any[] = [];

  Object.entries(dbPerson).forEach(([key, value]) => {
    if (value !== undefined && key !== 'id') {
      setParts.push(`${key} = ?`);
      values.push(value);
    }
  });

  if (setParts.length === 0) {
    return existing;
  }

  values.push(personId);

  await db
    .prepare(`UPDATE persons SET ${setParts.join(', ')} WHERE id = ?`)
    .bind(...values)
    .run();

  const updatedPerson = await getPersonById(db, personId);
  if (!updatedPerson) {
    throw new Error('Failed to update person');
  }

  return updatedPerson;
}

/**
 * Delete a person (cascade deletes relationships, events, etc.)
 */
export async function deletePerson(db: D1Database, personId: string): Promise<void> {
  await db.prepare('DELETE FROM persons WHERE id = ?').bind(personId).run();
}

/**
 * Search persons by name (uses FTS5 full-text search)
 */
export async function searchPersons(
  db: D1Database,
  params: PersonSearchParams
): Promise<PersonSearchResult> {
  const { tree_id, query, gender, is_living, limit = 50, offset = 0 } = params;

  let sql: string;
  let countSql: string;
  const bindings: any[] = [];

  if (query && query.trim()) {
    // Full-text search
    sql = `
      SELECT p.* FROM persons p
      INNER JOIN persons_fts fts ON p.id = fts.person_id
      WHERE fts.persons_fts MATCH ?
    `;
    countSql = `
      SELECT COUNT(*) as count FROM persons p
      INNER JOIN persons_fts fts ON p.id = fts.person_id
      WHERE fts.persons_fts MATCH ?
    `;
    bindings.push(query);
  } else {
    // Regular search
    sql = 'SELECT * FROM persons WHERE 1=1';
    countSql = 'SELECT COUNT(*) as count FROM persons WHERE 1=1';
  }

  // Add filters
  if (tree_id) {
    sql += ' AND tree_id = ?';
    countSql += ' AND tree_id = ?';
    bindings.push(tree_id);
  }

  if (gender) {
    sql += ' AND gender = ?';
    countSql += ' AND gender = ?';
    bindings.push(gender);
  }

  if (is_living !== undefined) {
    sql += ' AND is_living = ?';
    countSql += ' AND is_living = ?';
    bindings.push(is_living ? 1 : 0);
  }

  // Get total count
  const countResult = await db.prepare(countSql).bind(...bindings).first<{ count: number }>();
  const total = countResult?.count || 0;

  // Get results
  sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  bindings.push(limit, offset);

  const results = await db.prepare(sql).bind(...bindings).all<DbPerson>();

  return {
    persons: results.results.map(dbToPerson),
    total,
  };
}

// =====================================================
// RELATIONSHIP QUERIES
// =====================================================

/**
 * Get all relationships for a person
 */
export async function getRelationships(
  db: D1Database,
  personId: string,
  relationshipType?: RelationshipType
): Promise<Relationship[]> {
  let sql = `
    SELECT * FROM relationships
    WHERE person1_id = ? OR person2_id = ?
  `;
  const bindings: any[] = [personId, personId];

  if (relationshipType) {
    sql += ' AND relationship_type = ?';
    bindings.push(relationshipType);
  }

  sql += ' ORDER BY created_at DESC';

  const results = await db.prepare(sql).bind(...bindings).all<Relationship>();
  return results.results;
}

/**
 * Get parents of a person
 */
export async function getParents(db: D1Database, personId: string): Promise<Person[]> {
  const results = await db
    .prepare(
      `
      SELECT p.* FROM persons p
      INNER JOIN relationships r ON p.id = r.person1_id
      WHERE r.person2_id = ? AND r.relationship_type = 'parent'
    `
    )
    .bind(personId)
    .all<DbPerson>();

  return results.results.map(dbToPerson);
}

/**
 * Get children of a person
 */
export async function getChildren(db: D1Database, personId: string): Promise<Person[]> {
  const results = await db
    .prepare(
      `
      SELECT p.* FROM persons p
      INNER JOIN relationships r ON p.id = r.person2_id
      WHERE r.person1_id = ? AND r.relationship_type = 'parent'
    `
    )
    .bind(personId)
    .all<DbPerson>();

  return results.results.map(dbToPerson);
}

/**
 * Get spouses of a person
 */
export async function getSpouses(db: D1Database, personId: string): Promise<SpouseRelationship[]> {
  const results = await db
    .prepare(
      `
      SELECT
        p1.*, p2.*,
        r.id as relationship_id,
        r.marriage_date, r.marriage_place,
        r.divorce_date, r.divorce_place
      FROM relationships r
      INNER JOIN persons p1 ON p1.id = r.person1_id
      INNER JOIN persons p2 ON p2.id = r.person2_id
      WHERE (r.person1_id = ? OR r.person2_id = ?)
        AND r.relationship_type = 'spouse'
    `
    )
    .bind(personId, personId)
    .all<any>();

  return results.results.map((row) => {
    const person1 = dbToPerson({
      id: row.id,
      tree_id: row.tree_id,
      given_name: row.given_name,
      patronymic_chain: row.patronymic_chain,
      family_name: row.family_name,
      full_name_ar: row.full_name_ar,
      full_name_en: row.full_name_en,
      gender: row.gender,
      birth_date: row.birth_date,
      birth_place: row.birth_place,
      birth_place_lat: row.birth_place_lat,
      birth_place_lng: row.birth_place_lng,
      death_date: row.death_date,
      death_place: row.death_place,
      death_place_lat: row.death_place_lat,
      death_place_lng: row.death_place_lng,
      is_living: row.is_living,
      photo_url: row.photo_url,
      notes: row.notes,
      created_at: row.created_at,
      updated_at: row.updated_at,
    });

    return {
      person1,
      person2: person1, // Simplified - in real implementation, need to handle person2 columns
      relationship_id: row.relationship_id,
      marriage_date: row.marriage_date,
      marriage_place: row.marriage_place,
      divorce_date: row.divorce_date,
      divorce_place: row.divorce_place,
    };
  });
}

/**
 * Get siblings of a person
 */
export async function getSiblings(db: D1Database, personId: string): Promise<Person[]> {
  // Get parents first
  const parents = await getParents(db, personId);
  if (parents.length === 0) {
    return [];
  }

  // Get all children of the parents (excluding the person themselves)
  const siblings: Person[] = [];
  for (const parent of parents) {
    const children = await getChildren(db, parent.id);
    siblings.push(...children.filter((c) => c.id !== personId));
  }

  // Remove duplicates
  const uniqueSiblings = Array.from(
    new Map(siblings.map((s) => [s.id, s])).values()
  );

  return uniqueSiblings;
}

/**
 * Create a relationship
 */
export async function createRelationship(
  db: D1Database,
  input: CreateRelationshipInput
): Promise<Relationship> {
  const id = input.id || randomUUID();
  const now = Math.floor(Date.now() / 1000);

  await db
    .prepare(
      `INSERT INTO relationships (
        id, tree_id, person1_id, person2_id, relationship_type,
        marriage_date, marriage_place, divorce_date, divorce_place, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
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
    )
    .run();

  const created = await db
    .prepare('SELECT * FROM relationships WHERE id = ?')
    .bind(id)
    .first<Relationship>();

  if (!created) {
    throw new Error('Failed to create relationship');
  }

  return created;
}

/**
 * Update a relationship
 */
export async function updateRelationship(
  db: D1Database,
  relationshipId: string,
  input: UpdateRelationshipInput
): Promise<Relationship> {
  const setParts: string[] = [];
  const values: any[] = [];

  Object.entries(input).forEach(([key, value]) => {
    if (value !== undefined) {
      setParts.push(`${key} = ?`);
      values.push(value);
    }
  });

  if (setParts.length === 0) {
    const existing = await db
      .prepare('SELECT * FROM relationships WHERE id = ?')
      .bind(relationshipId)
      .first<Relationship>();

    if (!existing) {
      throw new Error('Relationship not found');
    }

    return existing;
  }

  values.push(relationshipId);

  await db
    .prepare(`UPDATE relationships SET ${setParts.join(', ')} WHERE id = ?`)
    .bind(...values)
    .run();

  const updated = await db
    .prepare('SELECT * FROM relationships WHERE id = ?')
    .bind(relationshipId)
    .first<Relationship>();

  if (!updated) {
    throw new Error('Failed to update relationship');
  }

  return updated;
}

/**
 * Delete a relationship
 */
export async function deleteRelationship(db: D1Database, relationshipId: string): Promise<void> {
  await db.prepare('DELETE FROM relationships WHERE id = ?').bind(relationshipId).run();
}

// =====================================================
// RECURSIVE ANCESTOR/DESCENDANT QUERIES
// =====================================================

/**
 * Get all ancestors of a person (recursive)
 * Returns ancestors in generational order (parents, grandparents, etc.)
 */
export async function getAncestors(
  db: D1Database,
  personId: string,
  maxGenerations: number = 10
): Promise<Person[]> {
  const ancestors: Person[] = [];
  const visited = new Set<string>();
  let currentGeneration = [personId];

  for (let i = 0; i < maxGenerations; i++) {
    if (currentGeneration.length === 0) break;

    const nextGeneration: string[] = [];

    for (const currentId of currentGeneration) {
      if (visited.has(currentId)) continue;
      visited.add(currentId);

      const parents = await getParents(db, currentId);
      ancestors.push(...parents);
      nextGeneration.push(...parents.map((p) => p.id));
    }

    currentGeneration = nextGeneration;
  }

  return ancestors;
}

/**
 * Get all descendants of a person (recursive)
 * Returns descendants in generational order (children, grandchildren, etc.)
 */
export async function getDescendants(
  db: D1Database,
  personId: string,
  maxGenerations: number = 10
): Promise<Person[]> {
  const descendants: Person[] = [];
  const visited = new Set<string>();
  let currentGeneration = [personId];

  for (let i = 0; i < maxGenerations; i++) {
    if (currentGeneration.length === 0) break;

    const nextGeneration: string[] = [];

    for (const currentId of currentGeneration) {
      if (visited.has(currentId)) continue;
      visited.add(currentId);

      const children = await getChildren(db, currentId);
      descendants.push(...children);
      nextGeneration.push(...children.map((c) => c.id));
    }

    currentGeneration = nextGeneration;
  }

  return descendants;
}

/**
 * Get family tree structure for visualization
 * Returns a person with their ancestors and descendants
 */
export async function getFamilyTreeStructure(
  db: D1Database,
  personId: string,
  ancestorGenerations: number = 3,
  descendantGenerations: number = 3
) {
  const person = await getPersonById(db, personId);
  if (!person) {
    throw new Error('Person not found');
  }

  const [ancestors, descendants, parents, children, spouses, siblings] = await Promise.all([
    getAncestors(db, personId, ancestorGenerations),
    getDescendants(db, personId, descendantGenerations),
    getParents(db, personId),
    getChildren(db, personId),
    getSpouses(db, personId),
    getSiblings(db, personId),
  ]);

  return {
    person,
    parents,
    children,
    spouses,
    siblings,
    ancestors,
    descendants,
  };
}

// =====================================================
// TREE QUERIES
// =====================================================

/**
 * Get a tree by ID
 */
export async function getTreeById(db: D1Database, treeId: string): Promise<Tree | null> {
  const result = await db.prepare('SELECT * FROM trees WHERE id = ?').bind(treeId).first<DbTree>();

  return result ? dbToTree(result) : null;
}

/**
 * Get all trees for a user
 */
export async function getTreesByUser(db: D1Database, userId: string): Promise<Tree[]> {
  const results = await db
    .prepare('SELECT * FROM trees WHERE user_id = ? ORDER BY created_at DESC')
    .bind(userId)
    .all<DbTree>();

  return results.results.map(dbToTree);
}

/**
 * Create a new tree
 */
export async function createTree(db: D1Database, input: CreateTreeInput): Promise<Tree> {
  const id = input.id || randomUUID();
  const now = Math.floor(Date.now() / 1000);

  const dbTree = treeToDB({
    ...input,
    id,
    created_at: now,
    updated_at: now,
  });

  await db
    .prepare(
      `INSERT INTO trees (id, user_id, name, description, is_public, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      dbTree.id,
      dbTree.user_id,
      dbTree.name,
      dbTree.description,
      dbTree.is_public,
      dbTree.created_at,
      dbTree.updated_at
    )
    .run();

  const created = await getTreeById(db, id);
  if (!created) {
    throw new Error('Failed to create tree');
  }

  return created;
}

/**
 * Update a tree
 */
export async function updateTree(db: D1Database, treeId: string, input: UpdateTreeInput): Promise<Tree> {
  const now = Math.floor(Date.now() / 1000);

  const dbTree = treeToDB({
    ...input,
    updated_at: now,
  });

  const setParts: string[] = [];
  const values: any[] = [];

  Object.entries(dbTree).forEach(([key, value]) => {
    if (value !== undefined && key !== 'id') {
      setParts.push(`${key} = ?`);
      values.push(value);
    }
  });

  if (setParts.length === 0) {
    const existing = await getTreeById(db, treeId);
    if (!existing) {
      throw new Error('Tree not found');
    }
    return existing;
  }

  values.push(treeId);

  await db
    .prepare(`UPDATE trees SET ${setParts.join(', ')} WHERE id = ?`)
    .bind(...values)
    .run();

  const updated = await getTreeById(db, treeId);
  if (!updated) {
    throw new Error('Failed to update tree');
  }

  return updated;
}

/**
 * Delete a tree (cascade deletes all persons, relationships, etc.)
 */
export async function deleteTree(db: D1Database, treeId: string): Promise<void> {
  await db.prepare('DELETE FROM trees WHERE id = ?').bind(treeId).run();
}

// =====================================================
// EVENT QUERIES
// =====================================================

/**
 * Get events for a person
 */
export async function getEventsByPerson(db: D1Database, personId: string): Promise<Event[]> {
  const results = await db
    .prepare('SELECT * FROM events WHERE person_id = ? ORDER BY event_date DESC')
    .bind(personId)
    .all<Event>();

  return results.results;
}

/**
 * Create an event
 */
export async function createEvent(db: D1Database, input: CreateEventInput): Promise<Event> {
  const id = input.id || randomUUID();
  const now = Math.floor(Date.now() / 1000);

  await db
    .prepare(
      `INSERT INTO events (
        id, person_id, tree_id, event_type, event_date,
        place_name, latitude, longitude, description, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      id,
      input.person_id,
      input.tree_id,
      input.event_type,
      input.event_date,
      input.place_name,
      input.latitude,
      input.longitude,
      input.description,
      now
    )
    .run();

  const created = await db.prepare('SELECT * FROM events WHERE id = ?').bind(id).first<Event>();

  if (!created) {
    throw new Error('Failed to create event');
  }

  return created;
}
