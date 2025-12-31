/**
 * GEDCOM Exporter for Shajara
 *
 * Exports Shajara family tree data to GEDCOM 5.5 format.
 * Preserves Arabic names with UTF-8 encoding.
 */

import type { Person, Relationship, Tree } from '../db/schema';
import { formatDate } from '../date-utils';

export interface ExportOptions {
  includeNotes?: boolean;
  includePhotos?: boolean;
  includeHijriDates?: boolean;
  submitterName?: string;
  submitterEmail?: string;
}

export interface GedcomExportResult {
  content: string;
  filename: string;
  stats: {
    personsExported: number;
    familiesExported: number;
    relationshipsExported: number;
  };
}

/**
 * Export tree data to GEDCOM format
 */
export function exportToGedcom(
  tree: Tree,
  persons: Person[],
  relationships: Relationship[],
  options: ExportOptions = {}
): GedcomExportResult {
  const lines: string[] = [];
  const personIdMap = new Map<string, number>(); // Map person ID to GEDCOM individual number
  const familyIdMap = new Map<string, number>();  // Map family key to GEDCOM family number

  let indiCounter = 1;
  let famCounter = 1;

  // Create ID mappings
  for (const person of persons) {
    personIdMap.set(person.id, indiCounter++);
  }

  // Group relationships into families
  const families = groupRelationshipsIntoFamilies(relationships, persons);
  for (const family of families) {
    familyIdMap.set(family.key, famCounter++);
  }

  // GEDCOM Header
  lines.push('0 HEAD');
  lines.push('1 SOUR SHAJARA');
  lines.push('2 VERS 1.0');
  lines.push('2 NAME Shajara Arabic Family Tree');
  lines.push('2 CORP Shajara');
  lines.push('1 DEST STANDARD');
  lines.push(`1 DATE ${formatGedcomDate(new Date())}`);
  lines.push('1 GEDC');
  lines.push('2 VERS 5.5');
  lines.push('2 FORM LINEAGE-LINKED');
  lines.push('1 CHAR UTF-8');
  lines.push('1 LANG Arabic');

  // Submitter
  lines.push('0 @SUBM@ SUBM');
  lines.push(`1 NAME ${options.submitterName || 'Shajara User'}`);
  if (options.submitterEmail) {
    lines.push(`1 EMAIL ${options.submitterEmail}`);
  }

  // Export individuals
  for (const person of persons) {
    const indiNum = personIdMap.get(person.id);
    if (!indiNum) continue;

    lines.push(`0 @I${indiNum}@ INDI`);

    // Name - prefer Arabic name if available
    const fullName = person.full_name_ar || person.full_name_en ||
      `${person.given_name} ${person.family_name || ''}`.trim();

    // Format name with surname in slashes per GEDCOM spec
    if (person.family_name) {
      lines.push(`1 NAME ${person.given_name} /${person.family_name}/`);
    } else {
      lines.push(`1 NAME ${fullName}`);
    }
    lines.push(`2 GIVN ${person.given_name}`);
    if (person.family_name) {
      lines.push(`2 SURN ${person.family_name}`);
    }

    // Arabic-specific name parts as custom tags
    if (person.kunya) {
      lines.push(`2 _KUNYA ${person.kunya}`);
    }
    if (person.laqab) {
      lines.push(`2 _LAQAB ${person.laqab}`);
    }
    if (person.nisba) {
      lines.push(`2 _NISBA ${person.nisba}`);
    }
    if (person.patronymic_chain) {
      lines.push(`2 _NASAB ${person.patronymic_chain}`);
    }
    if (person.nasab_chain) {
      lines.push(`2 _NASAB_FULL ${person.nasab_chain}`);
    }

    // Sex
    lines.push(`1 SEX ${person.gender === 'female' ? 'F' : 'M'}`);

    // Birth
    if (person.birth_date || person.birth_place) {
      lines.push('1 BIRT');
      if (person.birth_date) {
        lines.push(`2 DATE ${formatGedcomDate(new Date(person.birth_date))}`);
        if (options.includeHijriDates && person.birth_date_hijri) {
          lines.push(`2 _DATE_HIJRI ${person.birth_date_hijri}`);
        }
      }
      if (person.birth_place) {
        lines.push(`2 PLAC ${person.birth_place}`);
      }
    }

    // Death
    if (!person.is_living) {
      lines.push('1 DEAT Y');
      if (person.death_date || person.death_place) {
        if (person.death_date) {
          lines.push(`2 DATE ${formatGedcomDate(new Date(person.death_date))}`);
          if (options.includeHijriDates && person.death_date_hijri) {
            lines.push(`2 _DATE_HIJRI ${person.death_date_hijri}`);
          }
        }
        if (person.death_place) {
          lines.push(`2 PLAC ${person.death_place}`);
        }
      }
    }

    // Tribal affiliation as custom tags
    if (person.tribe_id) {
      lines.push(`1 _TRIBE ${person.tribe_id}`);
    }
    if (person.tribal_branch) {
      lines.push(`1 _TRIBAL_BRANCH ${person.tribal_branch}`);
    }

    // Sayyid lineage
    if (person.is_sayyid) {
      lines.push('1 _SAYYID Y');
      if (person.sayyid_verified) {
        lines.push('2 _VERIFIED Y');
      }
      if (person.sayyid_lineage) {
        lines.push(`2 _LINEAGE ${person.sayyid_lineage}`);
      }
    }

    // Notes
    if (options.includeNotes && person.notes) {
      // Split notes into 248-character lines (GEDCOM limit)
      const noteLines = splitIntoLines(person.notes, 248);
      lines.push(`1 NOTE ${noteLines[0]}`);
      for (let i = 1; i < noteLines.length; i++) {
        lines.push(`2 CONT ${noteLines[i]}`);
      }
    }

    // Photo URL
    if (options.includePhotos && person.photo_url) {
      lines.push('1 OBJE');
      lines.push('2 FORM URL');
      lines.push(`2 FILE ${person.photo_url}`);
    }

    // Family links
    for (const family of families) {
      const famNum = familyIdMap.get(family.key);
      if (!famNum) continue;

      // As spouse
      if (family.husbandId === person.id || family.wifeId === person.id) {
        lines.push(`1 FAMS @F${famNum}@`);
      }

      // As child
      if (family.childIds.includes(person.id)) {
        lines.push(`1 FAMC @F${famNum}@`);
      }
    }
  }

  // Export families
  for (const family of families) {
    const famNum = familyIdMap.get(family.key);
    if (!famNum) continue;

    lines.push(`0 @F${famNum}@ FAM`);

    if (family.husbandId) {
      const husbandNum = personIdMap.get(family.husbandId);
      if (husbandNum) {
        lines.push(`1 HUSB @I${husbandNum}@`);
      }
    }

    if (family.wifeId) {
      const wifeNum = personIdMap.get(family.wifeId);
      if (wifeNum) {
        lines.push(`1 WIFE @I${wifeNum}@`);
      }
    }

    // Marriage
    if (family.marriageDate || family.marriagePlace) {
      lines.push('1 MARR');
      if (family.marriageDate) {
        lines.push(`2 DATE ${formatGedcomDate(new Date(family.marriageDate))}`);
      }
      if (family.marriagePlace) {
        lines.push(`2 PLAC ${family.marriagePlace}`);
      }
    }

    // Divorce
    if (family.divorceDate) {
      lines.push('1 DIV');
      lines.push(`2 DATE ${formatGedcomDate(new Date(family.divorceDate))}`);
    }

    // Children
    for (const childId of family.childIds) {
      const childNum = personIdMap.get(childId);
      if (childNum) {
        lines.push(`1 CHIL @I${childNum}@`);
      }
    }
  }

  // Trailer
  lines.push('0 TRLR');

  const content = lines.join('\n');
  const filename = `${tree.name.replace(/[^a-zA-Z0-9\u0600-\u06FF]/g, '_')}_${new Date().toISOString().slice(0, 10)}.ged`;

  return {
    content,
    filename,
    stats: {
      personsExported: persons.length,
      familiesExported: families.length,
      relationshipsExported: relationships.length,
    },
  };
}

