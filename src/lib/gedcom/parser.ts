/**
 * GEDCOM Parser for Shajara
 *
 * Parses GEDCOM 5.5 format files and converts them to Shajara's data model.
 * Supports Arabic names with UTF-8 encoding and handles common GEDCOM variations.
 *
 * GEDCOM Structure:
 * - Each line has format: LEVEL TAG [VALUE]
 * - Level 0 records are individuals (INDI), families (FAM), etc.
 * - Nested levels contain details about the parent record
 */

import { v4 as uuidv4 } from 'uuid';
import type { Person, Relationship } from '../db/schema';
import { gregorianToHijri } from '../date-utils';

export interface GedcomLine {
  level: number;
  tag: string;
  value: string;
  pointer?: string;
}

export interface GedcomIndividual {
  id: string;
  gedcomId: string;
  givenName: string;
  surname: string;
  fullName: string;
  gender: 'male' | 'female';
  birthDate?: string;
  birthPlace?: string;
  deathDate?: string;
  deathPlace?: string;
  isLiving: boolean;
  notes?: string;
  familyAsChild?: string;    // FAM where this person is a child
  familiesAsSpouse: string[]; // FAMs where this person is a spouse
}

export interface GedcomFamily {
  id: string;
  gedcomId: string;
  husbandId?: string;
  wifeId?: string;
  childIds: string[];
  marriageDate?: string;
  marriagePlace?: string;
  divorceDate?: string;
}

export interface GedcomParseResult {
  individuals: GedcomIndividual[];
  families: GedcomFamily[];
  persons: Partial<Person>[];
  relationships: Partial<Relationship>[];
  errors: string[];
  warnings: string[];
  stats: {
    totalLines: number;
    individualsFound: number;
    familiesFound: number;
    personsCreated: number;
    relationshipsCreated: number;
  };
}

/**
 * Parse a GEDCOM file content string
 */
export function parseGedcom(content: string, treeId: string): GedcomParseResult {
  const lines = content.split(/\r?\n/).filter(line => line.trim());
  const errors: string[] = [];
  const warnings: string[] = [];

  // Parse into structured lines
  const parsedLines: GedcomLine[] = [];
  for (let i = 0; i < lines.length; i++) {
    const parsed = parseLine(lines[i], i + 1);
    if (parsed.error) {
      errors.push(parsed.error);
    } else if (parsed.line) {
      parsedLines.push(parsed.line);
    }
  }

  // Extract individuals and families
  const individuals: GedcomIndividual[] = [];
  const families: GedcomFamily[] = [];

  let currentRecord: GedcomLine[] = [];
  let currentType: string | null = null;

  for (const line of parsedLines) {
    if (line.level === 0) {
      // Process previous record
      if (currentRecord.length > 0 && currentType) {
        if (currentType === 'INDI') {
          const individual = parseIndividual(currentRecord);
          if (individual) individuals.push(individual);
        } else if (currentType === 'FAM') {
          const family = parseFamily(currentRecord);
          if (family) families.push(family);
        }
      }

      // Start new record
      currentRecord = [line];
      if (line.tag === 'INDI' || line.value === 'INDI') {
        currentType = 'INDI';
      } else if (line.tag === 'FAM' || line.value === 'FAM') {
        currentType = 'FAM';
      } else {
        currentType = null;
      }
    } else {
      currentRecord.push(line);
    }
  }

  // Process last record
  if (currentRecord.length > 0 && currentType) {
    if (currentType === 'INDI') {
      const individual = parseIndividual(currentRecord);
      if (individual) individuals.push(individual);
    } else if (currentType === 'FAM') {
      const family = parseFamily(currentRecord);
      if (family) families.push(family);
    }
  }

  // Map GEDCOM IDs to our UUIDs
  const gedcomToUuid = new Map<string, string>();
  for (const ind of individuals) {
    gedcomToUuid.set(ind.gedcomId, ind.id);
  }

  // Convert to Shajara format
  const persons: Partial<Person>[] = [];
  const relationships: Partial<Relationship>[] = [];

  // Convert individuals to persons
  for (const ind of individuals) {
    const person: Partial<Person> = {
      id: ind.id,
      tree_id: treeId,
      given_name: ind.givenName || ind.fullName || 'Unknown',
      family_name: ind.surname || null,
      full_name_ar: null, // Will be set if Arabic names detected
      full_name_en: ind.fullName || null,
      gender: ind.gender,
      birth_date: ind.birthDate || null,
      birth_date_hijri: ind.birthDate ? gregorianToHijri(ind.birthDate).hijri : null,
      birth_place: ind.birthPlace || null,
      death_date: ind.deathDate || null,
      death_date_hijri: ind.deathDate ? gregorianToHijri(ind.deathDate).hijri : null,
      death_place: ind.deathPlace || null,
      is_living: ind.isLiving,
      notes: ind.notes || null,
      // New Arabic fields (to be populated if Arabic text detected)
      kunya: null,
      laqab: null,
      nisba: null,
      patronymic_chain: null,
    };

    // Check if name contains Arabic characters
    if (containsArabic(ind.fullName || ind.givenName)) {
      person.full_name_ar = ind.fullName;
      // Try to extract Arabic name components
      const arabicParts = extractArabicNameParts(ind.fullName || ind.givenName);
      if (arabicParts.kunya) person.kunya = arabicParts.kunya;
      if (arabicParts.nisba) person.nisba = arabicParts.nisba;
      if (arabicParts.patronymic) person.patronymic_chain = arabicParts.patronymic;
    }

    persons.push(person);
  }

  // Convert families to relationships
  for (const fam of families) {
    const husbandUuid = fam.husbandId ? gedcomToUuid.get(fam.husbandId) : null;
    const wifeUuid = fam.wifeId ? gedcomToUuid.get(fam.wifeId) : null;

    // Spouse relationship
    if (husbandUuid && wifeUuid) {
      relationships.push({
        id: uuidv4(),
        tree_id: treeId,
        person1_id: husbandUuid,
        person2_id: wifeUuid,
        relationship_type: 'spouse',
        marriage_date: fam.marriageDate || null,
        marriage_date_hijri: fam.marriageDate ? gregorianToHijri(fam.marriageDate).hijri : null,
        divorce_date: fam.divorceDate || null,
      });
    }

    // Parent-child relationships
    for (const childGedcomId of fam.childIds) {
      const childUuid = gedcomToUuid.get(childGedcomId);
      if (!childUuid) continue;

      if (husbandUuid) {
        relationships.push({
          id: uuidv4(),
          tree_id: treeId,
          person1_id: husbandUuid,
          person2_id: childUuid,
          relationship_type: 'parent',
        });
      }

      if (wifeUuid) {
        relationships.push({
          id: uuidv4(),
          tree_id: treeId,
          person1_id: wifeUuid,
          person2_id: childUuid,
          relationship_type: 'parent',
        });
      }
    }
  }

  return {
    individuals,
    families,
    persons,
    relationships,
    errors,
    warnings,
    stats: {
      totalLines: lines.length,
      individualsFound: individuals.length,
      familiesFound: families.length,
      personsCreated: persons.length,
      relationshipsCreated: relationships.length,
    },
  };
}

