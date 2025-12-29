'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  ArrowRight, ArrowLeft, BookOpen, Plus, Search, Filter,
  TreeDeciduous, Grid, List
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StoryCard, LazyStoryEditor } from '@/components/stories';
import { type Story, type StoryType, getTreeStories } from '@/lib/db/story-actions';

interface StoriesClientProps {
  tree: {
    id: string;
    name_ar: string;
    name_en: string;
  };
  stories: Story[];
  featuredStories: Story[];
  currentUserId: string;
  locale: 'ar' | 'en';
}

const translations = {
  ar: {
    title: 'قصص العائلة',
    subtitle: 'تواصل مع عائلتك من خلال القصص والذكريات المشتركة',
    back: 'العودة للشجرة',
    newStory: 'شارك قصة',
    search: 'ابحث في قصص عائلتك...',
    filter: 'تصفية',
    all: 'الكل',
    featured: 'قصص مميزة',
    noStories: 'لم تُروَ أي قصة بعد',
    noStoriesDesc: 'كل عائلة لديها قصص تستحق أن تُروى. شارِك أول قصة لتبقى الذكريات حيَّة.',
    startWriting: 'شارك أول قصة',
    types: {
      memory: 'ذكريات عائلية',
      biography: 'قصص الحياة',
      tradition: 'تقاليد وعادات',
      recipe: 'وصفات الجدة',
      historical: 'من التاريخ',
      milestone: 'إنجازات',
      tribute: 'تكريم',
    },
  },
  en: {
    title: 'Family Stories',
    subtitle: 'Connect with your family through shared stories and memories',
    back: 'Back to Tree',
    newStory: 'Share a Story',
    search: 'Search your family stories...',
    filter: 'Filter',
    all: 'All',
    featured: 'Featured Stories',
    noStories: 'No stories shared yet',
    noStoriesDesc: 'Every family has stories worth telling. Share the first one to keep memories alive and connect generations',
    startWriting: 'Share First Story',
    types: {
      memory: 'Family Memories',
      biography: 'Life Stories',
      tradition: 'Traditions & Customs',
      recipe: 'Grandma\'s Recipes',
      historical: 'From History',
      milestone: 'Achievements',
      tribute: 'Tributes',
    },
  },
};

export function StoriesClient({
  tree,
  stories: initialStories,
  featuredStories,
  currentUserId,
  locale,
}: StoriesClientProps) {
  const t = translations[locale];
  const isRTL = locale === 'ar';
  const BackArrow = isRTL ? ArrowRight : ArrowLeft;

  const [stories, setStories] = React.useState(initialStories);
  const [showEditor, setShowEditor] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedType, setSelectedType] = React.useState<StoryType | 'all'>('all');
  const [viewMode, setViewMode] = React.useState<'grid' | 'list'>('grid');

  const treeName = locale === 'ar' ? tree.name_ar : tree.name_en;

  // Filter stories
  const filteredStories = React.useMemo(() => {
    return stories.filter((story) => {
      const matchesType = selectedType === 'all' || story.story_type === selectedType;
      const matchesSearch = !searchQuery ||
        story.title_ar.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (story.title_en && story.title_en.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (story.excerpt_ar && story.excerpt_ar.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesType && matchesSearch;
    });
  }, [stories, selectedType, searchQuery]);

  const handleStorySaved = async (story: Story) => {
    setShowEditor(false);
    // Refresh stories
    const updatedStories = await getTreeStories(tree.id, { status: 'published' });
    setStories(updatedStories);
  };

  if (showEditor) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="max-w-4xl mx-auto">
          <LazyStoryEditor
            treeId={tree.id}
            locale={locale}
            onSave={handleStorySaved}
            onCancel={() => setShowEditor(false)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href={`/${locale}/tree/${tree.id}`}
                className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <BackArrow className="w-5 h-5" />
              </Link>
              <div>
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-islamic-primary" />
                  <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                    {t.title}
                  </h1>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2 mt-1">
                  <TreeDeciduous className="w-4 h-4" />
                  {treeName}
                </p>
              </div>
            </div>

            <Button
              onClick={() => setShowEditor(true)}
              className="bg-islamic-primary hover:bg-islamic-dark"
            >
              <Plus className="w-4 h-4 me-2" />
              {t.newStory}
            </Button>
          </div>

          {/* Search and Filters */}
          <div className="mt-6 flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.search}
                className="w-full ps-10 pe-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-islamic-primary"
              />
            </div>

            {/* Type Filter */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
              <button
                onClick={() => setSelectedType('all')}
                className={`px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-colors ${
                  selectedType === 'all'
                    ? 'bg-islamic-primary text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                {t.all}
              </button>
              {(Object.keys(t.types) as StoryType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-colors ${
                    selectedType === type
                      ? 'bg-islamic-primary text-white'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {t.types[type]}
                </button>
              ))}
            </div>

            {/* View Toggle */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white dark:bg-slate-600 shadow' : ''}`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${viewMode === 'list' ? 'bg-white dark:bg-slate-600 shadow' : ''}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Featured Stories */}
        {featuredStories.length > 0 && selectedType === 'all' && !searchQuery && (
          <div className="mb-8">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
              {t.featured}
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredStories.map((story) => (
                <StoryCard
                  key={story.id}
                  story={story}
                  locale={locale}
                  variant="featured"
                  treeId={tree.id}
                />
              ))}
            </div>
          </div>
        )}

        {/* All Stories */}
        {filteredStories.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
              {t.noStories}
            </h3>
            <p className="text-slate-500 mb-6">{t.noStoriesDesc}</p>
            <Button
              onClick={() => setShowEditor(true)}
              className="bg-islamic-primary hover:bg-islamic-dark"
            >
              <Plus className="w-4 h-4 me-2" />
              {t.startWriting}
            </Button>
          </div>
        ) : (
          <div className={viewMode === 'grid'
            ? 'grid md:grid-cols-2 lg:grid-cols-3 gap-6'
            : 'space-y-4'
          }>
            {filteredStories.map((story) => (
              <StoryCard
                key={story.id}
                story={story}
                locale={locale}
                variant={viewMode === 'list' ? 'compact' : 'default'}
                treeId={tree.id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
