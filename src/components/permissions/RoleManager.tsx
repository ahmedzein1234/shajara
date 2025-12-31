'use client';

/**
 * Role Manager Component
 *
 * Displays and manages collaborators and their roles on a tree.
 */

import React, { useState, useEffect } from 'react';
import {
  Users,
  Crown,
  Shield,
  User,
  Eye,
  ChevronDown,
  X,
  Check,
  Loader2,
  UserPlus,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  TreeRole,
  ROLE_LABELS,
  ROLE_DESCRIPTIONS,
  ROLE_COLORS,
  ROLE_HIERARCHY,
  getPromotableRoles,
} from '@/lib/permissions';

interface Collaborator {
  userId: string;
  name: string;
  email: string;
  avatar?: string;
  role: TreeRole;
  invitedAt: number;
  acceptedAt?: number;
}

interface RoleManagerProps {
  treeId: string;
  currentUserId: string;
  currentUserRole: TreeRole;
  collaborators: Collaborator[];
  onRoleChange: (userId: string, newRole: TreeRole) => Promise<void>;
  onRemove: (userId: string) => Promise<void>;
  onInvite?: () => void;
  locale: 'ar' | 'en';
}

const ROLE_ICONS: Record<TreeRole, React.ElementType> = {
  owner: Crown,
  manager: Shield,
  member: User,
  guest: Eye,
};

const translations = {
  ar: {
    title: 'إدارة الأدوار',
    subtitle: 'تحكم في صلاحيات أعضاء الشجرة',
    inviteNew: 'دعوة عضو جديد',
    changeRole: 'تغيير الدور',
    remove: 'إزالة',
    confirmRemove: 'هل أنت متأكد؟',
    saving: 'جاري الحفظ...',
    you: '(أنت)',
    pending: 'في انتظار القبول',
    noCollaborators: 'لا يوجد أعضاء بعد',
    owner: 'مالك',
    manager: 'مدير',
    member: 'عضو',
    guest: 'ضيف',
  },
  en: {
    title: 'Role Management',
    subtitle: 'Control permissions for tree members',
    inviteNew: 'Invite New Member',
    changeRole: 'Change Role',
    remove: 'Remove',
    confirmRemove: 'Are you sure?',
    saving: 'Saving...',
    you: '(You)',
    pending: 'Pending acceptance',
    noCollaborators: 'No collaborators yet',
    owner: 'Owner',
    manager: 'Manager',
    member: 'Member',
    guest: 'Guest',
  },
};

