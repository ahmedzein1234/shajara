'use client';

import * as React from 'react';
import DOMPurify from 'dompurify';
import {
  Bold, Italic, List, ListOrdered, Quote, Image as ImageIcon,
  Calendar, MapPin, Users, Save, X, Eye, Loader2, Upload
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  type StoryType,
  type CreateStoryInput,
  type UpdateStoryInput,
  type Story,
  createStory,
  updateStory,
} from '@/lib/db/story-actions';

export interface StoryEditorProps {
  treeId: string;
  story?: Story;
  locale?: 'ar' | 'en';
  onSave?: (story: Story) => void;
  onCancel?: () => void;
}

const translations = {
  ar: {
    newStory: 'شارك قصة عائلتك',
    editStory: 'تعديل القصة',
    titlePlaceholder: 'عنوان القصة التي تريد مشاركتها...',
    contentPlaceholder: 'اكتب قصتك هنا... شارِك ذكريات عائلتك وقصص أجدادك لتبقى حيَّة للأجيال القادمة.',
    storyType: 'نوع القصة',
    eventDate: 'تاريخ الحدث',
    location: 'المكان',
    coverImage: 'صورة الغلاف',
    uploadCover: 'رفع صورة',
    saveDraft: 'حفظ كمسودة',
    publish: 'شارك مع العائلة',
    preview: 'معاينة',
    cancel: 'إلغاء',
    saving: 'جاري الحفظ...',
    types: {
      memory: 'ذكرى عائلية',
      biography: 'قصة حياة',
      tradition: 'تقاليد العائلة',
      recipe: 'وصفة الجدة',
      historical: 'من تاريخ العائلة',
      milestone: 'إنجاز عائلي',
      tribute: 'تكريم شخص عزيز',
    },
    formatting: {
      bold: 'عريض',
      italic: 'مائل',
      bulletList: 'قائمة نقطية',
      numberedList: 'قائمة مرقمة',
      quote: 'اقتباس',
      image: 'صورة',
    },
  },
  en: {
    newStory: 'Share a Family Story',
    editStory: 'Edit Story',
    titlePlaceholder: 'The title of the story you want to share...',
    contentPlaceholder: 'Write your story here... Share your family memories and ancestors\' tales to keep them alive for future generations. What moments brought your family together?',
    storyType: 'Story Type',
    eventDate: 'Event Date',
    location: 'Location',
    coverImage: 'Cover Image',
    uploadCover: 'Upload Image',
    saveDraft: 'Save Draft',
    publish: 'Share with Family',
    preview: 'Preview',
    cancel: 'Cancel',
    saving: 'Saving...',
    types: {
      memory: 'Family Memory',
      biography: 'Life Story',
      tradition: 'Family Tradition',
      recipe: 'Grandma\'s Recipe',
      historical: 'Family History',
      milestone: 'Family Achievement',
      tribute: 'Honoring a Loved One',
    },
    formatting: {
      bold: 'Bold',
      italic: 'Italic',
      bulletList: 'Bullet List',
      numberedList: 'Numbered List',
      quote: 'Quote',
      image: 'Image',
    },
  },
};

const storyTypeIcons: Record<StoryType, string> = {
  memory: '💭',
  biography: '📖',
  tradition: '🎭',
  recipe: '🍽️',
  historical: '📜',
  milestone: '🏆',
  tribute: '🕯️',
};

// Sanitize HTML content to prevent XSS attacks
const sanitizeHtml = (html: string): string => {
  if (typeof window === 'undefined') {
    // Server-side: return empty string or implement server-side sanitization
    return '';
  }
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'b', 'i', 'em', 'strong', 'a', 'ul', 'ol', 'li', 'br', 'blockquote', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span', 'div'],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'style'],
    ALLOW_DATA_ATTR: false,
    // Force all links to open in new tab with noopener
    ADD_ATTR: ['target', 'rel'],
    FORBID_TAGS: ['script', 'object', 'embed', 'form', 'input', 'iframe'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
  });
};

