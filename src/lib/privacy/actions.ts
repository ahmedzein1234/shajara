'use server';

/**
 * Privacy System Server Actions
 * Implements tiered visibility, connection requests, and access control
 */

import { getCloudflareContext } from '@opennextjs/cloudflare';
import type { D1Database } from '@cloudflare/workers-types';
import { getSession } from '@/lib/auth/actions';

async function getDB() {
  const { env } = await getCloudflareContext();
  return env.DB;
}

// =====================================================
// TYPES
// =====================================================

export type VisibilityLevel = 'private' | 'family' | 'extended' | 'public';
export type AccessLevel = 'viewer' | 'family' | 'trusted' | 'editor' | 'admin';
export type ConnectionStatus = 'pending' | 'approved' | 'rejected' | 'blocked';

export interface TreePrivacySettings {
  id: string;
  tree_id: string;
  default_visibility: VisibilityLevel;
  show_living_members_to_public: boolean;
  show_photos_to_public: boolean;
  show_dates_to_public: boolean;
  show_locations_to_public: boolean;
  allow_discovery: boolean;
  require_approval_for_connections: boolean;
  living_members_visibility: VisibilityLevel;
  deceased_members_visibility: VisibilityLevel;
  created_at: number;
  updated_at: number;
}

export interface MemberPrivacySettings {
  id: string;
  person_id: string;
  tree_id: string;
  visibility_level: VisibilityLevel | null;
  show_birth_date: boolean | null;
  show_birth_place: boolean | null;
  show_death_date: boolean | null;
  show_death_place: boolean | null;
  show_photo: boolean | null;
  show_notes: boolean | null;
  controlled_by_user_id: string | null;
  created_at: number;
  updated_at: number;
}

export interface ConnectionRequest {
  id: string;
  requester_user_id: string;
  tree_id: string;
  claimed_relationship: string | null;
  claimed_person_id: string | null;
  message: string | null;
  status: ConnectionStatus;
  reviewed_by_user_id: string | null;
  reviewed_at: number | null;
  review_notes: string | null;
  granted_access_level: AccessLevel | null;
  created_at: number;
  updated_at: number;
  // Joined fields
  requester_name?: string;
  requester_email?: string;
}

export interface FamilyConnection {
  id: string;
  user_id: string;
  tree_id: string;
  linked_person_id: string | null;
  relationship_type: string | null;
  access_level: AccessLevel;
  is_verified: boolean;
  verified_by_user_id: string | null;
  verified_at: number | null;
  invited_by_user_id: string | null;
  connection_request_id: string | null;
  created_at: number;
  updated_at: number;
  // Joined fields
  user_name?: string;
  user_email?: string;
  linked_person_name?: string;
}

// =====================================================
// TREE PRIVACY SETTINGS
// =====================================================

export async function getTreePrivacySettings(treeId: string): Promise<TreePrivacySettings | null> {
  const db = await getDB();
  const result = await db.prepare(`
    SELECT * FROM tree_privacy_settings WHERE tree_id = ?
  `).bind(treeId).first();

  if (!result) return null;

  return {
    ...result,
    show_living_members_to_public: Boolean(result.show_living_members_to_public),
    show_photos_to_public: Boolean(result.show_photos_to_public),
    show_dates_to_public: Boolean(result.show_dates_to_public),
    show_locations_to_public: Boolean(result.show_locations_to_public),
    allow_discovery: Boolean(result.allow_discovery),
    require_approval_for_connections: Boolean(result.require_approval_for_connections),
  } as TreePrivacySettings;
}

