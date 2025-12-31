/**
 * Tiered Permissions System
 *
 * Defines permissions for each role: Owner > Manager > Member > Guest
 *
 * Owner: Full control over tree and all members
 * Manager: Can add/edit/delete persons, manage members (but not owners)
 * Member: Can add/edit persons, but cannot delete or manage others
 * Guest: Read-only access
 */

export type TreeRole = 'owner' | 'manager' | 'member' | 'guest';

export interface TreePermissions {
  // Person operations
  canAddPerson: boolean;
  canEditPerson: boolean;
  canDeletePerson: boolean;

  // Relationship operations
  canAddRelationship: boolean;
  canEditRelationship: boolean;
  canDeleteRelationship: boolean;

  // Event operations
  canAddEvent: boolean;
  canEditEvent: boolean;
  canDeleteEvent: boolean;

  // Media operations
  canUploadMedia: boolean;
  canDeleteMedia: boolean;

  // Tree management
  canManageSettings: boolean;
  canInviteMembers: boolean;
  canRemoveMembers: boolean;
  canPromoteMembers: boolean;
  canExportTree: boolean;
  canDeleteTree: boolean;

  // Advanced features
  canApproveProposals: boolean;
  canViewAuditLog: boolean;
  canManageFamilyCouncil: boolean;
}

/**
 * Default permissions for each role
 */
export const ROLE_PERMISSIONS: Record<TreeRole, TreePermissions> = {
  owner: {
    canAddPerson: true,
    canEditPerson: true,
    canDeletePerson: true,
    canAddRelationship: true,
    canEditRelationship: true,
    canDeleteRelationship: true,
    canAddEvent: true,
    canEditEvent: true,
    canDeleteEvent: true,
    canUploadMedia: true,
    canDeleteMedia: true,
    canManageSettings: true,
    canInviteMembers: true,
    canRemoveMembers: true,
    canPromoteMembers: true,
    canExportTree: true,
    canDeleteTree: true,
    canApproveProposals: true,
    canViewAuditLog: true,
    canManageFamilyCouncil: true,
  },
  manager: {
    canAddPerson: true,
    canEditPerson: true,
    canDeletePerson: true,
    canAddRelationship: true,
    canEditRelationship: true,
    canDeleteRelationship: true,
    canAddEvent: true,
    canEditEvent: true,
    canDeleteEvent: true,
    canUploadMedia: true,
    canDeleteMedia: true,
    canManageSettings: false,
    canInviteMembers: true,
    canRemoveMembers: true, // Can remove members and guests, not managers/owners
    canPromoteMembers: false,
    canExportTree: true,
    canDeleteTree: false,
    canApproveProposals: true,
    canViewAuditLog: true,
    canManageFamilyCouncil: false,
  },
  member: {
    canAddPerson: true,
    canEditPerson: true,
    canDeletePerson: false, // Members cannot delete
    canAddRelationship: true,
    canEditRelationship: true,
    canDeleteRelationship: false,
    canAddEvent: true,
    canEditEvent: true,
    canDeleteEvent: false,
    canUploadMedia: true,
    canDeleteMedia: false,
    canManageSettings: false,
    canInviteMembers: false,
    canRemoveMembers: false,
    canPromoteMembers: false,
    canExportTree: true,
    canDeleteTree: false,
    canApproveProposals: false,
    canViewAuditLog: false,
    canManageFamilyCouncil: false,
  },
  guest: {
    canAddPerson: false,
    canEditPerson: false,
    canDeletePerson: false,
    canAddRelationship: false,
    canEditRelationship: false,
    canDeleteRelationship: false,
    canAddEvent: false,
    canEditEvent: false,
    canDeleteEvent: false,
    canUploadMedia: false,
    canDeleteMedia: false,
    canManageSettings: false,
    canInviteMembers: false,
    canRemoveMembers: false,
    canPromoteMembers: false,
    canExportTree: false,
    canDeleteTree: false,
    canApproveProposals: false,
    canViewAuditLog: false,
    canManageFamilyCouncil: false,
  },
};

/**
 * Role hierarchy - higher index = higher privileges
 */
export const ROLE_HIERARCHY: TreeRole[] = ['guest', 'member', 'manager', 'owner'];

/**
 * Get the numerical rank of a role
 */
export function getRoleRank(role: TreeRole): number {
  return ROLE_HIERARCHY.indexOf(role);
}

/**
 * Check if role A can manage role B (promote/demote/remove)
 */
export function canManageRole(managerRole: TreeRole, targetRole: TreeRole): boolean {
  // Owners can manage everyone except other owners
  if (managerRole === 'owner') {
    return targetRole !== 'owner';
  }
  // Managers can only manage members and guests
  if (managerRole === 'manager') {
    return targetRole === 'member' || targetRole === 'guest';
  }
  return false;
}

/**
 * Get the roles that a given role can promote to
 */
export function getPromotableRoles(currentRole: TreeRole): TreeRole[] {
  if (currentRole === 'owner') {
    return ['manager', 'member', 'guest'];
  }
  if (currentRole === 'manager') {
    return ['member', 'guest'];
  }
  return [];
}

/**
 * Get permissions for a specific role with optional overrides
 */
export function getPermissions(
  role: TreeRole,
  overrides?: Partial<TreePermissions>
): TreePermissions {
  const basePermissions = ROLE_PERMISSIONS[role];
  if (!overrides) return basePermissions;

  return {
    ...basePermissions,
    ...overrides,
  };
}

/**
 * Check if a user has a specific permission
 */
export function hasPermission(
  role: TreeRole,
  permission: keyof TreePermissions,
  overrides?: Partial<TreePermissions>
): boolean {
  const permissions = getPermissions(role, overrides);
  return permissions[permission];
}

/**
 * Translations for roles
 */
export const ROLE_LABELS = {
  ar: {
    owner: 'مالك',
    manager: 'مدير',
    member: 'عضو',
    guest: 'ضيف',
  },
  en: {
    owner: 'Owner',
    manager: 'Manager',
    member: 'Member',
    guest: 'Guest',
  },
};

export const ROLE_DESCRIPTIONS = {
  ar: {
    owner: 'تحكم كامل في الشجرة وجميع الأعضاء',
    manager: 'يمكنه إضافة وتعديل وحذف الأشخاص وإدارة الأعضاء',
    member: 'يمكنه إضافة وتعديل الأشخاص ولكن لا يمكنه الحذف',
    guest: 'عرض فقط',
  },
  en: {
    owner: 'Full control over tree and all members',
    manager: 'Can add, edit, delete persons and manage members',
    member: 'Can add and edit persons but cannot delete',
    guest: 'Read-only access',
  },
};

/**
 * Role colors for UI
 */
export const ROLE_COLORS: Record<TreeRole, { bg: string; text: string }> = {
  owner: { bg: 'bg-gold-500', text: 'text-white' },
  manager: { bg: 'bg-heritage-turquoise', text: 'text-white' },
  member: { bg: 'bg-heritage-navy', text: 'text-white' },
  guest: { bg: 'bg-warm-300', text: 'text-warm-700' },
};
