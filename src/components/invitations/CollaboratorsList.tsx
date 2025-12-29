'use client';

import * as React from 'react';
import { useLocale } from 'next-intl';
import { Users, Crown, Shield, Eye, UserMinus, MoreVertical } from 'lucide-react';
import { removeCollaborator, type TreeCollaborator } from '@/lib/db/invitation-actions';

interface CollaboratorsListProps {
  treeId: string;
  ownerId: string;
  collaborators: TreeCollaborator[];
  currentUserId: string;
  onUpdate?: () => void;
}

const translations = {
  ar: {
    title: 'المتعاونون',
    owner: 'المالك',
    admin: 'مدير',
    editor: 'محرر',
    viewer: 'مشاهد',
    remove: 'إزالة',
    removeConfirm: 'هل أنت متأكد من إزالة هذا المتعاون؟',
    noCollaborators: 'لم تتم إضافة متعاونين بعد',
    joined: 'انضم',
    you: '(أنت)',
  },
  en: {
    title: 'Collaborators',
    owner: 'Owner',
    admin: 'Admin',
    editor: 'Editor',
    viewer: 'Viewer',
    remove: 'Remove',
    removeConfirm: 'Are you sure you want to remove this collaborator?',
    noCollaborators: 'No collaborators added yet',
    joined: 'Joined',
    you: '(You)',
  },
};

const roleIcons = {
  admin: Shield,
  editor: Users,
  viewer: Eye,
};

const roleColors = {
  admin: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  editor: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  viewer: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
};

export function CollaboratorsList({ treeId, ownerId, collaborators, currentUserId, onUpdate }: CollaboratorsListProps) {
  const locale = useLocale() as 'ar' | 'en';
  const t = translations[locale];
  const [menuOpen, setMenuOpen] = React.useState<string | null>(null);
  const [removing, setRemoving] = React.useState<string | null>(null);

  const isOwner = currentUserId === ownerId;

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleRemove = async (userId: string) => {
    if (!confirm(t.removeConfirm)) return;

    setRemoving(userId);
    const result = await removeCollaborator(treeId, userId);
    setRemoving(null);

    if (result.success) {
      onUpdate?.();
    }
    setMenuOpen(null);
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Users className="w-5 h-5" />
          {t.title}
        </h3>
      </div>

      <div className="divide-y divide-slate-100 dark:divide-slate-700">
        {collaborators.length === 0 ? (
          <div className="p-8 text-center text-slate-500 dark:text-slate-400">
            {t.noCollaborators}
          </div>
        ) : (
          collaborators.map((collab) => {
            const RoleIcon = roleIcons[collab.role];
            const isCurrentUser = collab.user_id === currentUserId;

            return (
              <div
                key={collab.id}
                className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-bold">
                    {(collab.user_name || 'U').charAt(0).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-900 dark:text-white">
                        {collab.user_name || collab.user_email}
                      </span>
                      {isCurrentUser && (
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {t.you}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${roleColors[collab.role]}`}>
                        <RoleIcon className="w-3 h-3" />
                        {t[collab.role]}
                      </span>
                      <span className="text-xs text-slate-400 dark:text-slate-500">
                        {t.joined} {formatDate(collab.joined_at)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                {isOwner && !isCurrentUser && (
                  <div className="relative">
                    <button
                      onClick={() => setMenuOpen(menuOpen === collab.id ? null : collab.id)}
                      className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {menuOpen === collab.id && (
                      <div className="absolute end-0 top-full mt-1 w-36 bg-white dark:bg-slate-700 rounded-lg shadow-lg border border-slate-200 dark:border-slate-600 py-1 z-10">
                        <button
                          onClick={() => handleRemove(collab.user_id)}
                          disabled={removing === collab.user_id}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <UserMinus className="w-4 h-4" />
                          {t.remove}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
