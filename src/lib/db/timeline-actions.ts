'use server';

import { getCloudflareContext } from '@opennextjs/cloudflare';
import { getSession } from '@/lib/auth/actions';

// =====================================================
// TYPES
// =====================================================

export type EventSourceType = 'member_birth' | 'member_death' | 'member_marriage' | 'story' | 'manual' | 'milestone';
export type EventCategory = 'life' | 'marriage' | 'achievement' | 'memorial' | 'historical' | 'custom';

export interface TimelineEvent {
  id: string;
  tree_id: string;
  source_type: EventSourceType;
  source_id: string | null;
  title_ar: string;
  title_en: string | null;
  description_ar: string | null;
  description_en: string | null;
  event_date: string;
  event_date_precision: string;
  event_end_date: string | null;
  location_ar: string | null;
  location_en: string | null;
  latitude: number | null;
  longitude: number | null;
  icon: string | null;
  color: string | null;
  image_url: string | null;
  event_category: EventCategory;
  primary_member_id: string | null;
  is_visible: boolean;
  created_at: number;
  updated_at: number;
  // Joined data
  primary_member_name_ar?: string;
  primary_member_name_en?: string;
  primary_member_photo?: string;
  members?: TimelineEventMember[];
}

export interface TimelineEventMember {
  id: string;
  event_id: string;
  member_id: string;
  role: 'primary' | 'participant' | 'witness';
  member_name_ar?: string;
  member_name_en?: string;
  member_photo?: string;
}

export interface CreateTimelineEventInput {
  tree_id: string;
  source_type?: EventSourceType;
  source_id?: string;
  title_ar: string;
  title_en?: string;
  description_ar?: string;
  description_en?: string;
  event_date: string;
  event_date_precision?: string;
  event_end_date?: string;
  location_ar?: string;
  location_en?: string;
  latitude?: number;
  longitude?: number;
  icon?: string;
  color?: string;
  image_url?: string;
  event_category?: EventCategory;
  primary_member_id?: string;
  member_ids?: string[];
}

// =====================================================
// TIMELINE EVENT OPERATIONS
// =====================================================

/**
 * Create a manual timeline event
 */
