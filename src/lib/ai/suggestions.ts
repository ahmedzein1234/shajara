'use server';

import { getCloudflareContext } from '@opennextjs/cloudflare';

/**
 * AI-Powered Suggestions for Family Tree
 * Uses pattern matching and heuristics, can be enhanced with Claude API later
 */

export interface RelationshipSuggestion {
  personId: string;
  suggestedPersonId: string;
  relationshipType: string;
  confidence: number; // 0-100
  reason: string;
  reasonAr: string;
}

export interface DuplicateSuggestion {
  personId: string;
  duplicateId: string;
  similarity: number; // 0-100
  matchingFields: string[];
  suggestion: string;
  suggestionAr: string;
}

export interface NameSuggestion {
  name: string;
  nameAr: string;
  type: 'given_name' | 'family_name' | 'patronymic';
  popularity: number;
}

// Common Arabic name patterns
const PATRONYMIC_PREFIXES = ['بن', 'ابن', 'بنت', 'ابنة'];
const COMMON_FAMILY_PREFIXES = ['آل', 'ال', 'أبو', 'أم'];

/**
 * Suggest potential relationships based on names and existing data
 */
export async function suggestRelationships(
  treeId: string,
  personId: string
): Promise<RelationshipSuggestion[]> {
  try {
    const { env } = await getCloudflareContext();
    const db = env.DB;

    // Get the person's details
    const person = await db.prepare(`
      SELECT * FROM persons WHERE id = ? AND tree_id = ?
    `).bind(personId, treeId).first();

    if (!person) return [];

    // Get all other people in the tree
    const others = await db.prepare(`
      SELECT * FROM persons WHERE tree_id = ? AND id != ?
    `).bind(treeId, personId).all();

    const suggestions: RelationshipSuggestion[] = [];

    // Analyze patronymic chain for potential parents
    const personPatronymic = (person.patronymic_chain as string) || '';
    const personFamilyName = (person.family_name as string) || '';

    for (const other of others.results || []) {
      const otherName = (other.given_name as string) || '';
      const otherPatronymic = (other.patronymic_chain as string) || '';
      const otherFamilyName = (other.family_name as string) || '';

      // Check if this person's patronymic contains the other's name (potential parent)
      if (personPatronymic && otherName) {
        for (const prefix of PATRONYMIC_PREFIXES) {
          if (personPatronymic.includes(`${prefix} ${otherName}`)) {
            // Check if relationship already exists
            const existing = await db.prepare(`
              SELECT * FROM relationships
              WHERE tree_id = ? AND (
                (person1_id = ? AND person2_id = ?)
                OR (person1_id = ? AND person2_id = ?)
              )
            `).bind(treeId, personId, other.id, other.id, personId).first();

            if (!existing) {
              const relationshipType = person.gender === 'male' ? 'father' : 'mother';
              suggestions.push({
                personId,
                suggestedPersonId: other.id as string,
                relationshipType,
                confidence: 85,
                reason: `Name "${otherName}" appears in patronymic chain`,
                reasonAr: `الاسم "${otherName}" يظهر في سلسلة النسب`,
              });
            }
          }
        }
      }

      // Check for shared family name (potential siblings or extended family)
      if (personFamilyName && otherFamilyName && personFamilyName === otherFamilyName) {
        const existing = await db.prepare(`
          SELECT * FROM relationships
          WHERE tree_id = ? AND (
            (person1_id = ? AND person2_id = ?)
            OR (person1_id = ? AND person2_id = ?)
          )
        `).bind(treeId, personId, other.id, other.id, personId).first();

        if (!existing && !suggestions.find(s => s.suggestedPersonId === other.id)) {
          suggestions.push({
            personId,
            suggestedPersonId: other.id as string,
            relationshipType: 'relative',
            confidence: 60,
            reason: `Shared family name: ${personFamilyName}`,
            reasonAr: `اسم عائلة مشترك: ${personFamilyName}`,
          });
        }
      }

      // Check for similar patronymic chains (potential siblings)
      if (personPatronymic && otherPatronymic) {
        const similarity = calculateStringSimilarity(personPatronymic, otherPatronymic);
        if (similarity > 70) {
          const existing = await db.prepare(`
            SELECT * FROM relationships
            WHERE tree_id = ? AND (
              (person1_id = ? AND person2_id = ?)
              OR (person1_id = ? AND person2_id = ?)
            )
          `).bind(treeId, personId, other.id, other.id, personId).first();

          if (!existing && !suggestions.find(s => s.suggestedPersonId === other.id)) {
            suggestions.push({
              personId,
              suggestedPersonId: other.id as string,
              relationshipType: 'sibling',
              confidence: Math.round(similarity),
              reason: `Similar patronymic chains (${Math.round(similarity)}% match)`,
              reasonAr: `سلاسل نسب متشابهة (${Math.round(similarity)}% تطابق)`,
            });
          }
        }
      }
    }

    // Sort by confidence
    return suggestions.sort((a, b) => b.confidence - a.confidence).slice(0, 5);
  } catch (error) {
    console.error('Suggest relationships error:', error);
    return [];
  }
}

/**
 * Detect potential duplicate entries
 */
