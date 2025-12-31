'use server';

import { getCloudflareContext } from '@opennextjs/cloudflare';
import { getSession } from '@/lib/auth/actions';

import type { TreeRole } from '@/lib/permissions';

// Role types now unified with permission system: guest, member, manager, owner
export type InvitationRole = Exclude<TreeRole, 'owner'>; // Can't invite as owner

export interface TreeInvitation {
  id: string;
  tree_id: string;
  inviter_id: string;
  invitee_email: string | null;
  invitee_phone: string | null;
  invite_code: string;
  role: InvitationRole;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  message: string | null;
  expires_at: number;
  accepted_at: number | null;
  accepted_by: string | null;
  created_at: number;
  updated_at: number;
  // Joined fields
  tree_name_ar?: string;
  tree_name_en?: string;
  inviter_name?: string;
}

export interface TreeCollaborator {
  id: string;
  tree_id: string;
  user_id: string;
  role: TreeRole;
  invited_by: string | null;
  joined_at: number;
  last_accessed_at: number | null;
  // Joined fields
  user_name?: string;
  user_email?: string;
}

function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function generateId(): string {
  return 'inv-' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

export async function createInvitation(input: {
  treeId: string;
  email?: string;
  phone?: string;
  role: InvitationRole;
  message?: string;
  expiresInDays?: number;
}): Promise<{ success: boolean; invitation?: TreeInvitation; error?: string }> {
  try {
    const session = await getSession();
    if (!session?.user) {
      return { success: false, error: 'Not authenticated' };
    }

    const { env } = await getCloudflareContext();
    const db = env.DB;

    // Verify user owns or can manage this tree
    const tree = await db.prepare(`
      SELECT ft.* FROM family_trees ft
      LEFT JOIN tree_collaborators tc ON ft.id = tc.tree_id AND tc.user_id = ?
      WHERE ft.id = ? AND (ft.owner_id = ? OR tc.role = 'manager')
    `).bind(session.user.id, input.treeId, session.user.id).first();

    if (!tree) {
      return { success: false, error: 'Tree not found or no permission' };
    }

    // Check if invitation already exists for this email/phone
    if (input.email) {
      const existing = await db.prepare(`
        SELECT * FROM tree_invitations
        WHERE tree_id = ? AND invitee_email = ? AND status = 'pending'
      `).bind(input.treeId, input.email).first();

      if (existing) {
        return { success: false, error: 'Invitation already sent to this email' };
      }
    }

    const id = generateId();
    const inviteCode = generateInviteCode();
    const expiresAt = Math.floor(Date.now() / 1000) + (input.expiresInDays || 7) * 24 * 60 * 60;

    await db.prepare(`
      INSERT INTO tree_invitations (id, tree_id, inviter_id, invitee_email, invitee_phone, invite_code, role, message, expires_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      input.treeId,
      session.user.id,
      input.email || null,
      input.phone || null,
      inviteCode,
      input.role,
      input.message || null,
      expiresAt
    ).run();

    // Log activity
    await db.prepare(`
      INSERT INTO invitation_activity (id, invitation_id, action, actor_id)
      VALUES (?, ?, 'created', ?)
    `).bind(generateId(), id, session.user.id).run();

    const invitation = await db.prepare(`
      SELECT * FROM tree_invitations WHERE id = ?
    `).bind(id).first<TreeInvitation>();

    return { success: true, invitation: invitation || undefined };
  } catch (error) {
    console.error('Create invitation error:', error);
    return { success: false, error: 'Failed to create invitation' };
  }
}

export async function getInvitationByCode(code: string): Promise<TreeInvitation | null> {
  try {
    const { env } = await getCloudflareContext();
    const db = env.DB;

    const invitation = await db.prepare(`
      SELECT
        ti.*,
        ft.name_ar as tree_name_ar,
        ft.name_en as tree_name_en,
        u.name as inviter_name
      FROM tree_invitations ti
      JOIN family_trees ft ON ti.tree_id = ft.id
      JOIN users u ON ti.inviter_id = u.id
      WHERE ti.invite_code = ?
    `).bind(code).first<TreeInvitation>();

    return invitation || null;
  } catch (error) {
    console.error('Get invitation error:', error);
    return null;
  }
}

export async function acceptInvitation(code: string): Promise<{ success: boolean; treeId?: string; error?: string }> {
  try {
    const session = await getSession();
    if (!session?.user) {
      return { success: false, error: 'Not authenticated' };
    }

    const { env } = await getCloudflareContext();
    const db = env.DB;

    const invitation = await db.prepare(`
      SELECT * FROM tree_invitations WHERE invite_code = ? AND status = 'pending'
    `).bind(code).first<TreeInvitation>();

    if (!invitation) {
      return { success: false, error: 'Invitation not found or already used' };
    }

    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    if (invitation.expires_at < now) {
      await db.prepare(`
        UPDATE tree_invitations SET status = 'expired', updated_at = ? WHERE id = ?
      `).bind(now, invitation.id).run();
      return { success: false, error: 'Invitation has expired' };
    }

    // Check if user already has access
    const existing = await db.prepare(`
      SELECT * FROM tree_collaborators WHERE tree_id = ? AND user_id = ?
    `).bind(invitation.tree_id, session.user.id).first();

    if (existing) {
      return { success: false, error: 'You already have access to this tree' };
    }

    // Add as collaborator
    const collabId = 'collab-' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    await db.prepare(`
      INSERT INTO tree_collaborators (id, tree_id, user_id, role, invited_by, joined_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(collabId, invitation.tree_id, session.user.id, invitation.role, invitation.inviter_id, now).run();

    // Update invitation status
    await db.prepare(`
      UPDATE tree_invitations SET status = 'accepted', accepted_at = ?, accepted_by = ?, updated_at = ? WHERE id = ?
    `).bind(now, session.user.id, now, invitation.id).run();

    // Log activity
    await db.prepare(`
      INSERT INTO invitation_activity (id, invitation_id, action, actor_id)
      VALUES (?, ?, 'accepted', ?)
    `).bind(generateId(), invitation.id, session.user.id).run();

    return { success: true, treeId: invitation.tree_id };
  } catch (error) {
    console.error('Accept invitation error:', error);
    return { success: false, error: 'Failed to accept invitation' };
  }
}

export async function declineInvitation(code: string): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getSession();
    if (!session?.user) {
      return { success: false, error: 'Not authenticated' };
    }

    const { env } = await getCloudflareContext();
    const db = env.DB;

    const invitation = await db.prepare(`
      SELECT * FROM tree_invitations WHERE invite_code = ? AND status = 'pending'
    `).bind(code).first<TreeInvitation>();

    if (!invitation) {
      return { success: false, error: 'Invitation not found' };
    }

    const now = Math.floor(Date.now() / 1000);
    await db.prepare(`
      UPDATE tree_invitations SET status = 'declined', updated_at = ? WHERE id = ?
    `).bind(now, invitation.id).run();

    await db.prepare(`
      INSERT INTO invitation_activity (id, invitation_id, action, actor_id)
      VALUES (?, ?, 'declined', ?)
    `).bind(generateId(), invitation.id, session.user.id).run();

    return { success: true };
  } catch (error) {
    console.error('Decline invitation error:', error);
    return { success: false, error: 'Failed to decline invitation' };
  }
}

export async function getTreeInvitations(treeId: string): Promise<TreeInvitation[]> {
  try {
    const session = await getSession();
    if (!session?.user) return [];

    const { env } = await getCloudflareContext();
    const db = env.DB;

    // Verify access - managers and members can view invitations
    const hasAccess = await db.prepare(`
      SELECT 1 FROM family_trees ft
      LEFT JOIN tree_collaborators tc ON ft.id = tc.tree_id AND tc.user_id = ?
      WHERE ft.id = ? AND (ft.owner_id = ? OR tc.role IN ('manager', 'member'))
    `).bind(session.user.id, treeId, session.user.id).first();

    if (!hasAccess) return [];

    const result = await db.prepare(`
      SELECT ti.*, u.name as inviter_name
      FROM tree_invitations ti
      JOIN users u ON ti.inviter_id = u.id
      WHERE ti.tree_id = ?
      ORDER BY ti.created_at DESC
    `).bind(treeId).all<TreeInvitation>();

    return result.results || [];
  } catch (error) {
    console.error('Get invitations error:', error);
    return [];
  }
}

export async function getTreeCollaborators(treeId: string): Promise<TreeCollaborator[]> {
  try {
    const session = await getSession();
    if (!session?.user) return [];

    const { env } = await getCloudflareContext();
    const db = env.DB;

    const result = await db.prepare(`
      SELECT tc.*, u.name as user_name, u.email as user_email
      FROM tree_collaborators tc
      JOIN users u ON tc.user_id = u.id
      WHERE tc.tree_id = ?
      ORDER BY tc.joined_at DESC
    `).bind(treeId).all<TreeCollaborator>();

    return result.results || [];
  } catch (error) {
    console.error('Get collaborators error:', error);
    return [];
  }
}

export async function removeCollaborator(treeId: string, userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getSession();
    if (!session?.user) {
      return { success: false, error: 'Not authenticated' };
    }

    const { env } = await getCloudflareContext();
    const db = env.DB;

    // Verify ownership or admin
    const tree = await db.prepare(`
      SELECT * FROM family_trees WHERE id = ? AND owner_id = ?
    `).bind(treeId, session.user.id).first();

    if (!tree) {
      const isManager = await db.prepare(`
        SELECT * FROM tree_collaborators WHERE tree_id = ? AND user_id = ? AND role = 'manager'
      `).bind(treeId, session.user.id).first();

      if (!isManager) {
        return { success: false, error: 'No permission to remove collaborators' };
      }
    }

    await db.prepare(`
      DELETE FROM tree_collaborators WHERE tree_id = ? AND user_id = ?
    `).bind(treeId, userId).run();

    return { success: true };
  } catch (error) {
    console.error('Remove collaborator error:', error);
    return { success: false, error: 'Failed to remove collaborator' };
  }
}

