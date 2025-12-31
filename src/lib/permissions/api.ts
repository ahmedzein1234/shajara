/**
 * Permission API Helpers
 *
 * Functions for checking permissions in API routes and server components
 */

import { D1Database } from '@cloudflare/workers-types';
import {
  TreeRole,
  TreePermissions,
  getPermissions,
  hasPermission,
  ROLE_PERMISSIONS,
} from './index';

interface CollaboratorOverrides {
  can_add_persons: number | null;
  can_edit_persons: number | null;
  can_delete_persons: number | null;
  can_add_relationships: number | null;
  can_invite_others: number | null;
  can_export: number | null;
  can_manage_settings: number | null;
}

interface CollaboratorRow extends CollaboratorOverrides {
  role: TreeRole;
}

/**
 * Get user's role and permissions for a specific tree
 */
export async function getUserTreePermissions(
  db: D1Database,
  userId: string,
  treeId: string
): Promise<{ role: TreeRole | null; permissions: TreePermissions | null }> {
  // Check if user is the tree owner (via trees table)
  const tree = await db
    .prepare('SELECT user_id FROM trees WHERE id = ?')
    .bind(treeId)
    .first<{ user_id: string }>();

  if (tree?.user_id === userId) {
    return { role: 'owner', permissions: ROLE_PERMISSIONS.owner };
  }

  // Check tree_collaborators table
  const collaborator = await db
    .prepare(`
      SELECT role, can_add_persons, can_edit_persons, can_delete_persons,
             can_add_relationships, can_invite_others, can_export, can_manage_settings
      FROM tree_collaborators
      WHERE tree_id = ? AND user_id = ?
    `)
    .bind(treeId, userId)
    .first<CollaboratorRow>();

  if (!collaborator) {
    // Check if tree is public
    const isPublic = await db
      .prepare('SELECT is_public FROM trees WHERE id = ?')
      .bind(treeId)
      .first<{ is_public: number }>();

    if (isPublic?.is_public === 1) {
      return { role: 'guest', permissions: ROLE_PERMISSIONS.guest };
    }

    return { role: null, permissions: null };
  }

  // Build overrides from collaborator-specific permissions
  const overrides: Partial<TreePermissions> = {};
  if (collaborator.can_add_persons !== null) {
    overrides.canAddPerson = collaborator.can_add_persons === 1;
    overrides.canAddRelationship = collaborator.can_add_persons === 1;
    overrides.canAddEvent = collaborator.can_add_persons === 1;
  }
  if (collaborator.can_edit_persons !== null) {
    overrides.canEditPerson = collaborator.can_edit_persons === 1;
    overrides.canEditRelationship = collaborator.can_edit_persons === 1;
    overrides.canEditEvent = collaborator.can_edit_persons === 1;
  }
  if (collaborator.can_delete_persons !== null) {
    overrides.canDeletePerson = collaborator.can_delete_persons === 1;
    overrides.canDeleteRelationship = collaborator.can_delete_persons === 1;
    overrides.canDeleteEvent = collaborator.can_delete_persons === 1;
  }
  if (collaborator.can_invite_others !== null) {
    overrides.canInviteMembers = collaborator.can_invite_others === 1;
  }
  if (collaborator.can_export !== null) {
    overrides.canExportTree = collaborator.can_export === 1;
  }
  if (collaborator.can_manage_settings !== null) {
    overrides.canManageSettings = collaborator.can_manage_settings === 1;
  }

  const permissions = getPermissions(collaborator.role, overrides);

  return { role: collaborator.role, permissions };
}

/**
 * Check if user has a specific permission on a tree
 */
export async function checkTreePermission(
  db: D1Database,
  userId: string,
  treeId: string,
  permission: keyof TreePermissions
): Promise<boolean> {
  const { permissions } = await getUserTreePermissions(db, userId, treeId);
  if (!permissions) return false;
  return permissions[permission];
}

/**
 * Require a specific permission, throw error if not authorized
 */
export async function requireTreePermission(
  db: D1Database,
  userId: string,
  treeId: string,
  permission: keyof TreePermissions
): Promise<TreePermissions> {
  const { role, permissions } = await getUserTreePermissions(db, userId, treeId);

  if (!permissions) {
    throw new PermissionError('You do not have access to this tree');
  }

  if (!permissions[permission]) {
    throw new PermissionError(`You do not have permission to ${permissionToAction(permission)}`);
  }

  return permissions;
}

/**
 * Get all collaborators for a tree with their roles
 */