export async function detectDuplicates(treeId: string): Promise<DuplicateSuggestion[]> {
  try {
    const { env } = await getCloudflareContext();
    const db = env.DB;

    const persons = await db.prepare(`
      SELECT * FROM persons WHERE tree_id = ?
    `).bind(treeId).all();

    const suggestions: DuplicateSuggestion[] = [];
    const processed = new Set<string>();

    for (const person of persons.results || []) {
      for (const other of persons.results || []) {
        if (person.id === other.id) continue;

        const pairKey = [person.id, other.id].sort().join('-');
        if (processed.has(pairKey)) continue;
        processed.add(pairKey);

        const matchingFields: string[] = [];
        let totalSimilarity = 0;

        // Compare given names
        const nameSim = calculateStringSimilarity(
          (person.given_name as string) || '',
          (other.given_name as string) || ''
        );
        if (nameSim > 80) {
          matchingFields.push('given_name');
          totalSimilarity += nameSim * 0.3;
        }

        // Compare full names
        const fullNameSim = calculateStringSimilarity(
          (person.full_name_ar as string) || '',
          (other.full_name_ar as string) || ''
        );
        if (fullNameSim > 85) {
          matchingFields.push('full_name');
          totalSimilarity += fullNameSim * 0.4;
        }

        // Compare birth dates
        if (person.birth_date && other.birth_date && person.birth_date === other.birth_date) {
          matchingFields.push('birth_date');
          totalSimilarity += 100 * 0.2;
        }

        // Compare birth places
        const birthPlaceSim = calculateStringSimilarity(
          (person.birth_place as string) || '',
          (other.birth_place as string) || ''
        );
        if (birthPlaceSim > 80) {
          matchingFields.push('birth_place');
          totalSimilarity += birthPlaceSim * 0.1;
        }

        if (matchingFields.length >= 2 && totalSimilarity > 50) {
          suggestions.push({
            personId: person.id as string,
            duplicateId: other.id as string,
            similarity: Math.round(totalSimilarity),
            matchingFields,
            suggestion: `Consider merging these records (${matchingFields.join(', ')} match)`,
            suggestionAr: `يُنصح بدمج هذه السجلات (تطابق في ${matchingFields.length} حقول)`,
          });
        }
      }
    }

    return suggestions.sort((a, b) => b.similarity - a.similarity).slice(0, 10);
  } catch (error) {
    console.error('Detect duplicates error:', error);
    return [];
  }
}

/**
 * Get name suggestions based on existing data
 */
export async function getNameSuggestions(
  treeId: string,
  type: 'given_name' | 'family_name' | 'patronymic',
  prefix: string
): Promise<NameSuggestion[]> {
  try {
    const { env } = await getCloudflareContext();
    const db = env.DB;

    let column = 'given_name';
    if (type === 'family_name') column = 'family_name';
    if (type === 'patronymic') column = 'patronymic_chain';

    // Get names from the tree
    const result = await db.prepare(`
      SELECT ${column} as name, COUNT(*) as count
      FROM persons
      WHERE tree_id = ? AND ${column} LIKE ? AND ${column} IS NOT NULL
      GROUP BY ${column}
      ORDER BY count DESC
      LIMIT 10
    `).bind(treeId, `${prefix}%`).all();

    return (result.results || []).map((r) => ({
      name: r.name as string,
      nameAr: r.name as string,
      type,
      popularity: r.count as number,
    }));
  } catch (error) {
    console.error('Get name suggestions error:', error);
    return [];
  }
}

/**
 * Get common Arabic names for autocomplete
 */
export async function getCommonArabicNames(
  type: 'male' | 'female' | 'family',
  prefix: string
): Promise<NameSuggestion[]> {
  // Common Arabic names (can be expanded)
  const maleNames = [
    'محمد', 'أحمد', 'علي', 'عبدالله', 'خالد', 'سعود', 'فيصل', 'عمر',
    'إبراهيم', 'يوسف', 'سلمان', 'عبدالرحمن', 'ناصر', 'سعد', 'فهد',
    'تركي', 'بندر', 'نايف', 'مشاري', 'سلطان', 'عبدالعزيز', 'راشد',
  ];

  const femaleNames = [
    'فاطمة', 'عائشة', 'مريم', 'نورة', 'سارة', 'هند', 'لطيفة', 'منى',
    'نوف', 'ريم', 'دلال', 'العنود', 'مها', 'هيا', 'جواهر', 'أمل',
  ];

  const familyNames = [
    'القحطاني', 'العتيبي', 'الدوسري', 'الشمري', 'الحربي', 'المطيري',
    'الغامدي', 'الزهراني', 'العنزي', 'السبيعي', 'البقمي', 'الثبيتي',
    'آل سعود', 'آل الشيخ', 'العمري', 'الهاشمي', 'الأنصاري',
  ];

  let names: string[] = [];
  if (type === 'male') names = maleNames;
  else if (type === 'female') names = femaleNames;
  else names = familyNames;

  const filtered = prefix
    ? names.filter(n => n.startsWith(prefix))
    : names;

  return filtered.slice(0, 10).map((name, index) => ({
    name,
    nameAr: name,
    type: type === 'family' ? 'family_name' : 'given_name',
    popularity: 100 - index * 5,
  }));
}

/**
 * Calculate string similarity using Levenshtein distance
 */
function calculateStringSimilarity(str1: string, str2: string): number {
  if (!str1 || !str2) return 0;
  if (str1 === str2) return 100;

  const len1 = str1.length;
  const len2 = str2.length;
  const maxLen = Math.max(len1, len2);

  if (maxLen === 0) return 100;

  const matrix: number[][] = [];

  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  const distance = matrix[len1][len2];
  return Math.round(((maxLen - distance) / maxLen) * 100);
}
