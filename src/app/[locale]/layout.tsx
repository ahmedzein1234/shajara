import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import Link from 'next/link';
import { TreeDeciduous } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { getSession } from '@/lib/auth/actions';
import { ServiceWorkerRegistration, InstallPrompt } from '@/components/pwa';
import { ToastProvider } from '@/components/ui/toast';
import { TourProvider, TourOverlay } from '@/components/onboarding';
import { CookieConsent } from '@/components/CookieConsent';
import { GuestProvider } from '@/contexts/GuestContext';

const locales = ['ar', 'en'];

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
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
                <Link href={`/${locale}/members`} className="text-slate-300 hover:text-emerald-400 transition-smooth">
                  {locale === 'ar' ? 'الأعضاء' : 'Members'}
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

  // Get user session
  let user = null;
  try {
    const session = await getSession();
    user = session?.user || null;
  } catch {
    // Session fetch failed, user remains null
  }

  // Determine text direction
  const dir = locale === 'ar' ? 'rtl' : 'ltr';

  return (
    <html lang={locale} dir={dir}>
      <body>
        <NextIntlClientProvider messages={messages}>
          <GuestProvider>
            <ToastProvider>
              <TourProvider autoStart={true}>
                <ServiceWorkerRegistration />
                <div className="flex flex-col min-h-screen">
                  <Header user={user} />
                  <main className="flex-grow">
                    {children}
                  </main>
                  <Footer locale={locale} />
                </div>
                <InstallPrompt />
                <TourOverlay locale={locale as 'ar' | 'en'} />
                <CookieConsent locale={locale as 'ar' | 'en'} />
              </TourProvider>
            </ToastProvider>
          </GuestProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
