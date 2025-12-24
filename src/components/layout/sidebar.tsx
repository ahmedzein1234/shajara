'use client';

import * as React from 'react';
import { useLocale } from 'next-intl';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Home,
  Users,
  Calendar,
  Settings,
  FileText,
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface SidebarProps {
  className?: string;
  onClose?: () => void;
}

interface NavItem {
  title: string;
  titleAr: string;
  href: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  {
    title: 'Home',
    titleAr: 'الرئيسية',
    href: '/',
    icon: <Home size={20} />,
  },
  {
    title: 'Family Tree',
    titleAr: 'شجرة العائلة',
    href: '/tree',
    icon: <Users size={20} />,
  },
  {
    title: 'Members',
    titleAr: 'الأعضاء',
    href: '/members',
    icon: <Users size={20} />,
  },
  {
    title: 'Events',
    titleAr: 'الأحداث',
    href: '/events',
    icon: <Calendar size={20} />,
  },
  {
    title: 'Documents',
    titleAr: 'المستندات',
    href: '/documents',
    icon: <FileText size={20} />,
  },
  {
    title: 'Search',
    titleAr: 'البحث',
    href: '/search',
    icon: <Search size={20} />,
  },
];

export function Sidebar({ className, onClose }: SidebarProps) {
  const locale = useLocale();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = React.useState(false);

  const toggleCollapse = () => {
    setCollapsed(!collapsed);
  };

  return (
    <aside
      className={cn(
        'flex flex-col h-full',
        'bg-white dark:bg-slate-900',
        'border-e border-slate-200 dark:border-slate-800',
        'transition-all duration-300',
        collapsed ? 'w-16' : 'w-64',
        className
      )}
    >
      {/* Sidebar header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-slate-200 dark:border-slate-800">
        {!collapsed && (
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            {locale === 'ar' ? 'القائمة' : 'Menu'}
          </h2>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleCollapse}
          className="shrink-0"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {locale === 'ar' ? (
            collapsed ? <ChevronLeft size={18} /> : <ChevronRight size={18} />
          ) : (
            collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />
          )}
        </Button>
      </div>

      {/* Quick action */}
      <div className="p-4">
        <Button
          variant="primary"
          fullWidth={!collapsed}
          size="md"
          leftIcon={!collapsed && <Plus size={18} />}
        >
          {collapsed ? <Plus size={18} /> : locale === 'ar' ? 'إضافة عضو' : 'Add Member'}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 overflow-y-auto">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const title = locale === 'ar' ? item.titleAr : item.title;

            return (
              <li key={item.href}>
                <a
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg',
                    'text-sm font-medium transition-colors',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500',
                    isActive
                      ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800',
                    collapsed && 'justify-center'
                  )}
                  title={collapsed ? title : undefined}
                >
                  <span className="shrink-0">{item.icon}</span>
                  {!collapsed && <span>{title}</span>}
                </a>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Sidebar footer */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800">
        <a
          href="/settings"
          onClick={onClose}
          className={cn(
            'flex items-center gap-3 px-3 py-2 rounded-lg',
            'text-sm font-medium transition-colors',
            'text-slate-700 dark:text-slate-300',
            'hover:bg-slate-100 dark:hover:bg-slate-800',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500',
            collapsed && 'justify-center'
          )}
          title={collapsed ? (locale === 'ar' ? 'الإعدادات' : 'Settings') : undefined}
        >
          <Settings size={20} />
          {!collapsed && <span>{locale === 'ar' ? 'الإعدادات' : 'Settings'}</span>}
        </a>
      </div>
    </aside>
  );
}

export interface MobileSidebarProps {
  open: boolean;
  onClose: () => void;
}

export function MobileSidebar({ open, onClose }: MobileSidebarProps) {
  const locale = useLocale();

  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <div
        className={cn(
          'fixed top-0 z-50 h-full lg:hidden',
          'transition-transform duration-300',
          locale === 'ar' ? 'end-0' : 'start-0',
          open ? 'translate-x-0' : locale === 'ar' ? 'translate-x-full' : '-translate-x-full'
        )}
      >
        <Sidebar onClose={onClose} />
      </div>
    </>
  );
}
