'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Heart, MessageCircle, Eye, Calendar, MapPin, User,
  BookOpen, Loader2
} from 'lucide-react';
import { type Story, type StoryType, toggleStoryLike } from '@/lib/db/story-actions';

interface StoryCardProps {
  story: Story;
  locale?: 'ar' | 'en';
  showAuthor?: boolean;
  variant?: 'default' | 'compact' | 'featured';
  treeId?: string;
}

const storyTypeIcons: Record<StoryType, string> = {
  memory: '💭',
  biography: '📖',
  tradition: '🎭',
  recipe: '🍽️',
  historical: '📜',
  milestone: '🏆',
  tribute: '🕯️',
};

const storyTypeLabels = {
  ar: {
    memory: 'ذكرى',
    biography: 'سيرة ذاتية',
    tradition: 'تقاليد',
    recipe: 'وصفة',
    historical: 'تاريخي',
    milestone: 'إنجاز',
    tribute: 'تكريم',
  },
  en: {
    memory: 'Memory',
    biography: 'Biography',
    tradition: 'Tradition',
    recipe: 'Recipe',
    historical: 'Historical',
    milestone: 'Milestone',
    tribute: 'Tribute',
  },
};

function formatDate(timestamp: number, locale: 'ar' | 'en'): string {
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function StoryCard({
  story,
  locale = 'ar',
  showAuthor = true,
  variant = 'default',
  treeId,
}: StoryCardProps) {
  const isRTL = locale === 'ar';
  const [liked, setLiked] = React.useState(story.is_liked || false);
  const [likesCount, setLikesCount] = React.useState(story.likes_count);
  const [liking, setLiking] = React.useState(false);

  const title = locale === 'ar' ? story.title_ar : story.title_en || story.title_ar;
  const excerpt = locale === 'ar' ? story.excerpt_ar : story.excerpt_en || story.excerpt_ar;
  const location = locale === 'ar' ? story.location_ar : story.location_en || story.location_ar;

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setLiking(true);
    try {
      const result = await toggleStoryLike(story.id);
      if (result.success) {
        setLiked(result.liked);
        setLikesCount((prev) => prev + (result.liked ? 1 : -1));
      }
    } catch (error) {
      console.error('Failed to toggle like:', error);
    } finally {
      setLiking(false);
    }
  };

  const storyUrl = treeId ? `/${locale}/tree/${treeId}/stories/${story.id}` : '#';

  if (variant === 'compact') {
    return (
      <Link
        href={storyUrl}
        className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-islamic-primary transition-colors"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {story.cover_image_url ? (
          <img
            src={story.cover_image_url}
            alt=""
            className="w-16 h-16 rounded-lg object-cover shrink-0"
          />
        ) : (
          <div className="w-16 h-16 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0">
            <span className="text-2xl">{storyTypeIcons[story.story_type]}</span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-slate-900 dark:text-white truncate">{title}</h4>
          <p className="text-sm text-slate-500 truncate">{excerpt}</p>
          <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <Heart className={`w-3 h-3 ${liked ? 'fill-red-500 text-red-500' : ''}`} />
              {likesCount}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {story.views_count}
            </span>
          </div>
        </div>
      </Link>
    );
  }

  if (variant === 'featured') {
    return (
      <Link
        href={storyUrl}
        className="relative group overflow-hidden rounded-2xl"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {/* Background Image */}
        <div className="aspect-[16/9] w-full">
          {story.cover_image_url ? (
            <img
              src={story.cover_image_url}
              alt=""
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-islamic-primary to-islamic-dark flex items-center justify-center">
              <span className="text-6xl">{storyTypeIcons[story.story_type]}</span>
            </div>
          )}
        </div>

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

        {/* Content */}
        <div className="absolute bottom-0 start-0 end-0 p-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs text-white">
              {storyTypeIcons[story.story_type]} {storyTypeLabels[locale][story.story_type]}
            </span>
            {story.is_featured && (
              <span className="px-2 py-1 bg-amber-500/80 rounded-full text-xs text-white">
                {locale === 'ar' ? 'مميز' : 'Featured'}
              </span>
            )}
          </div>
          <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
          {excerpt && (
            <p className="text-sm text-white/80 line-clamp-2 mb-3">{excerpt}</p>
          )}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-sm text-white/70">
              {showAuthor && story.author_name && (
                <span className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  {story.author_name}
                </span>
              )}
              {story.event_date && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {story.event_date}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 text-white/70">
              <button
                onClick={handleLike}
                className="flex items-center gap-1 hover:text-red-400 transition-colors"
                disabled={liking}
              >
                {liking ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Heart className={`w-4 h-4 ${liked ? 'fill-red-500 text-red-500' : ''}`} />
                )}
                {likesCount}
              </button>
              <span className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                {story.views_count}
              </span>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  // Default variant
  return (
    <Link
      href={storyUrl}
      className="block bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden hover:border-islamic-primary transition-colors group"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Cover Image */}
      {story.cover_image_url ? (
        <div className="aspect-video w-full overflow-hidden">
          <img
            src={story.cover_image_url}
            alt=""
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
          />
        </div>
      ) : (
        <div className="aspect-video w-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center">
          <span className="text-5xl">{storyTypeIcons[story.story_type]}</span>
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        {/* Type Badge */}
        <div className="flex items-center gap-2 mb-2">
          <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded-full text-xs text-slate-600 dark:text-slate-300">
            {storyTypeIcons[story.story_type]} {storyTypeLabels[locale][story.story_type]}
          </span>
          {story.is_featured && (
            <span className="px-2 py-1 bg-amber-100 dark:bg-amber-900/30 rounded-full text-xs text-amber-700 dark:text-amber-400">
              {locale === 'ar' ? 'مميز' : 'Featured'}
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 line-clamp-2">
          {title}
        </h3>

        {/* Excerpt */}
        {excerpt && (
          <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-3 mb-3">
            {excerpt}
          </p>
        )}

        {/* Meta */}
        <div className="flex items-center justify-between text-sm text-slate-500">
          <div className="flex items-center gap-3">
            {showAuthor && story.author_name && (
              <span className="flex items-center gap-1">
                <User className="w-4 h-4" />
                {story.author_name}
              </span>
            )}
            {story.event_date && (
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {story.event_date}
              </span>
            )}
            {location && (
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {location}
              </span>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
          <button
            onClick={handleLike}
            className={`flex items-center gap-1 transition-colors ${liked ? 'text-red-500' : 'text-slate-400 hover:text-red-500'}`}
            disabled={liking}
          >
            {liking ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
            )}
            <span className="text-sm">{likesCount}</span>
          </button>
          <span className="flex items-center gap-1 text-slate-400">
            <MessageCircle className="w-4 h-4" />
            <span className="text-sm">{story.comments_count}</span>
          </span>
          <span className="flex items-center gap-1 text-slate-400">
            <Eye className="w-4 h-4" />
            <span className="text-sm">{story.views_count}</span>
          </span>
        </div>
      </div>
    </Link>
  );
}
