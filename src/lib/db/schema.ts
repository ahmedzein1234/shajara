/**
 * TypeScript types for Shajara Arabic Family Tree Database Schema
 * Matches the D1 database schema defined in migrations/0001_initial_schema.sql
 */

// =====================================================
// USER TYPES
// =====================================================

export interface User {
  id: string; // UUID
  email: string;
  name: string;
  avatar_url: string | null;
  locale: 'ar' | 'en';
  created_at: number; // Unix timestamp
  updated_at: number;
}

export type CreateUserInput = Omit<User, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
};

export type UpdateUserInput = Partial<Omit<User, 'id' | 'created_at' | 'updated_at'>>;

// =====================================================
// TREE TYPES
// =====================================================

export interface Tree {
  id: string; // UUID
  user_id: string;
  name: string;
  description: string | null;
  is_public: boolean;
  created_at: number;
  updated_at: number;
}

export type CreateTreeInput = Omit<Tree, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
};

export type UpdateTreeInput = Partial<Omit<Tree, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;

// =====================================================
// PERSON TYPES (Core entity for family members)
// =====================================================

export type Gender = 'male' | 'female';

export interface Person {
  id: string; // UUID
  tree_id: string;

  // Arabic name components
  given_name: string; // الاسم الأول
  patronymic_chain: string | null; // سلسلة النسب (e.g., "بن خالد بن محمد")
  family_name: string | null; // اسم العائلة/القبيلة

  // Full computed names
  full_name_ar: string | null; // Full Arabic name
  full_name_en: string | null; // English transliteration

  // Basic information
  gender: Gender;

  // Birth information
  birth_date: string | null; // ISO 8601 or Hijri date string
  birth_place: string | null;
  birth_place_lat: number | null;
  birth_place_lng: number | null;

  // Death information
  death_date: string | null;
  death_place: string | null;
  death_place_lat: number | null;
  death_place_lng: number | null;
  is_living: boolean;

  // Media and notes
  photo_url: string | null;
  notes: string | null;

  // Metadata
  created_at: number;
  updated_at: number;
}

export type CreatePersonInput = Omit<Person, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
};

export type UpdatePersonInput = Partial<Omit<Person, 'id' | 'tree_id' | 'created_at' | 'updated_at'>>;

/**
 * Helper to build full Arabic name from components
 */
export function buildFullNameAr(person: Pick<Person, 'given_name' | 'patronymic_chain' | 'family_name'>): string {
  const parts = [person.given_name];

  if (person.patronymic_chain) {
    parts.push(person.patronymic_chain);
  }

  if (person.family_name) {
    parts.push(person.family_name);
  }

  return parts.join(' ');
}

// =====================================================
// RELATIONSHIP TYPES
// =====================================================

export type RelationshipType = 'parent' | 'spouse' | 'sibling';

export interface Relationship {
  id: string; // UUID
  tree_id: string;
  person1_id: string;
  person2_id: string;
  relationship_type: RelationshipType;

  // Marriage-specific fields
  marriage_date: string | null;
  marriage_place: string | null;
  divorce_date: string | null;
  divorce_place: string | null;

  created_at: number;
}

export type CreateRelationshipInput = Omit<Relationship, 'id' | 'created_at'> & {
  id?: string;
};

export type UpdateRelationshipInput = Partial<Omit<Relationship, 'id' | 'tree_id' | 'person1_id' | 'person2_id' | 'relationship_type' | 'created_at'>>;

// Helper types for relationship queries
export interface PersonWithRelationship extends Person {
  relationship_type: RelationshipType;
  relationship_id: string;
}

export interface ParentChildRelationship {
  parent: Person;
  child: Person;
  relationship_id: string;
}

export interface SpouseRelationship {
  person1: Person;
  person2: Person;
  relationship_id: string;
  marriage_date: string | null;
  marriage_place: string | null;
  divorce_date: string | null;
  divorce_place: string | null;
}

// =====================================================
// EVENT TYPES
// =====================================================

export type EventType = 'birth' | 'death' | 'marriage' | 'migration' | 'hajj' | 'graduation' | 'military_service' | 'career' | 'custom';

export interface Event {
  id: string; // UUID
  person_id: string;
  tree_id: string;
  event_type: EventType;
  event_date: string | null; // ISO 8601 or Hijri date
  place_name: string | null;
  latitude: number | null;
  longitude: number | null;
  description: string | null;
  created_at: number;
}

export type CreateEventInput = Omit<Event, 'id' | 'created_at'> & {
  id?: string;
};

