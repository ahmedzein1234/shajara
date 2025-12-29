/**
 * Lazy-loaded StoryEditor Component
 * TipTap editor adds significant bundle size, so we lazy load it
 */

'use client';

import dynamic from 'next/dynamic';
import type { StoryEditorProps } from './StoryEditor';

// Editor skeleton loading state
function EditorSkeleton() {
  return (
    <div className="w-full min-h-[400px] bg-white rounded-xl border border-slate-200 animate-pulse">
      {/* Toolbar skeleton */}
      <div className="border-b border-slate-200 p-3 flex gap-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="w-8 h-8 bg-slate-200 rounded" />
        ))}
        <div className="flex-1" />
        {[1, 2].map((i) => (
          <div key={i} className="w-8 h-8 bg-slate-200 rounded" />
        ))}
      </div>

      {/* Content area skeleton */}
      <div className="p-6 space-y-4">
        <div className="h-6 bg-slate-200 rounded w-3/4" />
        <div className="h-4 bg-slate-100 rounded w-full" />
        <div className="h-4 bg-slate-100 rounded w-5/6" />
        <div className="h-4 bg-slate-100 rounded w-4/5" />
        <div className="h-4 bg-slate-100 rounded w-2/3" />
      </div>

      {/* Loading indicator */}
      <div className="p-4 text-center">
        <p className="text-sm text-slate-500">Loading editor...</p>
        <p className="text-xs text-slate-400">جاري تحميل المحرر...</p>
      </div>
    </div>
  );
}

// Lazy load the StoryEditor component
const LazyStoryEditor = dynamic(
  () => import('./StoryEditor').then(mod => ({ default: mod.StoryEditor })),
  {
    loading: () => <EditorSkeleton />,
    ssr: false, // Editor requires browser APIs
  }
);

export { LazyStoryEditor };
export type { StoryEditorProps };
