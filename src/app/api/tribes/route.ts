/**
 * Tribes API Route
 *
 * Manages tribal hierarchy data (Qabila → Fakhdh → Hamula → Bayt)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { v4 as uuidv4 } from 'uuid';
import type { Tribe } from '@/lib/db/schema';

interface TribeWithChildren extends Tribe {
  children?: TribeWithChildren[];
  level?: 'qabila' | 'fakhdh' | 'hamula' | 'bayt';
}

/**
 * GET /api/tribes
 * Fetch tribes with optional hierarchy
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const parentId = searchParams.get('parent_id');
  const flat = searchParams.get('flat') === 'true';
  const originType = searchParams.get('origin_type');
  const region = searchParams.get('region');
  const search = searchParams.get('search');

  try {
    const { env } = await getCloudflareContext();
    const db = env.DB;

    let query = 'SELECT * FROM tribes WHERE 1=1';
    const params: (string | null)[] = [];

    if (parentId !== null) {
      if (parentId === '') {
        query += ' AND parent_tribe_id IS NULL';
      } else {
        query += ' AND parent_tribe_id = ?';
        params.push(parentId);
      }
    }

    if (originType) {
      query += ' AND origin_type = ?';
      params.push(originType);
    }

    if (region) {
      query += ' AND region = ?';
      params.push(region);
    }

    if (search) {
      query += ' AND (name_ar LIKE ? OR name_en LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY name_ar ASC';

    const result = await db.prepare(query).bind(...params).all<Tribe>();
    const tribes = result.results || [];

    // If flat mode, return just the array
    if (flat) {
      return NextResponse.json({ tribes });
    }

    // Build hierarchy - only for top-level tribes (qabilas)
    if (parentId === null || parentId === '') {
      const allTribesResult = await db.prepare('SELECT * FROM tribes ORDER BY name_ar ASC').all<Tribe>();
      const allTribes = allTribesResult.results || [];

      const hierarchy = buildTribalHierarchy(allTribes);
      return NextResponse.json({ tribes: hierarchy });
    }

    return NextResponse.json({ tribes });
  } catch (error) {
    console.error('Error fetching tribes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tribes' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/tribes
 * Create a new tribe
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name_ar, name_en, parent_tribe_id, origin_type, region, description } = body;

    if (!name_ar) {
      return NextResponse.json(
        { error: 'Arabic name is required' },
        { status: 400 }
      );
    }

    const { env } = await getCloudflareContext();
    const db = env.DB;

    const id = `tribe_${uuidv4().replace(/-/g, '').slice(0, 16)}`;

    await db.prepare(`
      INSERT INTO tribes (id, name_ar, name_en, parent_tribe_id, origin_type, region, description)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      name_ar,
      name_en || null,
      parent_tribe_id || null,
      origin_type || null,
      region || null,
      description || null
    ).run();

    const tribe = await db.prepare('SELECT * FROM tribes WHERE id = ?').bind(id).first<Tribe>();

    return NextResponse.json({ tribe }, { status: 201 });
  } catch (error) {
    console.error('Error creating tribe:', error);
    return NextResponse.json(
      { error: 'Failed to create tribe' },
      { status: 500 }
    );
  }
}

/**
 * Build hierarchical tree from flat tribe list
 */
function buildTribalHierarchy(tribes: Tribe[]): TribeWithChildren[] {
  const tribeMap = new Map<string, TribeWithChildren>();
  const rootTribes: TribeWithChildren[] = [];

  // First pass: create all tribe objects with children array
  tribes.forEach(tribe => {
    tribeMap.set(tribe.id, { ...tribe, children: [] });
  });

  // Second pass: build hierarchy and assign levels
  tribes.forEach(tribe => {
    const tribeWithChildren = tribeMap.get(tribe.id)!;

    if (tribe.parent_tribe_id) {
      const parent = tribeMap.get(tribe.parent_tribe_id);
      if (parent) {
        // Determine level based on parent's level
        const parentLevel = parent.level;
        if (!parentLevel || parentLevel === 'qabila') {
          tribeWithChildren.level = 'fakhdh';
        } else if (parentLevel === 'fakhdh') {
          tribeWithChildren.level = 'hamula';
        } else if (parentLevel === 'hamula') {
          tribeWithChildren.level = 'bayt';
        }
        parent.children!.push(tribeWithChildren);
      }
    } else {
      // Top-level tribe (Qabila)
      tribeWithChildren.level = 'qabila';
      rootTribes.push(tribeWithChildren);
    }
  });

  return rootTribes;
}
