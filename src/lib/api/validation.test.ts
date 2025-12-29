/**
 * Validation Unit Tests
 * Tests for API input validation functions
 */

import { describe, it, expect } from 'vitest';
import {
  sanitizeText,
  isValidUrl,
  validateCreateTree,
  validateUpdateTree,
  validateCreatePerson,
  validateUpdatePerson,
  validateCreateRelationship,
  validateSearchParams,
  validateAIInput,
  ValidationError,
  MAX_LENGTHS,
} from './validation';

describe('Validation: sanitizeText', () => {
  it('should remove null bytes', () => {
    expect(sanitizeText('hello\0world')).toBe('helloworld');
  });

  it('should remove control characters', () => {
    expect(sanitizeText('hello\x00\x01\x02world')).toBe('helloworld');
  });

  it('should preserve newlines and tabs', () => {
    expect(sanitizeText('hello\n\tworld')).toBe('hello\n\tworld');
  });

  it('should handle empty string', () => {
    expect(sanitizeText('')).toBe('');
  });

  it('should preserve Arabic text', () => {
    expect(sanitizeText('مرحبا بالعالم')).toBe('مرحبا بالعالم');
  });

  it('should truncate long text', () => {
    const longText = 'a'.repeat(10000);
    expect(sanitizeText(longText).length).toBe(MAX_LENGTHS.notes);
  });
});

describe('Validation: isValidUrl', () => {
  it('should accept HTTPS URLs', () => {
    expect(isValidUrl('https://example.com')).toBe(true);
    expect(isValidUrl('https://example.com/path/to/image.jpg')).toBe(true);
  });

  it('should accept data URLs', () => {
    expect(isValidUrl('data:image/png;base64,abc123')).toBe(true);
  });

  it('should reject HTTP URLs', () => {
    expect(isValidUrl('http://example.com')).toBe(false);
  });

  it('should reject invalid URLs', () => {
    expect(isValidUrl('not-a-url')).toBe(false);
    expect(isValidUrl('')).toBe(false);
    expect(isValidUrl('ftp://example.com')).toBe(false);
  });

  it('should reject very long URLs', () => {
    const longUrl = 'https://example.com/' + 'a'.repeat(3000);
    expect(isValidUrl(longUrl)).toBe(false);
  });
});

describe('Validation: validateCreateTree', () => {
  const validUUID = '550e8400-e29b-41d4-a716-446655440000';

  it('should accept valid tree data', () => {
    const result = validateCreateTree({
      user_id: validUUID,
      name: 'Test Tree',
      description: 'A test tree',
      is_public: false,
    });

    expect(result.user_id).toBe(validUUID);
    expect(result.name).toBe('Test Tree');
    expect(result.description).toBe('A test tree');
    expect(result.is_public).toBe(false);
  });

  it('should accept Arabic tree name', () => {
    const result = validateCreateTree({
      user_id: validUUID,
      name: 'شجرة عائلة الراشد',
    });

    expect(result.name).toBe('شجرة عائلة الراشد');
  });

  it('should throw on missing user_id', () => {
    expect(() => validateCreateTree({ name: 'Test' }))
      .toThrow(ValidationError);
  });

  it('should throw on invalid user_id format', () => {
    expect(() => validateCreateTree({ user_id: 'invalid', name: 'Test' }))
      .toThrow('user_id must be a valid UUID');
  });

  it('should throw on missing name', () => {
    expect(() => validateCreateTree({ user_id: validUUID }))
      .toThrow(ValidationError);
  });

  it('should throw on empty name', () => {
    expect(() => validateCreateTree({ user_id: validUUID, name: '   ' }))
      .toThrow('name cannot be empty');
  });

  it('should throw on name too long', () => {
    expect(() => validateCreateTree({ user_id: validUUID, name: 'a'.repeat(300) }))
      .toThrow('name cannot exceed');
  });

  it('should default is_public to false', () => {
    const result = validateCreateTree({ user_id: validUUID, name: 'Test' });
    expect(result.is_public).toBe(false);
  });

  it('should sanitize name', () => {
    const result = validateCreateTree({
      user_id: validUUID,
      name: 'Test\0Tree',
    });
    expect(result.name).toBe('TestTree');
  });
});