export async function updateTreePrivacySettings(
  treeId: string,
  settings: Partial<Omit<TreePrivacySettings, 'id' | 'tree_id' | 'created_at' | 'updated_at'>>
): Promise<TreePrivacySettings | null> {
  const session = await getSession();
  if (!session?.user) throw new Error('Not authenticated');

  const db = await getDB();
  const now = Math.floor(Date.now() / 1000);

  // Check if user is admin/owner
  const hasAccess = await checkTreeAdminAccess(treeId, session.user.id);
  if (!hasAccess) throw new Error('Not authorized to modify tree settings');

  const updates: string[] = [];
  const values: (string | number | null)[] = [];

  if (settings.default_visibility !== undefined) {
    updates.push('default_visibility = ?');
    values.push(settings.default_visibility);
  }
  if (settings.show_living_members_to_public !== undefined) {
    updates.push('show_living_members_to_public = ?');
    values.push(settings.show_living_members_to_public ? 1 : 0);
  }
  if (settings.show_photos_to_public !== undefined) {
    updates.push('show_photos_to_public = ?');
    values.push(settings.show_photos_to_public ? 1 : 0);
  }
  if (settings.show_dates_to_public !== undefined) {
    updates.push('show_dates_to_public = ?');
    values.push(settings.show_dates_to_public ? 1 : 0);
  }
  if (settings.show_locations_to_public !== undefined) {
    updates.push('show_locations_to_public = ?');
    values.push(settings.show_locations_to_public ? 1 : 0);
  }
  if (settings.allow_discovery !== undefined) {
    updates.push('allow_discovery = ?');
    values.push(settings.allow_discovery ? 1 : 0);
  }
  if (settings.require_approval_for_connections !== undefined) {
    updates.push('require_approval_for_connections = ?');
    values.push(settings.require_approval_for_connections ? 1 : 0);
  }
  if (settings.living_members_visibility !== undefined) {
    updates.push('living_members_visibility = ?');
    values.push(settings.living_members_visibility);
  }
  if (settings.deceased_members_visibility !== undefined) {
    updates.push('deceased_members_visibility = ?');
    values.push(settings.deceased_members_visibility);
  }

  if (updates.length === 0) {
    return getTreePrivacySettings(treeId);
  }

  updates.push('updated_at = ?');
  values.push(now);
  values.push(treeId);

  await db.prepare(`
    UPDATE tree_privacy_settings SET ${updates.join(', ')} WHERE tree_id = ?
  `).bind(...values).run();

  // Log the action
  await logPrivacyAction(db, treeId, session.user.id, 'privacy_change', 'tree', treeId, {
    changes: settings,
  });

  return getTreePrivacySettings(treeId);
}

// =====================================================
// CONNECTION REQUESTS
// =====================================================

export async function createConnectionRequest(input: {
  treeId: string;
  claimedRelationship?: string;
  claimedPersonId?: string;
  message?: string;
}): Promise<ConnectionRequest> {
  const session = await getSession();
  if (!session?.user) throw new Error('Not authenticated');

  const db = await getDB();
  const id = crypto.randomUUID();
  const now = Math.floor(Date.now() / 1000);

  // Check if already connected or has pending request
  const existing = await db.prepare(`
    SELECT id FROM connection_requests
    WHERE requester_user_id = ? AND tree_id = ? AND status != 'rejected'
  `).bind(session.user.id, input.treeId).first();

  if (existing) {
    throw new Error('Connection request already exists');
  }

  const alreadyConnected = await db.prepare(`
    SELECT id FROM family_connections WHERE user_id = ? AND tree_id = ?
  `).bind(session.user.id, input.treeId).first();

  if (alreadyConnected) {
    throw new Error('Already connected to this tree');
  }

  // Check if blocked
  const isBlocked = await db.prepare(`
    SELECT id FROM blocked_users WHERE tree_id = ? AND blocked_user_id = ?
  `).bind(input.treeId, session.user.id).first();

  if (isBlocked) {
    throw new Error('Unable to request connection');
  }

  await db.prepare(`
    INSERT INTO connection_requests (
      id, requester_user_id, tree_id, claimed_relationship,
      claimed_person_id, message, status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?)
  `).bind(
    id,
    session.user.id,
    input.treeId,
    input.claimedRelationship || null,
    input.claimedPersonId || null,
    input.message || null,
    now,
    now
  ).run();

  // Log the action
  await logPrivacyAction(db, input.treeId, session.user.id, 'access_request', 'connection', id, {
    claimed_relationship: input.claimedRelationship,
    message: input.message,
  });

  return {
    id,
    requester_user_id: session.user.id,
    tree_id: input.treeId,
    claimed_relationship: input.claimedRelationship || null,
    claimed_person_id: input.claimedPersonId || null,
    message: input.message || null,
    status: 'pending',
    reviewed_by_user_id: null,
    reviewed_at: null,
    review_notes: null,
    granted_access_level: null,
    created_at: now,
    updated_at: now,
  };
}