export type UpdateEventInput = Partial<Omit<Event, 'id' | 'person_id' | 'tree_id' | 'created_at'>>;

// =====================================================
// MEDIA TYPES
// =====================================================

export interface Media {
  id: string; // UUID
  tree_id: string;
  r2_key: string; // R2 object key
  url: string; // Public URL
  file_type: string; // MIME type
  file_size: number; // Bytes
  title: string | null;
  description: string | null;
  uploaded_by: string; // User ID
  created_at: number;
}

export type CreateMediaInput = Omit<Media, 'id' | 'created_at'> & {
  id?: string;
};

export type UpdateMediaInput = Partial<Omit<Media, 'id' | 'tree_id' | 'r2_key' | 'uploaded_by' | 'created_at'>>;

// =====================================================
// PERSON_MEDIA TYPES (Junction table)
// =====================================================

export interface PersonMedia {
  id: string; // UUID
  person_id: string;
  media_id: string;
  caption: string | null;
  display_order: number;
  is_primary: boolean;
  created_at: number;
}

export type CreatePersonMediaInput = Omit<PersonMedia, 'id' | 'created_at'> & {
  id?: string;
};

// Combined type for person with their media
export interface PersonWithMedia extends Person {
  media: Array<Media & { caption: string | null; display_order: number; is_primary: boolean }>;
}

// =====================================================
// TREE COLLABORATOR TYPES
// =====================================================

export type CollaboratorRole = 'owner' | 'editor' | 'viewer';

export interface TreeCollaborator {
  id: string;
  tree_id: string;
  user_id: string;
  role: CollaboratorRole;
  invited_at: number;
}

export type CreateCollaboratorInput = Omit<TreeCollaborator, 'id' | 'invited_at'> & {
  id?: string;
};

// =====================================================
// AUDIT LOG TYPES
// =====================================================

export type EntityType = 'person' | 'relationship' | 'event' | 'media' | 'tree' | 'user';
export type AuditAction = 'create' | 'update' | 'delete';

export interface AuditLog {
  id: string;
  user_id: string;
  tree_id: string | null;
  entity_type: EntityType;
  entity_id: string;
  action: AuditAction;
  changes: string | null; // JSON string
  created_at: number;
}

export type CreateAuditLogInput = Omit<AuditLog, 'id' | 'created_at'> & {
  id?: string;
};

// =====================================================
// SEARCH AND FILTER TYPES
// =====================================================

export interface PersonSearchParams {
  tree_id?: string;
  query?: string; // Text search across names
  gender?: Gender;
  is_living?: boolean;
  birth_year_min?: number;
  birth_year_max?: number;
  limit?: number;
  offset?: number;
}

export interface PersonSearchResult {
  persons: Person[];
  total: number;
}

// =====================================================
// PAGINATION TYPES
// =====================================================

export interface PaginationParams {
  limit?: number;
  offset?: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
}

// =====================================================
// DATABASE ROW TYPES (as returned from D1)
// D1 stores booleans as 0/1, so we need conversion types
// =====================================================

export type DbUser = Omit<User, 'locale'> & {
  locale: string;
};

export type DbTree = Omit<Tree, 'is_public'> & {
  is_public: number; // 0 or 1
};

export type DbPerson = Omit<Person, 'is_living'> & {
  is_living: number; // 0 or 1
};

export type DbPersonMedia = Omit<PersonMedia, 'is_primary'> & {
  is_primary: number; // 0 or 1
};

// =====================================================
// CONVERSION HELPERS
// =====================================================

export function dbToTree(dbTree: DbTree): Tree {
  return {
    ...dbTree,
    is_public: dbTree.is_public === 1,
  };
}

export function dbToPerson(dbPerson: DbPerson): Person {
  return {
    ...dbPerson,
    is_living: dbPerson.is_living === 1,
  };
}

export function dbToPersonMedia(dbPersonMedia: DbPersonMedia): PersonMedia {
  return {
    ...dbPersonMedia,
    is_primary: dbPersonMedia.is_primary === 1,
  };
}

export function treeToDB(tree: Partial<Tree>): Partial<DbTree> {
  const { is_public, ...rest } = tree;
  return {
    ...rest,
    is_public: is_public !== undefined ? (is_public ? 1 : 0) : undefined,
  };
}

export function personToDB(person: Partial<Person>): Partial<DbPerson> {
  const { is_living, ...rest } = person;
  return {
    ...rest,
    is_living: is_living !== undefined ? (is_living ? 1 : 0) : undefined,
  };
}
