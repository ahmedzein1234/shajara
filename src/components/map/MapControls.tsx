/**
 * MapControls Component
 * Control buttons for map interaction (zoom, fullscreen, layers, timeline)
 */

'use client';

import { useState } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize,
  Minimize,
  Layers,
  Clock,
  MapIcon,
  Sun,
  Moon,
} from 'lucide-react';
import type { MapControlsProps, MapStyle } from '@/types/map';

// =====================================================
// MAIN COMPONENT
// =====================================================

export function MapControls({
  map,
  controlState,
  onControlChange,
  locale = 'ar',
  className = '',
}: MapControlsProps) {
  const [showLayerPanel, setShowLayerPanel] = useState(false);
  const [showStylePanel, setShowStylePanel] = useState(false);
  const [showTimelinePanel, setShowTimelinePanel] = useState(false);

  const isRtl = locale === 'ar';

  // =====================================================
  // ZOOM CONTROLS
  // =====================================================

  const handleZoomIn = () => {
    if (!map) return;
    map.zoomIn({ duration: 300 });
  };

  const handleZoomOut = () => {
    if (!map) return;
    map.zoomOut({ duration: 300 });
  };

  // =====================================================
  // FULLSCREEN CONTROL
  // =====================================================

  const handleFullscreen = async () => {
    const container = map.getContainer();

    if (!document.fullscreenElement) {
      try {
        await container.requestFullscreen();
        onControlChange({ isFullscreen: true });
      } catch (err) {
        console.error('Fullscreen error:', err);
      }
    } else {
      try {
        await document.exitFullscreen();
        onControlChange({ isFullscreen: false });
      } catch (err) {
        console.error('Exit fullscreen error:', err);
      }
    }
  };

  // =====================================================
  // THEME TOGGLE
  // =====================================================

  const handleThemeToggle = () => {
    const newTheme = controlState.currentTheme === 'light' ? 'dark' : 'light';
    onControlChange({ currentTheme: newTheme });
  };

  // =====================================================
  // LAYER VISIBILITY TOGGLE
  // =====================================================

  const handleLayerToggle = (layer: keyof typeof controlState.layerVisibility) => {
    onControlChange({
      layerVisibility: {
        ...controlState.layerVisibility,
        [layer]: !controlState.layerVisibility[layer],
      },
    });
  };

  // =====================================================
  // STYLE CHANGE
  // =====================================================

  const handleStyleChange = (style: MapStyle) => {
    onControlChange({ currentStyle: style });
    setShowStylePanel(false);
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div
      className={`absolute ${isRtl ? 'left-4' : 'right-4'} bottom-4 z-10 flex flex-col gap-2 ${className}`}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* Main Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-2 flex flex-col gap-1">
        {/* Zoom In */}
        <button
          onClick={handleZoomIn}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          title={isRtl ? 'تكبير' : 'Zoom in'}
        >
          <ZoomIn className="w-5 h-5 text-gray-700 dark:text-gray-300" />
        </button>

        {/* Zoom Out */}
        <button
          onClick={handleZoomOut}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          title={isRtl ? 'تصغير' : 'Zoom out'}
        >
          <ZoomOut className="w-5 h-5 text-gray-700 dark:text-gray-300" />
        </button>

        <div className="h-px bg-gray-200 dark:bg-gray-700 my-1" />

        {/* Layers */}
        <button
          onClick={() => {
            setShowLayerPanel(!showLayerPanel);
            setShowStylePanel(false);
            setShowTimelinePanel(false);
          }}
          className={`p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors ${
            showLayerPanel ? 'bg-primary-100 dark:bg-primary-900/30' : ''
          }`}
          title={isRtl ? 'الطبقات' : 'Layers'}
        >
          <Layers className="w-5 h-5 text-gray-700 dark:text-gray-300" />
        </button>

        {/* Style */}
        <button
          onClick={() => {
            setShowStylePanel(!showStylePanel);
            setShowLayerPanel(false);
            setShowTimelinePanel(false);
          }}
          className={`p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors ${
            showStylePanel ? 'bg-primary-100 dark:bg-primary-900/30' : ''
          }`}
          title={isRtl ? 'نمط الخريطة' : 'Map style'}
        >
          <MapIcon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
        </button>

        {/* Timeline */}
        <button
          onClick={() => {
            setShowTimelinePanel(!showTimelinePanel);
            setShowLayerPanel(false);
            setShowStylePanel(false);
          }}
          className={`p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors ${
            showTimelinePanel ? 'bg-primary-100 dark:bg-primary-900/30' : ''
          }`}
          title={isRtl ? 'الخط الزمني' : 'Timeline'}
        >
          <Clock className="w-5 h-5 text-gray-700 dark:text-gray-300" />
        </button>

        <div className="h-px bg-gray-200 dark:bg-gray-700 my-1" />

        {/* Theme Toggle */}
        <button
          onClick={handleThemeToggle}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          title={isRtl ? 'تبديل المظهر' : 'Toggle theme'}
        >
          {controlState.currentTheme === 'light' ? (
            <Moon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          ) : (
            <Sun className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          )}
        </button>

        {/* Fullscreen */}
        <button
          onClick={handleFullscreen}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          title={isRtl ? 'ملء الشاشة' : 'Fullscreen'}
        >
          {controlState.isFullscreen ? (
            <Minimize className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          ) : (
            <Maximize className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          )}
        </button>
      </div>

      {/* Layer Panel */}
      {showLayerPanel && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 w-64">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
            {isRtl ? 'طبقات الخريطة' : 'Map Layers'}
          </h3>

          <div className="space-y-2">
            {/* Birth Places */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={controlState.layerVisibility.birthPlaces}
                onChange={() => handleLayerToggle('birthPlaces')}
                className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">
                {isRtl ? 'أماكن الولادة' : 'Birth Places'}
              </span>
              <div className="w-3 h-3 rounded-full bg-primary-500" />
            </label>

            {/* Death Places */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={controlState.layerVisibility.deathPlaces}
                onChange={() => handleLayerToggle('deathPlaces')}
                className="w-4 h-4 text-gray-600 rounded focus:ring-gray-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">
                {isRtl ? 'أماكن الوفاة' : 'Death Places'}
              </span>
              <div className="w-3 h-3 rounded-full bg-gray-500" />
            </label>

            {/* Events */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={controlState.layerVisibility.events}
                onChange={() => handleLayerToggle('events')}
                className="w-4 h-4 text-violet-600 rounded focus:ring-violet-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">
                {isRtl ? 'الأحداث' : 'Events'}
              </span>
              <div className="w-3 h-3 rounded-full bg-violet-500" />
            </label>

            {/* Migration Paths */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={controlState.layerVisibility.migrationPaths}
                onChange={() => handleLayerToggle('migrationPaths')}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">
                {isRtl ? 'مسارات الهجرة' : 'Migration Paths'}
              </span>
              <div className="w-3 h-3 rounded-full bg-blue-500" />
            </label>

            {/* Clusters */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={controlState.layerVisibility.clusters}
                onChange={() => handleLayerToggle('clusters')}
                className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {isRtl ? 'تجميع العلامات' : 'Cluster Markers'}
              </span>
            </label>
          </div>
        </div>
      )}

      {/* Style Panel */}
      {showStylePanel && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 w-64">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
            {isRtl ? 'نمط الخريطة' : 'Map Style'}
          </h3>

          <div className="space-y-2">
            {/* OSM */}
            <button
              onClick={() => handleStyleChange('osm')}
              className={`w-full p-3 text-start rounded-lg border transition-colors ${
                controlState.currentStyle === 'osm'
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-primary-300'
              }`}
            >
              <div className="font-medium text-sm text-gray-900 dark:text-gray-100">
                {isRtl ? 'خريطة الشوارع' : 'Street Map'}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                OpenStreetMap
              </div>
            </button>

            {/* OSM Arabic */}
            <button
              onClick={() => handleStyleChange('osm-arabic')}
              className={`w-full p-3 text-start rounded-lg border transition-colors ${
                controlState.currentStyle === 'osm-arabic'
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-primary-300'
              }`}
            >
              <div className="font-medium text-sm text-gray-900 dark:text-gray-100">
                {isRtl ? 'خريطة عربية' : 'Arabic Map'}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {isRtl ? 'أسماء عربية' : 'Arabic labels'}
              </div>
            </button>

            {/* Streets (CartoDB) */}
            <button
              onClick={() => handleStyleChange('streets')}
              className={`w-full p-3 text-start rounded-lg border transition-colors ${
                controlState.currentStyle === 'streets'
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-primary-300'
              }`}
            >
              <div className="font-medium text-sm text-gray-900 dark:text-gray-100">
                {isRtl ? 'خريطة نظيفة' : 'Clean Streets'}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                CartoDB Positron
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Timeline Panel */}
      {showTimelinePanel && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 w-64">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
            {isRtl ? 'التصفية الزمنية' : 'Timeline Filter'}
          </h3>

          <div className="space-y-4">
            {/* Enable Timeline */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={controlState.timelineFilter.enabled}
                onChange={() =>
                  onControlChange({
                    timelineFilter: {
                      ...controlState.timelineFilter,
                      enabled: !controlState.timelineFilter.enabled,
                    },
                  })
                }
                className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {isRtl ? 'تفعيل التصفية' : 'Enable Filter'}
              </span>
            </label>

            {/* Year Range (placeholder) */}
            {controlState.timelineFilter.enabled && (
              <div className="space-y-2">
                <label className="block text-xs text-gray-600 dark:text-gray-400">
                  {isRtl ? 'نطاق السنوات' : 'Year Range'}
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder={isRtl ? 'من' : 'From'}
                    className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                  <input
                    type="number"
                    placeholder={isRtl ? 'إلى' : 'To'}
                    className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