export function StoryEditor({
  treeId,
  story,
  locale = 'ar',
  onSave,
  onCancel,
}: StoryEditorProps) {
  const t = translations[locale];
  const isRTL = locale === 'ar';
  const isEditing = Boolean(story);

  const [title, setTitle] = React.useState(
    locale === 'ar' ? story?.title_ar || '' : story?.title_en || story?.title_ar || ''
  );
  const [content, setContent] = React.useState(
    locale === 'ar' ? story?.content_ar || '' : story?.content_en || story?.content_ar || ''
  );
  const [storyType, setStoryType] = React.useState<StoryType>(story?.story_type || 'memory');
  const [eventDate, setEventDate] = React.useState(story?.event_date || '');
  const [location, setLocation] = React.useState(
    locale === 'ar' ? story?.location_ar || '' : story?.location_en || story?.location_ar || ''
  );
  const [coverImage, setCoverImage] = React.useState(story?.cover_image_url || '');
  const [saving, setSaving] = React.useState(false);
  const [showPreview, setShowPreview] = React.useState(false);

  const editorRef = React.useRef<HTMLDivElement>(null);

  const handleFormat = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const handleContentChange = () => {
    if (editorRef.current) {
      setContent(editorRef.current.innerHTML);
    }
  };

  const handleSave = async (publish: boolean = false) => {
    if (!title.trim()) return;

    setSaving(true);
    try {
      if (isEditing && story) {
        const updateInput: UpdateStoryInput = {
          status: publish ? 'published' : 'draft',
        };

        if (locale === 'ar') {
          updateInput.title_ar = title;
          updateInput.content_ar = content;
          updateInput.location_ar = location || undefined;
        } else {
          updateInput.title_en = title;
          updateInput.content_en = content;
          updateInput.location_en = location || undefined;
        }

        if (storyType !== story.story_type) updateInput.story_type = storyType;
        if (eventDate !== story.event_date) updateInput.event_date = eventDate || undefined;
        if (coverImage !== story.cover_image_url) updateInput.cover_image_url = coverImage || undefined;

        const result = await updateStory(story.id, updateInput);
        if (result.success) {
          onSave?.({
            ...story,
            ...updateInput,
          } as Story);
        }
      } else {
        const input: CreateStoryInput = {
          tree_id: treeId,
          title_ar: locale === 'ar' ? title : title,
          content_ar: locale === 'ar' ? content : undefined,
          content_en: locale === 'en' ? content : undefined,
          cover_image_url: coverImage || undefined,
          story_type: storyType,
          event_date: eventDate || undefined,
          location_ar: locale === 'ar' ? location : undefined,
          location_en: locale === 'en' ? location : undefined,
          status: publish ? 'published' : 'draft',
        };

        const result = await createStory(input);
        if (result.success && result.story) {
          onSave?.(result.story);
        }
      }
    } catch (error) {
      console.error('Failed to save story:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          {isEditing ? t.editStory : t.newStory}
        </h2>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
          >
            <Eye className="w-4 h-4 me-1" />
            {t.preview}
          </Button>
          {onCancel && (
            <Button variant="ghost" size="sm" onClick={onCancel}>
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {showPreview ? (
        /* Preview Mode */
        <div className="p-6">
          {coverImage && (
            <img
              src={coverImage}
              alt=""
              className="w-full h-64 object-cover rounded-xl mb-6"
            />
          )}
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">{storyTypeIcons[storyType]}</span>
            <span className="text-sm text-slate-500">{t.types[storyType]}</span>
            {eventDate && (
              <>
                <span className="text-slate-300">•</span>
                <span className="text-sm text-slate-500">{eventDate}</span>
              </>
            )}
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
            {title || t.titlePlaceholder}
          </h1>
          <div
            className="prose dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) || `<p class="text-slate-400">${t.contentPlaceholder}</p>` }}
          />
        </div>
      ) : (
        /* Editor Mode */
        <div className="p-4 space-y-4">
          {/* Cover Image */}
          <div className="relative">
            {coverImage ? (
              <div className="relative">
                <img
                  src={coverImage}
                  alt=""
                  className="w-full h-48 object-cover rounded-xl"
                />
                <button
                  onClick={() => setCoverImage('')}
                  className="absolute top-2 end-2 p-1.5 bg-black/50 text-white rounded-full hover:bg-black/70"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                <Upload className="w-8 h-8 text-slate-400 mb-2" />
                <span className="text-sm text-slate-500">{t.uploadCover}</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      // In a real app, upload to R2 and get URL
                      const url = URL.createObjectURL(file);
                      setCoverImage(url);
                    }
                  }}
                />
              </label>
            )}
          </div>

          {/* Story Type & Date Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* Story Type */}
            <div>
              <label className="text-xs text-slate-500 mb-1 block">{t.storyType}</label>
              <select
                value={storyType}
                onChange={(e) => setStoryType(e.target.value as StoryType)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
              >
                {Object.entries(t.types).map(([key, label]) => (
                  <option key={key} value={key}>
                    {storyTypeIcons[key as StoryType]} {label}
                  </option>
                ))}
              </select>
            </div>

            {/* Event Date */}
            <div>
              <label className="text-xs text-slate-500 mb-1 block">{t.eventDate}</label>
              <div className="relative">
                <Calendar className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full ps-9 pe-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                />
              </div>
            </div>

            {/* Location */}
            <div className="col-span-2">
              <label className="text-xs text-slate-500 mb-1 block">{t.location}</label>
              <div className="relative">
                <MapPin className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder={t.location}
                  className="w-full ps-9 pe-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Title */}
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t.titlePlaceholder}
            className="w-full px-4 py-3 text-xl font-bold border-0 border-b border-slate-200 dark:border-slate-700 bg-transparent focus:outline-none focus:border-islamic-primary"
          />

          {/* Formatting Toolbar */}
          <div className="flex items-center gap-1 p-2 bg-slate-50 dark:bg-slate-900 rounded-lg">
            <button
              onClick={() => handleFormat('bold')}
              className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"
              title={t.formatting.bold}
            >
              <Bold className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleFormat('italic')}
              className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"
              title={t.formatting.italic}
            >
              <Italic className="w-4 h-4" />
            </button>
            <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1" />
            <button
              onClick={() => handleFormat('insertUnorderedList')}
              className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"
              title={t.formatting.bulletList}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleFormat('insertOrderedList')}
              className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"
              title={t.formatting.numberedList}
            >
              <ListOrdered className="w-4 h-4" />
            </button>
            <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1" />
            <button
              onClick={() => handleFormat('formatBlock', 'blockquote')}
              className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"
              title={t.formatting.quote}
            >
              <Quote className="w-4 h-4" />
            </button>
          </div>

          {/* Content Editor */}
          <div
            ref={editorRef}
            contentEditable
            onInput={handleContentChange}
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }}
            className="min-h-[300px] p-4 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-islamic-primary prose dark:prose-invert max-w-none"
            data-placeholder={t.contentPlaceholder}
          />
        </div>
      )}

      {/* Footer Actions */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-end gap-3">
        {onCancel && (
          <Button variant="ghost" onClick={onCancel}>
            {t.cancel}
          </Button>
        )}
        <Button
          variant="outline"
          onClick={() => handleSave(false)}
          disabled={saving || !title.trim()}
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin me-2" /> : <Save className="w-4 h-4 me-2" />}
          {t.saveDraft}
        </Button>
        <Button
          onClick={() => handleSave(true)}
          disabled={saving || !title.trim()}
          className="bg-islamic-primary hover:bg-islamic-dark"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : t.publish}
        </Button>
      </div>

      {/* Empty content placeholder styling */}
      <style jsx global>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}
