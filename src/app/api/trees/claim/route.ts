/**
 * Guest Tree Claim API
 * POST /api/trees/claim
 *
 * Allows authenticated users to claim a guest tree they created before registering.
 * Transfers all persons and relationships from localStorage to the database.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { v4 as uuidv4 } from 'uuid';
import { getSession } from '@/lib/auth/actions';
import type { Person, Relationship } from '@/lib/db/schema';

interface GuestTree {
  id: string;
  name: string;
  description: string | null;
  is_public: boolean;
  isGuest: true;
  created_at: number;
  updated_at: number;
}

interface ClaimRequest {
  tree: GuestTree;
  persons: Person[];
  relationships: Relationship[];
}

export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const body: ClaimRequest = await request.json();

    // Validate request
    if (!body.tree || !body.tree.name) {
      return NextResponse.json(
        { error: 'Tree data is required' },
        { status: 400 }
      );
    }

    const { env } = await getCloudflareContext();
    const db = env.DB;
    const now = Math.floor(Date.now() / 1000);

    // Generate new tree ID
    const newTreeId = `tree_${uuidv4().replace(/-/g, '').slice(0, 16)}`;

    // Create mapping from guest IDs to new IDs
    const personIdMap = new Map<string, string>();

    // Generate new IDs for all persons
    for (const person of body.persons || []) {
      const newPersonId = `person_${uuidv4().replace(/-/g, '').slice(0, 16)}`;
      personIdMap.set(person.id, newPersonId);
    }

    // Create the tree
    await db.prepare(`
      INSERT INTO trees (id, user_id, name, description, is_public, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      newTreeId,
      userId,
      body.tree.name,
      body.tree.description || null,
      body.tree.is_public ? 1 : 0,
      now,
      now
    ).run();

    // Add user as owner collaborator
    await db.prepare(`
      INSERT INTO tree_collaborators (id, tree_id, user_id, role, invited_at, accepted_at)
      VALUES (?, ?, ?, 'owner', ?, ?)
    `).bind(
      `collab_${uuidv4().replace(/-/g, '').slice(0, 16)}`,
      newTreeId,
      userId,
      now,
      now
    ).run();

    // Create tree settings with defaults
    await db.prepare(`
      INSERT INTO tree_settings (id, tree_id, created_at, updated_at)
      VALUES (?, ?, ?, ?)
    `).bind(
      `settings_${uuidv4().replace(/-/g, '').slice(0, 16)}`,
      newTreeId,
      now,
      now
    ).run();

    // Insert persons
    let personsCreated = 0;
    for (const person of body.persons || []) {
      const newPersonId = personIdMap.get(person.id);
      if (!newPersonId) continue;

      try {
        await db.prepare(`
          INSERT INTO persons (
            id, tree_id, given_name, patronymic_chain, family_name,
            full_name_ar, full_name_en, gender, birth_date, birth_date_hijri,
            birth_place, death_date, death_date_hijri, death_place, is_living,
            photo_url, notes, kunya, laqab, nisba,
            tribe_id, tribal_branch, tribal_verified,
            nasab_chain, nasab_chain_en, is_sayyid, sayyid_verified, sayyid_lineage,
            created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          newPersonId,
          newTreeId,
          person.given_name,
          person.patronymic_chain || null,
          person.family_name || null,
          person.full_name_ar || null,
          person.full_name_en || null,
          person.gender,
          person.birth_date || null,
          person.birth_date_hijri || null,
          person.birth_place || null,
          person.death_date || null,
          person.death_date_hijri || null,
          person.death_place || null,
          person.is_living ? 1 : 0,
          person.photo_url || null,
          person.notes || null,
          person.kunya || null,
          person.laqab || null,
          person.nisba || null,
          person.tribe_id || null,
          person.tribal_branch || null,
          person.tribal_verified ? 1 : 0,
          person.nasab_chain || null,
          person.nasab_chain_en || null,
          person.is_sayyid ? 1 : 0,
          person.sayyid_verified ? 1 : 0,
          person.sayyid_lineage || null,
          now,
          now
        ).run();
        personsCreated++;
      } catch (error) {
        console.error('Error creating person:', error);
      }
    }

    // Insert relationships with mapped IDs
    let relationshipsCreated = 0;
    for (const rel of body.relationships || []) {
      const newPerson1Id = personIdMap.get(rel.person1_id);
      const newPerson2Id = personIdMap.get(rel.person2_id);

      if (!newPerson1Id || !newPerson2Id) continue;

      try {
        await db.prepare(`
          INSERT INTO relationships (
            id, tree_id, person1_id, person2_id, relationship_type,
            marriage_date, marriage_date_hijri, divorce_date, divorce_date_hijri,
            created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          `rel_${uuidv4().replace(/-/g, '').slice(0, 16)}`,
          newTreeId,
          newPerson1Id,
          newPerson2Id,
          rel.relationship_type,
          rel.marriage_date || null,
          rel.marriage_date_hijri || null,
          rel.divorce_date || null,
          rel.divorce_date_hijri || null,
          now,
          now
        ).run();
        relationshipsCreated++;
      } catch (error) {
        console.error('Error creating relationship:', error);
      }
    }

    // Log the claim in audit log
    await db.prepare(`
      INSERT INTO audit_log (id, tree_id, user_id, action, entity_type, entity_id, details, created_at)
      VALUES (?, ?, ?, 'claim', 'tree', ?, ?, ?)
    `).bind(
      `audit_${uuidv4().replace(/-/g, '').slice(0, 16)}`,
      newTreeId,
      userId,
      newTreeId,
      JSON.stringify({
        guest_tree_id: body.tree.id,
        persons_claimed: personsCreated,
        relationships_claimed: relationshipsCreated,
      }),
      now
    ).run();

    return NextResponse.json({
      success: true,
      tree: {
        id: newTreeId,
        name: body.tree.name,
        description: body.tree.description,
      },
      stats: {
        persons_created: personsCreated,
        relationships_created: relationshipsCreated,
      },
    }, { status: 201 });

  } catch (error) {
    console.error('Error claiming guest tree:', error);
    return NextResponse.json(
      { error: 'Failed to claim tree' },
      { status: 500 }
    );
  }
}
