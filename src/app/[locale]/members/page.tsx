import Link from 'next/link';
import { Users, Search, TreeDeciduous, ArrowRight, ArrowLeft, Lock } from 'lucide-react';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/actions';

interface PageProps {
  params: Promise<{ locale: string }>;
}

const translations = {
  ar: {
    title: 'أعضاء العائلة',
    subtitle: 'تواصل مع أقاربك واكتشف أفراد عائلتك',
    comingSoon: 'قريبًا',
    comingSoonDesc: 'نعمل على بناء دليل عائلي يساعدك على اكتشاف أقاربك والتواصل معهم بخصوصية وأمان.',
    features: {
      discover: 'اكتشف أقاربك',
      discoverDesc: 'ابحث عن أفراد عائلتك المسجلين في شجرة',
      connect: 'تواصل بأمان',
      connectDesc: 'أرسل طلبات تواصل وانتظر الموافقة',
      privacy: 'خصوصية كاملة',
      privacyDesc: 'أنت تتحكم في من يرى معلوماتك',
    },
    backToTree: 'العودة لأشجاري',
  },
  en: {
    title: 'Family Members',
    subtitle: 'Connect with relatives and discover your family',
    comingSoon: 'Coming Soon',
    comingSoonDesc: 'We\'re building a family directory to help you discover relatives and connect with them privately and securely.',
    features: {
      discover: 'Discover Relatives',
      discoverDesc: 'Search for family members registered on Shajara',
      connect: 'Connect Safely',
      connectDesc: 'Send connection requests and wait for approval',
      privacy: 'Full Privacy',
      privacyDesc: 'You control who sees your information',
    },
    backToTree: 'Back to My Trees',
  },
};

export default async function MembersPage({ params }: PageProps) {
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
                <Users className="w-8 h-8 text-islamic-primary" />
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
            <Lock className="w-4 h-4" />
            <span className="font-medium">{t.comingSoon}</span>
          </div>

          {/* Icon */}
          <div className="w-24 h-24 bg-gradient-to-br from-islamic-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg">
            <Search className="w-12 h-12 text-white" />
          </div>

          {/* Description */}
          <p className="text-xl text-slate-600 dark:text-slate-400 mb-12 leading-relaxed">
            {t.comingSoonDesc}
          </p>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="p-6 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
              <Users className="w-10 h-10 text-islamic-500 mx-auto mb-4" />
              <h3 className="font-bold text-slate-900 dark:text-white mb-2">{t.features.discover}</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">{t.features.discoverDesc}</p>
            </div>
            <div className="p-6 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
              <TreeDeciduous className="w-10 h-10 text-emerald-500 mx-auto mb-4" />
              <h3 className="font-bold text-slate-900 dark:text-white mb-2">{t.features.connect}</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">{t.features.connectDesc}</p>
            </div>
            <div className="p-6 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
              <Lock className="w-10 h-10 text-gold-500 mx-auto mb-4" />
              <h3 className="font-bold text-slate-900 dark:text-white mb-2">{t.features.privacy}</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">{t.features.privacyDesc}</p>
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
