'use server';

import { getCloudflareContext } from '@opennextjs/cloudflare';
import { getSession } from '@/lib/auth/actions';
import { createNotification, notifyTreeMembers } from './notification-actions';

// =====================================================
// TYPES
// =====================================================

export type MessageType = 'text' | 'image' | 'file' | 'system';
export type RoomType = 'tree' | 'direct' | 'group';

export interface ChatRoom {
  id: string;
  tree_id: string;
  room_type: RoomType;
  name_ar: string | null;
  name_en: string | null;
  is_active: boolean;
  created_at: number;
  // Computed fields
  unread_count?: number;
  last_message?: ChatMessage;
  member_count?: number;
}

export interface ChatMessage {
  id: string;
  room_id: string;
  sender_id: string;
  message_type: MessageType;
  content: string;
  reply_to_id: string | null;
  mentions: string[] | null;
  media_url: string | null;
  media_type: string | null;
  is_edited: boolean;
  edited_at: number | null;
  is_deleted: boolean;
  deleted_at: number | null;
  created_at: number;
  // Joined fields
  sender_name?: string;
  sender_avatar?: string;
  reply_to?: ChatMessage;
}

export interface Comment {
  id: string;
  tree_id: string;
  target_type: 'person' | 'photo' | 'story' | 'contribution';
  target_id: string;
  author_id: string;
  content: string;
  reply_to_id: string | null;
  mentions: string[] | null;
  is_edited: boolean;
  edited_at: number | null;
  is_deleted: boolean;
  deleted_at: number | null;
  created_at: number;
  // Joined fields
  author_name?: string;
  author_avatar?: string;
  reply_count?: number;
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

function extractMentions(content: string): string[] {
  const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
  const mentions: string[] = [];
  let match;
  while ((match = mentionRegex.exec(content)) !== null) {
    mentions.push(match[2]); // User ID
  }
  return mentions;
}

// =====================================================
// CHAT ROOMS
// =====================================================

export async function getOrCreateTreeChatRoom(treeId: string): Promise<ChatRoom | null> {
  try {
    const db = await getDB();

    // Check if room exists
    let room = await db.prepare(
      'SELECT * FROM chat_rooms WHERE tree_id = ? AND room_type = ?'
    ).bind(treeId, 'tree').first();

    if (!room) {
      // Create new room
      const id = generateId('room');
      const now = Math.floor(Date.now() / 1000);

      await db.prepare(`
        INSERT INTO chat_rooms (id, tree_id, room_type, is_active, created_at)
        VALUES (?, ?, 'tree', 1, ?)
      `).bind(id, treeId, now).run();

      room = await db.prepare('SELECT * FROM chat_rooms WHERE id = ?').bind(id).first();
    }

    if (!room) return null;

    return {
      ...room,
      is_active: room.is_active === 1,
    } as ChatRoom;
  } catch (error) {
    console.error('Get or create tree chat room error:', error);
    return null;
  }
}

export async function getUserChatRooms(): Promise<ChatRoom[]> {
  try {
    const session = await getSession();
    if (!session?.user) return [];

    const db = await getDB();

    // Get rooms from trees user has access to
    const results = await db.prepare(`
      SELECT cr.*,
        (SELECT COUNT(*) FROM chat_messages cm
         WHERE cm.room_id = cr.id
         AND cm.created_at > COALESCE(
           (SELECT last_read_at FROM message_read_status
            WHERE room_id = cr.id AND user_id = ?), 0
         )) as unread_count
      FROM chat_rooms cr
      WHERE cr.tree_id IN (
        SELECT id FROM trees WHERE owner_id = ?
        UNION
        SELECT tree_id FROM tree_collaborators WHERE user_id = ?
      )
      AND cr.is_active = 1
      ORDER BY cr.created_at DESC
    `).bind(session.user.id, session.user.id, session.user.id).all();

    return (results.results || []).map((r: Record<string, unknown>) => ({
      ...r,
      is_active: r.is_active === 1,
    })) as ChatRoom[];
  } catch (error) {
    console.error('Get user chat rooms error:', error);
    return [];
  }
}

// =====================================================
// CHAT MESSAGES
// =====================================================

export async function sendMessage(
  roomId: string,
  content: string,
  options?: {
    messageType?: MessageType;
    replyToId?: string;
    mediaUrl?: string;
    mediaType?: string;
  }
): Promise<{ success: boolean; message?: ChatMessage; error?: string }> {
  try {
    const session = await getSession();
    if (!session?.user) {
      return { success: false, error: 'Not authenticated' };
    }

    const db = await getDB();
    const now = Math.floor(Date.now() / 1000);
    const id = generateId('msg');

    // Extract mentions from content
    const mentions = extractMentions(content);

    await db.prepare(`
      INSERT INTO chat_messages (
        id, room_id, sender_id, message_type, content,
        reply_to_id, mentions, media_url, media_type, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      roomId,
      session.user.id,
      options?.messageType || 'text',
      content,
      options?.replyToId || null,
      mentions.length > 0 ? JSON.stringify(mentions) : null,
      options?.mediaUrl || null,
      options?.mediaType || null,
      now
    ).run();

    // Update sender's read status
    await updateReadStatus(roomId, id);

    // Get the room to notify members
    const room = await db.prepare(
      'SELECT * FROM chat_rooms WHERE id = ?'
    ).bind(roomId).first();

    // Notify mentioned users
    if (mentions.length > 0 && room) {
      for (const mentionedUserId of mentions) {
        if (mentionedUserId !== session.user.id) {
          await createNotification(mentionedUserId, {
            treeId: room.tree_id as string,
            type: 'mention',
            titleAr: `${session.user.name} أشار إليك`,
            titleEn: `${session.user.name} mentioned you`,
            bodyAr: content.substring(0, 100),
            bodyEn: content.substring(0, 100),
            actionUrl: `/tree/${room.tree_id}/chat`,
            actorId: session.user.id,
            actorName: session.user.name,
            targetType: 'message',
            targetId: id,
          });
        }
      }
    }

    // Notify other room members about new message
    if (room) {
      await notifyTreeMembers(room.tree_id as string, {
        type: 'message',
        titleAr: `رسالة جديدة من ${session.user.name}`,
        titleEn: `New message from ${session.user.name}`,
        bodyAr: content.substring(0, 100),
        bodyEn: content.substring(0, 100),
        actionUrl: `/tree/${room.tree_id}/chat`,
        actorId: session.user.id,
        actorName: session.user.name,
        targetType: 'message',
        targetId: id,
        excludeUserIds: [session.user.id],
      });
    }

    const message = await getMessage(id);
    return { success: true, message: message || undefined };
  } catch (error) {
    console.error('Send message error:', error);
    return { success: false, error: 'Failed to send message' };
  }
}

export async function getMessage(messageId: string): Promise<ChatMessage | null> {
  try {
    const db = await getDB();
    const result = await db.prepare(`
      SELECT cm.*, u.name as sender_name
      FROM chat_messages cm
      LEFT JOIN users u ON cm.sender_id = u.id
      WHERE cm.id = ?
    `).bind(messageId).first();

    if (!result) return null;

    return {
      ...result,
      is_edited: result.is_edited === 1,
      is_deleted: result.is_deleted === 1,
      mentions: result.mentions ? JSON.parse(result.mentions as string) : null,
    } as ChatMessage;
  } catch (error) {
    console.error('Get message error:', error);
    return null;
  }
}

export async function getRoomMessages(
  roomId: string,
  options?: { limit?: number; before?: string; after?: string }
): Promise<ChatMessage[]> {
  try {
    const session = await getSession();
    if (!session?.user) return [];

    const db = await getDB();
    let query = `
      SELECT cm.*, u.name as sender_name
      FROM chat_messages cm
      LEFT JOIN users u ON cm.sender_id = u.id
      WHERE cm.room_id = ?
    `;
    const params: (string | number)[] = [roomId];

    if (options?.before) {
      const beforeMsg = await db.prepare(
        'SELECT created_at FROM chat_messages WHERE id = ?'
      ).bind(options.before).first();
      if (beforeMsg) {
        query += ' AND cm.created_at < ?';
        params.push(beforeMsg.created_at as number);
      }
    }

    if (options?.after) {
      const afterMsg = await db.prepare(
        'SELECT created_at FROM chat_messages WHERE id = ?'
      ).bind(options.after).first();
      if (afterMsg) {
        query += ' AND cm.created_at > ?';
        params.push(afterMsg.created_at as number);
      }
    }

    query += ' ORDER BY cm.created_at DESC';

    if (options?.limit) {
      query += ' LIMIT ?';
      params.push(options.limit);
    }

    const results = await db.prepare(query).bind(...params).all();

    return (results.results || []).map((r: Record<string, unknown>) => ({
      ...r,
      is_edited: r.is_edited === 1,
      is_deleted: r.is_deleted === 1,
      mentions: r.mentions ? JSON.parse(r.mentions as string) : null,
    })).reverse() as ChatMessage[];
  } catch (error) {
    console.error('Get room messages error:', error);
    return [];
  }
}

export async function editMessage(
  messageId: string,
  newContent: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getSession();
    if (!session?.user) {
      return { success: false, error: 'Not authenticated' };
    }

    const db = await getDB();
    const now = Math.floor(Date.now() / 1000);

    // Verify ownership
    const message = await db.prepare(
      'SELECT sender_id FROM chat_messages WHERE id = ?'
    ).bind(messageId).first();

    if (!message || message.sender_id !== session.user.id) {
      return { success: false, error: 'Cannot edit this message' };
    }

    const mentions = extractMentions(newContent);

    await db.prepare(`
      UPDATE chat_messages
      SET content = ?, mentions = ?, is_edited = 1, edited_at = ?
      WHERE id = ?
    `).bind(
      newContent,
      mentions.length > 0 ? JSON.stringify(mentions) : null,
      now,
      messageId
    ).run();

    return { success: true };
  } catch (error) {
    console.error('Edit message error:', error);
    return { success: false, error: 'Failed to edit message' };
  }
}

export async function deleteMessage(messageId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getSession();
    if (!session?.user) {
      return { success: false, error: 'Not authenticated' };
    }

    const db = await getDB();
    const now = Math.floor(Date.now() / 1000);

    // Verify ownership
    const message = await db.prepare(
      'SELECT sender_id FROM chat_messages WHERE id = ?'
    ).bind(messageId).first();

    if (!message || message.sender_id !== session.user.id) {
      return { success: false, error: 'Cannot delete this message' };
    }

    await db.prepare(`
      UPDATE chat_messages
      SET content = '[deleted]', is_deleted = 1, deleted_at = ?
      WHERE id = ?
    `).bind(now, messageId).run();

    return { success: true };
  } catch (error) {
    console.error('Delete message error:', error);
    return { success: false, error: 'Failed to delete message' };
  }
}

// =====================================================
// READ STATUS
// =====================================================

export async function updateReadStatus(roomId: string, messageId?: string): Promise<{ success: boolean }> {
  try {
    const session = await getSession();
    if (!session?.user) return { success: false };

    const db = await getDB();
    const now = Math.floor(Date.now() / 1000);

    // Get latest message ID if not provided
    let lastMessageId = messageId;
    if (!lastMessageId) {
      const latest = await db.prepare(
        'SELECT id FROM chat_messages WHERE room_id = ? ORDER BY created_at DESC LIMIT 1'
      ).bind(roomId).first();
      lastMessageId = latest?.id as string;
    }

    // Upsert read status
    const existing = await db.prepare(
      'SELECT id FROM message_read_status WHERE room_id = ? AND user_id = ?'
    ).bind(roomId, session.user.id).first();

    if (existing) {
      await db.prepare(`
        UPDATE message_read_status
        SET last_read_message_id = ?, last_read_at = ?
        WHERE id = ?
      `).bind(lastMessageId, now, existing.id).run();
    } else {
      const id = generateId('read');
      await db.prepare(`
        INSERT INTO message_read_status (id, room_id, user_id, last_read_message_id, last_read_at)
        VALUES (?, ?, ?, ?, ?)
      `).bind(id, roomId, session.user.id, lastMessageId, now).run();
    }

    return { success: true };
  } catch (error) {
    console.error('Update read status error:', error);
    return { success: false };
  }
}

// =====================================================
// COMMENTS
// =====================================================

export async function addComment(
  treeId: string,
  targetType: 'person' | 'photo' | 'story' | 'contribution',
  targetId: string,
  content: string,
  replyToId?: string
): Promise<{ success: boolean; comment?: Comment; error?: string }> {
  try {
    const session = await getSession();
    if (!session?.user) {
      return { success: false, error: 'Not authenticated' };
    }

    const db = await getDB();
    const now = Math.floor(Date.now() / 1000);
    const id = generateId('comment');

    const mentions = extractMentions(content);

    await db.prepare(`
      INSERT INTO comments (
        id, tree_id, target_type, target_id, author_id,
        content, reply_to_id, mentions, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      treeId,
      targetType,
      targetId,
      session.user.id,
      content,
      replyToId || null,
      mentions.length > 0 ? JSON.stringify(mentions) : null,
      now
    ).run();

    // Notify mentioned users
    if (mentions.length > 0) {
      for (const mentionedUserId of mentions) {
        if (mentionedUserId !== session.user.id) {
          await createNotification(mentionedUserId, {
            treeId,
            type: 'mention',
            titleAr: `${session.user.name} أشار إليك في تعليق`,
            titleEn: `${session.user.name} mentioned you in a comment`,
            bodyAr: content.substring(0, 100),
            bodyEn: content.substring(0, 100),
            actionUrl: `/${targetType}/${targetId}`,
            actorId: session.user.id,
            actorName: session.user.name,
            targetType: 'comment',
            targetId: id,
          });
        }
      }
    }

    // Notify tree members about the comment
    await notifyTreeMembers(treeId, {
      type: 'comment',
      titleAr: `تعليق جديد من ${session.user.name}`,
      titleEn: `New comment from ${session.user.name}`,
      bodyAr: content.substring(0, 100),
      bodyEn: content.substring(0, 100),
      actionUrl: `/${targetType}/${targetId}`,
      actorId: session.user.id,
      actorName: session.user.name,
      targetType: 'comment',
      targetId: id,
      excludeUserIds: [session.user.id, ...mentions],
    });

    const comment = await getComment(id);
    return { success: true, comment: comment || undefined };
  } catch (error) {
    console.error('Add comment error:', error);
    return { success: false, error: 'Failed to add comment' };
  }
}

export async function getComment(commentId: string): Promise<Comment | null> {
  try {
    const db = await getDB();
    const result = await db.prepare(`
      SELECT c.*, u.name as author_name,
        (SELECT COUNT(*) FROM comments WHERE reply_to_id = c.id) as reply_count
      FROM comments c
      LEFT JOIN users u ON c.author_id = u.id
      WHERE c.id = ?
    `).bind(commentId).first();

    if (!result) return null;

    return {
      ...result,
      is_edited: result.is_edited === 1,
      is_deleted: result.is_deleted === 1,
      mentions: result.mentions ? JSON.parse(result.mentions as string) : null,
    } as Comment;
  } catch (error) {
    console.error('Get comment error:', error);
    return null;
  }
}

export async function getComments(
  targetType: 'person' | 'photo' | 'story' | 'contribution',
  targetId: string,
  options?: { limit?: number; offset?: number }
): Promise<Comment[]> {
  try {
    const db = await getDB();
    let query = `
      SELECT c.*, u.name as author_name,
        (SELECT COUNT(*) FROM comments WHERE reply_to_id = c.id) as reply_count
      FROM comments c
      LEFT JOIN users u ON c.author_id = u.id
      WHERE c.target_type = ? AND c.target_id = ? AND c.reply_to_id IS NULL
      ORDER BY c.created_at DESC
    `;
    const params: (string | number)[] = [targetType, targetId];

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
      is_edited: r.is_edited === 1,
      is_deleted: r.is_deleted === 1,
      mentions: r.mentions ? JSON.parse(r.mentions as string) : null,
    })) as Comment[];
  } catch (error) {
    console.error('Get comments error:', error);
    return [];
  }
}

