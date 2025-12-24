'use client';

import * as React from 'react';
import { useLocale } from 'next-intl';
import { cn } from '@/lib/utils';
import { Menu, X, Sun, Moon, Globe, User, LogOut, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { Dropdown, DropdownItem, DropdownSeparator, DropdownLabel } from '@/components/ui/dropdown';

export interface HeaderProps {
  onMenuToggle?: () => void;
  className?: string;
}

export function Header({ onMenuToggle, className }: HeaderProps) {
  const locale = useLocale();
  const [theme, setTheme] = React.useState<'light' | 'dark'>('light');
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  // Toggle theme
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  // Toggle language
  const toggleLanguage = () => {
    const newLocale = locale === 'ar' ? 'en' : 'ar';
    // In a real app, this would use Next.js router to change locale
    window.location.pathname = `/${newLocale}${window.location.pathname.substring(3)}`;
  };

  const handleMobileMenuToggle = () => {
    setMobileMenuOpen(!mobileMenuOpen);
    onMenuToggle?.();
  };

  return (
    <header
      className={cn(
        'sticky top-0 z-40 w-full',
        'bg-white dark:bg-slate-900',
        'border-b border-slate-200 dark:border-slate-800',
        'shadow-sm',
        className
      )}
    >
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Left section: Logo and mobile menu */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMobileMenuToggle}
              className="lg:hidden"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </Button>

            {/* Logo */}
            <a
              href="/"
              className="flex items-center gap-2 text-xl font-bold text-emerald-600 dark:text-emerald-400"
            >
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-8 w-8"
                aria-hidden="true"
              >
                <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5zm0 18c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z" />
              </svg>
              <span className="hidden sm:inline">
                {locale === 'ar' ? 'شجرة' : 'Shajara'}
              </span>
            </a>
          </div>

          {/* Center section: Navigation (desktop) */}
          <nav className="hidden lg:flex items-center gap-1">
            <a
              href="/"
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {locale === 'ar' ? 'الرئيسية' : 'Home'}
            </a>
            <a
              href="/tree"
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {locale === 'ar' ? 'شجرة العائلة' : 'Family Tree'}
            </a>
            <a
              href="/members"
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {locale === 'ar' ? 'الأعضاء' : 'Members'}
            </a>
            <a
              href="/events"
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {locale === 'ar' ? 'الأحداث' : 'Events'}
            </a>
          </nav>

          {/* Right section: Theme toggle, language toggle, user menu */}
          <div className="flex items-center gap-2">
            {/* Theme toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </Button>

            {/* Language toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleLanguage}
              aria-label={`Switch to ${locale === 'ar' ? 'English' : 'Arabic'}`}
            >
              <Globe size={18} />
              <span className="hidden sm:inline ms-1">
                {locale === 'ar' ? 'English' : 'عربي'}
              </span>
            </Button>

            {/* User menu */}
            <Dropdown
              trigger={
                <div className="cursor-pointer">
                  <Avatar
                    src={null}
                    fallback="User Name"
                    size="sm"
                    status="online"
                  />
                </div>
              }
              align="end"
            >
              <DropdownLabel>
                {locale === 'ar' ? 'حسابي' : 'My Account'}
              </DropdownLabel>
              <DropdownItem icon={<User size={16} />}>
                {locale === 'ar' ? 'الملف الشخصي' : 'Profile'}
              </DropdownItem>
              <DropdownItem icon={<Settings size={16} />}>
                {locale === 'ar' ? 'الإعدادات' : 'Settings'}
              </DropdownItem>
              <DropdownSeparator />
              <DropdownItem icon={<LogOut size={16} />} destructive>
                {locale === 'ar' ? 'تسجيل الخروج' : 'Sign Out'}
              </DropdownItem>
            </Dropdown>
          </div>
        </div>

        {/* Mobile navigation */}
        {mobileMenuOpen && (
          <nav className="lg:hidden border-t border-slate-200 dark:border-slate-800 py-4">
            <div className="flex flex-col gap-1">
              <a
                href="/"
                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                {locale === 'ar' ? 'الرئيسية' : 'Home'}
              </a>
              <a
                href="/tree"
                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                {locale === 'ar' ? 'شجرة العائلة' : 'Family Tree'}
              </a>
              <a
                href="/members"
                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                {locale === 'ar' ? 'الأعضاء' : 'Members'}
              </a>
              <a
                href="/events"
                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                {locale === 'ar' ? 'الأحداث' : 'Events'}
              </a>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