export async function cancelInvitation(invitationId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getSession();
    if (!session?.user) {
      return { success: false, error: 'Not authenticated' };
    }

    const { env } = await getCloudflareContext();
    const db = env.DB;

    const invitation = await db.prepare(`
      SELECT ti.* FROM tree_invitations ti
      JOIN family_trees ft ON ti.tree_id = ft.id
      WHERE ti.id = ? AND (ti.inviter_id = ? OR ft.owner_id = ?)
    `).bind(invitationId, session.user.id, session.user.id).first<TreeInvitation>();

    if (!invitation) {
      return { success: false, error: 'Invitation not found or no permission' };
    }

    const now = Math.floor(Date.now() / 1000);
    await db.prepare(`
      DELETE FROM tree_invitations WHERE id = ?
    `).bind(invitationId).run();

    return { success: true };
  } catch (error) {
    console.error('Cancel invitation error:', error);
    return { success: false, error: 'Failed to cancel invitation' };
  }
}

export async function getMyInvitations(): Promise<TreeInvitation[]> {
  try {
    const session = await getSession();
    if (!session?.user?.email) return [];

    const { env } = await getCloudflareContext();
    const db = env.DB;

    const result = await db.prepare(`
      SELECT
        ti.*,
        ft.name_ar as tree_name_ar,
        ft.name_en as tree_name_en,
        u.name as inviter_name
      FROM tree_invitations ti
      JOIN family_trees ft ON ti.tree_id = ft.id
      JOIN users u ON ti.inviter_id = u.id
      WHERE ti.invitee_email = ? AND ti.status = 'pending'
      ORDER BY ti.created_at DESC
    `).bind(session.user.email).all<TreeInvitation>();

    return result.results || [];
  } catch (error) {
    console.error('Get my invitations error:', error);
    return [];
  }
}

