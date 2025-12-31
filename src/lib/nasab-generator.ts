/**
 * Nasab (Patronymic Chain) Generator
 *
 * Generates the traditional Arabic nasab chain by traversing the family tree
 * through parent relationships. The nasab shows lineage through fathers:
 * محمد بن أحمد بن علي بن عمر (Muhammad ibn Ahmad ibn Ali ibn Omar)
 *
 * For women, "بنت" (bint = daughter of) is used instead of "بن" (ibn = son of):
 * فاطمة بنت أحمد بن علي (Fatima bint Ahmad ibn Ali)
 */

import type { Person, Relationship } from './db/schema';

interface NasabOptions {
  maxGenerations?: number;  // Maximum depth to traverse (default: 10)
  includeKunya?: boolean;   // Include kunya at start (default: false)
  includeLaqab?: boolean;   // Include laqab (default: false)
  includeNisba?: boolean;   // Include nisba at end (default: true)
  language?: 'ar' | 'en';   // Output language (default: 'ar')
}

interface NasabResult {
  chain: string;            // The full nasab chain
  chainEn: string;          // English transliteration
  generations: number;      // Number of generations traversed
  ancestors: string[];      // List of ancestor IDs in order
}

/**
 * Build nasab chain for a person by traversing parent relationships
 */
export async function generateNasab(
  personId: string,
  persons: Map<string, Person>,
  relationships: Relationship[],
  options: NasabOptions = {}
): Promise<NasabResult> {
  const {
    maxGenerations = 10,
    includeKunya = false,
    includeLaqab = false,
    includeNisba = true,
    language = 'ar'
  } = options;

  const person = persons.get(personId);
  if (!person) {
    return {
      chain: '',
      chainEn: '',
      generations: 0,
      ancestors: []
    };
  }

  // Build a map of child -> father relationships
  const fatherMap = new Map<string, string>();
  for (const rel of relationships) {
    if (rel.relationship_type === 'parent') {
      const parent = persons.get(rel.person1_id);
      const child = persons.get(rel.person2_id);

      // person1 is parent, person2 is child
      // We want father relationships for nasab
      if (parent?.gender === 'male' && child) {
        fatherMap.set(rel.person2_id, rel.person1_id);
      }
    }
  }

  // Traverse up through fathers
  const ancestors: string[] = [];
  const namesAr: string[] = [];
  const namesEn: string[] = [];

  let currentId = personId;
  let generation = 0;

  while (generation < maxGenerations) {
    const current = persons.get(currentId);
    if (!current) break;

    if (generation === 0) {
      // First person - just add their given name
      namesAr.push(current.given_name);
      namesEn.push(transliterateToEnglish(current.given_name) || current.full_name_en?.split(' ')[0] || current.given_name);
    } else {
      // Ancestors - add with ibn/bin
      namesAr.push(current.given_name);
      namesEn.push(transliterateToEnglish(current.given_name) || current.full_name_en?.split(' ')[0] || current.given_name);
      ancestors.push(currentId);
    }

    // Find father
    const fatherId = fatherMap.get(currentId);
    if (!fatherId) break;

    currentId = fatherId;
    generation++;
  }

  // Build the chain
  const isMale = person.gender === 'male';
  const connector = isMale ? 'بن' : 'بنت';
  const connectorEn = isMale ? 'ibn' : 'bint';

  let chainAr = namesAr[0];
  let chainEn = namesEn[0];

  // Add each ancestor with the connector
  for (let i = 1; i < namesAr.length; i++) {
    // After the first person (who uses bint for females),
    // the rest are all male ancestors using "بن"
    const conn = i === 1 ? connector : 'بن';
    const connE = i === 1 ? connectorEn : 'ibn';

    chainAr += ` ${conn} ${namesAr[i]}`;
    chainEn += ` ${connE} ${namesEn[i]}`;
  }

  // Add optional components
  if (includeKunya && person.kunya) {
    chainAr = `${person.kunya} ${chainAr}`;
    chainEn = `${transliterateToEnglish(person.kunya) || person.kunya} ${chainEn}`;
  }

  if (includeLaqab && person.laqab) {
    chainAr += ` ${person.laqab}`;
    chainEn += ` ${transliterateToEnglish(person.laqab) || person.laqab}`;
  }

  if (includeNisba && person.nisba) {
    chainAr += ` ${person.nisba}`;
    chainEn += ` ${transliterateToEnglish(person.nisba) || person.nisba}`;
  }

  // Add family name if not already included via nisba
  if (person.family_name && (!person.nisba || !person.nisba.includes(person.family_name))) {
    chainAr += ` ${person.family_name}`;
    chainEn += ` ${transliterateToEnglish(person.family_name) || person.family_name}`;
  }

  return {
    chain: chainAr,
    chainEn: chainEn,
    generations: generation,
    ancestors
  };
}

