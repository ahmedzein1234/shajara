'use server';

import { getCloudflareContext } from '@opennextjs/cloudflare';
import { getSession } from '@/lib/auth/actions';

// =====================================================
// TYPES
// =====================================================

export type NotificationType =
  | 'tree_invite' | 'invite_accepted' | 'member_joined'
  | 'person_added' | 'person_updated' | 'photo_added'
  | 'contribution_request' | 'contribution_received' | 'contribution_approved' | 'contribution_rejected'
  | 'memorial_reminder' | 'birthday_reminder'
  | 'mention' | 'message' | 'comment'
  | 'export_ready' | 'weekly_digest' | 'monthly_digest'
  | 'system';

export type TargetType = 'person' | 'tree' | 'contribution' | 'message' | 'comment';

export interface Notification {
  id: string;
  user_id: string;
  tree_id: string | null;
  notification_type: NotificationType;
  title_ar: string;
  title_en: string;
  body_ar: string | null;
  body_en: string | null;
  action_url: string | null;
  actor_id: string | null;
  actor_name: string | null;
  target_type: TargetType | null;
  target_id: string | null;
  metadata: Record<string, unknown> | null;
  is_read: boolean;
  read_at: number | null;
  is_pushed: boolean;
  pushed_at: number | null;
  is_emailed: boolean;
  emailed_at: number | null;
  created_at: number;
}

export interface NotificationPreferences {
  id: string;
  user_id: string;
  push_enabled: boolean;
  push_tree_updates: boolean;
  push_contributions: boolean;
  push_messages: boolean;
  push_mentions: boolean;
  push_memorials: boolean;
  email_enabled: boolean;
  email_tree_updates: boolean;
  email_contributions: boolean;
  email_messages: boolean;
  email_mentions: boolean;
  email_memorials: boolean;
  digest_frequency: 'daily' | 'weekly' | 'monthly' | 'never';
  digest_day: number;
  quiet_hours_enabled: boolean;
  quiet_hours_start: number;
  quiet_hours_end: number;
  timezone: string;
}

