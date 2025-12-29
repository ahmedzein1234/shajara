/**
 * User Data Export API
 * GDPR Article 20 - Right to Data Portability
 *
 * Exports all user data in a machine-readable format (JSON)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { getSession } from '@/lib/auth/actions';

interface ExportedUserData {
  exportDate: string;
  user: {
    id: string;
    email: string;
    name: string;
    createdAt: string;
    lastLogin: string | null;
  };
  trees: Array<{
    id: string;
    name: string;
    description: string | null;
    createdAt: string;
    updatedAt: string;
    persons: Array<{
      id: string;
      givenName: string;
      patronymicChain: string | null;
      familyName: string | null;
      fullNameAr: string | null;
      fullNameEn: string | null;
      gender: string;
      birthDate: string | null;
      deathDate: string | null;
      birthPlace: string | null;
      deathPlace: string | null;
      currentLocation: string | null;
      isLiving: boolean;
      photoUrl: string | null;
      notes: string | null;
      createdAt: string;
      updatedAt: string;
    }>;
    relationships: Array<{
      id: string;
      person1Id: string;
      person2Id: string;
      relationshipType: string;
      marriageDate: string | null;
      divorceDate: string | null;
      createdAt: string;
    }>;
  }>;
  metadata: {
    version: string;
    format: string;
    generatedBy: string;
  };
}

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Get Cloudflare context
    const { env } = await getCloudflareContext();
    const db = env.DB;

    // Fetch user data
    const user = await db
      .prepare('SELECT id, email, name, created_at, last_login FROM users WHERE id = ?')
      .bind(userId)
      .first();

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Fetch all trees owned by user
    const trees = await db
      .prepare(`
        SELECT id, name, description, created_at, updated_at
        FROM trees
        WHERE owner_id = ?
        ORDER BY created_at DESC
      `)
      .bind(userId)
      .all();

    // Build export data
    const exportData: ExportedUserData = {
      exportDate: new Date().toISOString(),
      user: {
        id: user.id as string,
        email: user.email as string,
        name: user.name as string,
        createdAt: user.created_at as string,
        lastLogin: user.last_login as string | null,
      },
      trees: [],
      metadata: {
        version: '1.0',
        format: 'JSON',
        generatedBy: 'Shajara GDPR Export',
      },
    };

    // For each tree, fetch persons and relationships
    for (const tree of trees.results || []) {
      const treeId = tree.id as string;

      // Fetch persons
      const persons = await db
        .prepare(`
          SELECT
            id, given_name, patronymic_chain, family_name,
            full_name_ar, full_name_en, gender,
            birth_date, death_date, birth_place, death_place,
            current_location, is_living, photo_url, notes,
            created_at, updated_at
          FROM persons
          WHERE tree_id = ?
          ORDER BY created_at
        `)
        .bind(treeId)
        .all();

      // Fetch relationships
      const relationships = await db
        .prepare(`
          SELECT
            id, person1_id, person2_id, relationship_type,
            marriage_date, divorce_date, created_at
          FROM relationships
          WHERE tree_id = ?
          ORDER BY created_at
        `)
        .bind(treeId)
        .all();

      exportData.trees.push({
        id: treeId,
        name: tree.name as string,
        description: tree.description as string | null,
        createdAt: tree.created_at as string,
        updatedAt: tree.updated_at as string,
        persons: (persons.results || []).map((p) => ({
          id: p.id as string,
          givenName: p.given_name as string,
          patronymicChain: p.patronymic_chain as string | null,
          familyName: p.family_name as string | null,
          fullNameAr: p.full_name_ar as string | null,
          fullNameEn: p.full_name_en as string | null,
          gender: p.gender as string,
          birthDate: p.birth_date as string | null,
          deathDate: p.death_date as string | null,
          birthPlace: p.birth_place as string | null,
          deathPlace: p.death_place as string | null,
          currentLocation: p.current_location as string | null,
          isLiving: p.is_living as boolean,
          photoUrl: p.photo_url as string | null,
          notes: p.notes as string | null,
          createdAt: p.created_at as string,
          updatedAt: p.updated_at as string,
        })),
        relationships: (relationships.results || []).map((r) => ({
          id: r.id as string,
          person1Id: r.person1_id as string,
          person2Id: r.person2_id as string,
          relationshipType: r.relationship_type as string,
          marriageDate: r.marriage_date as string | null,
          divorceDate: r.divorce_date as string | null,
          createdAt: r.created_at as string,
        })),
      });
    }

    // Return as downloadable JSON file
    const filename = `shajara-export-${userId}-${new Date().toISOString().slice(0, 10)}.json`;

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Data export failed:', error);
    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Request account deletion (GDPR Article 17 - Right to Erasure)
 */
export async function DELETE(request: NextRequest) {
  try {
    // Authenticate user
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Get Cloudflare context
    const { env } = await getCloudflareContext();
    const db = env.DB;

    // Start deletion process
    // Note: In production, you might want to schedule this for 30 days
    // to allow users to change their mind

    // Get all trees owned by user
    const trees = await db
      .prepare('SELECT id FROM trees WHERE owner_id = ?')
      .bind(userId)
      .all();

    const treeIds = (trees.results || []).map((t) => t.id as string);

    // Delete in order (respecting foreign keys)
    for (const treeId of treeIds) {
      // Delete relationships
      await db
        .prepare('DELETE FROM relationships WHERE tree_id = ?')
        .bind(treeId)
        .run();

      // Delete persons
      await db
        .prepare('DELETE FROM persons WHERE tree_id = ?')
        .bind(treeId)
        .run();
    }

    // Delete trees
    await db
      .prepare('DELETE FROM trees WHERE owner_id = ?')
      .bind(userId)
      .run();

    // Delete sessions
    await db
      .prepare('DELETE FROM sessions WHERE user_id = ?')
      .bind(userId)
      .run();

    // Delete user
    await db
      .prepare('DELETE FROM users WHERE id = ?')
      .bind(userId)
      .run();

    // Log the deletion for audit purposes
    console.info(`User account deleted: ${userId}`, {
      userId,
      timestamp: new Date().toISOString(),
      treesDeleted: treeIds.length,
    });

    return NextResponse.json({
      success: true,
      message: 'Account and all associated data have been deleted',
      deletedTrees: treeIds.length,
    });
  } catch (error) {
    console.error('Account deletion failed:', error);
    return NextResponse.json(
      { error: 'Failed to delete account' },
      { status: 500 }
    );
  }
}