export async function createTimelineEvent(
  input: CreateTimelineEventInput
): Promise<{ success: boolean; event?: TimelineEvent; error?: string }> {
  try {
    const session = await getSession();
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' };
    }

    const { env } = await getCloudflareContext();
    const db = env.DB;

    const eventId = crypto.randomUUID();

    await db.prepare(`
      INSERT INTO timeline_events (
        id, tree_id, source_type, source_id, title_ar, title_en,
        description_ar, description_en, event_date, event_date_precision,
        event_end_date, location_ar, location_en, latitude, longitude,
        icon, color, image_url, event_category, primary_member_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      eventId,
      input.tree_id,
      input.source_type || 'manual',
      input.source_id || null,
      input.title_ar,
      input.title_en || null,
      input.description_ar || null,
      input.description_en || null,
      input.event_date,
      input.event_date_precision || 'day',
      input.event_end_date || null,
      input.location_ar || null,
      input.location_en || null,
      input.latitude || null,
      input.longitude || null,
      input.icon || null,
      input.color || null,
      input.image_url || null,
      input.event_category || 'custom',
      input.primary_member_id || null
    ).run();

    // Add member associations
    if (input.member_ids && input.member_ids.length > 0) {
      for (const memberId of input.member_ids) {
        await db.prepare(`
          INSERT INTO timeline_event_members (event_id, member_id, role)
          VALUES (?, ?, 'participant')
        `).bind(eventId, memberId).run();
      }
    }

    const event = await getTimelineEvent(eventId);
    return { success: true, event: event || undefined };
  } catch (error) {
    console.error('Error creating timeline event:', error);
    return { success: false, error: 'Failed to create event' };
  }
}

/**
 * Get a single timeline event
 */
export async function getTimelineEvent(eventId: string): Promise<TimelineEvent | null> {
  try {
    const { env } = await getCloudflareContext();
    const db = env.DB;

    const event = await db.prepare(`
      SELECT te.*,
             m.first_name_ar as primary_member_first_name_ar,
             m.last_name_ar as primary_member_last_name_ar,
             m.first_name_en as primary_member_first_name_en,
             m.last_name_en as primary_member_last_name_en,
             m.photo_url as primary_member_photo
      FROM timeline_events te
      LEFT JOIN family_members m ON te.primary_member_id = m.id
      WHERE te.id = ?
    `).bind(eventId).first<Record<string, unknown>>();

    if (!event) return null;

    // Get associated members
    const members = await db.prepare(`
      SELECT tem.*, m.first_name_ar, m.last_name_ar, m.first_name_en, m.last_name_en, m.photo_url
      FROM timeline_event_members tem
      JOIN family_members m ON tem.member_id = m.id
      WHERE tem.event_id = ?
    `).bind(eventId).all<Record<string, unknown>>();

    return {
      ...event,
      is_visible: Boolean(event.is_visible),
      primary_member_name_ar: event.primary_member_first_name_ar
        ? `${event.primary_member_first_name_ar} ${event.primary_member_last_name_ar}`
        : undefined,
      primary_member_name_en: event.primary_member_first_name_en
        ? `${event.primary_member_first_name_en} ${event.primary_member_last_name_en}`
        : undefined,
      primary_member_photo: event.primary_member_photo as string | undefined,
      members: (members.results || []).map((m) => ({
        id: m.id as string,
        event_id: m.event_id as string,
        member_id: m.member_id as string,
        role: m.role as 'primary' | 'participant' | 'witness',
        member_name_ar: `${m.first_name_ar} ${m.last_name_ar}`,
        member_name_en: m.first_name_en ? `${m.first_name_en} ${m.last_name_en}` : undefined,
        member_photo: m.photo_url as string | undefined,
      })),
    } as TimelineEvent;
  } catch (error) {
    console.error('Error getting timeline event:', error);
    return null;
  }
}

/**
 * Get timeline events for a tree
 */
export async function getTreeTimeline(
  treeId: string,
  options: {
    category?: EventCategory;
    memberId?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  } = {}
): Promise<TimelineEvent[]> {
  try {
    const { env } = await getCloudflareContext();
    const db = env.DB;

    let whereClause = 'WHERE te.tree_id = ? AND te.is_visible = 1';
    const params: unknown[] = [treeId];

    if (options.category) {
      whereClause += ' AND te.event_category = ?';
      params.push(options.category);
    }

    if (options.startDate) {
      whereClause += ' AND te.event_date >= ?';
      params.push(options.startDate);
    }

    if (options.endDate) {
      whereClause += ' AND te.event_date <= ?';
      params.push(options.endDate);
    }

    if (options.memberId) {
      whereClause += ` AND (te.primary_member_id = ? OR EXISTS (
        SELECT 1 FROM timeline_event_members tem WHERE tem.event_id = te.id AND tem.member_id = ?
      ))`;
      params.push(options.memberId, options.memberId);
    }

    const limit = options.limit || 100;
    const offset = options.offset || 0;
    params.push(limit, offset);

    const results = await db.prepare(`
      SELECT te.*,
             m.first_name_ar as primary_member_first_name_ar,
             m.last_name_ar as primary_member_last_name_ar,
             m.first_name_en as primary_member_first_name_en,
             m.last_name_en as primary_member_last_name_en,
             m.photo_url as primary_member_photo
      FROM timeline_events te
      LEFT JOIN family_members m ON te.primary_member_id = m.id
      ${whereClause}
      ORDER BY te.event_date DESC
      LIMIT ? OFFSET ?
    `).bind(...params).all<Record<string, unknown>>();

    return (results.results || []).map((e) => ({
      ...e,
      is_visible: Boolean(e.is_visible),
      primary_member_name_ar: e.primary_member_first_name_ar
        ? `${e.primary_member_first_name_ar} ${e.primary_member_last_name_ar}`
        : undefined,
      primary_member_name_en: e.primary_member_first_name_en
        ? `${e.primary_member_first_name_en} ${e.primary_member_last_name_en}`
        : undefined,
      primary_member_photo: e.primary_member_photo as string | undefined,
    })) as TimelineEvent[];
  } catch (error) {
    console.error('Error getting tree timeline:', error);
    return [];
  }
}

/**
 * Generate timeline events from existing data (births, deaths, marriages, stories)
 */
export async function generateTimelineFromData(
  treeId: string
): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    const session = await getSession();
    if (!session?.user) {
      return { success: false, count: 0, error: 'Unauthorized' };
    }

    const { env } = await getCloudflareContext();
    const db = env.DB;

    let eventsCreated = 0;

    // Get all members with birth dates
    const members = await db.prepare(`
      SELECT id, first_name_ar, last_name_ar, first_name_en, last_name_en,
             birth_date, death_date, birth_place_ar, birth_place_en, photo_url
      FROM family_members
      WHERE tree_id = ? AND (birth_date IS NOT NULL OR death_date IS NOT NULL)
    `).bind(treeId).all<Record<string, unknown>>();

    for (const member of members.results || []) {
      const nameAr = `${member.first_name_ar} ${member.last_name_ar}`;
      const nameEn = member.first_name_en ? `${member.first_name_en} ${member.last_name_en}` : null;

      // Birth event
      if (member.birth_date) {
        await db.prepare(`
          INSERT INTO timeline_events (
            tree_id, source_type, source_id, title_ar, title_en,
            event_date, location_ar, location_en, icon, color,
            event_category, primary_member_id, image_url
          ) VALUES (?, 'member_birth', ?, ?, ?, ?, ?, ?, 'baby', '#10b981', 'life', ?, ?)
          ON CONFLICT DO NOTHING
        `).bind(
          treeId,
          member.id,
          `مولد ${nameAr}`,
          nameEn ? `Birth of ${nameEn}` : null,
          member.birth_date,
          member.birth_place_ar || null,
          member.birth_place_en || null,
          member.id,
          member.photo_url || null
        ).run();
        eventsCreated++;
      }

      // Death event
      if (member.death_date) {
        await db.prepare(`
          INSERT INTO timeline_events (
            tree_id, source_type, source_id, title_ar, title_en,
            event_date, icon, color, event_category, primary_member_id, image_url
          ) VALUES (?, 'member_death', ?, ?, ?, ?, 'candle', '#6b7280', 'memorial', ?, ?)
          ON CONFLICT DO NOTHING
        `).bind(
          treeId,
          member.id,
          `وفاة ${nameAr}`,
          nameEn ? `Death of ${nameEn}` : null,
          member.death_date,
          member.id,
          member.photo_url || null
        ).run();
        eventsCreated++;
      }
    }

    // Get marriages
    const marriages = await db.prepare(`
      SELECT ms.*, m1.first_name_ar as m1_first_name, m1.last_name_ar as m1_last_name,
             m2.first_name_ar as m2_first_name, m2.last_name_ar as m2_last_name
      FROM member_spouses ms
      JOIN family_members m1 ON ms.member_id = m1.id
      JOIN family_members m2 ON ms.spouse_id = m2.id
      WHERE m1.tree_id = ? AND ms.marriage_date IS NOT NULL
    `).bind(treeId).all<Record<string, unknown>>();

    for (const marriage of marriages.results || []) {
      if (marriage.marriage_date) {
        const couple = `${marriage.m1_first_name} ${marriage.m1_last_name} و ${marriage.m2_first_name} ${marriage.m2_last_name}`;

        await db.prepare(`
          INSERT INTO timeline_events (
            tree_id, source_type, source_id, title_ar, title_en,
            event_date, icon, color, event_category, primary_member_id
          ) VALUES (?, 'member_marriage', ?, ?, ?, ?, 'heart', '#ec4899', 'marriage', ?)
          ON CONFLICT DO NOTHING
        `).bind(
          treeId,
          marriage.id,
          `زواج ${couple}`,
          'Marriage',
          marriage.marriage_date,
          marriage.member_id
        ).run();
        eventsCreated++;
      }
    }

    // Add published stories to timeline
    const stories = await db.prepare(`
      SELECT id, title_ar, title_en, event_date, cover_image_url
      FROM stories
      WHERE tree_id = ? AND status = 'published' AND event_date IS NOT NULL
    `).bind(treeId).all<Record<string, unknown>>();

    for (const story of stories.results || []) {
      await db.prepare(`
        INSERT INTO timeline_events (
          tree_id, source_type, source_id, title_ar, title_en,
          event_date, icon, color, event_category, image_url
        ) VALUES (?, 'story', ?, ?, ?, ?, 'book-open', '#8b5cf6', 'custom', ?)
        ON CONFLICT DO NOTHING
      `).bind(
        treeId,
        story.id,
        story.title_ar,
        story.title_en || null,
        story.event_date,
        story.cover_image_url || null
      ).run();
      eventsCreated++;
    }

    return { success: true, count: eventsCreated };
  } catch (error) {
    console.error('Error generating timeline:', error);
    return { success: false, count: 0, error: 'Failed to generate timeline' };
  }
}

/**
 * Delete a timeline event
 */
export async function deleteTimelineEvent(
  eventId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getSession();
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' };
    }

    const { env } = await getCloudflareContext();
    const db = env.DB;

    // Only allow deleting manual events
    const event = await db.prepare(`
      SELECT source_type FROM timeline_events WHERE id = ?
    `).bind(eventId).first<{ source_type: string }>();

    if (!event) {
      return { success: false, error: 'Event not found' };
    }

    if (event.source_type !== 'manual' && event.source_type !== 'milestone') {
      return { success: false, error: 'Cannot delete auto-generated events' };
    }

    await db.prepare('DELETE FROM timeline_events WHERE id = ?').bind(eventId).run();

    return { success: true };
  } catch (error) {
    console.error('Error deleting timeline event:', error);
    return { success: false, error: 'Failed to delete event' };
  }
}

/**
 * Toggle event visibility
 */
export async function toggleEventVisibility(
  eventId: string
): Promise<{ success: boolean; visible: boolean; error?: string }> {
  try {
    const session = await getSession();
    if (!session?.user) {
      return { success: false, visible: false, error: 'Unauthorized' };
    }

    const { env } = await getCloudflareContext();
    const db = env.DB;

    const event = await db.prepare(`
      SELECT is_visible FROM timeline_events WHERE id = ?
    `).bind(eventId).first<{ is_visible: number }>();

    if (!event) {
      return { success: false, visible: false, error: 'Event not found' };
    }

    const newVisibility = event.is_visible ? 0 : 1;

    await db.prepare(`
      UPDATE timeline_events SET is_visible = ?, updated_at = unixepoch() WHERE id = ?
    `).bind(newVisibility, eventId).run();

    return { success: true, visible: Boolean(newVisibility) };
  } catch (error) {
    console.error('Error toggling visibility:', error);
    return { success: false, visible: false, error: 'Failed to update visibility' };
  }
}

/**
 * Get timeline statistics
 */
export async function getTimelineStats(treeId: string): Promise<{
  totalEvents: number;
  births: number;
  deaths: number;
  marriages: number;
  stories: number;
  custom: number;
  oldestDate: string | null;
  newestDate: string | null;
}> {
  try {
    const { env } = await getCloudflareContext();
    const db = env.DB;

    const stats = await db.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN source_type = 'member_birth' THEN 1 ELSE 0 END) as births,
        SUM(CASE WHEN source_type = 'member_death' THEN 1 ELSE 0 END) as deaths,
        SUM(CASE WHEN source_type = 'member_marriage' THEN 1 ELSE 0 END) as marriages,
        SUM(CASE WHEN source_type = 'story' THEN 1 ELSE 0 END) as stories,
        SUM(CASE WHEN source_type IN ('manual', 'milestone') THEN 1 ELSE 0 END) as custom,
        MIN(event_date) as oldest,
        MAX(event_date) as newest
      FROM timeline_events
      WHERE tree_id = ? AND is_visible = 1
    `).bind(treeId).first<Record<string, unknown>>();

    return {
      totalEvents: (stats?.total as number) || 0,
      births: (stats?.births as number) || 0,
      deaths: (stats?.deaths as number) || 0,
      marriages: (stats?.marriages as number) || 0,
      stories: (stats?.stories as number) || 0,
      custom: (stats?.custom as number) || 0,
      oldestDate: (stats?.oldest as string) || null,
      newestDate: (stats?.newest as string) || null,
    };
  } catch (error) {
    console.error('Error getting timeline stats:', error);
    return {
      totalEvents: 0,
      births: 0,
      deaths: 0,
      marriages: 0,
      stories: 0,
      custom: 0,
      oldestDate: null,
      newestDate: null,
    };
  }
}