export async function getInviteLink(inviteCode: string): Promise<string> {
  // Returns the full invitation link
  return `/invite/${inviteCode}`;
}

export interface TreeWithAccess {
  id: string;
  name_ar: string;
  name_en: string;
  owner_id: string;
  owner_name: string;
  isOwner: boolean;
  userRole: string;
}

export async function getTreeWithAccess(treeId: string): Promise<TreeWithAccess | null> {
  try {
    const session = await getSession();
    if (!session?.user) return null;

    const { env } = await getCloudflareContext();
    const db = env.DB;

    const tree = await db.prepare(`
      SELECT ft.*, u.name as owner_name
      FROM family_trees ft
      JOIN users u ON ft.owner_id = u.id
      WHERE ft.id = ?
    `).bind(treeId).first();

    if (!tree) return null;

    // Check if user has access
    const isOwner = tree.owner_id === session.user.id;
    const collaborator = await db.prepare(`
      SELECT * FROM tree_collaborators WHERE tree_id = ? AND user_id = ?
    `).bind(treeId, session.user.id).first();

    if (!isOwner && !collaborator) return null;

    return {
      id: tree.id as string,
      name_ar: tree.name_ar as string,
      name_en: tree.name_en as string,
      owner_id: tree.owner_id as string,
      owner_name: tree.owner_name as string,
      isOwner,
      userRole: isOwner ? 'owner' : (collaborator as { role: string })?.role || 'viewer',
    };
  } catch (error) {
    console.error('Get tree with access error:', error);
    return null;
  }
}