export async function getCommentReplies(commentId: string): Promise<Comment[]> {
  try {
    const db = await getDB();
    const results = await db.prepare(`
      SELECT c.*, u.name as author_name
      FROM comments c
      LEFT JOIN users u ON c.author_id = u.id
      WHERE c.reply_to_id = ?
      ORDER BY c.created_at ASC
    `).bind(commentId).all();

    return (results.results || []).map((r: Record<string, unknown>) => ({
      ...r,
      is_edited: r.is_edited === 1,
      is_deleted: r.is_deleted === 1,
      mentions: r.mentions ? JSON.parse(r.mentions as string) : null,
    })) as Comment[];
  } catch (error) {
    console.error('Get comment replies error:', error);
    return [];
  }
}

export async function deleteComment(commentId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getSession();
    if (!session?.user) {
      return { success: false, error: 'Not authenticated' };
    }

    const db = await getDB();
    const now = Math.floor(Date.now() / 1000);

    // Verify ownership
    const comment = await db.prepare(
      'SELECT author_id FROM comments WHERE id = ?'
    ).bind(commentId).first();

    if (!comment || comment.author_id !== session.user.id) {
      return { success: false, error: 'Cannot delete this comment' };
    }

    await db.prepare(`
      UPDATE comments
      SET content = '[deleted]', is_deleted = 1, deleted_at = ?
      WHERE id = ?
    `).bind(now, commentId).run();

    return { success: true };
  } catch (error) {
    console.error('Delete comment error:', error);
    return { success: false, error: 'Failed to delete comment' };
  }
}

// =====================================================
// SEARCH USERS FOR MENTIONS
// =====================================================

export async function searchUsersForMention(
  treeId: string,
  query: string
): Promise<Array<{ id: string; name: string }>> {
  try {
    const db = await getDB();
    const searchTerm = `%${query}%`;

    const results = await db.prepare(`
      SELECT DISTINCT u.id, u.name
      FROM users u
      WHERE u.id IN (
        SELECT owner_id FROM trees WHERE id = ?
        UNION
        SELECT user_id FROM tree_collaborators WHERE tree_id = ?
      )
      AND u.name LIKE ?
      LIMIT 10
    `).bind(treeId, treeId, searchTerm).all();

    return (results.results || []) as Array<{ id: string; name: string }>;
  } catch (error) {
    console.error('Search users for mention error:', error);
    return [];
  }
}
