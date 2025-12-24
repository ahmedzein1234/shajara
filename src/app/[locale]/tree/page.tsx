import Link from 'next/link';
import { TreeDeciduous, Plus, Users, Calendar, Eye, Quote } from 'lucide-react';
import { getTrees } from '@/lib/db/actions';
import { getPersonsByTreeIdLocal, getRelationshipsByTreeIdLocal } from '@/lib/db/local';

// Color palette for trees - Islamic inspired
const treeColors = ['islamic', 'gold', 'terracotta', 'emerald', 'purple'];

export default async function TreeListPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Fetch trees from the database
  const trees = await getTrees();

  // Get member and relationship counts for each tree
  const treesWithStats = trees.map((tree, index) => {
    const persons = getPersonsByTreeIdLocal(tree.id);
    const relationships = getRelationshipsByTreeIdLocal(tree.id);

    return {
      ...tree,
      memberCount: persons.length,
      relationshipCount: relationships.length,
      color: treeColors[index % treeColors.length],
    };
  });

  // Calculate totals
  const totalMembers = treesWithStats.reduce((sum, tree) => sum + tree.memberCount, 0);
  const totalRelationships = treesWithStats.reduce((sum, tree) => sum + tree.relationshipCount, 0);

  return (
    <div className="container mx-auto px-4 py-12 animate-fade-in">
      {/* Header with Islamic Divider */}
      <div className="mb-16">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4 font-display">
              {locale === 'ar' ? 'بساتين الأنساب' : 'Family Trees'}
            </h1>
            <p className="text-lg text-slate-600 leading-relaxed max-w-xl">
              {locale === 'ar'
                ? 'هنا تجتمع أشجار عائلاتك كلها، كل شجرةٍ تحمل اسماً وتاريخاً وذكريات'
                : 'View and manage all your family trees in one place'}
            </p>
          </div>

          {/* Create New Tree Button */}
          <Link
            href={`/${locale}/tree/new`}
            className="btn-primary inline-flex items-center gap-3 justify-center"
          >
            <Plus className="w-5 h-5" />
            <span className="font-bold">
              {locale === 'ar' ? 'إنشاء شجرة جديدة' : 'Create New Tree'}
            </span>
          </Link>
        </div>
        {/* Islamic Divider */}
        <div className="divider-islamic w-64 mt-6"></div>
      </div>

      {/* Trees Grid */}
      {treesWithStats.length === 0 ? (
        /* Empty State - Enhanced with Arabic Poetry */
        <div className="card-heritage text-center py-20 relative overflow-hidden">
          {/* Subtle pattern background */}
          <div className="absolute inset-0 bg-pattern-arabesque opacity-20"></div>

          <div className="relative">
            <div className="bg-gradient-to-br from-islamic-500 to-emerald-600 w-28 h-28 rounded-full flex items-center justify-center mx-auto mb-8 shadow-islamic animate-float">
              <TreeDeciduous className="w-14 h-14 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-4 font-display">
              {locale === 'ar' ? 'البستان ينتظر الغارس' : 'No Trees Yet'}
            </h2>
            <p className="text-slate-600 mb-10 max-w-lg mx-auto leading-relaxed text-lg">
              {locale === 'ar'
                ? 'لم تزرع شجرتك الأولى بعد؟ لا بأس، كل رحلةٍ عظيمة تبدأ بخطوة. ابدأ الآن في توثيق تاريخ عائلتك، واحفظ أسماء من أحببت وذكرى من سبقك.'
                : 'Start your journey by creating your first family tree and begin documenting your family history'}
            </p>
            <Link href={`/${locale}/tree/new`} className="btn-primary inline-flex items-center gap-2">
              <Plus className="w-5 h-5" />
              <span>{locale === 'ar' ? 'أنشئ شجرة عائلتك' : 'Create Your Family Tree'}</span>
            </Link>

            {/* Arabic Proverb */}
            {locale === 'ar' && (
              <p className="mt-10 text-gold-400 text-sm font-display italic flex items-center justify-center gap-2">
                <Quote className="w-4 h-4" />
                فالأصول لا تُنسى، والجذور تبقى مهما طال الزمان
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {treesWithStats.map((tree) => {
            const gradientClass =
              tree.color === 'emerald'
                ? 'gradient-emerald'
                : tree.color === 'amber'
                ? 'gradient-amber'
                : tree.color === 'purple'
                ? 'gradient-purple'
                : tree.color === 'blue'
                ? 'bg-gradient-to-br from-blue-500 to-indigo-600'
                : 'bg-gradient-to-br from-rose-500 to-pink-600';

            return (
              <Link
                key={tree.id}
                href={`/${locale}/tree/${tree.id}`}
                className="group card-hover overflow-hidden"
              >
                {/* Tree Header with Gradient */}
                <div className={`${gradientClass} h-32 -mx-6 -mt-6 mb-6 flex items-center justify-center relative overflow-hidden`}>
                  <TreeDeciduous className="w-16 h-16 text-white/90" />
                  <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-smooth"></div>

                  {/* Public/Private Badge */}
                  {tree.is_public && (
                    <div className="absolute top-3 right-3 bg-white/20 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full">
                      {locale === 'ar' ? 'عامة' : 'Public'}
                    </div>
                  )}
                </div>

                {/* Tree Info */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900 group-hover:text-emerald-600 transition-smooth mb-1">
                      {tree.name}
                    </h3>
                    {tree.description && (
                      <p className="text-slate-600 text-sm line-clamp-2">
                        {tree.description}
                      </p>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Users className="w-4 h-4" />
                      <span className="font-medium">
                        {tree.memberCount} {locale === 'ar' ? 'فرد' : 'members'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <Calendar className="w-4 h-4" />
                      <span className="font-medium">
                        {new Date(tree.updated_at * 1000).toLocaleDateString(
                          locale === 'ar' ? 'ar-SA' : 'en-US',
                          { month: 'short', day: 'numeric' }
                        )}
                      </span>
                    </div>
                  </div>

                  {/* View Button */}
                  <div className="pt-4 border-t border-slate-200">
                    <div className="flex items-center gap-2 text-emerald-600 group-hover:text-emerald-700 font-semibold">
                      <Eye className="w-4 h-4" />
                      <span>{locale === 'ar' ? 'عرض الشجرة' : 'View Tree'}</span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Quick Stats - Enhanced with Arabic labels */}
      {treesWithStats.length > 0 && (
        <div className="mt-16 grid sm:grid-cols-3 gap-6">
          <div className="card text-center group hover:border-islamic-500 transition-colors">
            <div className="text-4xl font-bold text-islamic-500 mb-2 font-display">
              {treesWithStats.length}
            </div>
            <div className="text-slate-600 font-medium font-accent">
              {locale === 'ar' ? 'أشجار الذاكرة' : 'Family Trees'}
            </div>
          </div>

          <div className="card text-center group hover:border-gold-400 transition-colors">
            <div className="text-4xl font-bold text-gold-400 mb-2 font-display">
              {totalMembers}
            </div>
            <div className="text-slate-600 font-medium font-accent">
              {locale === 'ar' ? 'أفراد العائلة' : 'Total Members'}
            </div>
          </div>

          <div className="card text-center group hover:border-heritage-terracotta transition-colors">
            <div className="text-4xl font-bold text-heritage-terracotta mb-2 font-display">
              {totalRelationships}
            </div>
            <div className="text-slate-600 font-medium font-accent">
              {locale === 'ar' ? 'وشائج القربى' : 'Relationships'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
