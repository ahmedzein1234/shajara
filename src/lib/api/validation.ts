/**
 * Request validation schemas for Shajara API
 * Provides type-safe validation for all API endpoints
 */

import type {
  CreateTreeInput,
  UpdateTreeInput,
  CreatePersonInput,
  UpdatePersonInput,
  CreateRelationshipInput,
  Gender,
  RelationshipType,
} from '../db/schema';

// =====================================================
// VALIDATION HELPERS
// =====================================================

export class ValidationError extends Error {
  constructor(
    message: string,
    public field?: string,
    public code?: string
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function isValidDate(date: string): boolean {
  // Check ISO 8601 format or simple date format
  const isoRegex = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?)?$/;
  const hijriRegex = /^\d{4}\/\d{2}\/\d{2}$/; // Simple Hijri date format
  return isoRegex.test(date) || hijriRegex.test(date);
}

function isValidGender(gender: string): gender is Gender {
  return gender === 'male' || gender === 'female';
}

function isValidRelationshipType(type: string): type is RelationshipType {
  return type === 'parent' || type === 'spouse' || type === 'sibling';
}

function isValidLocale(locale: string): locale is 'ar' | 'en' {
  return locale === 'ar' || locale === 'en';
}

// =====================================================
// TREE VALIDATION
// =====================================================

export function validateCreateTree(data: unknown): CreateTreeInput {
  if (!data || typeof data !== 'object') {
    throw new ValidationError('Request body must be an object');
  }

  const input = data as Partial<CreateTreeInput>;

  if (!input.user_id || typeof input.user_id !== 'string') {
    throw new ValidationError('user_id is required and must be a string', 'user_id');
  }

  if (!isValidUUID(input.user_id)) {
    throw new ValidationError('user_id must be a valid UUID', 'user_id');
  }

  if (!input.name || typeof input.name !== 'string') {
    throw new ValidationError('name is required and must be a string', 'name');
  }

  if (input.name.trim().length === 0) {
    throw new ValidationError('name cannot be empty', 'name');
  }

  if (input.name.length > 200) {
    throw new ValidationError('name cannot exceed 200 characters', 'name');
  }

  if (input.description !== undefined && input.description !== null) {
    if (typeof input.description !== 'string') {
      throw new ValidationError('description must be a string', 'description');
    }
    if (input.description.length > 1000) {
      throw new ValidationError('description cannot exceed 1000 characters', 'description');
    }
  }

  if (input.is_public !== undefined && typeof input.is_public !== 'boolean') {
    throw new ValidationError('is_public must be a boolean', 'is_public');
  }

  return {
    user_id: input.user_id,
    name: input.name.trim(),
    description: input.description?.trim() || null,
    is_public: input.is_public ?? false,
  };
}

export function validateUpdateTree(data: unknown): UpdateTreeInput {
  if (!data || typeof data !== 'object') {
    throw new ValidationError('Request body must be an object');
  }

  const input = data as Partial<UpdateTreeInput>;

  if (input.name !== undefined) {
    if (typeof input.name !== 'string') {
      throw new ValidationError('name must be a string', 'name');
    }
    if (input.name.trim().length === 0) {
      throw new ValidationError('name cannot be empty', 'name');
    }
    if (input.name.length > 200) {
      throw new ValidationError('name cannot exceed 200 characters', 'name');
    }
  }

  if (input.description !== undefined && input.description !== null) {
    if (typeof input.description !== 'string') {
      throw new ValidationError('description must be a string', 'description');
    }
    if (input.description.length > 1000) {
      throw new ValidationError('description cannot exceed 1000 characters', 'description');
    }
  }

  if (input.is_public !== undefined && typeof input.is_public !== 'boolean') {
    throw new ValidationError('is_public must be a boolean', 'is_public');
  }

  return {
    ...(input.name !== undefined && { name: input.name.trim() }),
    ...(input.description !== undefined && { description: input.description?.trim() || null }),
    ...(input.is_public !== undefined && { is_public: input.is_public }),
  };
}

// =====================================================
// PERSON VALIDATION
// =====================================================

export function validateCreatePerson(data: unknown): CreatePersonInput {
  if (!data || typeof data !== 'object') {
    throw new ValidationError('Request body must be an object');
  }

  const input = data as Partial<CreatePersonInput>;

  if (!input.tree_id || typeof input.tree_id !== 'string') {
    throw new ValidationError('tree_id is required and must be a string', 'tree_id');
  }

  if (!isValidUUID(input.tree_id)) {
    throw new ValidationError('tree_id must be a valid UUID', 'tree_id');
  }

  if (!input.given_name || typeof input.given_name !== 'string') {
    throw new ValidationError('given_name is required and must be a string', 'given_name');
  }

  if (input.given_name.trim().length === 0) {
    throw new ValidationError('given_name cannot be empty', 'given_name');
  }

  if (!input.gender || typeof input.gender !== 'string') {
    throw new ValidationError('gender is required and must be a string', 'gender');
  }

  if (!isValidGender(input.gender)) {
    throw new ValidationError('gender must be either "male" or "female"', 'gender');
  }

  // Validate optional string fields
  const stringFields = ['patronymic_chain', 'family_name', 'full_name_ar', 'full_name_en',
    'birth_date', 'birth_place', 'death_date', 'death_place', 'photo_url', 'notes'];

  for (const field of stringFields) {
    const value = input[field as keyof typeof input];
    if (value !== undefined && value !== null && typeof value !== 'string') {
      throw new ValidationError(`${field} must be a string`, field);
    }
  }

  // Validate dates
  if (input.birth_date && !isValidDate(input.birth_date)) {
    throw new ValidationError('birth_date must be a valid date string', 'birth_date');
  }

  if (input.death_date && !isValidDate(input.death_date)) {
    throw new ValidationError('death_date must be a valid date string', 'death_date');
  }

  // Validate number fields
  const numberFields = ['birth_place_lat', 'birth_place_lng', 'death_place_lat', 'death_place_lng'];
  for (const field of numberFields) {
    const value = input[field as keyof typeof input];
    if (value !== undefined && value !== null && typeof value !== 'number') {
      throw new ValidationError(`${field} must be a number`, field);
    }
  }

  // Validate latitude/longitude ranges
  if (input.birth_place_lat !== undefined && input.birth_place_lat !== null) {
    if (input.birth_place_lat < -90 || input.birth_place_lat > 90) {
      throw new ValidationError('birth_place_lat must be between -90 and 90', 'birth_place_lat');
    }
  }

  if (input.birth_place_lng !== undefined && input.birth_place_lng !== null) {
    if (input.birth_place_lng < -180 || input.birth_place_lng > 180) {
      throw new ValidationError('birth_place_lng must be between -180 and 180', 'birth_place_lng');
    }
  }

  if (input.death_place_lat !== undefined && input.death_place_lat !== null) {
    if (input.death_place_lat < -90 || input.death_place_lat > 90) {
      throw new ValidationError('death_place_lat must be between -90 and 90', 'death_place_lat');
    }
  }

  if (input.death_place_lng !== undefined && input.death_place_lng !== null) {
    if (input.death_place_lng < -180 || input.death_place_lng > 180) {
      throw new ValidationError('death_place_lng must be between -180 and 180', 'death_place_lng');
    }
  }

  if (input.is_living !== undefined && typeof input.is_living !== 'boolean') {
    throw new ValidationError('is_living must be a boolean', 'is_living');
  }

  return {
    tree_id: input.tree_id,
    given_name: input.given_name.trim(),
    patronymic_chain: input.patronymic_chain?.trim() || null,
    family_name: input.family_name?.trim() || null,
    full_name_ar: input.full_name_ar?.trim() || null,
    full_name_en: input.full_name_en?.trim() || null,
    gender: input.gender,
    birth_date: input.birth_date?.trim() || null,
    birth_place: input.birth_place?.trim() || null,
    birth_place_lat: input.birth_place_lat ?? null,
    birth_place_lng: input.birth_place_lng ?? null,
    death_date: input.death_date?.trim() || null,
    death_place: input.death_place?.trim() || null,
    death_place_lat: input.death_place_lat ?? null,
    death_place_lng: input.death_place_lng ?? null,
    is_living: input.is_living ?? true,
    photo_url: input.photo_url?.trim() || null,
    notes: input.notes?.trim() || null,
  };
}

export function validateUpdatePerson(data: unknown): UpdatePersonInput {
  if (!data || typeof data !== 'object') {
    throw new ValidationError('Request body must be an object');
  }

  const input = data as Partial<UpdatePersonInput>;
  const result: UpdatePersonInput = {};

  if (input.given_name !== undefined) {
    if (typeof input.given_name !== 'string') {
      throw new ValidationError('given_name must be a string', 'given_name');
    }
    if (input.given_name.trim().length === 0) {
      throw new ValidationError('given_name cannot be empty', 'given_name');
    }
    result.given_name = input.given_name.trim();
  }

  if (input.gender !== undefined) {
    if (typeof input.gender !== 'string') {
      throw new ValidationError('gender must be a string', 'gender');
    }
    if (!isValidGender(input.gender)) {
      throw new ValidationError('gender must be either "male" or "female"', 'gender');
    }
    result.gender = input.gender;
  }

  // Validate optional string fields
  const stringFields = ['patronymic_chain', 'family_name', 'full_name_ar', 'full_name_en',
    'birth_date', 'birth_place', 'death_date', 'death_place', 'photo_url', 'notes'];

  for (const field of stringFields) {
    const value = input[field as keyof typeof input];
    if (value !== undefined) {
      if (value !== null && typeof value !== 'string') {
        throw new ValidationError(`${field} must be a string`, field);
      }
      (result as any)[field] = value === null ? null : (value as string).trim();
    }
  }

  // Validate dates
  if (input.birth_date !== undefined && input.birth_date !== null && !isValidDate(input.birth_date)) {
    throw new ValidationError('birth_date must be a valid date string', 'birth_date');
  }

  if (input.death_date !== undefined && input.death_date !== null && !isValidDate(input.death_date)) {
    throw new ValidationError('death_date must be a valid date string', 'death_date');
  }

  // Validate number fields
  const numberFields = ['birth_place_lat', 'birth_place_lng', 'death_place_lat', 'death_place_lng'];
  for (const field of numberFields) {
    const value = input[field as keyof typeof input];
    if (value !== undefined) {
      if (value !== null && typeof value !== 'number') {
        throw new ValidationError(`${field} must be a number`, field);
      }
      (result as any)[field] = value as number | null;
    }
  }

  if (input.is_living !== undefined && typeof input.is_living !== 'boolean') {
    throw new ValidationError('is_living must be a boolean', 'is_living');
  }

  if (input.is_living !== undefined) {
    result.is_living = input.is_living;
  }

  return result;
}

// =====================================================
// RELATIONSHIP VALIDATION
// =====================================================

export function validateCreateRelationship(data: unknown): CreateRelationshipInput {
  if (!data || typeof data !== 'object') {
    throw new ValidationError('Request body must be an object');
  }

  const input = data as Partial<CreateRelationshipInput>;

  if (!input.tree_id || typeof input.tree_id !== 'string') {
    throw new ValidationError('tree_id is required and must be a string', 'tree_id');
  }

  if (!isValidUUID(input.tree_id)) {
    throw new ValidationError('tree_id must be a valid UUID', 'tree_id');
  }

  if (!input.person1_id || typeof input.person1_id !== 'string') {
    throw new ValidationError('person1_id is required and must be a string', 'person1_id');
  }

  if (!isValidUUID(input.person1_id)) {
    throw new ValidationError('person1_id must be a valid UUID', 'person1_id');
  }

  if (!input.person2_id || typeof input.person2_id !== 'string') {
    throw new ValidationError('person2_id is required and must be a string', 'person2_id');
  }

  if (!isValidUUID(input.person2_id)) {
    throw new ValidationError('person2_id must be a valid UUID', 'person2_id');
  }

  if (input.person1_id === input.person2_id) {
    throw new ValidationError('person1_id and person2_id cannot be the same', 'person2_id');
  }

  if (!input.relationship_type || typeof input.relationship_type !== 'string') {
    throw new ValidationError('relationship_type is required and must be a string', 'relationship_type');
  }

  if (!isValidRelationshipType(input.relationship_type)) {
    throw new ValidationError('relationship_type must be "parent", "spouse", or "sibling"', 'relationship_type');
  }

  // Validate optional string fields
  const stringFields = ['marriage_date', 'marriage_place', 'divorce_date', 'divorce_place'];
  for (const field of stringFields) {
    const value = input[field as keyof typeof input];
    if (value !== undefined && value !== null && typeof value !== 'string') {
      throw new ValidationError(`${field} must be a string`, field);
    }
  }

  // Validate dates
  if (input.marriage_date && !isValidDate(input.marriage_date)) {
    throw new ValidationError('marriage_date must be a valid date string', 'marriage_date');
  }

  if (input.divorce_date && !isValidDate(input.divorce_date)) {
    throw new ValidationError('divorce_date must be a valid date string', 'divorce_date');
  }

  return {
    tree_id: input.tree_id,
    person1_id: input.person1_id,
    person2_id: input.person2_id,
    relationship_type: input.relationship_type,
    marriage_date: input.marriage_date?.trim() || null,
    marriage_place: input.marriage_place?.trim() || null,
    divorce_date: input.divorce_date?.trim() || null,
    divorce_place: input.divorce_place?.trim() || null,
  };
}

// =====================================================
// SEARCH VALIDATION
// =====================================================

export interface SearchParams {
  tree_id?: string;
  query?: string;
  gender?: Gender;
  is_living?: boolean;
  limit?: number;
  offset?: number;
}

export function validateSearchParams(params: URLSearchParams): SearchParams {
  const result: SearchParams = {};

  const treeId = params.get('tree_id');
  if (treeId) {
    if (!isValidUUID(treeId)) {
      throw new ValidationError('tree_id must be a valid UUID', 'tree_id');
    }
    result.tree_id = treeId;
  }

  const query = params.get('query');
  if (query) {
    result.query = query.trim();
  }

  const gender = params.get('gender');
  if (gender) {
    if (!isValidGender(gender)) {
      throw new ValidationError('gender must be either "male" or "female"', 'gender');
    }
    result.gender = gender;
  }

  const isLiving = params.get('is_living');
  if (isLiving) {
    if (isLiving !== 'true' && isLiving !== 'false') {
      throw new ValidationError('is_living must be "true" or "false"', 'is_living');
    }
    result.is_living = isLiving === 'true';
  }

  const limit = params.get('limit');
  if (limit) {
    const limitNum = parseInt(limit, 10);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      throw new ValidationError('limit must be a number between 1 and 100', 'limit');
    }
    result.limit = limitNum;
  }

  const offset = params.get('offset');
  if (offset) {
    const offsetNum = parseInt(offset, 10);
    if (isNaN(offsetNum) || offsetNum < 0) {
      throw new ValidationError('offset must be a non-negative number', 'offset');
    }
    result.offset = offsetNum;
  }

  return result;
}

// =====================================================
// UPLOAD VALIDATION
// =====================================================

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function validateUploadFile(file: File): void {
  if (!file) {
    throw new ValidationError('File is required');
  }

  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new ValidationError(
      `Invalid file type. Allowed types: ${ALLOWED_IMAGE_TYPES.join(', ')}`,
      'file'
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new ValidationError(
      `File size exceeds maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024}MB`,
      'file'
    );
  }
}