export async function getTreeCollaborators(
  db: D1Database,
  treeId: string
): Promise<Array<{
  userId: string;
  name: string;
  email: string;
  avatar?: string;
  role: TreeRole;
  invitedAt: number;
  acceptedAt?: number;
}>> {
  const result = await db
    .prepare(`
      SELECT
        tc.user_id,
        tc.role,
        tc.invited_at,
        tc.accepted_at,
        u.name,
        u.email,
        u.avatar_url
      FROM tree_collaborators tc
      JOIN users u ON tc.user_id = u.id
      WHERE tc.tree_id = ?
      ORDER BY
        CASE tc.role
          WHEN 'owner' THEN 1
          WHEN 'manager' THEN 2
          WHEN 'member' THEN 3
          WHEN 'guest' THEN 4
        END
    `)
    .bind(treeId)
    .all<{
      user_id: string;
      role: TreeRole;
      invited_at: number;
      accepted_at: number | null;
      name: string;
      email: string;
      avatar_url: string | null;
    }>();

  return (result.results || []).map((row) => ({
    userId: row.user_id,
    name: row.name,
    email: row.email,
    avatar: row.avatar_url || undefined,
    role: row.role,
    invitedAt: row.invited_at,
    acceptedAt: row.accepted_at || undefined,
  }));
}

/**
 * Update a collaborator's role
 */
export async function updateCollaboratorRole(
  db: D1Database,
  treeId: string,
  targetUserId: string,
  newRole: TreeRole,
  actorUserId: string
): Promise<void> {
  // Get actor's permissions
  const { role: actorRole, permissions: actorPermissions } = await getUserTreePermissions(
    db,
    actorUserId,
    treeId
  );

  if (!actorPermissions?.canPromoteMembers && actorRole !== 'owner') {
    throw new PermissionError('You do not have permission to change roles');
  }

  // Get target's current role
  const target = await db
    .prepare('SELECT role FROM tree_collaborators WHERE tree_id = ? AND user_id = ?')
    .bind(treeId, targetUserId)
    .first<{ role: TreeRole }>();

  if (!target) {
    throw new PermissionError('User is not a collaborator on this tree');
  }

  // Check if actor can manage the target's current and new role
  const roleRanks: Record<TreeRole, number> = { guest: 0, member: 1, manager: 2, owner: 3 };
  const actorRank = roleRanks[actorRole || 'guest'];
  const targetCurrentRank = roleRanks[target.role];
  const newRank = roleRanks[newRole];

  // Can't promote to or demote from a role equal or higher than your own
  if (targetCurrentRank >= actorRank || newRank >= actorRank) {
    throw new PermissionError('You cannot change roles at or above your level');
  }

  // Update the role
  await db
    .prepare('UPDATE tree_collaborators SET role = ? WHERE tree_id = ? AND user_id = ?')
    .bind(newRole, treeId, targetUserId)
    .run();
}

/**
 * Remove a collaborator from a tree
 */
export async function removeCollaborator(
  db: D1Database,
  treeId: string,
  targetUserId: string,
  actorUserId: string
): Promise<void> {
  const { role: actorRole, permissions: actorPermissions } = await getUserTreePermissions(
    db,
    actorUserId,
    treeId
  );

  if (!actorPermissions?.canRemoveMembers) {
    throw new PermissionError('You do not have permission to remove members');
  }

  // Get target's current role
  const target = await db
    .prepare('SELECT role FROM tree_collaborators WHERE tree_id = ? AND user_id = ?')
    .bind(treeId, targetUserId)
    .first<{ role: TreeRole }>();

  if (!target) {
    throw new PermissionError('User is not a collaborator on this tree');
  }

  // Check if actor can remove this role
  const roleRanks: Record<TreeRole, number> = { guest: 0, member: 1, manager: 2, owner: 3 };
  const actorRank = roleRanks[actorRole || 'guest'];
  const targetRank = roleRanks[target.role];

  if (targetRank >= actorRank) {
    throw new PermissionError('You cannot remove members at or above your level');
  }

  await db
    .prepare('DELETE FROM tree_collaborators WHERE tree_id = ? AND user_id = ?')
    .bind(treeId, targetUserId)
    .run();
}

/**
 * Custom error class for permission errors
 */
export class PermissionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PermissionError';
  }
}

/**
 * Convert permission key to human-readable action
 */
function permissionToAction(permission: keyof TreePermissions): string {
  const actions: Record<keyof TreePermissions, string> = {
    canAddPerson: 'add family members',
    canEditPerson: 'edit family members',
    canDeletePerson: 'delete family members',
    canAddRelationship: 'add relationships',
    canEditRelationship: 'edit relationships',
    canDeleteRelationship: 'delete relationships',
    canAddEvent: 'add events',
    canEditEvent: 'edit events',
    canDeleteEvent: 'delete events',
    canUploadMedia: 'upload media',
    canDeleteMedia: 'delete media',
    canManageSettings: 'manage settings',
    canInviteMembers: 'invite members',
    canRemoveMembers: 'remove members',
    canPromoteMembers: 'change member roles',
    canExportTree: 'export the tree',
    canDeleteTree: 'delete the tree',
    canApproveProposals: 'approve proposals',
    canViewAuditLog: 'view audit log',
    canManageFamilyCouncil: 'manage family council',
  };
  return actions[permission] || permission;
}
