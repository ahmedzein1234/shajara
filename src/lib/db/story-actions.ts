'use server';

import { getCloudflareContext } from '@opennextjs/cloudflare';
import { getSession } from '@/lib/auth/actions';

// =====================================================
// TYPES
// =====================================================

export type StoryType = 'memory' | 'biography' | 'tradition' | 'recipe' | 'historical' | 'milestone' | 'tribute';
export type StoryStatus = 'draft' | 'published' | 'archived';
export type StoryVisibility = 'family' | 'public' | 'private';

export interface Story {
  id: string;
  tree_id: string;
  author_id: string;
  title_ar: string;
  title_en: string | null;
  content_ar: string | null;
  content_en: string | null;
  excerpt_ar: string | null;
  excerpt_en: string | null;
  cover_image_url: string | null;
  story_type: StoryType;
  event_date: string | null;
  event_date_precision: string;
  event_end_date: string | null;
  location_ar: string | null;
  location_en: string | null;
  latitude: number | null;
  longitude: number | null;
  status: StoryStatus;
  visibility: StoryVisibility;
  published_at: number | null;
  views_count: number;
  likes_count: number;
  comments_count: number;
  is_featured: boolean;
  featured_order: number | null;
  created_at: number;
  updated_at: number;
  // Joined data
  author_name?: string;
  is_liked?: boolean;
  members?: StoryMember[];
  media?: StoryMedia[];
}

export interface StoryMember {
  id: string;
  story_id: string;
  member_id: string;
  role: 'primary' | 'mentioned' | 'author_of';
  member_name_ar?: string;
  member_name_en?: string;
  member_photo?: string;
}

export interface StoryMedia {
  id: string;
  story_id: string;
  media_id: string;
  display_order: number;
  caption_ar: string | null;
  caption_en: string | null;
  file_url?: string;
  file_type?: string;
  thumbnail_url?: string;
}

export interface CreateStoryInput {
  tree_id: string;
  title_ar: string;
  title_en?: string;
  content_ar?: string;
  content_en?: string;
  cover_image_url?: string;
  story_type?: StoryType;
  event_date?: string;
  event_date_precision?: string;
  location_ar?: string;
  location_en?: string;
  status?: StoryStatus;
  visibility?: StoryVisibility;
  member_ids?: string[];
}

export interface UpdateStoryInput {
  title_ar?: string;
  title_en?: string;
  content_ar?: string;
  content_en?: string;
  excerpt_ar?: string;
  excerpt_en?: string;
  cover_image_url?: string;
  story_type?: StoryType;
  event_date?: string;
  event_date_precision?: string;
  event_end_date?: string;
  location_ar?: string;
  location_en?: string;
  latitude?: number;
  longitude?: number;
  status?: StoryStatus;
  visibility?: StoryVisibility;
}

// =====================================================
// STORY CRUD OPERATIONS
// =====================================================

/**
 * Create a new story
 */
