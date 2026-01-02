import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  Plus,
  User,
  Edit,
  Share2,
  Download,
  Search,
  Filter,
  Quote,
  Link2,
  Settings
} from 'lucide-react';
import { getTreeWithData } from '@/lib/db/actions';
import { getSession } from '@/lib/auth/actions';
import { getUserAccessLevel } from '@/lib/privacy/actions';
import TreeViewClient from './TreeViewClient';

export default async function TreeViewPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;

  // Fetch tree data from the database
  const { tree, persons, relationships } = await getTreeWithData(id);

  // If tree not found, show 404
  if (!tree) {
    notFound();
  }

  // Check user access level for showing settings
  const session = await getSession();
  const access = session?.user ? await getUserAccessLevel(id, session.user.id) : { level: null, isOwner: false, isBlocked: false };
  const canManageTree = access.isOwner || access.level === 'admin' || access.level === 'editor';

  // Find the root person (person with no parents, or oldest person)
  const rootPersonId = persons.length > 0 ? findRootPerson(persons, relationships) : undefined;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-16 z-40">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link
                href={`/${locale}/tree`}
                className="p-2 hover:bg-slate-100 rounded-lg transition-smooth"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">
                  {tree.name}
                </h1>
                <p className="text-slate-600">
                  {persons.length} {locale === 'ar' ? 'فرد' : 'members'}
                  {tree.description && ` • ${tree.description}`}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <button className="btn-outline flex items-center gap-2">
                <Share2 className="w-4 h-4" />
                <span>{locale === 'ar' ? 'مشاركة' : 'Share'}</span>
              </button>
              <button className="btn-outline flex items-center gap-2">
                <Download className="w-4 h-4" />
                <span>{locale === 'ar' ? 'تصدير' : 'Export'}</span>
              </button>
              {canManageTree && (
                <Link href={`/${locale}/tree/${id}/settings`} className="btn-outline flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  <span>{locale === 'ar' ? 'إعدادات' : 'Settings'}</span>
                </Link>
              )}
              <Link href={`/${locale}/tree/${id}/edit`} className="btn-secondary flex items-center gap-2">
                <Edit className="w-4 h-4" />
                <span>{locale === 'ar' ? 'تعديل' : 'Edit'}</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Tree Visualization Area */}
          <div className="lg:col-span-2">
            <div className="card p-0 overflow-hidden" style={{ height: '700px' }}>
              {persons.length > 0 ? (
                <TreeViewClient
                  treeId={id}
                  persons={persons}
                  relationships={relationships}
                  rootPersonId={rootPersonId}
                  locale={locale as 'ar' | 'en'}
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full py-20 text-center relative">
                  {/* Subtle pattern background */}
                  <div className="absolute inset-0 bg-pattern-arabesque opacity-10"></div>

                  <div className="relative">
                    <div className="bg-gradient-to-br from-islamic-500 to-emerald-600 w-32 h-32 rounded-full flex items-center justify-center mb-8 shadow-islamic animate-float">
                      <User className="w-16 h-16 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-4 font-display">
                      {locale === 'ar' ? 'ابدأ رحلة التعرف على عائلتك' : 'Start Discovering Your Family'}
                    </h3>
                    <p className="text-slate-600 mb-8 max-w-md leading-relaxed">
                      {locale === 'ar'
                        ? 'كل رحلة تبدأ بخطوة، وكل عائلة تبدأ باسم. أضف نفسك أو والديك أو أجدادك، وشاهد كيف تتفرع شجرة عائلتك وتتواصل أغصانها.'
                        : 'Every journey begins with a step, and every family begins with a name. Add yourself, your parents, or grandparents, and watch your family tree grow and connect.'}
                    </p>
                    <Link
                      href={`/${locale}/tree/${id}/person/new`}
                      className="btn-primary inline-flex items-center gap-2"
                    >
                      <Plus className="w-5 h-5" />
                      <span>{locale === 'ar' ? 'ابدأ الآن' : 'Start Now'}</span>
                    </Link>

                    {/* Arabic Proverb */}
                    {locale === 'ar' && (
                      <p className="mt-8 text-gold-400 text-sm font-display italic flex items-center justify-center gap-2">
                        <Quote className="w-4 h-4" />
                        صِلَةُ الرَّحِم تزيدُ في العُمر
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar - Person List */}
          <div className="lg:col-span-1">
            <div className="card sticky top-32">
              {/* Search and Filter */}
              <div className="mb-6 space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder={locale === 'ar' ? 'بحث عن شخص...' : 'Search person...'}
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <button className="w-full btn-outline flex items-center justify-center gap-2">
                  <Filter className="w-4 h-4" />
                  <span>{locale === 'ar' ? 'تصفية' : 'Filter'}</span>
                </button>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 mb-6">
                <Link
                  href={`/${locale}/tree/${id}/person/new`}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                  data-tour="add-person"
                >
                  <Plus className="w-5 h-5" />
                  <span>{locale === 'ar' ? 'أضف فرداً من العائلة' : 'Add Family Member'}</span>
                </Link>
                <Link
                  href={`/${locale}/tree/${id}/relationship/new`}
                  className="btn-secondary w-full flex items-center justify-center gap-2"
                >
                  <Link2 className="w-5 h-5" />
                  <span>{locale === 'ar' ? 'اربط بين الأفراد' : 'Connect Members'}</span>
                </Link>
              </div>

              {/* Person List */}
              <div>
                <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2 font-accent">
                  <User className="w-5 h-5 text-islamic-500" />
                  <span>{locale === 'ar' ? 'أبناء العائلة وبناتها' : 'Family Members'}</span>
                  <span className="text-sm font-normal text-slate-500">({persons.length})</span>
                </h3>

                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {persons.map((person) => (
                    <Link
                      key={person.id}
                      href={`/${locale}/person/${person.id}`}
                      className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-lg transition-smooth border border-slate-200 hover:border-emerald-300"
                    >
                      {/* Avatar */}
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 ${
                        person.gender === 'male'
                          ? 'bg-gradient-to-br from-blue-400 to-blue-600'
                          : 'bg-gradient-to-br from-pink-400 to-pink-600'
                      }`}>
                        {person.given_name.charAt(0)}
                      </div>

                      {/* Info */}
                      <div className="flex-grow min-w-0">
                        <div className="font-semibold text-slate-900 truncate">
                          {locale === 'ar' ? person.full_name_ar || person.given_name : person.full_name_en || person.given_name}
                        </div>
                        <div className="text-sm text-slate-600">
                          {person.birth_date ? new Date(person.birth_date).getFullYear() : ''}
                          {person.death_date ? ` - ${new Date(person.death_date).getFullYear()}` : person.is_living ? '' : ''}
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div className="flex-shrink-0">
                        <div className={`text-xs font-semibold px-2 py-1 rounded ${
                          person.is_living
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {person.is_living
                            ? (locale === 'ar' ? 'على قيد الحياة' : 'Living')
                            : (locale === 'ar' ? 'متوفى' : 'Deceased')}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Find the root person in the tree (person with no parents)
 */
function findRootPerson(
  persons: { id: string; birth_date: string | null }[],
  relationships: { person1_id: string; person2_id: string; relationship_type: string }[]
): string | undefined {
  // Get all person IDs that are children (have parent relationships)
  const childIds = new Set(
    relationships
      .filter(r => r.relationship_type === 'parent')
      .map(r => r.person2_id)
  );

  // Find persons who are not children (potential roots)
  const potentialRoots = persons.filter(p => !childIds.has(p.id));

  if (potentialRoots.length === 0) {
    // If everyone has a parent, return the first person
    return persons[0]?.id;
  }

  // Return the oldest person among potential roots
  const sortedRoots = potentialRoots.sort((a, b) => {
    if (!a.birth_date && !b.birth_date) return 0;
    if (!a.birth_date) return 1;
    if (!b.birth_date) return -1;
    return new Date(a.birth_date).getTime() - new Date(b.birth_date).getTime();
  });

  return sortedRoots[0]?.id;
}
