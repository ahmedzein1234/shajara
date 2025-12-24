import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import Link from 'next/link';
import { TreeDeciduous, User, Globe, Menu } from 'lucide-react';

const locales = ['ar', 'en'];

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

async function Header({ locale }: { locale: string }) {
  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link
            href={`/${locale}`}
            className="flex items-center gap-3 text-emerald-600 hover:text-emerald-700 transition-smooth"
          >
            <div className="bg-emerald-600 text-white p-2 rounded-lg">
              <TreeDeciduous className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">
                {locale === 'ar' ? 'شجرة' : 'Shajara'}
              </h1>
              <p className="text-xs text-slate-600">
                {locale === 'ar' ? 'شجرة العائلة' : 'Family Tree'}
              </p>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href={`/${locale}/tree`}
              className="flex items-center gap-2 text-slate-700 hover:text-emerald-600 transition-smooth font-medium"
            >
              <TreeDeciduous className="w-4 h-4" />
              <span>{locale === 'ar' ? 'الأشجار' : 'Trees'}</span>
            </Link>
            <Link
              href={`/${locale}/person`}
              className="flex items-center gap-2 text-slate-700 hover:text-emerald-600 transition-smooth font-medium"
            >
              <User className="w-4 h-4" />
              <span>{locale === 'ar' ? 'الأشخاص' : 'People'}</span>
            </Link>

            {/* Language Switcher */}
            <Link
              href={locale === 'ar' ? '/en' : '/ar'}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition-smooth"
            >
              <Globe className="w-4 h-4" />
              <span className="font-medium">{locale === 'ar' ? 'EN' : 'عربي'}</span>
            </Link>
          </nav>

          {/* Mobile Menu Button */}
          <button className="md:hidden p-2 hover:bg-slate-100 rounded-lg transition-smooth">
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </div>
    </header>
  );
}

function Footer({ locale }: { locale: string }) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 text-white mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-3 gap-8">
          {/* About */}
          <div>
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <TreeDeciduous className="w-5 h-5" />
              {locale === 'ar' ? 'شجرة' : 'Shajara'}
            </h3>
            <p className="text-slate-300 leading-relaxed">
              {locale === 'ar'
                ? 'احفظ تراث عائلتك وشاركه مع الأجيال القادمة من خلال شجرة عائلة جميلة وسهلة الاستخدام.'
                : 'Preserve and share your family heritage with future generations through beautiful, easy-to-use family trees.'}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xl font-bold mb-4">
              {locale === 'ar' ? 'روابط سريعة' : 'Quick Links'}
            </h3>
            <ul className="space-y-2">
              <li>
                <Link href={`/${locale}/tree`} className="text-slate-300 hover:text-emerald-400 transition-smooth">
                  {locale === 'ar' ? 'الأشجار' : 'Trees'}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/person`} className="text-slate-300 hover:text-emerald-400 transition-smooth">
                  {locale === 'ar' ? 'الأشخاص' : 'People'}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/about`} className="text-slate-300 hover:text-emerald-400 transition-smooth">
                  {locale === 'ar' ? 'عن شجرة' : 'About'}
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-xl font-bold mb-4">
              {locale === 'ar' ? 'تواصل معنا' : 'Contact'}
            </h3>
            <p className="text-slate-300">
              {locale === 'ar'
                ? 'لديك سؤال؟ نحن هنا للمساعدة!'
                : 'Have a question? We\'re here to help!'}
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-800 mt-8 pt-8 text-center text-slate-400">
          <p>
            {locale === 'ar'
              ? `© ${currentYear} شجرة. جميع الحقوق محفوظة.`
              : `© ${currentYear} Shajara. All rights reserved.`}
          </p>
        </div>
      </div>
    </footer>
  );
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Validate locale
  if (!locales.includes(locale)) {
    notFound();
  }

  // Get messages for the locale
  const messages = await getMessages();

  // Determine text direction
  const dir = locale === 'ar' ? 'rtl' : 'ltr';

  return (
    <html lang={locale} dir={dir}>
      <body>
        <NextIntlClientProvider messages={messages}>
          <div className="flex flex-col min-h-screen">
            <Header locale={locale} />
            <main className="flex-grow">
              {children}
            </main>
            <Footer locale={locale} />
          </div>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