export async function getConnectionRequests(treeId: string): Promise<ConnectionRequest[]> {
  const session = await getSession();
  if (!session?.user) throw new Error('Not authenticated');

  const db = await getDB();

  // Check if user has admin access to tree
  const hasAccess = await checkTreeAdminAccess(treeId, session.user.id);
  if (!hasAccess) throw new Error('Not authorized');

  const results = await db.prepare(`
    SELECT
      cr.*,
      u.name as requester_name,
      u.email as requester_email
    FROM connection_requests cr
    LEFT JOIN users u ON cr.requester_user_id = u.id
    WHERE cr.tree_id = ?
    ORDER BY
      CASE cr.status
        WHEN 'pending' THEN 0
        ELSE 1
      END,
      cr.created_at DESC
  `).bind(treeId).all();

  return results.results as unknown as ConnectionRequest[];
}

export async function getPendingConnectionsCount(treeId: string): Promise<number> {
  const session = await getSession();
  if (!session?.user) return 0;

  const db = await getDB();

  // Check if user has admin access
  const hasAccess = await checkTreeAdminAccess(treeId, session.user.id);
  if (!hasAccess) return 0;

  const result = await db.prepare(`
    SELECT COUNT(*) as count FROM connection_requests
    WHERE tree_id = ? AND status = 'pending'
  `).bind(treeId).first<{ count: number }>();

  return result?.count || 0;
}

