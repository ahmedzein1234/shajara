/**
 * ContextMenu Component
 * Right-click context menu for tree node actions
 */

'use client';

import React, { useEffect, useRef, useCallback, memo } from 'react';
import { TreeNode } from '@/types/tree';
import {
  UserPlus,
  Edit3,
  Eye,
  Target,
  Link2,
  Trash2,
  UserMinus,
  Users,
  Heart,
  X,
} from 'lucide-react';

interface ContextMenuProps {
  node: TreeNode;
  x: number;
  y: number;
  locale: 'ar' | 'en';
  onClose: () => void;
  onAddChild?: (node: TreeNode) => void;
  onAddSpouse?: (node: TreeNode) => void;
  onAddParent?: (node: TreeNode) => void;
  onAddSibling?: (node: TreeNode) => void;
  onEdit?: (node: TreeNode) => void;
  onViewProfile?: (node: TreeNode) => void;
  onSetAsRoot?: (node: TreeNode) => void;
  onCopyLink?: (node: TreeNode) => void;
  onDelete?: (node: TreeNode) => void;
}

const translations = {
  ar: {
    addChild: 'إضافة ابن/ابنة',
    addSpouse: 'إضافة زوج/زوجة',
    addParent: 'إضافة والد/والدة',
    addSibling: 'إضافة أخ/أخت',
    edit: 'تعديل البيانات',
    viewProfile: 'عرض الملف الشخصي',
    setAsRoot: 'تعيين كجذر الشجرة',
    copyLink: 'نسخ الرابط',
    delete: 'حذف',
    addPeople: 'إضافة أفراد',
    actions: 'إجراءات',
  },
  en: {
    addChild: 'Add Child',
    addSpouse: 'Add Spouse',
    addParent: 'Add Parent',
    addSibling: 'Add Sibling',
    edit: 'Edit Profile',
    viewProfile: 'View Full Profile',
    setAsRoot: 'Set as Root',
    copyLink: 'Copy Link',
    delete: 'Delete',
    addPeople: 'Add People',
    actions: 'Actions',
  },
};

export const ContextMenu = memo(function ContextMenu({
  node,
  x,
  y,
  locale,
  onClose,
  onAddChild,
  onAddSpouse,
  onAddParent,
  onAddSibling,
  onEdit,
  onViewProfile,
  onSetAsRoot,
  onCopyLink,
  onDelete,
}: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const t = translations[locale];
  const isRTL = locale === 'ar';

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  // Adjust position to stay within viewport
  useEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      if (rect.right > viewportWidth) {
        menuRef.current.style.left = `${viewportWidth - rect.width - 10}px`;
      }
      if (rect.bottom > viewportHeight) {
        menuRef.current.style.top = `${viewportHeight - rect.height - 10}px`;
      }
    }
  }, [x, y]);

  const handleAction = useCallback((action: (() => void) | undefined) => {
    if (action) {
      action();
    }
    onClose();
  }, [onClose]);

  const MenuItem = ({
    icon: Icon,
    label,
    onClick,
    variant = 'default',
  }: {
    icon: React.ElementType;
    label: string;
    onClick?: () => void;
    variant?: 'default' | 'danger';
  }) => (
    <button
      onClick={() => handleAction(onClick ? () => onClick() : undefined)}
      disabled={!onClick}
      className={`
        w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-colors
        ${isRTL ? 'text-right' : 'text-left'}
        ${
          variant === 'danger'
            ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'
            : 'text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700'
        }
        ${!onClick ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      <Icon size={16} className={variant === 'danger' ? 'text-red-500' : 'text-gray-400'} />
      <span>{label}</span>
    </button>
  );

  const Divider = () => (
    <div className="h-px bg-gray-200 dark:bg-gray-700 my-1" />
  );

  const SectionLabel = ({ label }: { label: string }) => (
    <div className="px-3 py-1.5 text-xs font-medium text-gray-400 uppercase tracking-wide">
      {label}
    </div>
  );

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 py-1 min-w-[200px] overflow-hidden"
      style={{
        left: x,
        top: y,
        direction: isRTL ? 'rtl' : 'ltr',
      }}
    >
      {/* Header with person name */}
      <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
              node.person.gender === 'male'
                ? 'bg-blue-500'
                : node.person.gender === 'female'
                ? 'bg-pink-500'
                : 'bg-gray-500'
            }`}
          >
            {node.person.given_name[0]}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-gray-900 dark:text-white truncate">
              {locale === 'ar'
                ? node.person.full_name_ar || node.person.given_name
                : node.person.full_name_en || node.person.given_name}
            </div>
            {node.person.birth_date && (
              <div className="text-xs text-gray-500">
                {new Date(node.person.birth_date).getFullYear()}
                {node.person.death_date && ` - ${new Date(node.person.death_date).getFullYear()}`}
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <X size={14} className="text-gray-400" />
          </button>
        </div>
      </div>

      {/* Add People Section */}
      <SectionLabel label={t.addPeople} />
      <MenuItem icon={UserPlus} label={t.addChild} onClick={onAddChild ? () => onAddChild(node) : undefined} />
      <MenuItem icon={Heart} label={t.addSpouse} onClick={onAddSpouse ? () => onAddSpouse(node) : undefined} />
      <MenuItem icon={Users} label={t.addParent} onClick={onAddParent ? () => onAddParent(node) : undefined} />
      <MenuItem icon={UserMinus} label={t.addSibling} onClick={onAddSibling ? () => onAddSibling(node) : undefined} />

      <Divider />

      {/* Actions Section */}
      <SectionLabel label={t.actions} />
      <MenuItem icon={Edit3} label={t.edit} onClick={onEdit ? () => onEdit(node) : undefined} />
      <MenuItem icon={Eye} label={t.viewProfile} onClick={onViewProfile ? () => onViewProfile(node) : undefined} />
      <MenuItem icon={Target} label={t.setAsRoot} onClick={onSetAsRoot ? () => onSetAsRoot(node) : undefined} />
      <MenuItem icon={Link2} label={t.copyLink} onClick={onCopyLink ? () => onCopyLink(node) : undefined} />

      <Divider />

      {/* Danger Zone */}
      <MenuItem
        icon={Trash2}
        label={t.delete}
        onClick={onDelete ? () => onDelete(node) : undefined}
        variant="danger"
      />
    </div>
  );
});

export default ContextMenu;
