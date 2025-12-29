import Link from 'next/link';
import { TreeDeciduous, Share2, MapPin, ArrowLeft, ArrowRight, Sparkles, Quote, Users, Heart, MessageCircle, BookOpen } from 'lucide-react';

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
              <Quote className="w-4 h-4 text-amber-200" />
              <span className="text-sm font-medium text-amber-100 font-display">
                {locale === 'ar' ? 'صِلَةُ الرَّحِم تزيدُ في العُمر' : 'Family bonds enrich your life'}
              </span>
            </div>

            {/* Main Headline - Clear & Readable */}
            <h1 className="text-5xl md:text-7xl font-bold mb-8 leading-tight font-accent">
              {locale === 'ar' ? (
                <>
                  اعرف عائلتك
                  <br />
                  <span className="text-amber-200">واحفظ تراثها</span>
                </>
              ) : (
                <>
                  Know Your Family
                  <br />
                  <span className="text-amber-200">Preserve Their Legacy</span>
                </>
              )}
            </h1>

            <p className="text-xl md:text-2xl mb-12 text-emerald-50/90 max-w-3xl mx-auto leading-relaxed font-accent">
              {locale === 'ar'
                ? 'تواصَل مع أهلك وأقاربك، واكتشف قصصهم وذكرياتهم. احفظ تراث عائلتك للأجيال القادمة، لأن العائلة ليست مجرد أسماء، بل روابط تستحق البقاء.'
                : 'Connect with your relatives, discover their stories and memories, and preserve your family heritage for generations to come. Because family is not just names—it\'s relationships and bonds worth cherishing.'}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href={`/${locale}/tree`}
                className="group bg-white text-emerald-600 px-8 py-4 rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl hover:scale-105 transition-smooth flex items-center gap-3"
              >
                <span>{locale === 'ar' ? 'ابدأ التواصل مع عائلتك' : 'Start Connecting with Family'}</span>
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
            <div className="mt-12 flex items-center justify-center gap-8 text-emerald-100/70 text-sm flex-wrap">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-200" />
                <span>{locale === 'ar' ? 'تواصل عائلي' : 'Family Connection'}</span>
              </div>
              <div className="w-1 h-1 bg-emerald-100/50 rounded-full hidden sm:block"></div>
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-amber-200" />
                <span>{locale === 'ar' ? 'قصص وذكريات' : 'Stories & Memories'}</span>
              </div>
              <div className="w-1 h-1 bg-emerald-100/50 rounded-full hidden sm:block"></div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-200" />
                <span>{locale === 'ar' ? 'تراث محفوظ' : 'Preserved Heritage'}</span>
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
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6 font-accent">
              {locale === 'ar' ? 'تعرَّف على عائلتك بشكلٍ أعمق' : 'Know Your Family Deeper'}
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
              {locale === 'ar'
                ? 'أكثر من مجرد شجرة عائلة - هي جسر يربطك بأهلك وتاريخك وهويتك'
                : 'More than a family tree—it\'s a bridge connecting you to your people, history, and identity'}
            </p>
            {/* Islamic Divider */}
            <div className="divider-islamic w-48 mx-auto mt-8"></div>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Feature 1 - Know Your Family */}
            <div className="card-hover text-center group relative">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-islamic-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-t-xl"></div>
              <div className="gradient-islamic w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-smooth shadow-islamic">
                <Users className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4 font-accent">
                {locale === 'ar' ? 'اكتشف من هم أهلك' : 'Discover Who Your Family Is'}
              </h3>
              <p className="text-slate-600 leading-relaxed leading-arabic">
                {locale === 'ar'
                  ? 'تعرَّف على أقاربك القريبين والبعيدين، واكتشف صِلات القرابة بينكم. كل اسمٍ في شجرتك له قصة، وكل فردٍ له مكانة خاصة.'
                  : 'Meet your distant and close relatives, discover kinship ties, and learn where your family came from. Every name has a story, every person has a place.'}
              </p>
            </div>

            {/* Feature 2 - Connect & Communicate */}
            <div className="card-hover text-center group relative">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-gold-300 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-t-xl"></div>
              <div className="gradient-gold w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-smooth shadow-gold">
                <MessageCircle className="w-10 h-10 text-slate-800" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4 font-accent">
                {locale === 'ar' ? 'تواصل مع عائلتك' : 'Connect With Your Family'}
              </h3>
              <p className="text-slate-600 leading-relaxed leading-arabic">
                {locale === 'ar'
                  ? 'تحدَّث مع أفراد عائلتك، وشارِك معهم الذكريات والصور. ابقَ على تواصلٍ دائم مع الأهل أينما كانوا.'
                  : 'Chat with your family members, share memories and photos, and stay connected with relatives everywhere. Keeping family ties has never been easier.'}
              </p>
            </div>

            {/* Feature 3 - Preserve Heritage */}
            <div className="card-hover text-center group relative">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-heritage-terracotta to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-t-xl"></div>
              <div className="bg-gradient-to-br from-heritage-terracotta to-heritage-terracotta/80 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-smooth">
                <BookOpen className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4 font-accent">
                {locale === 'ar' ? 'احفظ تاريخ العائلة' : 'Preserve Family History'}
              </h3>
              <p className="text-slate-600 leading-relaxed leading-arabic">
                {locale === 'ar'
                  ? 'وثِّق قصص الأجداد وحِكمتهم، وسجِّل التقاليد والعادات. احفظ الذكريات قبل أن تضيع مع مرور الزمن.'
                  : 'Document ancestral stories and wisdom, record traditions and customs, and preserve memories for future generations. Don\'t let history fade with time.'}
              </p>
            </div>
          </div>

          {/* Additional Features Row */}
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mt-8">
            {/* Feature 4 - Geographic Origins */}
            <div className="card-hover text-center group relative">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-t-xl"></div>
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-smooth">
                <MapPin className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4 font-accent">
                {locale === 'ar' ? 'اكتشف جذورك الجغرافية' : 'Discover Your Geographic Roots'}
              </h3>
              <p className="text-slate-600 leading-relaxed leading-arabic">
                {locale === 'ar'
                  ? 'تتبَّع رحلة عائلتك على الخريطة، من الموطن الأصلي إلى أماكن الاستقرار. اعرِف من أين جئتَ لتعرف مَن أنت.'
                  : 'Trace your family journey across the map, from homeland to migration and settlement. Know where you came from to know who you are.'}
              </p>
            </div>

            {/* Feature 5 - Family Tree */}
            <div className="card-hover text-center group relative">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-t-xl"></div>
              <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-smooth">
                <TreeDeciduous className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4 font-accent">
                {locale === 'ar' ? 'ارسم شجرة عائلتك' : 'Draw Your Family Tree'}
              </h3>
              <p className="text-slate-600 leading-relaxed leading-arabic">
                {locale === 'ar'
                  ? 'أنشِئ شجرة عائلة تفاعلية وجميلة، وأضِف الأجداد والأحفاد. وثِّق كل علاقة قرابة بطريقة سهلة وواضحة.'
                  : 'Create a beautiful interactive family tree, add ancestors and descendants, and document every kinship in an easy visual way.'}
              </p>
            </div>

            {/* Feature 6 - Share & Collaborate */}
            <div className="card-hover text-center group relative">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-pink-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-t-xl"></div>
              <div className="bg-gradient-to-br from-pink-500 to-pink-600 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-smooth">
                <Heart className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4 font-accent">
                {locale === 'ar' ? 'شارك وتعاون مع الأهل' : 'Share & Collaborate with Family'}
              </h3>
              <p className="text-slate-600 leading-relaxed leading-arabic">
                {locale === 'ar'
                  ? 'ادعُ أفراد العائلة للمشاركة، ليُضيف كلٌّ منهم ما يعرفه. معًا تبنون أرشيفًا عائليًا لا يُنسى.'
                  : 'Invite family members to participate, each adds what they know, and together you build a complete unforgettable family archive.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Quote Section - Arabic Heritage */}
      <section className="py-16 bg-emerald-50">
        <div className="container mx-auto px-4">
          <blockquote className="max-w-3xl mx-auto text-center">
            <Quote className="w-12 h-12 text-amber-500 mx-auto mb-6 opacity-60" />
            <p className="text-2xl md:text-3xl text-emerald-700 font-display leading-relaxed mb-6">
              {locale === 'ar'
                ? 'من لا يعرف ماضيه، لا يفهم حاضره، ولا يستطيع أن يخطط لمستقبله'
                : 'He who does not know his past, cannot understand his present, nor plan for his future'}
            </p>
            <footer className="text-slate-500 font-accent">
              {locale === 'ar' ? '— حكمة عربية' : '— Arabic Wisdom'}
            </footer>
          </blockquote>
        </div>
      </section>

      {/* Connection Section - NEW */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-pink-100 text-pink-600 mb-8">
              <Heart className="w-8 h-8" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6 font-accent">
              {locale === 'ar' ? 'لأن العائلة أكثر من مجرد أسماء' : 'Because Family Is More Than Just Names'}
            </h2>
            <p className="text-xl text-slate-600 leading-relaxed mb-8">
              {locale === 'ar'
                ? 'العائلة هي الأمان والانتماء، هي الجذور التي تمنحنا القوة. نساعدك على إعادة اكتشاف روابطك العائلية، والتعرُّف على مَن يشاركونك الدم والتاريخ. كل قريبٍ هو جزءٌ من قصتك، وكل ذكرى كنزٌ للأجيال القادمة.'
                : 'Family is safety, it is belonging, it is the roots that give us strength. At Shajara, we help you rediscover your family bonds and meet those who share your blood and history. Every relative you meet is part of your story, and every memory you preserve is a treasure for your future generations.'}
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm text-slate-500">
              <span className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-full">
                <Users className="w-4 h-4" />
                {locale === 'ar' ? 'اكتشف أقاربك' : 'Discover relatives'}
              </span>
              <span className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-full">
                <MessageCircle className="w-4 h-4" />
                {locale === 'ar' ? 'تواصل معهم' : 'Connect with them'}
              </span>
              <span className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-full">
                <BookOpen className="w-4 h-4" />
                {locale === 'ar' ? 'شارك القصص' : 'Share stories'}
              </span>
              <span className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-full">
                <Heart className="w-4 h-4" />
                {locale === 'ar' ? 'احفظ الذكريات' : 'Preserve memories'}
              </span>
            </div>
          </div>
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
          <h2 className="text-4xl md:text-5xl font-bold mb-6 font-accent">
            {locale === 'ar' ? 'ابدأ رحلتك مع عائلتك' : 'Start Your Journey With Family'}
          </h2>
          <p className="text-xl text-emerald-100/80 mb-12 max-w-2xl mx-auto leading-relaxed">
            {locale === 'ar'
              ? 'كل رابطة عائلية تستحق أن تُصان، وكل ذكرى تستحق أن تبقى. ابدأ اليوم ببناء شجرة عائلتك، وتواصَل مع أهلك، واحفظوا تاريخكم معًا.'
              : 'Every family bond deserves to be cherished, and every memory deserves to be preserved. Start today building your family tree, connect with your relatives, and preserve your shared history for generations to come.'}
          </p>

          <Link
            href={`/${locale}/tree`}
            className="inline-flex items-center gap-3 btn-heritage px-10 py-5 rounded-xl font-bold text-lg text-slate-900 hover:scale-105 transition-smooth"
          >
            <Users className="w-6 h-6" />
            <span>{locale === 'ar' ? 'تواصل مع عائلتك الآن' : 'Connect With Your Family Now'}</span>
          </Link>

          {/* Footer Quote */}
          <p className="mt-12 text-amber-200/60 text-sm font-display italic">
            {locale === 'ar' ? '«صِلَةُ الرَّحِمِ تَزيدُ في الرِّزقِ وَتُنسِئُ في الأَجَل»' : '"Family ties increase blessings and extend life"'}
          </p>
        </div>
      </section>
    </div>
  );
}