describe('Validation: validateUpdateTree', () => {
  it('should accept partial updates', () => {
    const result = validateUpdateTree({ name: 'New Name' });
    expect(result.name).toBe('New Name');
    expect(result.description).toBeUndefined();
  });

  it('should allow setting description to null', () => {
    const result = validateUpdateTree({ description: null });
    expect(result.description).toBeNull();
  });

  it('should throw on empty name', () => {
    expect(() => validateUpdateTree({ name: '' }))
      .toThrow('name cannot be empty');
  });

  it('should accept empty object', () => {
    const result = validateUpdateTree({});
    expect(Object.keys(result)).toHaveLength(0);
  });
});

describe('Validation: validateCreatePerson', () => {
  const validUUID = '550e8400-e29b-41d4-a716-446655440000';

  it('should accept valid person data', () => {
    const result = validateCreatePerson({
      tree_id: validUUID,
      given_name: 'Ahmed',
      gender: 'male',
    });

    expect(result.tree_id).toBe(validUUID);
    expect(result.given_name).toBe('Ahmed');
    expect(result.gender).toBe('male');
    expect(result.is_living).toBe(true);
  });

  it('should accept full person data', () => {
    const result = validateCreatePerson({
      tree_id: validUUID,
      given_name: 'أحمد',
      patronymic_chain: 'بن محمد بن عبدالله',
      family_name: 'الراشد',
      full_name_ar: 'أحمد بن محمد الراشد',
      full_name_en: 'Ahmed bin Mohammed Al-Rashid',
      gender: 'male',
      birth_date: '1980-01-15',
      birth_place: 'Riyadh',
      birth_place_lat: 24.7136,
      birth_place_lng: 46.6753,
      is_living: true,
    });

    expect(result.patronymic_chain).toBe('بن محمد بن عبدالله');
    expect(result.birth_place_lat).toBe(24.7136);
  });

  it('should throw on missing tree_id', () => {
    expect(() => validateCreatePerson({ given_name: 'Ahmed', gender: 'male' }))
      .toThrow('tree_id is required');
  });

  it('should throw on invalid gender', () => {
    expect(() => validateCreatePerson({
      tree_id: validUUID,
      given_name: 'Ahmed',
      gender: 'other',
    })).toThrow('gender must be either "male" or "female"');
  });

  it('should throw on invalid date format', () => {
    expect(() => validateCreatePerson({
      tree_id: validUUID,
      given_name: 'Ahmed',
      gender: 'male',
      birth_date: 'not-a-date',
    })).toThrow('birth_date must be a valid date');
  });

  it('should accept ISO date format', () => {
    const result = validateCreatePerson({
      tree_id: validUUID,
      given_name: 'Ahmed',
      gender: 'male',
      birth_date: '1980-01-15T10:30:00Z',
    });
    expect(result.birth_date).toBe('1980-01-15T10:30:00Z');
  });

  it('should accept Hijri date format', () => {
    const result = validateCreatePerson({
      tree_id: validUUID,
      given_name: 'Ahmed',
      gender: 'male',
      birth_date: '1400/06/15',
    });
    expect(result.birth_date).toBe('1400/06/15');
  });

  it('should throw on invalid latitude', () => {
    expect(() => validateCreatePerson({
      tree_id: validUUID,
      given_name: 'Ahmed',
      gender: 'male',
      birth_place_lat: 100,
    })).toThrow('birth_place_lat must be between -90 and 90');
  });

  it('should throw on invalid longitude', () => {
    expect(() => validateCreatePerson({
      tree_id: validUUID,
      given_name: 'Ahmed',
      gender: 'male',
      birth_place_lng: 200,
    })).toThrow('birth_place_lng must be between -180 and 180');
  });

  it('should throw on invalid photo URL', () => {
    expect(() => validateCreatePerson({
      tree_id: validUUID,
      given_name: 'Ahmed',
      gender: 'male',
      photo_url: 'http://example.com/photo.jpg',
    })).toThrow('photo_url must be a valid HTTPS URL');
  });
});

describe('Validation: validateUpdatePerson', () => {
  it('should accept partial updates', () => {
    const result = validateUpdatePerson({ given_name: 'Mohammed' });
    expect(result.given_name).toBe('Mohammed');
  });

  it('should allow setting fields to null', () => {
    const result = validateUpdatePerson({ death_date: null, death_place: null });
    expect(result.death_date).toBeNull();
    expect(result.death_place).toBeNull();
  });

  it('should throw on empty given_name', () => {
    expect(() => validateUpdatePerson({ given_name: '' }))
      .toThrow('given_name cannot be empty');
  });
});