export interface PushSubscription {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh_key: string;
  auth_key: string;
  device_name: string | null;
  browser: string | null;
  platform: string | null;
  is_active: boolean;
  last_used_at: number | null;
  created_at: number;
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
// NOTIFICATIONS
// =====================================================

export async function createNotification(
  userId: string,
  data: {
    treeId?: string;
    type: NotificationType;
    titleAr: string;
    titleEn: string;
    bodyAr?: string;
    bodyEn?: string;
    actionUrl?: string;
    actorId?: string;
    actorName?: string;
    targetType?: TargetType;
    targetId?: string;
    metadata?: Record<string, unknown>;
  }
): Promise<{ success: boolean; notification?: Notification; error?: string }> {
  try {
    const db = await getDB();
    const now = Math.floor(Date.now() / 1000);
    const id = generateId('notif');

    await db.prepare(`
      INSERT INTO notifications (
        id, user_id, tree_id, notification_type,
        title_ar, title_en, body_ar, body_en,
        action_url, actor_id, actor_name,
        target_type, target_id, metadata, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      userId,
      data.treeId || null,
      data.type,
      data.titleAr,
      data.titleEn,
      data.bodyAr || null,
      data.bodyEn || null,
      data.actionUrl || null,
      data.actorId || null,
      data.actorName || null,
      data.targetType || null,
      data.targetId || null,
      data.metadata ? JSON.stringify(data.metadata) : null,
      now
    ).run();

    const notification = await getNotification(id);
    return { success: true, notification: notification || undefined };
  } catch (error) {
    console.error('Create notification error:', error);
    return { success: false, error: 'Failed to create notification' };
  }
}

export async function getNotification(notificationId: string): Promise<Notification | null> {
  try {
    const db = await getDB();
    const result = await db.prepare(
      'SELECT * FROM notifications WHERE id = ?'
    ).bind(notificationId).first();

    if (!result) return null;

    return {
      ...result,
      is_read: result.is_read === 1,
      is_pushed: result.is_pushed === 1,
      is_emailed: result.is_emailed === 1,
      metadata: result.metadata ? JSON.parse(result.metadata as string) : null,
    } as Notification;
  } catch (error) {
    console.error('Get notification error:', error);
    return null;
  }
}

export async function getUserNotifications(options?: {
  limit?: number;
  offset?: number;
  unreadOnly?: boolean;
  types?: NotificationType[];
}): Promise<Notification[]> {
  try {
    const session = await getSession();
    if (!session?.user) return [];

    const db = await getDB();
    let query = 'SELECT * FROM notifications WHERE user_id = ?';
    const params: (string | number)[] = [session.user.id];

    if (options?.unreadOnly) {
      query += ' AND is_read = 0';
    }

    if (options?.types?.length) {
      const placeholders = options.types.map(() => '?').join(',');
      query += ` AND notification_type IN (${placeholders})`;
      params.push(...options.types);
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
      is_read: r.is_read === 1,
      is_pushed: r.is_pushed === 1,
      is_emailed: r.is_emailed === 1,
      metadata: r.metadata ? JSON.parse(r.metadata as string) : null,
    })) as Notification[];
  } catch (error) {
    console.error('Get user notifications error:', error);
    return [];
  }
}

export async function getUnreadCount(): Promise<number> {
  try {
    const session = await getSession();
    if (!session?.user) return 0;

    const db = await getDB();
    const result = await db.prepare(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0'
    ).bind(session.user.id).first();

    return (result?.count as number) || 0;
  } catch (error) {
    console.error('Get unread count error:', error);
    return 0;
  }
}

export async function markAsRead(notificationIds: string | string[]): Promise<{ success: boolean }> {
  try {
    const session = await getSession();
    if (!session?.user) return { success: false };

    const db = await getDB();
    const now = Math.floor(Date.now() / 1000);
    const ids = Array.isArray(notificationIds) ? notificationIds : [notificationIds];

    const placeholders = ids.map(() => '?').join(',');
    await db.prepare(`
      UPDATE notifications SET is_read = 1, read_at = ?
      WHERE id IN (${placeholders}) AND user_id = ?
    `).bind(now, ...ids, session.user.id).run();

    return { success: true };
  } catch (error) {
    console.error('Mark as read error:', error);
    return { success: false };
  }
}

export async function markAllAsRead(): Promise<{ success: boolean }> {
  try {
    const session = await getSession();
    if (!session?.user) return { success: false };

    const db = await getDB();
    const now = Math.floor(Date.now() / 1000);

    await db.prepare(`
      UPDATE notifications SET is_read = 1, read_at = ?
      WHERE user_id = ? AND is_read = 0
    `).bind(now, session.user.id).run();

    return { success: true };
  } catch (error) {
    console.error('Mark all as read error:', error);
    return { success: false };
  }
}

export async function deleteNotification(notificationId: string): Promise<{ success: boolean }> {
  try {
    const session = await getSession();
    if (!session?.user) return { success: false };

    const db = await getDB();
    await db.prepare(
      'DELETE FROM notifications WHERE id = ? AND user_id = ?'
    ).bind(notificationId, session.user.id).run();

    return { success: true };
  } catch (error) {
    console.error('Delete notification error:', error);
    return { success: false };
  }
}

// =====================================================
// NOTIFICATION PREFERENCES
// =====================================================

export async function getNotificationPreferences(): Promise<NotificationPreferences | null> {
  try {
    const session = await getSession();
    if (!session?.user) return null;

    const db = await getDB();
    const result = await db.prepare(
      'SELECT * FROM notification_preferences WHERE user_id = ?'
    ).bind(session.user.id).first();

    if (!result) {
      // Return defaults if no preferences set
      return {
        id: '',
        user_id: session.user.id,
        push_enabled: true,
        push_tree_updates: true,
        push_contributions: true,
        push_messages: true,
        push_mentions: true,
        push_memorials: true,
        email_enabled: true,
        email_tree_updates: true,
        email_contributions: true,
        email_messages: false,
        email_mentions: true,
        email_memorials: true,
        digest_frequency: 'weekly',
        digest_day: 0,
        quiet_hours_enabled: false,
        quiet_hours_start: 22,
        quiet_hours_end: 8,
        timezone: 'Asia/Riyadh',
      };
    }

    return {
      ...result,
      push_enabled: result.push_enabled === 1,
      push_tree_updates: result.push_tree_updates === 1,
      push_contributions: result.push_contributions === 1,
      push_messages: result.push_messages === 1,
      push_mentions: result.push_mentions === 1,
      push_memorials: result.push_memorials === 1,
      email_enabled: result.email_enabled === 1,
      email_tree_updates: result.email_tree_updates === 1,
      email_contributions: result.email_contributions === 1,
      email_messages: result.email_messages === 1,
      email_mentions: result.email_mentions === 1,
      email_memorials: result.email_memorials === 1,
      quiet_hours_enabled: result.quiet_hours_enabled === 1,
    } as NotificationPreferences;
  } catch (error) {
    console.error('Get notification preferences error:', error);
    return null;
  }
}

export async function updateNotificationPreferences(
  updates: Partial<Omit<NotificationPreferences, 'id' | 'user_id'>>
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getSession();
    if (!session?.user) {
      return { success: false, error: 'Not authenticated' };
    }

    const db = await getDB();
    const now = Math.floor(Date.now() / 1000);

    // Check if preferences exist
    const existing = await db.prepare(
      'SELECT id FROM notification_preferences WHERE user_id = ?'
    ).bind(session.user.id).first();

    if (existing) {
      // Update existing
      const fields: string[] = [];
      const values: (string | number | null)[] = [];

      const boolFields = [
        'push_enabled', 'push_tree_updates', 'push_contributions', 'push_messages',
        'push_mentions', 'push_memorials', 'email_enabled', 'email_tree_updates',
        'email_contributions', 'email_messages', 'email_mentions', 'email_memorials',
        'quiet_hours_enabled'
      ];

      for (const field of boolFields) {
        if ((updates as Record<string, unknown>)[field] !== undefined) {
          fields.push(`${field} = ?`);
          values.push((updates as Record<string, unknown>)[field] ? 1 : 0);
        }
      }

      if (updates.digest_frequency !== undefined) {
        fields.push('digest_frequency = ?');
        values.push(updates.digest_frequency);
      }
      if (updates.digest_day !== undefined) {
        fields.push('digest_day = ?');
        values.push(updates.digest_day);
      }
      if (updates.quiet_hours_start !== undefined) {
        fields.push('quiet_hours_start = ?');
        values.push(updates.quiet_hours_start);
      }
      if (updates.quiet_hours_end !== undefined) {
        fields.push('quiet_hours_end = ?');
        values.push(updates.quiet_hours_end);
      }
      if (updates.timezone !== undefined) {
        fields.push('timezone = ?');
        values.push(updates.timezone);
      }

      if (fields.length > 0) {
        fields.push('updated_at = ?');
        values.push(now);
        values.push(session.user.id);

        await db.prepare(`
          UPDATE notification_preferences SET ${fields.join(', ')} WHERE user_id = ?
        `).bind(...values).run();
      }
    } else {
      // Create new
      const id = generateId('pref');
      await db.prepare(`
        INSERT INTO notification_preferences (
          id, user_id, push_enabled, push_tree_updates, push_contributions,
          push_messages, push_mentions, push_memorials, email_enabled,
          email_tree_updates, email_contributions, email_messages,
          email_mentions, email_memorials, digest_frequency, digest_day,
          quiet_hours_enabled, quiet_hours_start, quiet_hours_end, timezone,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        id,
        session.user.id,
        updates.push_enabled !== false ? 1 : 0,
        updates.push_tree_updates !== false ? 1 : 0,
        updates.push_contributions !== false ? 1 : 0,
        updates.push_messages !== false ? 1 : 0,
        updates.push_mentions !== false ? 1 : 0,
        updates.push_memorials !== false ? 1 : 0,
        updates.email_enabled !== false ? 1 : 0,
        updates.email_tree_updates !== false ? 1 : 0,
        updates.email_contributions !== false ? 1 : 0,
        updates.email_messages ? 1 : 0,
        updates.email_mentions !== false ? 1 : 0,
        updates.email_memorials !== false ? 1 : 0,
        updates.digest_frequency || 'weekly',
        updates.digest_day || 0,
        updates.quiet_hours_enabled ? 1 : 0,
        updates.quiet_hours_start || 22,
        updates.quiet_hours_end || 8,
        updates.timezone || 'Asia/Riyadh',
        now,
        now
      ).run();
    }

    return { success: true };
  } catch (error) {
    console.error('Update notification preferences error:', error);
    return { success: false, error: 'Failed to update preferences' };
  }
}

// =====================================================
// PUSH SUBSCRIPTIONS
// =====================================================

export async function savePushSubscription(
  subscription: {
    endpoint: string;
    keys: { p256dh: string; auth: string };
  },
  deviceInfo?: { deviceName?: string; browser?: string; platform?: string }
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getSession();
    if (!session?.user) {
      return { success: false, error: 'Not authenticated' };
    }

    const db = await getDB();
    const now = Math.floor(Date.now() / 1000);
    const id = generateId('push');

    // Check if subscription already exists
    const existing = await db.prepare(
      'SELECT id FROM push_subscriptions WHERE user_id = ? AND endpoint = ?'
    ).bind(session.user.id, subscription.endpoint).first();

    if (existing) {
      // Update existing
      await db.prepare(`
        UPDATE push_subscriptions SET
          p256dh_key = ?, auth_key = ?, is_active = 1, last_used_at = ?
        WHERE id = ?
      `).bind(
        subscription.keys.p256dh,
        subscription.keys.auth,
        now,
        existing.id
      ).run();
    } else {
      // Create new
      await db.prepare(`
        INSERT INTO push_subscriptions (
          id, user_id, endpoint, p256dh_key, auth_key,
          device_name, browser, platform, is_active, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
      `).bind(
        id,
        session.user.id,
        subscription.endpoint,
        subscription.keys.p256dh,
        subscription.keys.auth,
        deviceInfo?.deviceName || null,
        deviceInfo?.browser || null,
        deviceInfo?.platform || null,
        now
      ).run();
    }

    return { success: true };
  } catch (error) {
    console.error('Save push subscription error:', error);
    return { success: false, error: 'Failed to save subscription' };
  }
}

