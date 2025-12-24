'use server';

/**
 * Server Actions for database operations
 * These can be called from client and server components
 */

import {
  getAllTreesLocal,
  getTreeByIdLocal,
  getTreeWithDataLocal,
  createTreeLocal,
  createPersonLocal,
  createRelationshipLocal,
} from './local';
import type { Tree, Person, Relationship } from './schema';

// Default user ID for development
const DEV_USER_ID = 'dev-user-001';

// =====================================================
// TREE ACTIONS
// =====================================================

export async function getTrees(): Promise<Tree[]> {
  return getAllTreesLocal();
}

export async function getTreeById(id: string): Promise<Tree | null> {
  return getTreeByIdLocal(id);
}

export async function getTreeWithData(treeId: string): Promise<{
  tree: Tree | null;
  persons: Person[];
  relationships: Relationship[];
}> {
  return getTreeWithDataLocal(treeId);
}

export async function createTree(input: {
  name: string;
  description?: string;
  is_public?: boolean;
}): Promise<Tree> {
  return createTreeLocal({
    user_id: DEV_USER_ID,
    name: input.name,
    description: input.description,
    is_public: input.is_public,
  });
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
  return createPersonLocal(input);
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
  return createRelationshipLocal(input);
}
