/**
 * Lazy-loaded FamilyMap Component
 * MapLibre GL JS adds ~800KB to the bundle, so we lazy load it
 */

'use client';

import dynamic from 'next/dynamic';
import type { FamilyMapProps } from '@/types/map';

// Map skeleton loading state
function MapSkeleton() {
  return (
    <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 animate-pulse flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-slate-300 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-slate-500">Loading map...</p>
        <p className="text-xs text-slate-400 mt-1">جاري تحميل الخريطة...</p>
      </div>
    </div>
  );
}

// Lazy load the FamilyMap component with no SSR (MapLibre doesn't support SSR)
const LazyFamilyMap = dynamic(
  () => import('./FamilyMap').then(mod => ({ default: mod.FamilyMap })),
  {
    loading: () => <MapSkeleton />,
    ssr: false,
  }
);

export { LazyFamilyMap };
export type { FamilyMapProps };