export async function removePushSubscription(endpoint: string): Promise<{ success: boolean }> {
  try {
    const session = await getSession();
    if (!session?.user) return { success: false };

    const db = await getDB();
    await db.prepare(
      'DELETE FROM push_subscriptions WHERE user_id = ? AND endpoint = ?'
    ).bind(session.user.id, endpoint).run();

    return { success: true };
  } catch (error) {
    console.error('Remove push subscription error:', error);
    return { success: false };
  }
}

export async function getUserPushSubscriptions(userId: string): Promise<PushSubscription[]> {
  try {
    const db = await getDB();
    const results = await db.prepare(
      'SELECT * FROM push_subscriptions WHERE user_id = ? AND is_active = 1'
    ).bind(userId).all();

    return (results.results || []).map((r: Record<string, unknown>) => ({
      ...r,
      is_active: r.is_active === 1,
    })) as PushSubscription[];
  } catch (error) {
    console.error('Get user push subscriptions error:', error);
    return [];
  }
}

// =====================================================
// BATCH NOTIFICATIONS
// =====================================================

export async function notifyTreeMembers(
  treeId: string,
  data: {
    type: NotificationType;
    titleAr: string;
    titleEn: string;
    bodyAr?: string;
    bodyEn?: string;
    actionUrl?: string;
    actorId?: string;
    actorName?: string;
    targetType?: TargetType;
    targetId?: string;
    excludeUserIds?: string[];
  }
): Promise<{ success: boolean; count: number }> {
  try {
    const db = await getDB();

    // Get all tree members (owner + collaborators)
    const owner = await db.prepare(
      'SELECT owner_id FROM trees WHERE id = ?'
    ).bind(treeId).first();

    const collaborators = await db.prepare(
      'SELECT user_id FROM tree_collaborators WHERE tree_id = ?'
    ).bind(treeId).all();

    const memberIds = new Set<string>();
    if (owner?.owner_id) memberIds.add(owner.owner_id as string);
    for (const c of (collaborators.results || [])) {
      memberIds.add((c as Record<string, unknown>).user_id as string);
    }

    // Remove excluded users
    if (data.excludeUserIds) {
      for (const id of data.excludeUserIds) {
        memberIds.delete(id);
      }
    }

    // Create notifications for all members
    let count = 0;
    for (const userId of memberIds) {
      const result = await createNotification(userId, {
        treeId,
        type: data.type,
        titleAr: data.titleAr,
        titleEn: data.titleEn,
        bodyAr: data.bodyAr,
        bodyEn: data.bodyEn,
        actionUrl: data.actionUrl,
        actorId: data.actorId,
        actorName: data.actorName,
        targetType: data.targetType,
        targetId: data.targetId,
      });
      if (result.success) count++;
    }

    return { success: true, count };
  } catch (error) {
    console.error('Notify tree members error:', error);
    return { success: false, count: 0 };
  }
}