export async function createStory(
  input: CreateStoryInput
): Promise<{ success: boolean; story?: Story; error?: string }> {
  try {
    const session = await getSession();
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' };
    }

    const { env } = await getCloudflareContext();
    const db = env.DB;

    const storyId = crypto.randomUUID();

    // Generate excerpt from content
    const excerpt_ar = input.content_ar
      ? input.content_ar.replace(/<[^>]*>/g, '').slice(0, 200)
      : null;
    const excerpt_en = input.content_en
      ? input.content_en.replace(/<[^>]*>/g, '').slice(0, 200)
      : null;

    await db.prepare(`
      INSERT INTO stories (
        id, tree_id, author_id, title_ar, title_en, content_ar, content_en,
        excerpt_ar, excerpt_en, cover_image_url, story_type, event_date,
        event_date_precision, location_ar, location_en, status, visibility,
        published_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      storyId,
      input.tree_id,
      session.user.id,
      input.title_ar,
      input.title_en || null,
      input.content_ar || null,
      input.content_en || null,
      excerpt_ar,
      excerpt_en,
      input.cover_image_url || null,
      input.story_type || 'memory',
      input.event_date || null,
      input.event_date_precision || 'day',
      input.location_ar || null,
      input.location_en || null,
      input.status || 'draft',
      input.visibility || 'family',
      input.status === 'published' ? Math.floor(Date.now() / 1000) : null
    ).run();

    // Add member associations
    if (input.member_ids && input.member_ids.length > 0) {
      for (const memberId of input.member_ids) {
        await db.prepare(`
          INSERT INTO story_members (story_id, member_id, role)
          VALUES (?, ?, 'mentioned')
        `).bind(storyId, memberId).run();
      }
    }

    const story = await getStory(storyId);
    return { success: true, story: story || undefined };
  } catch (error) {
    console.error('Error creating story:', error);
    return { success: false, error: 'Failed to create story' };
  }
}

/**
 * Get a single story by ID
 */
export async function getStory(storyId: string): Promise<Story | null> {
  try {
    const session = await getSession();
    const userId = session?.user?.id;

    const { env } = await getCloudflareContext();
    const db = env.DB;

    const story = await db.prepare(`
      SELECT s.*, u.name as author_name,
             CASE WHEN sl.id IS NOT NULL THEN 1 ELSE 0 END as is_liked
      FROM stories s
      LEFT JOIN users u ON s.author_id = u.id
      LEFT JOIN story_likes sl ON s.id = sl.story_id AND sl.user_id = ?
      WHERE s.id = ?
    `).bind(userId || '', storyId).first<Record<string, unknown>>();

    if (!story) return null;

    // Get associated members
    const members = await db.prepare(`
      SELECT sm.*, m.first_name_ar, m.first_name_en, m.last_name_ar, m.last_name_en, m.photo_url
      FROM story_members sm
      JOIN family_members m ON sm.member_id = m.id
      WHERE sm.story_id = ?
      ORDER BY sm.role
    `).bind(storyId).all<Record<string, unknown>>();

    // Get associated media
    const media = await db.prepare(`
      SELECT sm.*, mi.file_url, mi.file_type, mi.thumbnail_url
      FROM story_media sm
      JOIN media_items mi ON sm.media_id = mi.id
      WHERE sm.story_id = ?
      ORDER BY sm.display_order
    `).bind(storyId).all<Record<string, unknown>>();

    return {
      ...story,
      is_featured: Boolean(story.is_featured),
      is_liked: Boolean(story.is_liked),
      members: (members.results || []).map((m) => ({
        id: m.id as string,
        story_id: m.story_id as string,
        member_id: m.member_id as string,
        role: m.role as 'primary' | 'mentioned' | 'author_of',
        member_name_ar: `${m.first_name_ar} ${m.last_name_ar}`,
        member_name_en: m.first_name_en ? `${m.first_name_en} ${m.last_name_en}` : undefined,
        member_photo: m.photo_url as string | undefined,
      })),
      media: (media.results || []).map((m) => ({
        id: m.id as string,
        story_id: m.story_id as string,
        media_id: m.media_id as string,
        display_order: m.display_order as number,
        caption_ar: m.caption_ar as string | null,
        caption_en: m.caption_en as string | null,
        file_url: m.file_url as string,
        file_type: m.file_type as string,
        thumbnail_url: m.thumbnail_url as string | undefined,
      })),
    } as Story;
  } catch (error) {
    console.error('Error getting story:', error);
    return null;
  }
}

/**
 * Get stories for a tree
 */
export async function getTreeStories(
  treeId: string,
  options: {
    status?: StoryStatus;
    type?: StoryType;
    memberId?: string;
    limit?: number;
    offset?: number;
    featured?: boolean;
  } = {}
): Promise<Story[]> {
  try {
    const session = await getSession();
    const userId = session?.user?.id;

    const { env } = await getCloudflareContext();
    const db = env.DB;

    let whereClause = 'WHERE s.tree_id = ?';
    const params: unknown[] = [treeId];

    if (options.status) {
      whereClause += ' AND s.status = ?';
      params.push(options.status);
    } else {
      whereClause += " AND s.status = 'published'";
    }

    if (options.type) {
      whereClause += ' AND s.story_type = ?';
      params.push(options.type);
    }

    if (options.featured) {
      whereClause += ' AND s.is_featured = 1';
    }

    if (options.memberId) {
      whereClause += ' AND EXISTS (SELECT 1 FROM story_members sm WHERE sm.story_id = s.id AND sm.member_id = ?)';
      params.push(options.memberId);
    }

    const limit = options.limit || 20;
    const offset = options.offset || 0;

    params.push(userId || '', limit, offset);

    const results = await db.prepare(`
      SELECT s.*, u.name as author_name,
             CASE WHEN sl.id IS NOT NULL THEN 1 ELSE 0 END as is_liked
      FROM stories s
      LEFT JOIN users u ON s.author_id = u.id
      LEFT JOIN story_likes sl ON s.id = sl.story_id AND sl.user_id = ?
      ${whereClause}
      ORDER BY s.is_featured DESC, s.published_at DESC, s.created_at DESC
      LIMIT ? OFFSET ?
    `).bind(...params).all<Record<string, unknown>>();

    return (results.results || []).map((s) => ({
      ...s,
      is_featured: Boolean(s.is_featured),
      is_liked: Boolean(s.is_liked),
    })) as Story[];
  } catch (error) {
    console.error('Error getting tree stories:', error);
    return [];
  }
}

/**
 * Update a story
 */
export async function updateStory(
  storyId: string,
  input: UpdateStoryInput
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getSession();
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' };
    }

    const { env } = await getCloudflareContext();
    const db = env.DB;

    // Check ownership
    const story = await db.prepare(`
      SELECT author_id, status FROM stories WHERE id = ?
    `).bind(storyId).first<{ author_id: string; status: string }>();

    if (!story || story.author_id !== session.user.id) {
      return { success: false, error: 'Not authorized to edit this story' };
    }

    const updates: string[] = ['updated_at = unixepoch()'];
    const values: unknown[] = [];

    const fields = [
      'title_ar', 'title_en', 'content_ar', 'content_en',
      'excerpt_ar', 'excerpt_en', 'cover_image_url', 'story_type',
      'event_date', 'event_date_precision', 'event_end_date',
      'location_ar', 'location_en', 'latitude', 'longitude',
      'status', 'visibility'
    ];

    for (const field of fields) {
      if (field in input) {
        updates.push(`${field} = ?`);
        values.push((input as Record<string, unknown>)[field]);
      }
    }

    // Handle publishing
    if (input.status === 'published' && story.status !== 'published') {
      updates.push('published_at = unixepoch()');
    }

    // Auto-generate excerpt if content changed
    if (input.content_ar && !input.excerpt_ar) {
      updates.push('excerpt_ar = ?');
      values.push(input.content_ar.replace(/<[^>]*>/g, '').slice(0, 200));
    }
    if (input.content_en && !input.excerpt_en) {
      updates.push('excerpt_en = ?');
      values.push(input.content_en.replace(/<[^>]*>/g, '').slice(0, 200));
    }

    values.push(storyId);

    await db.prepare(`
      UPDATE stories SET ${updates.join(', ')} WHERE id = ?
    `).bind(...values).run();

    return { success: true };
  } catch (error) {
    console.error('Error updating story:', error);
    return { success: false, error: 'Failed to update story' };
  }
}

/**
 * Delete a story
 */
export async function deleteStory(
  storyId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getSession();
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' };
    }

    const { env } = await getCloudflareContext();
    const db = env.DB;

    // Check ownership
    const story = await db.prepare(`
      SELECT author_id FROM stories WHERE id = ?
    `).bind(storyId).first<{ author_id: string }>();

    if (!story || story.author_id !== session.user.id) {
      return { success: false, error: 'Not authorized to delete this story' };
    }

    await db.prepare('DELETE FROM stories WHERE id = ?').bind(storyId).run();

    return { success: true };
  } catch (error) {
    console.error('Error deleting story:', error);
    return { success: false, error: 'Failed to delete story' };
  }
}

/**
 * Like/unlike a story
 */
export async function toggleStoryLike(
  storyId: string
): Promise<{ success: boolean; liked: boolean; error?: string }> {
  try {
    const session = await getSession();
    if (!session?.user) {
      return { success: false, liked: false, error: 'Unauthorized' };
    }

    const { env } = await getCloudflareContext();
    const db = env.DB;

    // Check if already liked
    const existingLike = await db.prepare(`
      SELECT id FROM story_likes WHERE story_id = ? AND user_id = ?
    `).bind(storyId, session.user.id).first();

    if (existingLike) {
      // Unlike
      await db.prepare(`
        DELETE FROM story_likes WHERE story_id = ? AND user_id = ?
      `).bind(storyId, session.user.id).run();

      await db.prepare(`
        UPDATE stories SET likes_count = likes_count - 1 WHERE id = ?
      `).bind(storyId).run();

      return { success: true, liked: false };
    } else {
      // Like
      await db.prepare(`
        INSERT INTO story_likes (story_id, user_id) VALUES (?, ?)
      `).bind(storyId, session.user.id).run();

      await db.prepare(`
        UPDATE stories SET likes_count = likes_count + 1 WHERE id = ?
      `).bind(storyId).run();

      return { success: true, liked: true };
    }
  } catch (error) {
    console.error('Error toggling like:', error);
    return { success: false, liked: false, error: 'Failed to update like' };
  }
}

/**
 * Increment view count
 */
export async function incrementStoryViews(storyId: string): Promise<void> {
  try {
    const { env } = await getCloudflareContext();
    const db = env.DB;

    await db.prepare(`
      UPDATE stories SET views_count = views_count + 1 WHERE id = ?
    `).bind(storyId).run();
  } catch (error) {
    console.error('Error incrementing views:', error);
  }
}

/**
 * Add member to story
 */
export async function addStoryMember(
  storyId: string,
  memberId: string,
  role: 'primary' | 'mentioned' | 'author_of' = 'mentioned'
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getSession();
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' };
    }

    const { env } = await getCloudflareContext();
    const db = env.DB;

    await db.prepare(`
      INSERT INTO story_members (story_id, member_id, role)
      VALUES (?, ?, ?)
      ON CONFLICT (story_id, member_id) DO UPDATE SET role = excluded.role
    `).bind(storyId, memberId, role).run();

    return { success: true };
  } catch (error) {
    console.error('Error adding story member:', error);
    return { success: false, error: 'Failed to add member' };
  }
}

/**
 * Remove member from story
 */
export async function removeStoryMember(
  storyId: string,
  memberId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getSession();
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' };
    }

    const { env } = await getCloudflareContext();
    const db = env.DB;

    await db.prepare(`
      DELETE FROM story_members WHERE story_id = ? AND member_id = ?
    `).bind(storyId, memberId).run();

    return { success: true };
  } catch (error) {
    console.error('Error removing story member:', error);
    return { success: false, error: 'Failed to remove member' };
  }
}

/**
 * Add media to story
 */
export async function addStoryMedia(
  storyId: string,
  mediaId: string,
  caption_ar?: string,
  caption_en?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getSession();
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' };
    }

    const { env } = await getCloudflareContext();
    const db = env.DB;

    // Get next display order
    const lastOrder = await db.prepare(`
      SELECT MAX(display_order) as max_order FROM story_media WHERE story_id = ?
    `).bind(storyId).first<{ max_order: number | null }>();

    const displayOrder = (lastOrder?.max_order || 0) + 1;

    await db.prepare(`
      INSERT INTO story_media (story_id, media_id, display_order, caption_ar, caption_en)
      VALUES (?, ?, ?, ?, ?)
    `).bind(storyId, mediaId, displayOrder, caption_ar || null, caption_en || null).run();

    return { success: true };
  } catch (error) {
    console.error('Error adding story media:', error);
    return { success: false, error: 'Failed to add media' };
  }
}

/**
 * Get stories by member
 */
export async function getMemberStories(memberId: string): Promise<Story[]> {
  try {
    const session = await getSession();
    const userId = session?.user?.id;

    const { env } = await getCloudflareContext();
    const db = env.DB;

    const results = await db.prepare(`
      SELECT s.*, u.name as author_name,
             CASE WHEN sl.id IS NOT NULL THEN 1 ELSE 0 END as is_liked
      FROM stories s
      JOIN story_members sm ON s.id = sm.story_id
      LEFT JOIN users u ON s.author_id = u.id
      LEFT JOIN story_likes sl ON s.id = sl.story_id AND sl.user_id = ?
      WHERE sm.member_id = ? AND s.status = 'published'
      ORDER BY s.event_date DESC, s.created_at DESC
    `).bind(userId || '', memberId).all<Record<string, unknown>>();

    return (results.results || []).map((s) => ({
      ...s,
      is_featured: Boolean(s.is_featured),
      is_liked: Boolean(s.is_liked),
    })) as Story[];
  } catch (error) {
    console.error('Error getting member stories:', error);
    return [];
  }
}
