import Link from 'next/link';
import { TreeDeciduous, Share2, MapPin, ArrowLeft, ArrowRight, Sparkles, Quote } from 'lucide-react';

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isRTL = locale === 'ar';

  return (
    <div className="animate-fade-in">
      {/* Hero Section - Enhanced with Islamic design */}
      <section className="relative overflow-hidden bg-gradient-to-br from-islamic-600 via-islamic-500 to-emerald-600 text-white">
        {/* Islamic Pattern Overlay */}
        <div className="absolute inset-0 bg-pattern-star opacity-30"></div>

        {/* Decorative Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-64 h-64 bg-gold-300/20 rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/4 w-32 h-32 bg-heritage-terracotta/10 rounded-full blur-2xl"></div>
        </div>

        <div className="container mx-auto px-4 py-24 md:py-36 relative">
          <div className="max-w-4xl mx-auto text-center">
            {/* Arabic Proverb Badge */}
            <div className="inline-flex items-center gap-3 bg-white/15 backdrop-blur-sm px-5 py-2.5 rounded-full mb-10 border border-white/20">
              <Quote className="w-4 h-4 text-gold-200" />
              <span className="text-sm font-medium text-gold-100 font-display">
                {locale === 'ar' ? 'المرء بأصله وفصله' : 'A person is defined by their roots'}
              </span>
            </div>

            {/* Main Headline - Calligraphic */}
            <h1 className="text-5xl md:text-7xl font-bold mb-8 leading-tight font-display">
              {locale === 'ar' ? (
                <>
                  جذورٌ راسخة،
                  <br />
                  <span className="text-gold-200">وإرثٌ خالد</span>
                </>
              ) : (
                <>
                  Deep Roots,
                  <br />
                  <span className="text-gold-200">Eternal Legacy</span>
                </>
              )}
            </h1>

            <p className="text-xl md:text-2xl mb-12 text-emerald-50/90 max-w-3xl mx-auto leading-relaxed font-accent">
              {locale === 'ar'
                ? 'احفظ ذكرى من سبقوك، وأورِث قصصك لمن يأتي بعدك. كل شجرةٍ عظيمة بدأت ببذرة، وكل عائلةٍ كريمة بدأت بذِكرى.'
                : 'Preserve the memory of those who came before you, and pass your stories to those who come after. Every great tree began with a seed, and every noble family began with a memory.'}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href={`/${locale}/tree`}
                className="group bg-white text-islamic-600 px-8 py-4 rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl hover:scale-105 transition-smooth flex items-center gap-3"
              >
                <span>{locale === 'ar' ? 'ابدأ رحلة الأنساب' : 'Begin Your Journey'}</span>
                {isRTL ? (
                  <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                ) : (
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                )}
              </Link>

              <button className="bg-white/10 backdrop-blur-sm text-white px-8 py-4 rounded-xl font-bold text-lg border-2 border-gold-200/30 hover:bg-white/20 hover:border-gold-200/50 transition-smooth">
                {locale === 'ar' ? 'اكتشف المزيد' : 'Learn More'}
              </button>
            </div>

            {/* Trust Indicator */}
            <div className="mt-12 flex items-center justify-center gap-8 text-emerald-100/70 text-sm">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-gold-200" />
                <span>{locale === 'ar' ? 'مجاني للأبد' : 'Free Forever'}</span>
              </div>
              <div className="w-1 h-1 bg-emerald-100/50 rounded-full"></div>
              <div className="flex items-center gap-2">
                <span>{locale === 'ar' ? 'عربي أصيل' : 'Arabic-First'}</span>
              </div>
              <div className="w-1 h-1 bg-emerald-100/50 rounded-full"></div>
              <div className="flex items-center gap-2">
                <span>{locale === 'ar' ? 'خصوصية تامة' : 'Complete Privacy'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Wave Divider with Gold Accent */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path
              d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 80C1200 80 1320 70 1380 65L1440 60V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
              fill="rgb(248, 250, 252)"
            />
          </svg>
        </div>
      </section>

      {/* Features Section - Enhanced with Arabic Copy */}
      <section className="py-24 bg-slate-50 relative">
        {/* Subtle pattern background */}
        <div className="absolute inset-0 bg-pattern-arabesque opacity-30"></div>

        <div className="container mx-auto px-4 relative">
          {/* Section Header */}
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6 font-display">
              {locale === 'ar' ? 'لماذا تختار شجرة؟' : 'Why Choose Shajara?'}
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
              {locale === 'ar'
                ? 'هنا حيث تلتقي الأسماء بالذكريات، والماضي بالحاضر'
                : 'Where names meet memories, and the past meets the present'}
            </p>
            {/* Islamic Divider */}
            <div className="divider-islamic w-48 mx-auto mt-8"></div>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Feature 1 - Tree Building */}
            <div className="card-hover text-center group relative">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-islamic-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-t-xl"></div>
              <div className="gradient-islamic w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-smooth shadow-islamic">
                <TreeDeciduous className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4 font-accent">
                {locale === 'ar' ? 'شجرةٌ تحكي ألف حكاية' : 'A Tree Telling Thousand Stories'}
              </h3>
              <p className="text-slate-600 leading-relaxed leading-arabic">
                {locale === 'ar'
                  ? 'ارسم خريطة نسبك بكل سهولة ويُسر، من الأجداد إلى الأحفاد. واجهة عربية أصيلة تحترم تراثنا وتقاليدنا في ذكر النسب والكُنى والألقاب.'
                  : 'Draw your lineage map with ease, from ancestors to descendants. An authentic Arabic interface respecting our heritage and traditions.'}
              </p>
            </div>

            {/* Feature 2 - Geographic Mapping */}
            <div className="card-hover text-center group relative">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-gold-300 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-t-xl"></div>
              <div className="gradient-gold w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-smooth shadow-gold">
                <MapPin className="w-10 h-10 text-heritage-navy" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4 font-accent">
                {locale === 'ar' ? 'من أين جئنا؟ خارطة الجذور' : 'Where Did We Come From?'}
              </h3>
              <p className="text-slate-600 leading-relaxed leading-arabic">
                {locale === 'ar'
                  ? 'تتبّع رحلة عائلتك عبر الزمان والمكان. ارسم خريطة مواطن أجدادك واكتشف المسار الذي سلكته عائلتك عبر القرون.'
                  : 'Track your family journey through time and place. Map your ancestors homelands and discover the path your family took across centuries.'}
              </p>
            </div>

            {/* Feature 3 - Sharing */}
            <div className="card-hover text-center group relative">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-heritage-terracotta to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-t-xl"></div>
              <div className="bg-gradient-to-br from-heritage-terracotta to-heritage-terracotta/80 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-smooth">
                <Share2 className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4 font-accent">
                {locale === 'ar' ? 'تراثٌ مشترك، ذاكرةٌ جماعية' : 'Shared Heritage, Collective Memory'}
              </h3>
              <p className="text-slate-600 leading-relaxed leading-arabic">
                {locale === 'ar'
                  ? 'شارك شجرة عائلتك مع الأهل والأقارب. دع كل فردٍ يُسهم بما يعرف، يضيف صورة، يروي حكاية. معاً نحفظ ما نخشى أن ننساه.'
                  : 'Share your family tree with relatives. Let each person contribute what they know, add a photo, tell a story. Together we preserve what we fear to forget.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Quote Section - Arabic Heritage */}
      <section className="py-16 bg-islamic-50">
        <div className="container mx-auto px-4">
          <blockquote className="max-w-3xl mx-auto text-center">
            <Quote className="w-12 h-12 text-gold-300 mx-auto mb-6 opacity-60" />
            <p className="text-2xl md:text-3xl text-islamic-600 font-display leading-relaxed mb-6">
              {locale === 'ar'
                ? 'التاريخ ليس ما مضى، بل ما نحفظه ليبقى'
                : 'History is not what passed, but what we preserve to remain'}
            </p>
            <footer className="text-slate-500 font-accent">
              {locale === 'ar' ? '— حكمة عربية' : '— Arabic Wisdom'}
            </footer>
          </blockquote>
        </div>
      </section>

      {/* CTA Section - Enhanced */}
      <section className="py-24 bg-gradient-to-br from-heritage-navy via-islamic-600 to-heritage-navy text-white relative overflow-hidden">
        {/* Pattern overlay */}
        <div className="absolute inset-0 bg-pattern-star opacity-20"></div>

        {/* Decorative orbs */}
        <div className="absolute top-10 right-20 w-64 h-64 bg-gold-300/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 left-20 w-48 h-48 bg-heritage-terracotta/10 rounded-full blur-2xl"></div>

        <div className="container mx-auto px-4 text-center relative">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 font-display">
            {locale === 'ar' ? 'البستان ينتظر الغارس' : 'The Orchard Awaits the Planter'}
          </h2>
          <p className="text-xl text-emerald-100/80 mb-12 max-w-2xl mx-auto leading-relaxed">
            {locale === 'ar'
              ? 'كل رحلةٍ عظيمة تبدأ بخطوة. ابدأ الآن في توثيق تاريخ عائلتك، واحفظ أسماء من أحببت وذكرى من سبقك. فالأصول لا تُنسى، والجذور تبقى مهما طال الزمان.'
              : 'Every great journey begins with a step. Start documenting your family history now, preserve the names of those you loved and the memory of those who came before. Origins are never forgotten, and roots remain no matter how long the time.'}
          </p>

          <Link
            href={`/${locale}/tree`}
            className="inline-flex items-center gap-3 btn-heritage px-10 py-5 rounded-xl font-bold text-lg text-heritage-navy hover:scale-105 transition-smooth"
          >
            <TreeDeciduous className="w-6 h-6" />
            <span>{locale === 'ar' ? 'أنشئ شجرة عائلتك الآن' : 'Create Your Family Tree Now'}</span>
          </Link>

          {/* Footer Quote */}
          <p className="mt-12 text-gold-200/60 text-sm font-display italic">
            {locale === 'ar' ? '«الأرحام معلقة بالعرش»' : '"Blood ties are sacred"'}
          </p>
        </div>
      </section>
    </div>
  );
}

export const runtime = 'edge';
