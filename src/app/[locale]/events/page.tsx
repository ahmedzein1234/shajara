import Link from 'next/link';
import { Calendar, TreeDeciduous, ArrowRight, ArrowLeft, Clock } from 'lucide-react';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/actions';

interface PageProps {
  params: Promise<{ locale: string }>;
}

const translations = {
  ar: {
    title: 'أحداث العائلة',
    subtitle: 'تتبع المناسبات والذكريات العائلية',
    comingSoon: 'قريبًا',
    comingSoonDesc: 'نعمل على بناء تقويم للمناسبات العائلية يساعدك على تذكر أعياد الميلاد والذكريات المهمة.',
    features: {
      birthdays: 'أعياد الميلاد',
      birthdaysDesc: 'تذكير بأعياد ميلاد أفراد العائلة',
      anniversaries: 'الذكريات السنوية',
      anniversariesDesc: 'ذكريات الزواج والمناسبات المهمة',
      events: 'المناسبات',
      eventsDesc: 'تجمعات العائلة والاحتفالات',
    },
    backToTree: 'العودة لأشجاري',
  },
  en: {
    title: 'Family Events',
    subtitle: 'Track family occasions and memories',
    comingSoon: 'Coming Soon',
    comingSoonDesc: 'We\'re building a family event calendar to help you remember birthdays and important anniversaries.',
    features: {
      birthdays: 'Birthdays',
      birthdaysDesc: 'Reminders for family member birthdays',
      anniversaries: 'Anniversaries',
      anniversariesDesc: 'Wedding anniversaries and milestones',
      events: 'Events',
      eventsDesc: 'Family gatherings and celebrations',
    },
    backToTree: 'Back to My Trees',
  },
};

export default async function EventsPage({ params }: PageProps) {
  const { locale } = await params;
  const session = await getSession();
  const t = translations[locale as 'ar' | 'en'] || translations.en;
  const isRTL = locale === 'ar';
  const BackArrow = isRTL ? ArrowRight : ArrowLeft;

  if (!session?.user) {
    redirect(`/${locale}/login`);
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-4 mb-6">
            <Link
              href={`/${locale}/tree`}
              className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              <BackArrow className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white font-accent flex items-center gap-3">
                <Calendar className="w-8 h-8 text-islamic-primary" />
                {t.title}
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">{t.subtitle}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Coming Soon Content */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          {/* Coming Soon Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 rounded-full mb-8">
            <Clock className="w-4 h-4" />
            <span className="font-medium">{t.comingSoon}</span>
          </div>

          {/* Icon */}
          <div className="w-24 h-24 bg-gradient-to-br from-islamic-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg">
            <Calendar className="w-12 h-12 text-white" />
          </div>

          {/* Description */}
          <p className="text-xl text-slate-600 dark:text-slate-400 mb-12 leading-relaxed">
            {t.comingSoonDesc}
          </p>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="p-6 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900/30 rounded-xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🎂</span>
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white mb-2">{t.features.birthdays}</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">{t.features.birthdaysDesc}</p>
            </div>
            <div className="p-6 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="w-12 h-12 bg-rose-100 dark:bg-rose-900/30 rounded-xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">💍</span>
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white mb-2">{t.features.anniversaries}</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">{t.features.anniversariesDesc}</p>
            </div>
            <div className="p-6 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🎉</span>
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white mb-2">{t.features.events}</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">{t.features.eventsDesc}</p>
            </div>
          </div>

          {/* Back Button */}
          <Link
            href={`/${locale}/tree`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-islamic-primary hover:bg-islamic-600 text-white rounded-xl font-medium transition-colors"
          >
            <TreeDeciduous className="w-5 h-5" />
            {t.backToTree}
          </Link>
        </div>
      </div>
    </div>
  );
}
