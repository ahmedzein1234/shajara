'use server';

import { getCloudflareContext } from '@opennextjs/cloudflare';
import { getSession } from '@/lib/auth/actions';

// =====================================================
// TYPES
// =====================================================

export type ActivityType =
  | 'person_added' | 'person_updated' | 'person_deleted'
  | 'photo_added' | 'photo_updated'
  | 'relationship_added' | 'relationship_updated'
  | 'tree_updated' | 'tree_shared'
  | 'member_joined' | 'member_left'
  | 'contribution_received' | 'contribution_approved'
  | 'milestone_reached' | 'memorial_date'
  | 'verification_requested' | 'verification_completed'
  | 'export_requested' | 'comment_added';

export type TargetType = 'person' | 'relationship' | 'tree' | 'user' | 'contribution';
export type VisibleTo = 'all' | 'admins' | 'editors' | 'owner';

export interface ActivityFeedItem {
  id: string;
  tree_id: string;
  activity_type: ActivityType;
  actor_id: string | null;
  actor_name: string | null;
  target_type: TargetType | null;
  target_id: string | null;
  target_name: string | null;
  target_name_ar: string | null;
  details: string | null;
  is_public: boolean;
  visible_to: VisibleTo;
  created_at: number;
}

export interface MemorialReminder {
  id: string;
  tree_id: string;
  person_id: string;
  user_id: string;
  reminder_type: 'death_anniversary' | 'birth_anniversary' | 'custom';
  custom_date: string | null;
  custom_title_ar: string | null;
  custom_title_en: string | null;
  notify_days_before: number;
  notify_via_email: boolean;
  notify_via_push: boolean;
  is_active: boolean;
  last_notified_at: number | null;
  created_at: number;
  // Joined fields
  person_name_ar?: string;
  person_name_en?: string;
  person_birth_date?: string;
  person_death_date?: string;
}

// =====================================================
// HELPERS
// =====================================================

async function getDB() {
  const { env } = await getCloudflareContext();
  return env.DB;
}

