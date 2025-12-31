/**
 * Guest Tree Store
 *
 * Allows users to create and edit family trees without registration.
 * Trees are stored in localStorage and can be claimed later by registering.
 */

import type { Person, Relationship, Tree } from '@/lib/db/schema';

const GUEST_TREE_KEY = 'shajara_guest_tree';
const GUEST_PERSONS_KEY = 'shajara_guest_persons';
const GUEST_RELATIONSHIPS_KEY = 'shajara_guest_relationships';
const GUEST_SESSION_KEY = 'shajara_guest_session';

export interface GuestSession {
  id: string;
  createdAt: number;
  lastUpdated: number;
}

export interface GuestTree extends Omit<Tree, 'user_id'> {
  isGuest: true;
}

export interface GuestStore {
  tree: GuestTree | null;
  persons: Person[];
  relationships: Relationship[];
  session: GuestSession | null;
}

/**
 * Generate a simple UUID for guest data
 */
function generateId(): string {
  return 'guest_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

/**
 * Initialize or get existing guest session
 */
export function getGuestSession(): GuestSession | null {
  if (typeof window === 'undefined') return null;

  const stored = localStorage.getItem(GUEST_SESSION_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Create a new guest session
 */
export function createGuestSession(): GuestSession {
  const session: GuestSession = {
    id: generateId(),
    createdAt: Date.now(),
    lastUpdated: Date.now(),
  };

  if (typeof window !== 'undefined') {
    localStorage.setItem(GUEST_SESSION_KEY, JSON.stringify(session));
  }

  return session;
}

/**
 * Get guest tree from localStorage
 */
export function getGuestTree(): GuestTree | null {
  if (typeof window === 'undefined') return null;

  const stored = localStorage.getItem(GUEST_TREE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Create a new guest tree
 */
export function createGuestTree(name: string, description?: string): GuestTree {
  let session = getGuestSession();
  if (!session) {
    session = createGuestSession();
  }

  const now = Math.floor(Date.now() / 1000);
  const tree: GuestTree = {
    id: 'guest_tree_' + session.id,
    name,
    description: description || null,
    is_public: false,
    isGuest: true,
    created_at: now,
    updated_at: now,
  };

  if (typeof window !== 'undefined') {
    localStorage.setItem(GUEST_TREE_KEY, JSON.stringify(tree));
    localStorage.setItem(GUEST_PERSONS_KEY, JSON.stringify([]));
    localStorage.setItem(GUEST_RELATIONSHIPS_KEY, JSON.stringify([]));
  }

  return tree;
}

/**
 * Get all guest persons
 */
export function getGuestPersons(): Person[] {
  if (typeof window === 'undefined') return [];

  const stored = localStorage.getItem(GUEST_PERSONS_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }
  return [];
}

/**
 * Add a person to guest tree
 */
export function addGuestPerson(personData: Omit<Person, 'id' | 'created_at' | 'updated_at'>): Person {
  const now = Math.floor(Date.now() / 1000);
  const person: Person = {
    ...personData,
    id: generateId(),
    created_at: now,
    updated_at: now,
  };

  const persons = getGuestPersons();
  persons.push(person);

  if (typeof window !== 'undefined') {
    localStorage.setItem(GUEST_PERSONS_KEY, JSON.stringify(persons));
    updateGuestSession();
  }

  return person;
}

/**
 * Update a guest person
 */
export function updateGuestPerson(id: string, updates: Partial<Person>): Person | null {
  const persons = getGuestPersons();
  const index = persons.findIndex(p => p.id === id);

  if (index === -1) return null;

  const updated = {
    ...persons[index],
    ...updates,
    updated_at: Math.floor(Date.now() / 1000),
  };

  persons[index] = updated;

  if (typeof window !== 'undefined') {
    localStorage.setItem(GUEST_PERSONS_KEY, JSON.stringify(persons));
    updateGuestSession();
  }

  return updated;
}

/**
 * Delete a guest person
 */
export function deleteGuestPerson(id: string): boolean {
  const persons = getGuestPersons();
  const filtered = persons.filter(p => p.id !== id);

  if (filtered.length === persons.length) return false;

  // Also delete any relationships involving this person
  const relationships = getGuestRelationships();
  const filteredRels = relationships.filter(
    r => r.person1_id !== id && r.person2_id !== id
  );

  if (typeof window !== 'undefined') {
    localStorage.setItem(GUEST_PERSONS_KEY, JSON.stringify(filtered));
    localStorage.setItem(GUEST_RELATIONSHIPS_KEY, JSON.stringify(filteredRels));
    updateGuestSession();
  }

  return true;
}

/**
 * Get all guest relationships
 */
export function getGuestRelationships(): Relationship[] {
  if (typeof window === 'undefined') return [];

  const stored = localStorage.getItem(GUEST_RELATIONSHIPS_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }
  return [];
}

/**
 * Add a relationship to guest tree
 */
export function addGuestRelationship(
  relationshipData: Omit<Relationship, 'id' | 'created_at'>
): Relationship {
  const relationship: Relationship = {
    ...relationshipData,
    id: generateId(),
    created_at: Math.floor(Date.now() / 1000),
  };

  const relationships = getGuestRelationships();
  relationships.push(relationship);

  if (typeof window !== 'undefined') {
    localStorage.setItem(GUEST_RELATIONSHIPS_KEY, JSON.stringify(relationships));
    updateGuestSession();
  }

  return relationship;
}

/**
 * Delete a guest relationship
 */
export function deleteGuestRelationship(id: string): boolean {
  const relationships = getGuestRelationships();
  const filtered = relationships.filter(r => r.id !== id);

  if (filtered.length === relationships.length) return false;

  if (typeof window !== 'undefined') {
    localStorage.setItem(GUEST_RELATIONSHIPS_KEY, JSON.stringify(filtered));
    updateGuestSession();
  }

  return true;
}

/**
 * Update guest session timestamp
 */
function updateGuestSession(): void {
  const session = getGuestSession();
  if (session) {
    session.lastUpdated = Date.now();
    localStorage.setItem(GUEST_SESSION_KEY, JSON.stringify(session));
  }
}

/**
 * Get complete guest store
 */
export function getGuestStore(): GuestStore {
  return {
    tree: getGuestTree(),
    persons: getGuestPersons(),
    relationships: getGuestRelationships(),
    session: getGuestSession(),
  };
}

/**
 * Check if guest has any data
 */
export function hasGuestData(): boolean {
  const store = getGuestStore();
  return store.tree !== null || store.persons.length > 0;
}

/**
 * Clear all guest data (after claiming or discarding)
 */
export function clearGuestData(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(GUEST_TREE_KEY);
    localStorage.removeItem(GUEST_PERSONS_KEY);
    localStorage.removeItem(GUEST_RELATIONSHIPS_KEY);
    localStorage.removeItem(GUEST_SESSION_KEY);
  }
}

/**
 * Get tree age in hours
 */
export function getGuestTreeAge(): number | null {
  const session = getGuestSession();
  if (!session) return null;

  return (Date.now() - session.createdAt) / (1000 * 60 * 60);
}

/**
 * Export guest data for claiming
 */
export function exportGuestDataForClaim(): {
  tree: GuestTree | null;
  persons: Person[];
  relationships: Relationship[];
} {
  return {
    tree: getGuestTree(),
    persons: getGuestPersons(),
    relationships: getGuestRelationships(),
  };
}
