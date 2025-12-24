'use client';

import * as React from 'react';
import { useLocale } from 'next-intl';
import { cn } from '@/lib/utils';
import { Heart, Github, Twitter, Mail } from 'lucide-react';

export interface FooterProps {
  className?: string;
}

export function Footer({ className }: FooterProps) {
  const locale = useLocale();
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    product: [
      { title: 'Features', titleAr: 'المميزات', href: '/features' },
      { title: 'Pricing', titleAr: 'الأسعار', href: '/pricing' },
      { title: 'FAQ', titleAr: 'الأسئلة الشائعة', href: '/faq' },
    ],
    company: [
      { title: 'About', titleAr: 'عن التطبيق', href: '/about' },
      { title: 'Blog', titleAr: 'المدونة', href: '/blog' },
      { title: 'Contact', titleAr: 'اتصل بنا', href: '/contact' },
    ],
    legal: [
      { title: 'Privacy', titleAr: 'الخصوصية', href: '/privacy' },
      { title: 'Terms', titleAr: 'الشروط', href: '/terms' },
      { title: 'Cookies', titleAr: 'ملفات تعريف الارتباط', href: '/cookies' },
    ],
  };

  const socialLinks = [
    {
      name: 'GitHub',
      icon: <Github size={20} />,
      href: 'https://github.com',
      ariaLabel: 'Visit our GitHub',
    },
    {
      name: 'Twitter',
      icon: <Twitter size={20} />,
      href: 'https://twitter.com',
      ariaLabel: 'Follow us on Twitter',
    },
    {
      name: 'Email',
      icon: <Mail size={20} />,
      href: 'mailto:contact@shajara.app',
      ariaLabel: 'Send us an email',
    },
  ];

  return (
    <footer
      className={cn(
        'w-full bg-slate-50 dark:bg-slate-900',
        'border-t border-slate-200 dark:border-slate-800',
        className
      )}
    >
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand column */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-8 w-8 text-emerald-600 dark:text-emerald-400"
                aria-hidden="true"
              >
                <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5zm0 18c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z" />
              </svg>
              <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                {locale === 'ar' ? 'شجرة' : 'Shajara'}
              </span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 max-w-sm">
              {locale === 'ar'
                ? 'تطبيق شجرة العائلة بالعربية - احفظ تاريخ عائلتك وشارك القصص عبر الأجيال'
                : 'Arabic-first family tree application - Preserve your family history and share stories across generations'}
            </p>
            {/* Social links */}
            <div className="flex items-center gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  aria-label={social.ariaLabel}
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Product links */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4">
              {locale === 'ar' ? 'المنتج' : 'Product'}
            </h3>
            <ul className="space-y-2">
              {footerLinks.product.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-sm text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                  >
                    {locale === 'ar' ? link.titleAr : link.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company links */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4">
              {locale === 'ar' ? 'الشركة' : 'Company'}
            </h3>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-sm text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                  >
                    {locale === 'ar' ? link.titleAr : link.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal links */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4">
              {locale === 'ar' ? 'قانوني' : 'Legal'}
            </h3>
            <ul className="space-y-2">
              {footerLinks.legal.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-sm text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                  >
                    {locale === 'ar' ? link.titleAr : link.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom section */}
        <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-1">
              {locale === 'ar' ? (
                <>
                  &copy; {currentYear} شجرة. جميع الحقوق محفوظة. صنع بـ
                  <Heart size={14} className="text-red-500 fill-current" />
                </>
              ) : (
                <>
                  &copy; {currentYear} Shajara. All rights reserved. Made with
                  <Heart size={14} className="text-red-500 fill-current" />
                </>
              )}
            </p>

            {/* Language selector */}
            <div className="flex items-center gap-2">
              <a
                href="/ar"
                className={cn(
                  'px-3 py-1 text-sm rounded-md transition-colors',
                  locale === 'ar'
                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                )}
              >
                العربية
              </a>
              <a
                href="/en"
                className={cn(
                  'px-3 py-1 text-sm rounded-md transition-colors',
                  locale === 'en'
                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                )}
              >
                English
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