/**
 * Parse a single GEDCOM line
 */
function parseLine(line: string, lineNumber: number): { line?: GedcomLine; error?: string } {
  const match = line.match(/^(\d+)\s+(@\w+@)?\s*(\w+)\s*(.*)$/);

  if (!match) {
    return { error: `Line ${lineNumber}: Invalid GEDCOM format: ${line}` };
  }

  const [, levelStr, pointer, tag, value] = match;
  const level = parseInt(levelStr, 10);

  return {
    line: {
      level,
      tag: tag.toUpperCase(),
      value: value?.trim() || '',
      pointer: pointer?.replace(/@/g, ''),
    },
  };
}

/**
 * Parse an individual record
 */
function parseIndividual(lines: GedcomLine[]): GedcomIndividual | null {
  const header = lines[0];
  if (!header.pointer) return null;

  const individual: GedcomIndividual = {
    id: uuidv4(),
    gedcomId: header.pointer,
    givenName: '',
    surname: '',
    fullName: '',
    gender: 'male', // Default, will be updated
    isLiving: true,
    familiesAsSpouse: [],
  };

  let currentSubRecord: string | null = null;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];

    if (line.level === 1) {
      currentSubRecord = line.tag;

      switch (line.tag) {
        case 'NAME':
          // Format: Given Name /Surname/
          const nameMatch = line.value.match(/^(.+?)(?:\s*\/(.+?)\/)?$/);
          if (nameMatch) {
            individual.fullName = line.value.replace(/\//g, '').trim();
            individual.givenName = nameMatch[1]?.trim() || '';
            individual.surname = nameMatch[2]?.trim() || '';
          }
          break;
        case 'SEX':
          individual.gender = line.value.toUpperCase() === 'F' ? 'female' : 'male';
          break;
        case 'FAMC':
          individual.familyAsChild = line.value.replace(/@/g, '');
          break;
        case 'FAMS':
          individual.familiesAsSpouse.push(line.value.replace(/@/g, ''));
          break;
        case 'NOTE':
          individual.notes = (individual.notes || '') + line.value;
          break;
        case 'DEAT':
          individual.isLiving = false;
          break;
      }
    } else if (line.level === 2) {
      // Sub-record details
      if (currentSubRecord === 'BIRT') {
        if (line.tag === 'DATE') individual.birthDate = parseGedcomDate(line.value) || undefined;
        if (line.tag === 'PLAC') individual.birthPlace = line.value;
      } else if (currentSubRecord === 'DEAT') {
        if (line.tag === 'DATE') individual.deathDate = parseGedcomDate(line.value) || undefined;
        if (line.tag === 'PLAC') individual.deathPlace = line.value;
      } else if (currentSubRecord === 'NAME') {
        if (line.tag === 'GIVN') individual.givenName = line.value;
        if (line.tag === 'SURN') individual.surname = line.value;
      }
    }
  }

  return individual;
}