function generateId(prefix: string): string {
  return prefix + '-' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

// =====================================================
// ACTIVITY FEED
// =====================================================

export async function logActivity(
  treeId: string,
  activityType: ActivityType,
  data: {
    actorId?: string;
    actorName?: string;
    targetType?: TargetType;
    targetId?: string;
    targetName?: string;
    targetNameAr?: string;
    details?: Record<string, unknown>;
    isPublic?: boolean;
    visibleTo?: VisibleTo;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const db = await getDB();
    const now = Math.floor(Date.now() / 1000);
    const id = generateId('act');

    await db.prepare(`
      INSERT INTO activity_feed (
        id, tree_id, activity_type, actor_id, actor_name,
        target_type, target_id, target_name, target_name_ar,
        details, is_public, visible_to, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      treeId,
      activityType,
      data.actorId || null,
      data.actorName || null,
      data.targetType || null,
      data.targetId || null,
      data.targetName || null,
      data.targetNameAr || null,
      data.details ? JSON.stringify(data.details) : null,
      data.isPublic ? 1 : 0,
      data.visibleTo || 'all',
      now
    ).run();

    return { success: true };
  } catch (error) {
    console.error('Log activity error:', error);
    return { success: false, error: 'Failed to log activity' };
  }
}

export async function getActivityFeed(
  treeId: string,
  options?: {
    limit?: number;
    offset?: number;
    activityTypes?: ActivityType[];
    visibleTo?: VisibleTo;
  }
): Promise<ActivityFeedItem[]> {
  try {
    const db = await getDB();
    let query = 'SELECT * FROM activity_feed WHERE tree_id = ?';
    const params: (string | number)[] = [treeId];

    if (options?.activityTypes?.length) {
      const placeholders = options.activityTypes.map(() => '?').join(',');
      query += ` AND activity_type IN (${placeholders})`;
      params.push(...options.activityTypes);
    }

    if (options?.visibleTo) {
      query += ' AND (visible_to = ? OR visible_to = \'all\')';
      params.push(options.visibleTo);
    }

    query += ' ORDER BY created_at DESC';

    if (options?.limit) {
      query += ' LIMIT ?';
      params.push(options.limit);
      if (options?.offset) {
        query += ' OFFSET ?';
        params.push(options.offset);
      }
    }

    const results = await db.prepare(query).bind(...params).all();

    return (results.results || []).map((r: Record<string, unknown>) => ({
      ...r,
      is_public: r.is_public === 1,
      details: r.details ? JSON.parse(r.details as string) : null,
    })) as ActivityFeedItem[];
  } catch (error) {
    console.error('Get activity feed error:', error);
    return [];
  }
}

export async function getRecentActivity(
  treeId: string,
  limit: number = 10
): Promise<ActivityFeedItem[]> {
  return getActivityFeed(treeId, { limit });
}

// =====================================================
// MEMORIAL REMINDERS
// =====================================================

export async function createMemorialReminder(
  treeId: string,
  personId: string,
  data: {
    reminderType: 'death_anniversary' | 'birth_anniversary' | 'custom';
    customDate?: string;
    customTitleAr?: string;
    customTitleEn?: string;
    notifyDaysBefore?: number;
    notifyViaEmail?: boolean;
    notifyViaPush?: boolean;
  }
): Promise<{ success: boolean; reminder?: MemorialReminder; error?: string }> {
  try {
    const session = await getSession();
    if (!session?.user) {
      return { success: false, error: 'Not authenticated' };
    }

    const db = await getDB();
    const now = Math.floor(Date.now() / 1000);
    const id = generateId('memorial');

    // Check if reminder already exists
    const existing = await db.prepare(`
      SELECT id FROM memorial_reminders
      WHERE tree_id = ? AND person_id = ? AND user_id = ? AND reminder_type = ?
    `).bind(treeId, personId, session.user.id, data.reminderType).first();

    if (existing) {
      return { success: false, error: 'Reminder already exists for this person' };
    }

    await db.prepare(`
      INSERT INTO memorial_reminders (
        id, tree_id, person_id, user_id, reminder_type,
        custom_date, custom_title_ar, custom_title_en,
        notify_days_before, notify_via_email, notify_via_push,
        is_active, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
    `).bind(
      id,
      treeId,
      personId,
      session.user.id,
      data.reminderType,
      data.customDate || null,
      data.customTitleAr || null,
      data.customTitleEn || null,
      data.notifyDaysBefore ?? 1,
      data.notifyViaEmail !== false ? 1 : 0,
      data.notifyViaPush !== false ? 1 : 0,
      now
    ).run();

    const reminder = await getMemorialReminder(id);
    return { success: true, reminder: reminder || undefined };
  } catch (error) {
    console.error('Create memorial reminder error:', error);
    return { success: false, error: 'Failed to create reminder' };
  }
}

export async function getMemorialReminder(reminderId: string): Promise<MemorialReminder | null> {
  try {
    const db = await getDB();
    const result = await db.prepare(`
      SELECT mr.*, p.name_ar as person_name_ar, p.name_en as person_name_en,
             p.birth_date as person_birth_date, p.death_date as person_death_date
      FROM memorial_reminders mr
      LEFT JOIN persons p ON mr.person_id = p.id
      WHERE mr.id = ?
    `).bind(reminderId).first();

    if (!result) return null;

    return {
      ...result,
      notify_via_email: result.notify_via_email === 1,
      notify_via_push: result.notify_via_push === 1,
      is_active: result.is_active === 1,
    } as MemorialReminder;
  } catch (error) {
    console.error('Get memorial reminder error:', error);
    return null;
  }
}

export async function getUserMemorialReminders(treeId?: string): Promise<MemorialReminder[]> {
  try {
    const session = await getSession();
    if (!session?.user) {
      return [];
    }

    const db = await getDB();
    let query = `
      SELECT mr.*, p.name_ar as person_name_ar, p.name_en as person_name_en,
             p.birth_date as person_birth_date, p.death_date as person_death_date
      FROM memorial_reminders mr
      LEFT JOIN persons p ON mr.person_id = p.id
      WHERE mr.user_id = ?
    `;
    const params: string[] = [session.user.id];

    if (treeId) {
      query += ' AND mr.tree_id = ?';
      params.push(treeId);
    }

    query += ' ORDER BY mr.created_at DESC';

    const results = await db.prepare(query).bind(...params).all();

    return (results.results || []).map((r: Record<string, unknown>) => ({
      ...r,
      notify_via_email: r.notify_via_email === 1,
      notify_via_push: r.notify_via_push === 1,
      is_active: r.is_active === 1,
    })) as MemorialReminder[];
  } catch (error) {
    console.error('Get user memorial reminders error:', error);
    return [];
  }
}

export async function updateMemorialReminder(
  reminderId: string,
  data: {
    notifyDaysBefore?: number;
    notifyViaEmail?: boolean;
    notifyViaPush?: boolean;
    isActive?: boolean;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getSession();
    if (!session?.user) {
      return { success: false, error: 'Not authenticated' };
    }

    const db = await getDB();
    const updates: string[] = [];
    const values: (string | number)[] = [];

    if (data.notifyDaysBefore !== undefined) {
      updates.push('notify_days_before = ?');
      values.push(data.notifyDaysBefore);
    }
    if (data.notifyViaEmail !== undefined) {
      updates.push('notify_via_email = ?');
      values.push(data.notifyViaEmail ? 1 : 0);
    }
    if (data.notifyViaPush !== undefined) {
      updates.push('notify_via_push = ?');
      values.push(data.notifyViaPush ? 1 : 0);
    }
    if (data.isActive !== undefined) {
      updates.push('is_active = ?');
      values.push(data.isActive ? 1 : 0);
    }

    if (updates.length === 0) {
      return { success: true };
    }

    values.push(reminderId);
    values.push(session.user.id);

    await db.prepare(`
      UPDATE memorial_reminders SET ${updates.join(', ')}
      WHERE id = ? AND user_id = ?
    `).bind(...values).run();

    return { success: true };
  } catch (error) {
    console.error('Update memorial reminder error:', error);
    return { success: false, error: 'Failed to update reminder' };
  }
}

export async function deleteMemorialReminder(reminderId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getSession();
    if (!session?.user) {
      return { success: false, error: 'Not authenticated' };
    }

    const db = await getDB();
    await db.prepare(
      'DELETE FROM memorial_reminders WHERE id = ? AND user_id = ?'
    ).bind(reminderId, session.user.id).run();

    return { success: true };
  } catch (error) {
    console.error('Delete memorial reminder error:', error);
    return { success: false, error: 'Failed to delete reminder' };
  }
}

// =====================================================
// UPCOMING MEMORIALS
// =====================================================

export async function getUpcomingMemorials(
  treeId: string,
  daysAhead: number = 30
): Promise<Array<{
  type: 'birth' | 'death';
  person_id: string;
  person_name_ar: string;
  person_name_en: string;
  date: string;
  days_until: number;
}>> {
  try {
    const db = await getDB();
    const today = new Date();
    const results: Array<{
      type: 'birth' | 'death';
      person_id: string;
      person_name_ar: string;
      person_name_en: string;
      date: string;
      days_until: number;
    }> = [];

    // Get persons with birth and death dates
    const persons = await db.prepare(`
      SELECT id, name_ar, name_en, birth_date, death_date
      FROM persons
      WHERE tree_id = ? AND (birth_date IS NOT NULL OR death_date IS NOT NULL)
    `).bind(treeId).all();

    for (const person of (persons.results || []) as Record<string, unknown>[]) {
      // Check birth anniversary
      if (person.birth_date) {
        const birthDate = new Date(person.birth_date as string);
        const thisYearBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());

        // If already passed this year, check next year
        if (thisYearBirthday < today) {
          thisYearBirthday.setFullYear(thisYearBirthday.getFullYear() + 1);
        }

        const daysUntil = Math.ceil((thisYearBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        if (daysUntil <= daysAhead) {
          results.push({
            type: 'birth',
            person_id: person.id as string,
            person_name_ar: person.name_ar as string,
            person_name_en: person.name_en as string,
            date: person.birth_date as string,
            days_until: daysUntil,
          });
        }
      }

      // Check death anniversary (only for deceased)
      if (person.death_date) {
        const deathDate = new Date(person.death_date as string);
        const thisYearAnniversary = new Date(today.getFullYear(), deathDate.getMonth(), deathDate.getDate());

        if (thisYearAnniversary < today) {
          thisYearAnniversary.setFullYear(thisYearAnniversary.getFullYear() + 1);
        }

        const daysUntil = Math.ceil((thisYearAnniversary.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        if (daysUntil <= daysAhead) {
          results.push({
            type: 'death',
            person_id: person.id as string,
            person_name_ar: person.name_ar as string,
            person_name_en: person.name_en as string,
            date: person.death_date as string,
            days_until: daysUntil,
          });
        }
      }
    }

    // Sort by days until
    return results.sort((a, b) => a.days_until - b.days_until);
  } catch (error) {
    console.error('Get upcoming memorials error:', error);
    return [];
  }
}
