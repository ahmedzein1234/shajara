'use client';

import * as React from 'react';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Menu, X, Sun, Moon, Globe, User, LogOut, Settings, LogIn, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { Dropdown, DropdownItem, DropdownSeparator, DropdownLabel } from '@/components/ui/dropdown';
import { logout, type User as UserType } from '@/lib/auth/actions';

export interface HeaderProps {
  onMenuToggle?: () => void;
  className?: string;
  user?: UserType | null;
}

export function Header({ onMenuToggle, className, user }: HeaderProps) {
  const locale = useLocale();
  const router = useRouter();
  const [theme, setTheme] = React.useState<'light' | 'dark'>('light');
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMobileMenuOpen(false);
      }
    };

    if (mobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  // Toggle theme
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  // Toggle language
  const toggleLanguage = () => {
    const newLocale = locale === 'ar' ? 'en' : 'ar';
    window.location.pathname = `/${newLocale}${window.location.pathname.substring(3)}`;
  };

  const handleMobileMenuToggle = () => {
    setMobileMenuOpen(!mobileMenuOpen);
    onMenuToggle?.();
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await logout();
    router.push(`/${locale}`);
    router.refresh();
  };

  const navItems = [
    { href: `/${locale}`, label: locale === 'ar' ? 'الرئيسية' : 'Home' },
    { href: `/${locale}/tree`, label: locale === 'ar' ? 'شجرة العائلة' : 'Family Tree' },
    { href: `/${locale}/members`, label: locale === 'ar' ? 'الأعضاء' : 'Members' },
    { href: `/${locale}/events`, label: locale === 'ar' ? 'الأحداث' : 'Events' },
  ];

  return (
    <>
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
                className="lg:hidden min-w-[44px] min-h-[44px]"
                aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </Button>

              {/* Logo */}
              <a
                href={`/${locale}`}
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
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  {item.label}
                </a>
              ))}
            </nav>

            {/* Right section: Theme toggle, language toggle, user menu */}
            <div className="flex items-center gap-2">
              {/* Theme toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleTheme}
                aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
                className="min-w-[44px] min-h-[44px]"
              >
                {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
              </Button>

              {/* Language toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleLanguage}
                aria-label={`Switch to ${locale === 'ar' ? 'English' : 'Arabic'}`}
                className="min-w-[44px] min-h-[44px]"
              >
                <Globe size={18} />
                <span className="hidden sm:inline ms-1">
                  {locale === 'ar' ? 'English' : 'عربي'}
                </span>
              </Button>

              {/* User menu or Login/Register */}
              {user ? (
                <Dropdown
                  trigger={
                    <div className="cursor-pointer">
                      <Avatar
                        src={user.avatar_url}
                        fallback={user.name}
                        size="sm"
                        status="online"
                      />
                    </div>
                  }
                  align="end"
                >
                  <DropdownLabel>
                    <div className="font-medium">{user.name}</div>
                    <div className="text-xs text-slate-500">{user.email}</div>
                  </DropdownLabel>
                  <DropdownItem icon={<User size={16} />} href={`/${locale}/profile`}>
                    {locale === 'ar' ? 'الملف الشخصي' : 'Profile'}
                  </DropdownItem>
                  <DropdownItem icon={<Settings size={16} />} href={`/${locale}/settings`}>
                    {locale === 'ar' ? 'الإعدادات' : 'Settings'}
                  </DropdownItem>
                  <DropdownSeparator />
                  <DropdownItem
                    icon={<LogOut size={16} />}
                    destructive
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                  >
                    {isLoggingOut
                      ? (locale === 'ar' ? 'جاري الخروج...' : 'Signing out...')
                      : (locale === 'ar' ? 'تسجيل الخروج' : 'Sign Out')
                    }
                  </DropdownItem>
                </Dropdown>
              ) : (
                <div className="hidden sm:flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push(`/${locale}/login`)}
                  >
                    <LogIn size={18} className="me-1" />
                    {locale === 'ar' ? 'دخول' : 'Sign In'}
                  </Button>
                  <Button
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={() => router.push(`/${locale}/register`)}
                  >
                    <UserPlus size={18} className="me-1" />
                    {locale === 'ar' ? 'تسجيل' : 'Sign Up'}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile menu drawer */}
      <div
        ref={menuRef}
        className={cn(
          'fixed top-0 z-50 h-full w-72 bg-white dark:bg-slate-900 shadow-xl lg:hidden',
          'transform transition-transform duration-300 ease-in-out',
          locale === 'ar' ? 'right-0' : 'left-0',
          mobileMenuOpen
            ? 'translate-x-0'
            : locale === 'ar' ? 'translate-x-full' : '-translate-x-full'
        )}
      >
        {/* Mobile menu header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
          <a
            href={`/${locale}`}
            className="flex items-center gap-2 text-xl font-bold text-emerald-600 dark:text-emerald-400"
          >
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-8 w-8"
            >
              <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5zm0 18c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z" />
            </svg>
            <span>{locale === 'ar' ? 'شجرة' : 'Shajara'}</span>
          </a>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close menu"
            className="min-w-[44px] min-h-[44px]"
          >
            <X size={24} />
          </Button>
        </div>

        {/* Mobile menu content */}
        <nav className="p-4">
          <div className="flex flex-col gap-1">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="px-4 py-3 text-base font-medium text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.label}
              </a>
            ))}
          </div>

          {/* Mobile auth buttons */}
          {!user && (
            <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-3">
              <Button
                variant="outline"
                className="w-full justify-center"
                onClick={() => {
                  setMobileMenuOpen(false);
                  router.push(`/${locale}/login`);
                }}
              >
                <LogIn size={18} className="me-2" />
                {locale === 'ar' ? 'تسجيل الدخول' : 'Sign In'}
              </Button>
              <Button
                className="w-full justify-center bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => {
                  setMobileMenuOpen(false);
                  router.push(`/${locale}/register`);
                }}
              >
                <UserPlus size={18} className="me-2" />
                {locale === 'ar' ? 'إنشاء حساب' : 'Create Account'}
              </Button>
            </div>
          )}

          {/* Mobile user info */}
          {user && (
            <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3 px-4 py-3">
                <Avatar
                  src={user.avatar_url}
                  fallback={user.name}
                  size="md"
                />
                <div>
                  <div className="font-medium text-slate-900 dark:text-white">{user.name}</div>
                  <div className="text-sm text-slate-500">{user.email}</div>
                </div>
              </div>
              <div className="mt-4 flex flex-col gap-1">
                <a
                  href={`/${locale}/profile`}
                  className="px-4 py-3 text-base font-medium text-slate-700 dark:text-slate-300 hover:text-emerald-600 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-3"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <User size={20} />
                  {locale === 'ar' ? 'الملف الشخصي' : 'Profile'}
                </a>
                <a
                  href={`/${locale}/settings`}
                  className="px-4 py-3 text-base font-medium text-slate-700 dark:text-slate-300 hover:text-emerald-600 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-3"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Settings size={20} />
                  {locale === 'ar' ? 'الإعدادات' : 'Settings'}
                </a>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  disabled={isLoggingOut}
                  className="px-4 py-3 text-base font-medium text-red-600 hover:text-red-700 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3 w-full text-start"
                >
                  <LogOut size={20} />
                  {isLoggingOut
                    ? (locale === 'ar' ? 'جاري الخروج...' : 'Signing out...')
                    : (locale === 'ar' ? 'تسجيل الخروج' : 'Sign Out')
                  }
                </button>
              </div>
            </div>
          )}
        </nav>
      </div>
    </>
  );
}
