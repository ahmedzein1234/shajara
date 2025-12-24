'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, TreeDeciduous, Loader2, Sparkles, Quote } from 'lucide-react';
import { createTree } from '@/lib/db/actions';

export default function NewTreePage() {
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;
  const isRTL = locale === 'ar';

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError(locale === 'ar' ? 'الرجاء إدخال اسم الشجرة' : 'Please enter a tree name');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const tree = await createTree({
        name: name.trim(),
        description: description.trim() || undefined,
        is_public: isPublic,
      });

      // Redirect to the new tree
      router.push(`/${locale}/tree/${tree.id}`);
    } catch (err) {
      console.error('Failed to create tree:', err);
      setError(locale === 'ar' ? 'حدث خطأ أثناء إنشاء الشجرة' : 'Failed to create tree');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 relative">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-pattern-arabesque opacity-30"></div>

      <div className="container mx-auto px-4 py-12 relative">
        {/* Back Link */}
        <Link
          href={`/${locale}/tree`}
          className="inline-flex items-center gap-2 text-slate-600 hover:text-islamic-500 mb-8 transition-smooth"
        >
          <ArrowLeft className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
          <span>{locale === 'ar' ? 'العودة إلى البستان' : 'Back to Trees'}</span>
        </Link>

        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="bg-gradient-to-br from-islamic-500 to-emerald-600 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-islamic animate-float">
              <TreeDeciduous className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4 font-display">
              {locale === 'ar' ? 'ازرع شجرةً جديدة' : 'Create New Tree'}
            </h1>
            <p className="text-lg text-slate-600 leading-relaxed max-w-md mx-auto">
              {locale === 'ar'
                ? 'كل شجرةٍ عظيمة بدأت ببذرة، وكل عائلةٍ كريمة بدأت باسم'
                : 'Every great tree began with a seed, every noble family began with a name'}
            </p>
            <div className="divider-islamic w-48 mx-auto mt-6"></div>
          </div>

          {/* Form Card */}
          <div className="card-heritage p-8 md:p-10">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Tree Name */}
              <div>
                <label
                  htmlFor="name"
                  className="block text-lg font-bold text-slate-900 mb-3 font-accent"
                >
                  {locale === 'ar' ? 'اسم الشجرة' : 'Tree Name'}
                  <span className="text-heritage-terracotta mr-1">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={locale === 'ar' ? 'مثال: عائلة الأنصاري' : 'e.g., The Smith Family'}
                  className="w-full px-5 py-4 text-lg border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-islamic-500 focus:border-islamic-500 transition-smooth placeholder:text-slate-400"
                  dir={isRTL ? 'rtl' : 'ltr'}
                />
              </div>

              {/* Description */}
              <div>
                <label
                  htmlFor="description"
                  className="block text-lg font-bold text-slate-900 mb-3 font-accent"
                >
                  {locale === 'ar' ? 'وصف الشجرة' : 'Description'}
                  <span className="text-slate-400 font-normal text-sm mr-2">
                    ({locale === 'ar' ? 'اختياري' : 'Optional'})
                  </span>
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={locale === 'ar'
                    ? 'اكتب قصة عائلتك، أو أصولها، أو أي ملاحظات تودّ حفظها...'
                    : 'Write about your family history, origins, or any notes...'}
                  rows={4}
                  className="w-full px-5 py-4 text-lg border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-islamic-500 focus:border-islamic-500 transition-smooth placeholder:text-slate-400 resize-none"
                  dir={isRTL ? 'rtl' : 'ltr'}
                />
              </div>

              {/* Privacy Toggle */}
              <div className="flex items-center justify-between p-5 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <div className="font-bold text-slate-900 font-accent">
                    {locale === 'ar' ? 'شجرة عامة' : 'Public Tree'}
                  </div>
                  <div className="text-sm text-slate-600">
                    {locale === 'ar'
                      ? 'يمكن للجميع مشاهدة هذه الشجرة'
                      : 'Anyone can view this tree'}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPublic(!isPublic)}
                  className={`relative w-14 h-8 rounded-full transition-smooth ${
                    isPublic ? 'bg-islamic-500' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                      isPublic
                        ? (isRTL ? 'right-7' : 'left-7')
                        : (isRTL ? 'right-1' : 'left-1')
                    }`}
                    style={{
                      transform: isPublic
                        ? (isRTL ? 'translateX(0)' : 'translateX(0)')
                        : 'translateX(0)'
                    }}
                  />
                </button>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-center">
                  {error}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full btn-primary py-5 text-lg font-bold flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span>{locale === 'ar' ? 'جارٍ الإنشاء...' : 'Creating...'}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-6 h-6" />
                    <span>{locale === 'ar' ? 'ازرع الشجرة' : 'Create Tree'}</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Arabic Proverb */}
          {locale === 'ar' && (
            <div className="text-center mt-10">
              <p className="text-gold-400 text-sm font-display italic flex items-center justify-center gap-2">
                <Quote className="w-4 h-4" />
                من غرس حصد، ومن زرع الخير لا يندم
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export const runtime = 'edge';