describe('Validation: validateCreateRelationship', () => {
  const validUUID1 = '550e8400-e29b-41d4-a716-446655440001';
  const validUUID2 = '550e8400-e29b-41d4-a716-446655440002';
  const treeUUID = '550e8400-e29b-41d4-a716-446655440000';

  it('should accept valid relationship data', () => {
    const result = validateCreateRelationship({
      tree_id: treeUUID,
      person1_id: validUUID1,
      person2_id: validUUID2,
      relationship_type: 'parent',
    });

    expect(result.relationship_type).toBe('parent');
  });

  it('should accept spouse relationship with marriage data', () => {
    const result = validateCreateRelationship({
      tree_id: treeUUID,
      person1_id: validUUID1,
      person2_id: validUUID2,
      relationship_type: 'spouse',
      marriage_date: '2000-06-15',
      marriage_place: 'Riyadh',
    });

    expect(result.marriage_date).toBe('2000-06-15');
    expect(result.marriage_place).toBe('Riyadh');
  });

  it('should throw when person1_id equals person2_id', () => {
    expect(() => validateCreateRelationship({
      tree_id: treeUUID,
      person1_id: validUUID1,
      person2_id: validUUID1,
      relationship_type: 'parent',
    })).toThrow('person1_id and person2_id cannot be the same');
  });

  it('should throw on invalid relationship type', () => {
    expect(() => validateCreateRelationship({
      tree_id: treeUUID,
      person1_id: validUUID1,
      person2_id: validUUID2,
      relationship_type: 'cousin',
    })).toThrow('relationship_type must be "parent", "spouse", or "sibling"');
  });
});

describe('Validation: validateSearchParams', () => {
  it('should parse valid search params', () => {
    const params = new URLSearchParams({
      tree_id: '550e8400-e29b-41d4-a716-446655440000',
      query: 'Ahmed',
      gender: 'male',
      is_living: 'true',
      limit: '20',
      offset: '0',
    });

    const result = validateSearchParams(params);

    expect(result.query).toBe('Ahmed');
    expect(result.gender).toBe('male');
    expect(result.is_living).toBe(true);
    expect(result.limit).toBe(20);
    expect(result.offset).toBe(0);
  });

  it('should handle empty params', () => {
    const params = new URLSearchParams();
    const result = validateSearchParams(params);
    expect(Object.keys(result)).toHaveLength(0);
  });

  it('should throw on invalid limit', () => {
    const params = new URLSearchParams({ limit: '200' });
    expect(() => validateSearchParams(params))
      .toThrow('limit must be a number between 1 and 100');
  });

  it('should throw on negative offset', () => {
    const params = new URLSearchParams({ offset: '-1' });
    expect(() => validateSearchParams(params))
      .toThrow('offset must be a non-negative number');
  });

  it('should throw on query too long', () => {
    const params = new URLSearchParams({ query: 'a'.repeat(300) });
    expect(() => validateSearchParams(params))
      .toThrow('query cannot exceed');
  });
});

describe('Validation: validateAIInput', () => {
  it('should accept valid AI input', () => {
    const result = validateAIInput('Extract family information from this text');
    expect(result).toBe('Extract family information from this text');
  });

  it('should sanitize AI input', () => {
    const result = validateAIInput('Text with\0null byte');
    expect(result).toBe('Text withnull byte');
  });

  it('should throw on empty input', () => {
    expect(() => validateAIInput('')).toThrow('AI input is required');
  });

  it('should throw on input too long', () => {
    expect(() => validateAIInput('a'.repeat(15000)))
      .toThrow('AI input cannot exceed');
  });

  it('should accept Arabic AI input', () => {
    const result = validateAIInput('استخراج معلومات العائلة من هذا النص');
    expect(result).toBe('استخراج معلومات العائلة من هذا النص');
  });
});

describe('Validation: ValidationError', () => {
  it('should include field information', () => {
    const error = new ValidationError('Invalid value', 'fieldName', 'INVALID');
    expect(error.field).toBe('fieldName');
    expect(error.code).toBe('INVALID');
    expect(error.message).toBe('Invalid value');
    expect(error.name).toBe('ValidationError');
  });
});