export function RoleManager({
  treeId,
  currentUserId,
  currentUserRole,
  collaborators,
  onRoleChange,
  onRemove,
  onInvite,
  locale,
}: RoleManagerProps) {
  const t = translations[locale];
  const labels = ROLE_LABELS[locale];
  const descriptions = ROLE_DESCRIPTIONS[locale];

  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [confirmRemoveUser, setConfirmRemoveUser] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  const canManageRoles = currentUserRole === 'owner' || currentUserRole === 'manager';
  const promotableRoles = getPromotableRoles(currentUserRole);

  const handleRoleChange = async (userId: string, newRole: TreeRole) => {
    setLoading(userId);
    try {
      await onRoleChange(userId, newRole);
    } finally {
      setLoading(null);
      setEditingUser(null);
    }
  };

  const handleRemove = async (userId: string) => {
    setLoading(userId);
    try {
      await onRemove(userId);
    } finally {
      setLoading(null);
      setConfirmRemoveUser(null);
    }
  };

  const canManageUser = (userRole: TreeRole): boolean => {
    if (currentUserRole === 'owner') return userRole !== 'owner';
    if (currentUserRole === 'manager') return userRole === 'member' || userRole === 'guest';
    return false;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-heritage-navy flex items-center gap-2">
            <Users className="w-5 h-5 text-heritage-turquoise" />
            {t.title}
          </h3>
          <p className="text-sm text-warm-500 mt-1">{t.subtitle}</p>
        </div>

        {canManageRoles && onInvite && (
          <button
            onClick={onInvite}
            className="inline-flex items-center gap-2 px-4 py-2 bg-heritage-turquoise text-white rounded-lg font-medium hover:bg-heritage-turquoise/90 transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            {t.inviteNew}
          </button>
        )}
      </div>

      {/* Role Legend */}
      <div className="flex flex-wrap gap-3 p-4 bg-warm-50 rounded-xl">
        {ROLE_HIERARCHY.slice().reverse().map((role) => {
          const Icon = ROLE_ICONS[role];
          const colors = ROLE_COLORS[role];
          return (
            <div key={role} className="flex items-center gap-2">
              <span className={cn('p-1.5 rounded', colors.bg)}>
                <Icon className={cn('w-3 h-3', colors.text)} />
              </span>
              <div>
                <p className="text-sm font-medium text-heritage-navy">{labels[role]}</p>
                <p className="text-xs text-warm-500">{descriptions[role]}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Collaborators List */}
      {collaborators.length === 0 ? (
        <div className="text-center py-12 text-warm-500">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>{t.noCollaborators}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {collaborators.map((collab) => {
            const Icon = ROLE_ICONS[collab.role];
            const colors = ROLE_COLORS[collab.role];
            const isCurrentUser = collab.userId === currentUserId;
            const canManage = canManageUser(collab.role) && !isCurrentUser;

            return (
              <div
                key={collab.userId}
                className={cn(
                  'flex items-center gap-4 p-4 rounded-xl border transition-colors',
                  isCurrentUser
                    ? 'bg-heritage-turquoise/5 border-heritage-turquoise/20'
                    : 'bg-white border-warm-200 hover:border-warm-300'
                )}
              >
                {/* Avatar */}
                <div className={cn(
                  'w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold',
                  colors.bg, colors.text
                )}>
                  {collab.avatar ? (
                    <img
                      src={collab.avatar}
                      alt={collab.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    collab.name.charAt(0).toUpperCase()
                  )}
                </div>

                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-heritage-navy truncate">
                    {collab.name}
                    {isCurrentUser && (
                      <span className="text-heritage-turquoise text-sm ms-2">
                        {t.you}
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-warm-500 truncate">{collab.email}</p>
                  {!collab.acceptedAt && (
                    <p className="text-xs text-gold-600">{t.pending}</p>
                  )}
                </div>

                {/* Role Badge */}
                <div className="flex items-center gap-2">
                  <span className={cn(
                    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium',
                    colors.bg, colors.text
                  )}>
                    <Icon className="w-4 h-4" />
                    {labels[collab.role]}
                  </span>
                </div>

                {/* Actions */}
                {canManage && (
                  <div className="flex items-center gap-2">
                    {loading === collab.userId ? (
                      <Loader2 className="w-5 h-5 text-warm-400 animate-spin" />
                    ) : (
                      <>
                        {/* Role Dropdown */}
                        <div className="relative">
                          <button
                            onClick={() => setEditingUser(
                              editingUser === collab.userId ? null : collab.userId
                            )}
                            className="p-2 text-warm-500 hover:text-heritage-turquoise hover:bg-warm-100 rounded-lg transition-colors"
                            title={t.changeRole}
                          >
                            <ChevronDown className="w-5 h-5" />
                          </button>

                          {editingUser === collab.userId && (
                            <div className="absolute end-0 top-full mt-1 w-48 bg-white border border-warm-200 rounded-lg shadow-lg z-10">
                              {promotableRoles.map((role) => {
                                const RoleIcon = ROLE_ICONS[role];
                                return (
                                  <button
                                    key={role}
                                    onClick={() => handleRoleChange(collab.userId, role)}
                                    className={cn(
                                      'w-full flex items-center gap-2 px-4 py-2 text-start hover:bg-warm-50 transition-colors',
                                      role === collab.role && 'bg-warm-50'
                                    )}
                                  >
                                    <RoleIcon className="w-4 h-4 text-warm-500" />
                                    <span className="text-sm text-heritage-navy">
                                      {labels[role]}
                                    </span>
                                    {role === collab.role && (
                                      <Check className="w-4 h-4 text-heritage-turquoise ms-auto" />
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* Remove Button */}
                        {confirmRemoveUser === collab.userId ? (
                          <button
                            onClick={() => handleRemove(collab.userId)}
                            className="px-3 py-1.5 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition-colors"
                          >
                            {t.confirmRemove}
                          </button>
                        ) : (
                          <button
                            onClick={() => setConfirmRemoveUser(collab.userId)}
                            className="p-2 text-warm-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title={t.remove}
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