/**
 * Parse a family record
 */
function parseFamily(lines: GedcomLine[]): GedcomFamily | null {
  const header = lines[0];
  if (!header.pointer) return null;

  const family: GedcomFamily = {
    id: uuidv4(),
    gedcomId: header.pointer,
    childIds: [],
  };

  let currentSubRecord: string | null = null;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];

    if (line.level === 1) {
      currentSubRecord = line.tag;

      switch (line.tag) {
        case 'HUSB':
          family.husbandId = line.value.replace(/@/g, '');
          break;
        case 'WIFE':
          family.wifeId = line.value.replace(/@/g, '');
          break;
        case 'CHIL':
          family.childIds.push(line.value.replace(/@/g, ''));
          break;
      }
    } else if (line.level === 2) {
      if (currentSubRecord === 'MARR') {
        if (line.tag === 'DATE') family.marriageDate = parseGedcomDate(line.value) || undefined;
        if (line.tag === 'PLAC') family.marriagePlace = line.value;
      } else if (currentSubRecord === 'DIV') {
        if (line.tag === 'DATE') family.divorceDate = parseGedcomDate(line.value) || undefined;
      }
    }
  }

  return family;
}

/**
 * Parse GEDCOM date format to ISO format
 * GEDCOM dates can be: "15 JAN 1990", "JAN 1990", "1990", "ABT 1990", etc.
 */
function parseGedcomDate(gedcomDate: string): string | null {
  if (!gedcomDate) return null;

  // Remove modifiers like ABT, BEF, AFT, EST
  const cleaned = gedcomDate.replace(/^(ABT|BEF|AFT|EST|CAL|FROM|TO|BET|AND)\s*/gi, '').trim();

  const months: Record<string, string> = {
    JAN: '01', FEB: '02', MAR: '03', APR: '04',
    MAY: '05', JUN: '06', JUL: '07', AUG: '08',
    SEP: '09', OCT: '10', NOV: '11', DEC: '12',
  };

  // Full date: "15 JAN 1990"
  const fullMatch = cleaned.match(/^(\d{1,2})\s+(\w{3})\s+(\d{4})$/i);
  if (fullMatch) {
    const [, day, monthStr, year] = fullMatch;
    const month = months[monthStr.toUpperCase()];
    if (month) {
      return `${year}-${month}-${day.padStart(2, '0')}`;
    }
  }

  // Month and year: "JAN 1990"
  const monthYearMatch = cleaned.match(/^(\w{3})\s+(\d{4})$/i);
  if (monthYearMatch) {
    const [, monthStr, year] = monthYearMatch;
    const month = months[monthStr.toUpperCase()];
    if (month) {
      return `${year}-${month}-01`;
    }
  }

  // Year only: "1990"
  const yearMatch = cleaned.match(/^(\d{4})$/);
  if (yearMatch) {
    return `${yearMatch[1]}-01-01`;
  }

  return null;
}

/**
 * Check if string contains Arabic characters
 */
function containsArabic(str: string | null | undefined): boolean {
  if (!str) return false;
  return /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(str);
}

/**
 * Extract Arabic name parts (kunya, patronymic, nisba)
 */
function extractArabicNameParts(name: string): {
  kunya?: string;
  patronymic?: string;
  nisba?: string;
} {
  const result: { kunya?: string; patronymic?: string; nisba?: string } = {};

  // Extract kunya (أبو/أم + name)
  const kunyaMatch = name.match(/(أبو|أم)\s+[\u0600-\u06FF]+/);
  if (kunyaMatch) {
    result.kunya = kunyaMatch[0];
  }

  // Extract patronymic chain (بن/بنت ... بن ...)
  const patronymicMatch = name.match(/(بن|بنت)\s+[\u0600-\u06FF]+(\s+(بن|بنت)\s+[\u0600-\u06FF]+)*/);
  if (patronymicMatch) {
    result.patronymic = patronymicMatch[0];
  }

  // Extract nisba (word starting with ال and ending with ي)
  const nisbaMatch = name.match(/ال[\u0600-\u06FF]+ي/);
  if (nisbaMatch) {
    result.nisba = nisbaMatch[0];
  }

  return result;
}