/**
 * Group relationships into family units
 */
interface FamilyGroup {
  key: string;
  husbandId?: string;
  wifeId?: string;
  childIds: string[];
  marriageDate?: string;
  marriagePlace?: string;
  divorceDate?: string;
}

function groupRelationshipsIntoFamilies(
  relationships: Relationship[],
  persons: Person[]
): FamilyGroup[] {
  const personMap = new Map<string, Person>();
  for (const p of persons) {
    personMap.set(p.id, p);
  }

  const families = new Map<string, FamilyGroup>();

  // First, find all spouse relationships
  for (const rel of relationships) {
    if (rel.relationship_type === 'spouse') {
      const person1 = personMap.get(rel.person1_id);
      const person2 = personMap.get(rel.person2_id);

      if (!person1 || !person2) continue;

      const husbandId = person1.gender === 'male' ? person1.id : person2.id;
      const wifeId = person1.gender === 'female' ? person1.id : person2.id;

      const key = `${husbandId}-${wifeId}`;

      if (!families.has(key)) {
        families.set(key, {
          key,
          husbandId,
          wifeId,
          childIds: [],
          marriageDate: rel.marriage_date || undefined,
          marriagePlace: rel.marriage_place || undefined,
          divorceDate: rel.divorce_date || undefined,
        });
      }
    }
  }

  // Then, add children to families based on parent relationships
  for (const rel of relationships) {
    if (rel.relationship_type === 'parent') {
      const parentId = rel.person1_id;
      const childId = rel.person2_id;
      const parent = personMap.get(parentId);

      if (!parent) continue;

      // Find family where this parent is a spouse
      for (const family of families.values()) {
        if (family.husbandId === parentId || family.wifeId === parentId) {
          if (!family.childIds.includes(childId)) {
            family.childIds.push(childId);
          }
          break;
        }
      }
    }
  }

  // Create families for single parents with children
  for (const rel of relationships) {
    if (rel.relationship_type === 'parent') {
      const parentId = rel.person1_id;
      const childId = rel.person2_id;
      const parent = personMap.get(parentId);

      if (!parent) continue;

      // Check if child is already in a family
      let foundFamily = false;
      for (const family of families.values()) {
        if (family.childIds.includes(childId)) {
          foundFamily = true;
          break;
        }
      }

      if (!foundFamily) {
        // Create single-parent family
        const key = `single-${parentId}`;
        if (!families.has(key)) {
          const family: FamilyGroup = {
            key,
            childIds: [childId],
          };
          if (parent.gender === 'male') {
            family.husbandId = parentId;
          } else {
            family.wifeId = parentId;
          }
          families.set(key, family);
        } else {
          const family = families.get(key)!;
          if (!family.childIds.includes(childId)) {
            family.childIds.push(childId);
          }
        }
      }
    }
  }

  return Array.from(families.values());
}

/**
 * Format date for GEDCOM (e.g., "15 JAN 1990")
 */
function formatGedcomDate(date: Date): string {
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

/**
 * Split text into lines of maximum length
 */
function splitIntoLines(text: string, maxLength: number): string[] {
  const lines: string[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    if (remaining.length <= maxLength) {
      lines.push(remaining);
      break;
    }

    // Find last space before maxLength
    let splitPoint = remaining.lastIndexOf(' ', maxLength);
    if (splitPoint === -1) {
      splitPoint = maxLength;
    }

    lines.push(remaining.substring(0, splitPoint));
    remaining = remaining.substring(splitPoint + 1);
  }

  return lines;
}
