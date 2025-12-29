import Link from 'next/link';
import { TreeDeciduous, Heart, Shield, Users, Globe, BookOpen, ArrowRight, ArrowLeft } from 'lucide-react';

interface PageProps {
  params: Promise<{ locale: string }>;
}

const translations = {
  ar: {
    title: 'عن شَجَرة',
    subtitle: 'التطبيق العربي الأول لحفظ تراث عائلتك',
    mission: {
      title: 'رسالتنا',
      text: 'نؤمن بأن كل عائلة تستحق أن تُحفظ قصتها للأجيال القادمة. شَجَرة هو أول تطبيق عربي متكامل لبناء شجرة العائلة، مصمم خصيصًا للعائلات العربية مع مراعاة الخصوصية والتقاليد.',
    },
    values: {
      title: 'قيمنا',
      items: [
        {
          icon: 'Shield',
          title: 'الخصوصية أولًا',
          text: 'نضع خصوصية عائلتك في المقدمة. أنت تتحكم في من يرى معلوماتك.',
        },
        {
          icon: 'Heart',
          title: 'صِلة الرَّحِم',
          text: 'نساعدك على التواصل مع أقاربك وتقوية روابطك العائلية.',
        },
        {
          icon: 'BookOpen',
          title: 'حفظ التراث',
          text: 'نحافظ على قصص الأجداد وتقاليد العائلة للأجيال القادمة.',
        },
        {
          icon: 'Globe',
          title: 'عربي بالكامل',
          text: 'مصمم للغة العربية من البداية، مع دعم كامل للكتابة من اليمين لليسار.',
        },
      ],
    },
    features: {
      title: 'ماذا نقدم',
      items: [
        'شجرة عائلة تفاعلية وجميلة',
        'دعم كامل للعربية والإنجليزية',
        'خصوصية متقدمة وتحكم كامل',
        'مشاركة آمنة مع العائلة',
        'قصص وذكريات العائلة',
        'خريطة الجذور الجغرافية',
      ],
    },
    cta: {
      title: 'ابدأ رحلتك',
      text: 'انضم لآلاف العائلات العربية التي تحفظ تاريخها مع شَجَرة',
      button: 'ابدأ الآن مجانًا',
    },
    back: 'الرئيسية',
  },
  en: {
    title: 'About Shajara',
    subtitle: 'The first Arabic app to preserve your family heritage',
    mission: {
      title: 'Our Mission',
      text: 'We believe every family deserves to have their story preserved for future generations. Shajara is the first comprehensive Arabic family tree app, designed specifically for Arab families with privacy and traditions in mind.',
    },
    values: {
      title: 'Our Values',
      items: [
        {
          icon: 'Shield',
          title: 'Privacy First',
          text: 'Your family\'s privacy comes first. You control who sees your information.',
        },
        {
          icon: 'Heart',
          title: 'Family Bonds',
          text: 'We help you connect with relatives and strengthen family ties.',
        },
        {
          icon: 'BookOpen',
          title: 'Heritage Preservation',
          text: 'We preserve ancestral stories and family traditions for future generations.',
        },
        {
          icon: 'Globe',
          title: 'Arabic-First',
          text: 'Designed for Arabic from the ground up, with full RTL support.',
        },
      ],
    },
    features: {
      title: 'What We Offer',
      items: [
        'Beautiful interactive family tree',
        'Full Arabic and English support',
        'Advanced privacy controls',
        'Secure family sharing',
        'Family stories and memories',
        'Geographic roots map',
      ],
    },
    cta: {
      title: 'Start Your Journey',
      text: 'Join thousands of Arab families preserving their history with Shajara',
      button: 'Start Free Now',
    },
    back: 'Home',
  },
};

const iconMap = {
  Shield,
  Heart,
  BookOpen,
  Globe,
};

export default async function AboutPage({ params }: PageProps) {
  const { locale } = await params;
  const t = translations[locale as 'ar' | 'en'] || translations.en;
  const isRTL = locale === 'ar';
  const BackArrow = isRTL ? ArrowRight : ArrowLeft;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-islamic-600 via-islamic-500 to-emerald-600 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-pattern-star opacity-20"></div>
        <div className="container mx-auto px-4 py-16 relative">
          <Link
            href={`/${locale}`}
            className="inline-flex items-center gap-2 text-emerald-100 hover:text-white mb-8 transition-colors"
          >
            <BackArrow className="w-4 h-4" />
            {t.back}
          </Link>

          <div className="max-w-3xl">
            <div className="flex items-center gap-4 mb-6">
              <TreeDeciduous className="w-12 h-12" />
              <h1 className="text-4xl md:text-5xl font-bold font-accent">{t.title}</h1>
            </div>
            <p className="text-xl text-emerald-100">{t.subtitle}</p>
          </div>
        </div>
      </div>

      {/* Mission Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6 font-accent">
            {t.mission.title}
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
            {t.mission.text}
          </p>
        </div>
      </div>

      {/* Values Section */}
      <div className="bg-white dark:bg-slate-800 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-12 text-center font-accent">
            {t.values.title}
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {t.values.items.map((item, index) => {
              const IconComponent = iconMap[item.icon as keyof typeof iconMap];
              return (
                <div key={index} className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-islamic-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <IconComponent className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-white mb-2">{item.title}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{item.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-8 font-accent">
            {t.features.title}
          </h2>
          <ul className="grid md:grid-cols-2 gap-4">
            {t.features.items.map((item, index) => (
              <li key={index} className="flex items-center gap-3 p-4 bg-white dark:bg-slate-800 rounded-xl shadow-sm">
                <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                  <TreeDeciduous className="w-4 h-4 text-emerald-600" />
                </div>
                <span className="text-slate-700 dark:text-slate-300">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-br from-heritage-navy to-islamic-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4 font-accent">{t.cta.title}</h2>
          <p className="text-emerald-100 mb-8 max-w-xl mx-auto">{t.cta.text}</p>
          <Link
            href={`/${locale}/register`}
            className="inline-flex items-center gap-2 px-8 py-4 bg-gold-300 hover:bg-gold-200 text-heritage-navy font-bold rounded-xl transition-colors"
          >
            <Users className="w-5 h-5" />
            {t.cta.button}
          </Link>
        </div>
      </div>
    </div>
  );
}
