/**
 * TreeControls Component
 * Control panel for family tree navigation, zoom, and export
 */

'use client';

import React, { useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Download,
  Search,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Users,
  User,
  Layers,
  PieChart,
  Keyboard,
} from 'lucide-react';
import { TreeNode, LayoutType, ExportFormat } from '@/types/tree';
import { searchNodes } from '@/hooks/useTreeLayout';

interface TreeControlsProps {
  // Zoom controls
  scale: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  onFitView: () => void;

  // Layout controls
  layoutType: LayoutType;
  onLayoutChange: (layout: LayoutType) => void;

  // Search
  nodes: TreeNode[];
  onSearch?: (results: TreeNode[]) => void;
  onSelectNode?: (node: TreeNode) => void;

  // Export
  onExport?: (format: ExportFormat) => void;

  // Direction (RTL/LTR)
  direction: 'rtl' | 'ltr';
  onDirectionToggle?: () => void;

  // Keyboard shortcuts
  onShowShortcuts?: () => void;

  locale?: 'ar' | 'en';
  className?: string;
}

export function TreeControls({
  scale,
  onZoomIn,
  onZoomOut,
  onResetView,
  onFitView,
  layoutType,
  onLayoutChange,
  nodes,
  onSearch,
  onSelectNode,
  onExport,
  direction,
  onDirectionToggle,
  onShowShortcuts,
  locale = 'ar',
  className,
}: TreeControlsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<TreeNode[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const t = locale === 'ar' ? translations.ar : translations.en;

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      const results = searchNodes(nodes, query);
      setSearchResults(results);
      setShowSearchResults(true);
      onSearch?.(results);
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
      onSearch?.([]);
    }
  };

  const handleSelectResult = (node: TreeNode) => {
    onSelectNode?.(node);
    setShowSearchResults(false);
    setSearchQuery('');
  };

  const zoomPercent = Math.round(scale * 100);

  return (
    <div
      className={cn(
        'fixed top-6 end-6 z-10', // RTL-aware positioning
        'flex flex-col gap-3',
        'animate-slide-in-right', // Entrance animation
        className
      )}
      dir={locale === 'ar' ? 'rtl' : 'ltr'}
      style={{
        animationDuration: '0.4s',
        animationTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      {/* Search Bar - warm cream background */}
      <div className="relative">
        <div className="flex items-center gap-2 bg-warm-100 rounded-lg shadow-card-warm border border-warm-300 px-3 py-2">
          <Search size={18} className="text-warm-500" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="outline-none text-sm w-64 placeholder:text-warm-400 bg-transparent text-warm-800"
            dir={locale === 'ar' ? 'rtl' : 'ltr'}
          />
          {searchQuery && (
            <button
              onClick={() => handleSearch('')}
              className="text-warm-400 hover:text-warm-600 transition-colors"
            >
              <RotateCcw size={16} />
            </button>
          )}
        </div>

        {/* Search Results Dropdown - warm styling */}
        {showSearchResults && searchResults.length > 0 && (
          <div className="absolute top-full mt-2 w-full bg-warm-50 rounded-lg shadow-card-warm-hover border border-warm-200 max-h-80 overflow-y-auto">
            {searchResults.map((node) => (
              <button
                key={node.id}
                onClick={() => handleSelectResult(node)}
                className="w-full px-4 py-3 hover:bg-warm-100 border-b border-warm-100 last:border-b-0 text-start transition-colors"
              >
                <div className="font-medium text-sm text-warm-800">
                  {locale === 'ar'
                    ? node.person.full_name_ar || node.person.given_name
                    : node.person.full_name_en || node.person.given_name}
                </div>
                {node.person.birth_date && (
                  <div className="text-xs text-warm-500 mt-1">
                    {new Date(node.person.birth_date).getFullYear()}
                    {node.person.death_date && ` - ${new Date(node.person.death_date).getFullYear()}`}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}

        {showSearchResults && searchResults.length === 0 && searchQuery && (
          <div className="absolute top-full mt-2 w-full bg-warm-50 rounded-lg shadow-card-warm border border-warm-200 px-4 py-3 text-sm text-warm-500 text-center">
            {t.noResults}
          </div>
        )}
      </div>

      {/* Main Controls - warm heritage styling */}
      <div className="bg-warm-100 rounded-lg shadow-card-warm border border-warm-300 p-2">
        <div className="flex flex-col gap-2">
          {/* Zoom Controls */}
          <div className="flex items-center gap-1">
            <ControlButton
              icon={<ZoomOut size={18} />}
              onClick={onZoomOut}
              disabled={scale <= 0.1}
              tooltip={t.zoomOut}
              locale={locale}
            />
            <div className="px-3 py-1 text-xs font-medium text-warm-600 min-w-[60px] text-center">
              {zoomPercent}%
            </div>
            <ControlButton
              icon={<ZoomIn size={18} />}
              onClick={onZoomIn}
              disabled={scale >= 3.0}
              tooltip={t.zoomIn}
              locale={locale}
            />
            <div className="w-px h-6 bg-warm-300 mx-1" />
            <ControlButton
              icon={<Maximize2 size={18} />}
              onClick={onFitView}
              tooltip={t.fitView}
              locale={locale}
            />
            <ControlButton
              icon={<RotateCcw size={18} />}
              onClick={onResetView}
              tooltip={t.reset}
              locale={locale}
            />
          </div>

          {/* Layout Type Selector */}
          <div className="border-t border-warm-200 pt-2">
            <div className="text-xs font-medium text-warm-600 mb-2 px-1">{t.viewMode}</div>
            <div className="grid grid-cols-2 gap-1">
              <LayoutButton
                active={layoutType === 'descendants'}
                onClick={() => onLayoutChange('descendants')}
                icon={<Users size={16} />}
                label={t.descendants}
              />
              <LayoutButton
                active={layoutType === 'ancestors'}
                onClick={() => onLayoutChange('ancestors')}
                icon={<User size={16} />}
                label={t.ancestors}
              />
              <LayoutButton
                active={layoutType === 'hourglass'}
                onClick={() => onLayoutChange('hourglass')}
                icon={<Layers size={16} />}
                label={t.hourglass}
              />
              <LayoutButton
                active={layoutType === 'full'}
                onClick={() => onLayoutChange('full')}
                icon={<Maximize2 size={16} />}
                label={t.full}
              />
              <LayoutButton
                active={layoutType === 'fan'}
                onClick={() => onLayoutChange('fan')}
                icon={<PieChart size={16} />}
                label={t.fan}
              />
            </div>
          </div>

          {/* Direction Toggle */}
          {onDirectionToggle && (
            <div className="border-t border-warm-200 pt-2">
              <ControlButton
                icon={direction === 'rtl' ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                onClick={onDirectionToggle}
                tooltip={direction === 'rtl' ? t.switchToLtr : t.switchToRtl}
                locale={locale}
                fullWidth
                label={direction === 'rtl' ? 'RTL' : 'LTR'}
              />
            </div>
          )}

          {/* Export */}
          {onExport && (
            <div className="border-t border-warm-200 pt-2 relative">
              <ControlButton
                icon={<Download size={18} />}
                onClick={() => setShowExportMenu(!showExportMenu)}
                tooltip={t.export}
                locale={locale}
                fullWidth
                label={t.export}
              />

              {showExportMenu && (
                <div className="absolute bottom-full mb-2 end-0 bg-warm-50 rounded-lg shadow-card-warm-hover border border-warm-200 py-1 min-w-[150px]">
                  <ExportButton format="png" onClick={onExport} onClose={() => setShowExportMenu(false)} />
                  <ExportButton format="jpeg" onClick={onExport} onClose={() => setShowExportMenu(false)} />
                  <ExportButton format="svg" onClick={onExport} onClose={() => setShowExportMenu(false)} />
                  <ExportButton format="pdf" onClick={onExport} onClose={() => setShowExportMenu(false)} />
                </div>
              )}
            </div>
          )}

          {/* Keyboard Shortcuts */}
          {onShowShortcuts && (
            <div className="border-t border-warm-200 pt-2">
              <ControlButton
                icon={<Keyboard size={18} />}
                onClick={onShowShortcuts}
                tooltip={t.shortcuts}
                locale={locale}
                fullWidth
                label={t.shortcuts}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Control button component
 */
function ControlButton({
  icon,
  onClick,
  disabled = false,
  tooltip,
  locale = 'ar',
  fullWidth = false,
  label,
}: {
  icon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  tooltip?: string;
  locale?: 'ar' | 'en';
  fullWidth?: boolean;
  label?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'p-2 rounded-md transition-all duration-200',
        'hover:bg-warm-200 active:bg-warm-300 hover:scale-[1.02] active:scale-[0.98]',
        'disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:scale-100',
        'text-warm-700',
        fullWidth && 'w-full flex items-center justify-center gap-2'
      )}
      title={tooltip}
    >
      {icon}
      {label && <span className="text-xs font-medium">{label}</span>}
    </button>
  );
}

/**
 * Layout selection button
 */
function LayoutButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-2 py-1.5 rounded-md transition-all duration-200',
        'flex items-center justify-center gap-1.5',
        'text-xs font-medium',
        active
          ? 'bg-heritage-turquoise/10 text-heritage-turquoise border border-heritage-turquoise/30'
          : 'bg-warm-50 text-warm-600 hover:bg-warm-200 hover:text-warm-700 border border-transparent'
      )}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

/**
 * Export format button
 */
function ExportButton({
  format,
  onClick,
  onClose,
}: {
  format: ExportFormat;
  onClick: (format: ExportFormat) => void;
  onClose: () => void;
}) {
  const handleClick = () => {
    onClick(format);
    onClose();
  };

  return (
    <button
      onClick={handleClick}
      className="w-full px-4 py-2 text-start text-sm text-warm-700 hover:bg-warm-100 transition-colors"
    >
      {format.toUpperCase()}
    </button>
  );
}

/**
 * Translations
 */
const translations = {
  ar: {
    searchPlaceholder: 'ابحث عن شخص...',
    noResults: 'لا توجد نتائج',
    zoomIn: 'تكبير',
    zoomOut: 'تصغير',
    fitView: 'ملاءمة العرض',
    reset: 'إعادة تعيين',
    viewMode: 'نمط العرض',
    descendants: 'الأحفاد',
    ancestors: 'الأجداد',
    hourglass: 'الساعة الرملية',
    full: 'كامل',
    fan: 'مروحة',
    switchToRtl: 'التبديل إلى RTL',
    switchToLtr: 'التبديل إلى LTR',
    export: 'تصدير',
    shortcuts: 'اختصارات',
  },
  en: {
    searchPlaceholder: 'Search for a person...',
    noResults: 'No results found',
    zoomIn: 'Zoom In',
    zoomOut: 'Zoom Out',
    fitView: 'Fit View',
    reset: 'Reset',
    viewMode: 'View Mode',
    descendants: 'Descendants',
    ancestors: 'Ancestors',
    hourglass: 'Hourglass',
    full: 'Full',
    fan: 'Fan Chart',
    switchToRtl: 'Switch to RTL',
    switchToLtr: 'Switch to LTR',
    export: 'Export',
    shortcuts: 'Shortcuts',
  },
};
