/**
 * Export API Route
 * GET /api/export/[treeId] - Export tree as GEDCOM format
 */

import { NextRequest } from 'next/server';
import {
  getDatabase,
  getTreeById,
  getPersonsByTreeId,
  getRelationshipsByTreeId,
  verifyTreeOwnership,
} from '@/lib/api/db';
import {
  handleError,
  NotFoundError,
  ForbiddenError,
  UnauthorizedError,
} from '@/lib/api/errors';
import type { Person, Relationship } from '@/lib/db/schema';

// Mock user ID - replace with actual authentication
function getCurrentUserId(request: NextRequest): string | null {
  const authHeader = request.headers.get('x-user-id');
  const url = new URL(request.url);
  const queryUserId = url.searchParams.get('user_id');

  return authHeader || queryUserId;
}

interface RouteContext {
  params: Promise<{ treeId: string }>;
}

/**
 * Generate GEDCOM format from tree data
 * GEDCOM (GEnealogical Data COMmunication) is a standard format for genealogical data
 */
function generateGEDCOM(
  treeName: string,
  persons: Person[],
  relationships: Relationship[]
): string {
  const lines: string[] = [];

  // Header
  lines.push('0 HEAD');
  lines.push('1 SOUR Shajara');
  lines.push(`2 NAME ${treeName}`);
  lines.push('2 VERS 1.0');
  lines.push('1 DEST ANY');
  lines.push('1 DATE ' + new Date().toISOString().split('T')[0].replace(/-/g, ' '));
  lines.push('1 CHAR UTF-8');
  lines.push('1 GEDC');
  lines.push('2 VERS 5.5.1');
  lines.push('2 FORM LINEAGE-LINKED');

  // Create a map of person ID to GEDCOM ID
  const personIdMap = new Map<string, number>();
  persons.forEach((person, index) => {
    personIdMap.set(person.id, index + 1);
  });

  // Individual records
  persons.forEach((person) => {
    const gedcomId = personIdMap.get(person.id)!;

    lines.push(`0 @I${gedcomId}@ INDI`);

    // Name (use Arabic name as primary, English as alternate)
    if (person.full_name_ar) {
      lines.push(`1 NAME ${person.full_name_ar}`);
      lines.push(`2 GIVN ${person.given_name}`);
      if (person.family_name) {
        lines.push(`2 SURN ${person.family_name}`);
      }
    } else if (person.full_name_en) {
      lines.push(`1 NAME ${person.full_name_en}`);
    } else {
      lines.push(`1 NAME ${person.given_name}`);
    }

    // Alternate name (English)
    if (person.full_name_en && person.full_name_ar) {
      lines.push(`1 NAME ${person.full_name_en}`);
      lines.push('2 TYPE aka');
    }

    // Gender
    lines.push(`1 SEX ${person.gender === 'male' ? 'M' : 'F'}`);

    // Birth
    if (person.birth_date || person.birth_place) {
      lines.push('1 BIRT');
      if (person.birth_date) {
        lines.push(`2 DATE ${person.birth_date}`);
      }
      if (person.birth_place) {
        lines.push(`2 PLAC ${person.birth_place}`);
        if (person.birth_place_lat && person.birth_place_lng) {
          lines.push(`3 MAP`);
          lines.push(`4 LATI ${person.birth_place_lat}`);
          lines.push(`4 LONG ${person.birth_place_lng}`);
        }
      }
    }

    // Death
    if (!person.is_living && (person.death_date || person.death_place)) {
      lines.push('1 DEAT');
      if (person.death_date) {
        lines.push(`2 DATE ${person.death_date}`);
      }
      if (person.death_place) {
        lines.push(`2 PLAC ${person.death_place}`);
        if (person.death_place_lat && person.death_place_lng) {
          lines.push(`3 MAP`);
          lines.push(`4 LATI ${person.death_place_lat}`);
          lines.push(`4 LONG ${person.death_place_lng}`);
        }
      }
    }

    // Notes
    if (person.notes) {
      lines.push(`1 NOTE ${person.notes}`);
    }

    // Photo
    if (person.photo_url) {
      lines.push('1 OBJE');
      lines.push(`2 FILE ${person.photo_url}`);
      lines.push('2 FORM jpg');
    }
  });

  // Family records (from relationships)
  let familyIndex = 1;
  const processedSpouses = new Set<string>();

  relationships.forEach((rel) => {
    if (rel.relationship_type === 'spouse') {
      // Create unique key for this spouse relationship
      const spouseKey = [rel.person1_id, rel.person2_id].sort().join('-');

      if (!processedSpouses.has(spouseKey)) {
        processedSpouses.add(spouseKey);

        const person1GedcomId = personIdMap.get(rel.person1_id);
        const person2GedcomId = personIdMap.get(rel.person2_id);

        if (person1GedcomId && person2GedcomId) {
          lines.push(`0 @F${familyIndex}@ FAM`);

          // Determine husband and wife based on gender
          const person1 = persons.find((p) => p.id === rel.person1_id);

          if (person1?.gender === 'male') {
            lines.push(`1 HUSB @I${person1GedcomId}@`);
            lines.push(`1 WIFE @I${person2GedcomId}@`);
          } else {
            lines.push(`1 HUSB @I${person2GedcomId}@`);
            lines.push(`1 WIFE @I${person1GedcomId}@`);
          }

          // Marriage date and place
          if (rel.marriage_date || rel.marriage_place) {
            lines.push('1 MARR');
            if (rel.marriage_date) {
              lines.push(`2 DATE ${rel.marriage_date}`);
            }
            if (rel.marriage_place) {
              lines.push(`2 PLAC ${rel.marriage_place}`);
            }
          }

          // Divorce
          if (rel.divorce_date || rel.divorce_place) {
            lines.push('1 DIV');
            if (rel.divorce_date) {
              lines.push(`2 DATE ${rel.divorce_date}`);
            }
            if (rel.divorce_place) {
              lines.push(`2 PLAC ${rel.divorce_place}`);
            }
          }

          familyIndex++;
        }
      }
    }

    // Parent-child relationships
    if (rel.relationship_type === 'parent') {
      const parentGedcomId = personIdMap.get(rel.person1_id);
      const childGedcomId = personIdMap.get(rel.person2_id);

      if (parentGedcomId && childGedcomId) {
        // Find or create family record for this parent
        lines.push(`0 @F${familyIndex}@ FAM`);

        const parent = persons.find((p) => p.id === rel.person1_id);
        if (parent?.gender === 'male') {
          lines.push(`1 HUSB @I${parentGedcomId}@`);
        } else {
          lines.push(`1 WIFE @I${parentGedcomId}@`);
        }

        lines.push(`1 CHIL @I${childGedcomId}@`);

        familyIndex++;
      }
    }
  });

  // Trailer
  lines.push('0 TRLR');

  return lines.join('\n');
}

/**
 * GET /api/export/[treeId]
 * Export tree as GEDCOM file
 *
 * Returns a text file in GEDCOM 5.5.1 format
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const userId = getCurrentUserId(request);
    if (!userId) {
      throw new UnauthorizedError('User ID is required');
    }

    const { treeId } = await context.params;
    const db = getDatabase(request);

    // Get tree
    const tree = await getTreeById(db, treeId);
    if (!tree) {
      throw new NotFoundError('Tree not found');
    }

    // Verify ownership or public access
    const isOwner = await verifyTreeOwnership(db, treeId, userId);
    if (!tree.is_public && !isOwner) {
      throw new ForbiddenError('You do not have access to this tree');
    }

    // Get all persons and relationships
    const persons = await getPersonsByTreeId(db, treeId);
    const relationships = await getRelationshipsByTreeId(db, treeId);

    // Generate GEDCOM
    const gedcom = generateGEDCOM(tree.name, persons, relationships);

    // Return as downloadable file
    return new Response(gedcom, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': `attachment; filename="${tree.name.replace(/[^a-zA-Z0-9-_]/g, '_')}.ged"`,
      },
    });
  } catch (error) {
    return handleError(error);
  }
}

// Removed edge runtime for OpenNext compatibility