export async function reviewConnectionRequest(
  requestId: string,
  decision: 'approved' | 'rejected' | 'blocked',
  accessLevel?: AccessLevel,
  notes?: string
): Promise<void> {
  const session = await getSession();
  if (!session?.user) throw new Error('Not authenticated');

  const db = await getDB();
  const now = Math.floor(Date.now() / 1000);

  // Get the request
  const request = await db.prepare(`
    SELECT * FROM connection_requests WHERE id = ?
  `).bind(requestId).first<ConnectionRequest>();

  if (!request) throw new Error('Request not found');

  // Check admin access
  const hasAccess = await checkTreeAdminAccess(request.tree_id, session.user.id);
  if (!hasAccess) throw new Error('Not authorized');

  // Update the request
  await db.prepare(`
    UPDATE connection_requests SET
      status = ?,
      reviewed_by_user_id = ?,
      reviewed_at = ?,
      review_notes = ?,
      granted_access_level = ?,
      updated_at = ?
    WHERE id = ?
  `).bind(
    decision,
    session.user.id,
    now,
    notes || null,
    decision === 'approved' ? (accessLevel || 'viewer') : null,
    now,
    requestId
  ).run();

  // If approved, create family connection
  if (decision === 'approved') {
    await db.prepare(`
      INSERT INTO family_connections (
        id, user_id, tree_id, linked_person_id, relationship_type,
        access_level, is_verified, invited_by_user_id, connection_request_id,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?)
    `).bind(
      crypto.randomUUID(),
      request.requester_user_id,
      request.tree_id,
      request.claimed_person_id || null,
      request.claimed_relationship || null,
      accessLevel || 'viewer',
      session.user.id,
      requestId,
      now,
      now
    ).run();
  }

  // If blocked, add to blocked users
  if (decision === 'blocked') {
    await db.prepare(`
      INSERT OR IGNORE INTO blocked_users (id, tree_id, blocked_user_id, blocked_by_user_id, reason, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      crypto.randomUUID(),
      request.tree_id,
      request.requester_user_id,
      session.user.id,
      notes || null,
      now
    ).run();
  }

  // Log the action
  await logPrivacyAction(db, request.tree_id, session.user.id, decision === 'approved' ? 'approval' : 'rejection', 'connection', requestId, {
    decision,
    access_level: accessLevel,
    notes,
  });
}

// =====================================================
// FAMILY CONNECTIONS
// =====================================================

export async function getFamilyConnections(treeId: string): Promise<FamilyConnection[]> {
  const session = await getSession();
  if (!session?.user) throw new Error('Not authenticated');

  const db = await getDB();

  // Check if user has access to see connections
  const hasAccess = await checkTreeAdminAccess(treeId, session.user.id);
  if (!hasAccess) throw new Error('Not authorized');

  const results = await db.prepare(`
    SELECT
      fc.*,
      u.name as user_name,
      u.email as user_email,
      p.given_name || ' ' || COALESCE(p.family_name, '') as linked_person_name
    FROM family_connections fc
    LEFT JOIN users u ON fc.user_id = u.id
    LEFT JOIN persons p ON fc.linked_person_id = p.id
    WHERE fc.tree_id = ?
    ORDER BY fc.access_level DESC, fc.created_at DESC
  `).bind(treeId).all();

  return results.results.map(r => ({
    ...r,
    is_verified: Boolean(r.is_verified),
  })) as unknown as FamilyConnection[];
}

export async function inviteFamilyMember(input: {
  treeId: string;
  email: string;
  accessLevel?: AccessLevel;
  linkedPersonId?: string;
  relationshipType?: string;
}): Promise<void> {
  const session = await getSession();
  if (!session?.user) throw new Error('Not authenticated');

  const db = await getDB();
  const now = Math.floor(Date.now() / 1000);

  // Check admin access
  const hasAccess = await checkTreeAdminAccess(input.treeId, session.user.id);
  if (!hasAccess) throw new Error('Not authorized');

  // Find user by email
  const invitedUser = await db.prepare(`
    SELECT id FROM users WHERE email = ?
  `).bind(input.email).first<{ id: string }>();

  if (!invitedUser) {
    // TODO: Send invitation email to non-registered user
    throw new Error('User not found. Invitation emails coming soon.');
  }

  // Check if already connected
  const existing = await db.prepare(`
    SELECT id FROM family_connections WHERE user_id = ? AND tree_id = ?
  `).bind(invitedUser.id, input.treeId).first();

  if (existing) {
    throw new Error('User is already connected to this tree');
  }

  // Create the connection
  await db.prepare(`
    INSERT INTO family_connections (
      id, user_id, tree_id, linked_person_id, relationship_type,
      access_level, is_verified, invited_by_user_id, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?)
  `).bind(
    crypto.randomUUID(),
    invitedUser.id,
    input.treeId,
    input.linkedPersonId || null,
    input.relationshipType || null,
    input.accessLevel || 'viewer',
    session.user.id,
    now,
    now
  ).run();

  // Log the action
  await logPrivacyAction(db, input.treeId, session.user.id, 'approval', 'connection', invitedUser.id, {
    action: 'invite',
    email: input.email,
    access_level: input.accessLevel,
  });
}

export async function updateFamilyConnection(
  connectionId: string,
  updates: {
    accessLevel?: AccessLevel;
    linkedPersonId?: string;
    relationshipType?: string;
    isVerified?: boolean;
  }
): Promise<void> {
  const session = await getSession();
  if (!session?.user) throw new Error('Not authenticated');

  const db = await getDB();
  const now = Math.floor(Date.now() / 1000);

  // Get connection to check permissions
  const connection = await db.prepare(`
    SELECT * FROM family_connections WHERE id = ?
  `).bind(connectionId).first<FamilyConnection>();

  if (!connection) throw new Error('Connection not found');

  // Check admin access
  const hasAccess = await checkTreeAdminAccess(connection.tree_id, session.user.id);
  if (!hasAccess) throw new Error('Not authorized');

  const updateParts: string[] = [];
  const values: (string | number | null)[] = [];

  if (updates.accessLevel !== undefined) {
    updateParts.push('access_level = ?');
    values.push(updates.accessLevel);
  }
  if (updates.linkedPersonId !== undefined) {
    updateParts.push('linked_person_id = ?');
    values.push(updates.linkedPersonId || null);
  }
  if (updates.relationshipType !== undefined) {
    updateParts.push('relationship_type = ?');
    values.push(updates.relationshipType || null);
  }
  if (updates.isVerified !== undefined) {
    updateParts.push('is_verified = ?');
    values.push(updates.isVerified ? 1 : 0);
    if (updates.isVerified) {
      updateParts.push('verified_by_user_id = ?');
      values.push(session.user.id);
      updateParts.push('verified_at = ?');
      values.push(now);
    }
  }

  if (updateParts.length === 0) return;

  updateParts.push('updated_at = ?');
  values.push(now);
  values.push(connectionId);

  await db.prepare(`
    UPDATE family_connections SET ${updateParts.join(', ')} WHERE id = ?
  `).bind(...values).run();
}

export async function removeFamilyConnection(connectionId: string): Promise<void> {
  const session = await getSession();
  if (!session?.user) throw new Error('Not authenticated');

  const db = await getDB();

  // Get connection to check permissions
  const connection = await db.prepare(`
    SELECT * FROM family_connections WHERE id = ?
  `).bind(connectionId).first<FamilyConnection>();

  if (!connection) throw new Error('Connection not found');

  // Check admin access (or if user is removing themselves)
  const isAdmin = await checkTreeAdminAccess(connection.tree_id, session.user.id);
  const isSelf = connection.user_id === session.user.id;

  if (!isAdmin && !isSelf) throw new Error('Not authorized');

  await db.prepare(`
    DELETE FROM family_connections WHERE id = ?
  `).bind(connectionId).run();

  // Log the action
  await logPrivacyAction(db, connection.tree_id, session.user.id, 'privacy_change', 'connection', connectionId, {
    action: 'remove',
    removed_user_id: connection.user_id,
  });
}

// =====================================================
// ACCESS CONTROL
// =====================================================

export async function getUserAccessLevel(treeId: string, userId?: string): Promise<{
  level: AccessLevel | null;
  isOwner: boolean;
  isBlocked: boolean;
}> {
  const db = await getDB();
  const targetUserId = userId || (await getSession())?.user?.id;

  if (!targetUserId) {
    return { level: null, isOwner: false, isBlocked: false };
  }

  // Check if blocked
  const isBlocked = await db.prepare(`
    SELECT id FROM blocked_users WHERE tree_id = ? AND blocked_user_id = ?
  `).bind(treeId, targetUserId).first();

  if (isBlocked) {
    return { level: null, isOwner: false, isBlocked: true };
  }

  // Check tree_collaborators (owner/editor from old system)
  const collaborator = await db.prepare(`
    SELECT role FROM tree_collaborators WHERE tree_id = ? AND user_id = ?
  `).bind(treeId, targetUserId).first<{ role: string }>();

  if (collaborator?.role === 'owner') {
    return { level: 'admin', isOwner: true, isBlocked: false };
  }
  if (collaborator?.role === 'editor') {
    return { level: 'editor', isOwner: false, isBlocked: false };
  }

  // Check family_connections (new privacy system)
  const connection = await db.prepare(`
    SELECT access_level FROM family_connections WHERE tree_id = ? AND user_id = ?
  `).bind(treeId, targetUserId).first<{ access_level: AccessLevel }>();

  if (connection) {
    return { level: connection.access_level, isOwner: false, isBlocked: false };
  }

  return { level: null, isOwner: false, isBlocked: false };
}

export async function canUserViewTree(treeId: string): Promise<boolean> {
  const session = await getSession();
  const db = await getDB();

  // Check if tree is public
  const tree = await db.prepare(`
    SELECT is_public FROM trees WHERE id = ?
  `).bind(treeId).first<{ is_public: number }>();

  if (!tree) return false;
  if (tree.is_public) return true;

  // If not logged in, can only see public trees
  if (!session?.user) return false;

  // Check access level
  const { level, isBlocked } = await getUserAccessLevel(treeId, session.user.id);
  return !isBlocked && level !== null;
}

export async function canUserViewPerson(
  personId: string,
  viewerUserId?: string
): Promise<{
  canView: boolean;
  visibleFields: {
    fullProfile: boolean;
    birthDate: boolean;
    birthPlace: boolean;
    deathDate: boolean;
    deathPlace: boolean;
    photo: boolean;
    notes: boolean;
  };
}> {
  const db = await getDB();
  const session = await getSession();
  const userId = viewerUserId || session?.user?.id;

  // Get person and their tree
  const person = await db.prepare(`
    SELECT p.*, t.is_public, t.user_id as tree_owner_id
    FROM persons p
    JOIN trees t ON p.tree_id = t.id
    WHERE p.id = ?
  `).bind(personId).first<{
    id: string;
    tree_id: string;
    is_living: number;
    is_public: number;
    tree_owner_id: string;
  }>();

  if (!person) {
    return { canView: false, visibleFields: { fullProfile: false, birthDate: false, birthPlace: false, deathDate: false, deathPlace: false, photo: false, notes: false } };
  }

  // Get tree privacy settings
  const treePrivacy = await getTreePrivacySettings(person.tree_id);

  // Get member-specific privacy settings
  const memberPrivacy = await db.prepare(`
    SELECT * FROM member_privacy_settings WHERE person_id = ?
  `).bind(personId).first<MemberPrivacySettings>();

  // Determine viewer's access level
  const access = userId ? await getUserAccessLevel(person.tree_id, userId) : { level: null, isOwner: false, isBlocked: false };

  if (access.isBlocked) {
    return { canView: false, visibleFields: { fullProfile: false, birthDate: false, birthPlace: false, deathDate: false, deathPlace: false, photo: false, notes: false } };
  }

  // Owner/admin sees everything
  if (access.isOwner || access.level === 'admin' || access.level === 'editor') {
    return { canView: true, visibleFields: { fullProfile: true, birthDate: true, birthPlace: true, deathDate: true, deathPlace: true, photo: true, notes: true } };
  }

  // Determine visibility level to check against
  const isLiving = Boolean(person.is_living);
  const defaultVisibility = isLiving
    ? (treePrivacy?.living_members_visibility || 'family')
    : (treePrivacy?.deceased_members_visibility || 'extended');

  const effectiveVisibility = memberPrivacy?.visibility_level || defaultVisibility;

  // Check visibility based on access level
  let canViewBasic = false;
  if (effectiveVisibility === 'public') {
    canViewBasic = true;
  } else if (effectiveVisibility === 'extended' && (access.level === 'trusted' || access.level === 'family' || access.level === 'viewer')) {
    canViewBasic = true;
  } else if (effectiveVisibility === 'family' && (access.level === 'family' || access.level === 'trusted')) {
    canViewBasic = true;
  }

  if (!canViewBasic) {
    return { canView: false, visibleFields: { fullProfile: false, birthDate: false, birthPlace: false, deathDate: false, deathPlace: false, photo: false, notes: false } };
  }

  // Determine field visibility
  const isPublicViewer = !userId || access.level === null;
  const showToPublic = (field: 'dates' | 'locations' | 'photos'): boolean => {
    if (!isPublicViewer) return true;
    switch (field) {
      case 'dates': return Boolean(treePrivacy?.show_dates_to_public);
      case 'locations': return Boolean(treePrivacy?.show_locations_to_public);
      case 'photos': return Boolean(treePrivacy?.show_photos_to_public);
    }
  };

  return {
    canView: true,
    visibleFields: {
      fullProfile: access.level === 'family' || access.level === 'trusted',
      birthDate: memberPrivacy?.show_birth_date !== false && showToPublic('dates'),
      birthPlace: memberPrivacy?.show_birth_place !== false && showToPublic('locations'),
      deathDate: memberPrivacy?.show_death_date !== false && showToPublic('dates'),
      deathPlace: memberPrivacy?.show_death_place !== false && showToPublic('locations'),
      photo: memberPrivacy?.show_photo !== false && showToPublic('photos'),
      notes: memberPrivacy?.show_notes !== false && (access.level === 'family' || access.level === 'trusted'),
    },
  };
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

async function checkTreeAdminAccess(treeId: string, userId: string): Promise<boolean> {
  const db = await getDB();

  // Check if owner via tree_collaborators
  const collaborator = await db.prepare(`
    SELECT role FROM tree_collaborators WHERE tree_id = ? AND user_id = ?
  `).bind(treeId, userId).first<{ role: string }>();

  if (collaborator?.role === 'owner' || collaborator?.role === 'editor') {
    return true;
  }

  // Check if admin via family_connections
  const connection = await db.prepare(`
    SELECT access_level FROM family_connections WHERE tree_id = ? AND user_id = ?
  `).bind(treeId, userId).first<{ access_level: AccessLevel }>();

  return connection?.access_level === 'admin' || connection?.access_level === 'editor';
}

async function logPrivacyAction(
  db: D1Database,
  treeId: string | null,
  userId: string,
  actionType: string,
  targetType: string,
  targetId: string,
  details: Record<string, unknown>
): Promise<void> {
  await db.prepare(`
    INSERT INTO privacy_audit_log (id, tree_id, user_id, action_type, target_type, target_id, details, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    crypto.randomUUID(),
    treeId,
    userId,
    actionType,
    targetType,
    targetId,
    JSON.stringify(details),
    Math.floor(Date.now() / 1000)
  ).run();
}

// =====================================================
// USER PRIVACY PREFERENCES
// =====================================================

export async function getUserPrivacyPreferences(): Promise<{
  allow_family_search: boolean;
  show_in_member_directory: boolean;
  default_tree_visibility: VisibilityLevel;
  notify_on_connection_request: boolean;
  notify_on_profile_view: boolean;
  notify_on_tree_update: boolean;
} | null> {
  const session = await getSession();
  if (!session?.user) return null;

  const db = await getDB();
  const result = await db.prepare(`
    SELECT * FROM user_privacy_preferences WHERE user_id = ?
  `).bind(session.user.id).first();

  if (!result) {
    // Return defaults
    return {
      allow_family_search: true,
      show_in_member_directory: true,
      default_tree_visibility: 'family',
      notify_on_connection_request: true,
      notify_on_profile_view: false,
      notify_on_tree_update: true,
    };
  }

  return {
    allow_family_search: Boolean(result.allow_family_search),
    show_in_member_directory: Boolean(result.show_in_member_directory),
    default_tree_visibility: result.default_tree_visibility as VisibilityLevel,
    notify_on_connection_request: Boolean(result.notify_on_connection_request),
    notify_on_profile_view: Boolean(result.notify_on_profile_view),
    notify_on_tree_update: Boolean(result.notify_on_tree_update),
  };
}

export async function updateUserPrivacyPreferences(prefs: {
  allow_family_search?: boolean;
  show_in_member_directory?: boolean;
  default_tree_visibility?: VisibilityLevel;
  notify_on_connection_request?: boolean;
  notify_on_profile_view?: boolean;
  notify_on_tree_update?: boolean;
}): Promise<void> {
  const session = await getSession();
  if (!session?.user) throw new Error('Not authenticated');

  const db = await getDB();
  const now = Math.floor(Date.now() / 1000);

  // Check if preferences exist
  const existing = await db.prepare(`
    SELECT id FROM user_privacy_preferences WHERE user_id = ?
  `).bind(session.user.id).first();

  if (!existing) {
    // Create new preferences
    await db.prepare(`
      INSERT INTO user_privacy_preferences (
        id, user_id, allow_family_search, show_in_member_directory,
        default_tree_visibility, notify_on_connection_request,
        notify_on_profile_view, notify_on_tree_update, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      crypto.randomUUID(),
      session.user.id,
      prefs.allow_family_search !== undefined ? (prefs.allow_family_search ? 1 : 0) : 1,
      prefs.show_in_member_directory !== undefined ? (prefs.show_in_member_directory ? 1 : 0) : 1,
      prefs.default_tree_visibility || 'family',
      prefs.notify_on_connection_request !== undefined ? (prefs.notify_on_connection_request ? 1 : 0) : 1,
      prefs.notify_on_profile_view !== undefined ? (prefs.notify_on_profile_view ? 1 : 0) : 0,
      prefs.notify_on_tree_update !== undefined ? (prefs.notify_on_tree_update ? 1 : 0) : 1,
      now,
      now
    ).run();
  } else {
    // Update existing
    const updates: string[] = [];
    const values: (string | number)[] = [];

    if (prefs.allow_family_search !== undefined) {
      updates.push('allow_family_search = ?');
      values.push(prefs.allow_family_search ? 1 : 0);
    }
    if (prefs.show_in_member_directory !== undefined) {
      updates.push('show_in_member_directory = ?');
      values.push(prefs.show_in_member_directory ? 1 : 0);
    }
    if (prefs.default_tree_visibility !== undefined) {
      updates.push('default_tree_visibility = ?');
      values.push(prefs.default_tree_visibility);
    }
    if (prefs.notify_on_connection_request !== undefined) {
      updates.push('notify_on_connection_request = ?');
      values.push(prefs.notify_on_connection_request ? 1 : 0);
    }
    if (prefs.notify_on_profile_view !== undefined) {
      updates.push('notify_on_profile_view = ?');
      values.push(prefs.notify_on_profile_view ? 1 : 0);
    }
    if (prefs.notify_on_tree_update !== undefined) {
      updates.push('notify_on_tree_update = ?');
      values.push(prefs.notify_on_tree_update ? 1 : 0);
    }

    if (updates.length > 0) {
      updates.push('updated_at = ?');
      values.push(now);
      values.push(session.user.id);

      await db.prepare(`
        UPDATE user_privacy_preferences SET ${updates.join(', ')} WHERE user_id = ?
      `).bind(...values).run();
    }
  }
}