/**
 * Generate nasab chains for all persons in a tree
 */
export async function generateAllNasab(
  persons: Person[],
  relationships: Relationship[],
  options: NasabOptions = {}
): Promise<Map<string, NasabResult>> {
  const personMap = new Map<string, Person>();
  for (const p of persons) {
    personMap.set(p.id, p);
  }

  const results = new Map<string, NasabResult>();

  for (const person of persons) {
    const nasab = await generateNasab(person.id, personMap, relationships, options);
    results.set(person.id, nasab);
  }

  return results;
}

/**
 * Simple Arabic to English transliteration
 * This is a basic implementation - for production, consider using a library
 */
function transliterateToEnglish(arabic: string | null | undefined): string | null {
  if (!arabic) return null;

  const translitMap: Record<string, string> = {
    'ا': 'a', 'أ': 'a', 'إ': 'i', 'آ': 'aa',
    'ب': 'b', 'ت': 't', 'ث': 'th',
    'ج': 'j', 'ح': 'h', 'خ': 'kh',
    'د': 'd', 'ذ': 'dh', 'ر': 'r', 'ز': 'z',
    'س': 's', 'ش': 'sh', 'ص': 's', 'ض': 'd',
    'ط': 't', 'ظ': 'z', 'ع': 'a', 'غ': 'gh',
    'ف': 'f', 'ق': 'q', 'ك': 'k', 'ل': 'l',
    'م': 'm', 'ن': 'n', 'ه': 'h', 'و': 'w',
    'ي': 'y', 'ى': 'a', 'ة': 'a', 'ء': "'",
    'ئ': "'", 'ؤ': "'", 'ـ': '',
    // Common combinations
    'ال': 'al-',
  };

  // Handle "ال" prefix specially
  let result = arabic;
  if (result.startsWith('ال')) {
    result = 'Al-' + result.substring(2);
  }

  let output = '';
  for (const char of result) {
    output += translitMap[char] || char;
  }

  // Capitalize first letter
  return output.charAt(0).toUpperCase() + output.slice(1);
}

/**
 * Format nasab for display with different styles
 */
export function formatNasab(
  nasab: NasabResult,
  style: 'full' | 'short' | 'formal' = 'full',
  maxNames: number = 5
): { ar: string; en: string } {
  if (style === 'short') {
    // Just the person and their father
    const parts = nasab.chain.split(' بن ');
    const partsEn = nasab.chainEn.split(' ibn ');

    return {
      ar: parts.slice(0, 2).join(' بن '),
      en: partsEn.slice(0, 2).join(' ibn ')
    };
  }

  if (style === 'formal') {
    // Limited generations for formal documents
    const parts = nasab.chain.split(' بن ');
    const partsEn = nasab.chainEn.split(' ibn ');

    return {
      ar: parts.slice(0, maxNames).join(' بن '),
      en: partsEn.slice(0, maxNames).join(' ibn ')
    };
  }

  // Full nasab
  return {
    ar: nasab.chain,
    en: nasab.chainEn
  };
}

/**
 * Validate that a nasab chain is consistent with tree relationships
 */
export function validateNasab(
  personId: string,
  claimedNasab: string,
  persons: Map<string, Person>,
  relationships: Relationship[]
): { isValid: boolean; discrepancies: string[] } {
  const generated = generateNasab(personId, persons, relationships, {
    includeKunya: false,
    includeLaqab: false,
    includeNisba: false
  });

  const discrepancies: string[] = [];

  // Extract names from claimed nasab
  const claimedNames = claimedNasab
    .replace(/بنت/g, 'بن')
    .split(' بن ')
    .map(n => n.trim());

  const generatedNames = generated.then(r =>
    r.chain.replace(/بنت/g, 'بن').split(' بن ').map(n => n.trim())
  );

  // Compare names
  Promise.all([generated, generatedNames]).then(([genResult, genNames]) => {
    for (let i = 0; i < Math.min(claimedNames.length, genNames.length); i++) {
      if (claimedNames[i] !== genNames[i]) {
        discrepancies.push(
          `Generation ${i}: claimed "${claimedNames[i]}" but tree shows "${genNames[i]}"`
        );
      }
    }

    if (claimedNames.length > genNames.length) {
      discrepancies.push(
        `Claimed ${claimedNames.length} generations but only ${genNames.length} found in tree`
      );
    }
  });

  return {
    isValid: discrepancies.length === 0,
    discrepancies
  };
}

export default {
  generateNasab,
  generateAllNasab,
  formatNasab,
  validateNasab
};
