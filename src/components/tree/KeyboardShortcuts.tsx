/**
 * KeyboardShortcuts Modal Component
 * Displays available keyboard shortcuts for the family tree
 */

'use client';

import React, { useEffect } from 'react';
import { cn } from '@/lib/utils';
import {
  X,
  Keyboard,
  ZoomIn,
  ZoomOut,
  Move,
  Search,
  Home,
  Maximize2,
  MousePointer,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';

interface KeyboardShortcutsProps {
  locale: 'ar' | 'en';
  isOpen: boolean;
  onClose: () => void;
}

interface ShortcutCategory {
  title: string;
  shortcuts: {
    keys: string[];
    description: string;
    icon?: React.ReactNode;
  }[];
}

export function KeyboardShortcuts({
  locale,
  isOpen,
  onClose,
}: KeyboardShortcutsProps) {
  const t = locale === 'ar' ? translations.ar : translations.en;

  // Handle escape key to close
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Handle ? key to open/close shortcuts modal
  useEffect(() => {
    const handleQuestionMark = (e: KeyboardEvent) => {
      if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
        // Don't trigger if typing in an input
        if (document.activeElement?.tagName === 'INPUT' ||
            document.activeElement?.tagName === 'TEXTAREA') {
          return;
        }
        e.preventDefault();
        if (isOpen) {
          onClose();
        }
      }
    };

    document.addEventListener('keydown', handleQuestionMark);
    return () => document.removeEventListener('keydown', handleQuestionMark);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const categories: ShortcutCategory[] = [
    {
      title: t.navigation,
      shortcuts: [
        { keys: ['↑', '↓', '←', '→'], description: t.arrowKeys, icon: <Move size={16} /> },
        { keys: ['Home'], description: t.homeKey, icon: <Home size={16} /> },
        { keys: ['Tab'], description: t.tabKey, icon: <MousePointer size={16} /> },
        { keys: ['Enter'], description: t.enterKey },
        { keys: ['Escape'], description: t.escapeKey },
      ],
    },
    {
      title: t.zoom,
      shortcuts: [
        { keys: ['+', '='], description: t.zoomIn, icon: <ZoomIn size={16} /> },
        { keys: ['-'], description: t.zoomOut, icon: <ZoomOut size={16} /> },
        { keys: ['0'], description: t.resetZoom },
        { keys: ['Ctrl', 'Scroll'], description: t.scrollZoom },
      ],
    },
    {
      title: t.actions,
      shortcuts: [
        { keys: ['Ctrl', 'F'], description: t.search, icon: <Search size={16} /> },
        { keys: ['Ctrl', 'E'], description: t.editPerson },
        { keys: ['Delete'], description: t.deletePerson },
        { keys: ['F'], description: t.fullscreen, icon: <Maximize2 size={16} /> },
      ],
    },
    {
      title: t.general,
      shortcuts: [
        { keys: ['?'], description: t.showHelp, icon: <Keyboard size={16} /> },
        { keys: ['Ctrl', 'Z'], description: t.undo },
        { keys: ['Ctrl', 'S'], description: t.save },
      ],
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-modal-title"
    >
      <div
        className={cn(
          'bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden',
          'flex flex-col'
        )}
        dir={locale === 'ar' ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Keyboard size={24} />
            <h2 id="shortcuts-modal-title" className="font-bold text-lg">
              {t.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label={locale === 'ar' ? 'إغلاق' : 'Close'}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {categories.map((category, categoryIndex) => (
              <div key={categoryIndex} className="space-y-3">
                <h3 className="font-semibold text-gray-900 text-sm uppercase tracking-wide border-b border-gray-200 pb-2">
                  {category.title}
                </h3>
                <div className="space-y-2">
                  {category.shortcuts.map((shortcut, shortcutIndex) => (
                    <div
                      key={shortcutIndex}
                      className="flex items-center justify-between gap-4 py-1.5"
                    >
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        {shortcut.icon && (
                          <span className="text-gray-400">{shortcut.icon}</span>
                        )}
                        <span>{shortcut.description}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {shortcut.keys.map((key, keyIndex) => (
                          <React.Fragment key={keyIndex}>
                            <kbd
                              className={cn(
                                'px-2 py-1 text-xs font-mono font-medium',
                                'bg-gray-100 text-gray-700 rounded-md',
                                'border border-gray-300 shadow-sm',
                                'min-w-[28px] text-center'
                              )}
                            >
                              {key}
                            </kbd>
                            {keyIndex < shortcut.keys.length - 1 && (
                              <span className="text-gray-400 text-xs">+</span>
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
          <p className="text-sm text-gray-500 text-center flex items-center justify-center gap-2">
            <span>{t.pressToClose}</span>
            <kbd className="px-2 py-0.5 text-xs font-mono bg-white border border-gray-300 rounded shadow-sm">
              Esc
            </kbd>
            <span>{t.orPress}</span>
            <kbd className="px-2 py-0.5 text-xs font-mono bg-white border border-gray-300 rounded shadow-sm">
              ?
            </kbd>
          </p>
        </div>
      </div>
    </div>
  );
}

const translations = {
  ar: {
    title: 'اختصارات لوحة المفاتيح',
    navigation: 'التنقل',
    zoom: 'التكبير والتصغير',
    actions: 'الإجراءات',
    general: 'عام',
    arrowKeys: 'التنقل بين الأشخاص',
    homeKey: 'العودة للجذر',
    tabKey: 'الانتقال للشخص التالي',
    enterKey: 'تحديد الشخص',
    escapeKey: 'إلغاء التحديد',
    zoomIn: 'تكبير',
    zoomOut: 'تصغير',
    resetZoom: 'إعادة تعيين التكبير',
    scrollZoom: 'تكبير بالتمرير',
    search: 'البحث',
    editPerson: 'تعديل الشخص المحدد',
    deletePerson: 'حذف الشخص المحدد',
    fullscreen: 'ملء الشاشة',
    showHelp: 'عرض هذه المساعدة',
    undo: 'تراجع',
    save: 'حفظ',
    pressToClose: 'اضغط',
    orPress: 'أو',
  },
  en: {
    title: 'Keyboard Shortcuts',
    navigation: 'Navigation',
    zoom: 'Zoom',
    actions: 'Actions',
    general: 'General',
    arrowKeys: 'Navigate between people',
    homeKey: 'Return to root person',
    tabKey: 'Move to next person',
    enterKey: 'Select person',
    escapeKey: 'Deselect / Close',
    zoomIn: 'Zoom in',
    zoomOut: 'Zoom out',
    resetZoom: 'Reset zoom',
    scrollZoom: 'Zoom with scroll',
    search: 'Search',
    editPerson: 'Edit selected person',
    deletePerson: 'Delete selected person',
    fullscreen: 'Toggle fullscreen',
    showHelp: 'Show this help',
    undo: 'Undo',
    save: 'Save',
    pressToClose: 'Press',
    orPress: 'or',
  },
};

export default KeyboardShortcuts;
