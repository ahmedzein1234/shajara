/**
 * RelationshipFinder Component
 * Find and visualize the relationship path between any two people
 */

'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { TreeNode } from '@/types/tree';
import { Person } from '@/lib/db/schema';
import {
  Search,
  X,
  ArrowRight,
  ArrowLeft,
  Users,
  Link2,
  Sparkles,
} from 'lucide-react';
import { cn, getInitials, generateAvatarColor } from '@/lib/utils';

interface RelationshipFinderProps {
  nodes: TreeNode[];
  isOpen: boolean;
  onClose: () => void;
  locale?: 'ar' | 'en';
  onHighlightPath?: (personIds: string[]) => void;
  onSelectPerson?: (personId: string) => void;
}

interface PathStep {
  node: TreeNode;
  relationship: string;
  direction: 'up' | 'down' | 'spouse';
}

const translations = {
  ar: {
    title: 'اكتشف القرابة',
    subtitle: 'اختر شخصين لمعرفة علاقتهما',
    firstPerson: 'الشخص الأول',
    secondPerson: 'الشخص الثاني',
    searchPlaceholder: 'ابحث عن شخص...',
    findRelationship: 'اكتشف العلاقة',
    noPath: 'لم يتم العثور على علاقة مباشرة',
    pathFound: 'تم العثور على العلاقة!',
    steps: 'خطوات',
    parent: 'والد/والدة',
    child: 'ابن/ابنة',
    spouse: 'زوج/زوجة',
    sibling: 'أخ/أخت',
    relationships: {
      father: 'الأب',
      mother: 'الأم',
      son: 'الابن',
      daughter: 'الابنة',
      husband: 'الزوج',
      wife: 'الزوجة',
      brother: 'الأخ',
      sister: 'الأخت',
      grandfather: 'الجد',
      grandmother: 'الجدة',
      grandson: 'الحفيد',
      granddaughter: 'الحفيدة',
      uncle: 'العم/الخال',
      aunt: 'العمة/الخالة',
      cousin: 'ابن/ابنة العم',
      nephew: 'ابن الأخ/الأخت',
      niece: 'ابنة الأخ/الأخت',
    },
    clearSelection: 'مسح الاختيار',
    highlightPath: 'تمييز المسار',
  },
  en: {
    title: 'Discover Relationship',
    subtitle: 'Select two people to find their connection',
    firstPerson: 'First Person',
    secondPerson: 'Second Person',
    searchPlaceholder: 'Search for a person...',
    findRelationship: 'Find Relationship',
    noPath: 'No direct relationship found',
    pathFound: 'Relationship found!',
    steps: 'steps',
    parent: 'Parent',
    child: 'Child',
    spouse: 'Spouse',
    sibling: 'Sibling',
    relationships: {
      father: 'Father',
      mother: 'Mother',
      son: 'Son',
      daughter: 'Daughter',
      husband: 'Husband',
      wife: 'Wife',
      brother: 'Brother',
      sister: 'Sister',
      grandfather: 'Grandfather',
      grandmother: 'Grandmother',
      grandson: 'Grandson',
      granddaughter: 'Granddaughter',
      uncle: 'Uncle',
      aunt: 'Aunt',
      cousin: 'Cousin',
      nephew: 'Nephew',
      niece: 'Niece',
    },
    clearSelection: 'Clear Selection',
    highlightPath: 'Highlight Path',
  },
};

export function RelationshipFinder({
  nodes,
  isOpen,
  onClose,
  locale = 'ar',
  onHighlightPath,
  onSelectPerson,
}: RelationshipFinderProps) {
  const [person1, setPerson1] = useState<TreeNode | null>(null);
  const [person2, setPerson2] = useState<TreeNode | null>(null);
  const [searchQuery1, setSearchQuery1] = useState('');
  const [searchQuery2, setSearchQuery2] = useState('');
  const [showResults1, setShowResults1] = useState(false);
  const [showResults2, setShowResults2] = useState(false);

  const t = translations[locale];
  const isRTL = locale === 'ar';

  // Search nodes
  const searchResults1 = useMemo(() => {
    if (!searchQuery1.trim()) return [];
    const query = searchQuery1.toLowerCase();
    return nodes.filter(node => {
      const name = locale === 'ar'
        ? (node.person.full_name_ar || node.person.given_name)
        : (node.person.full_name_en || node.person.given_name);
      return name.toLowerCase().includes(query);
    }).slice(0, 8);
  }, [nodes, searchQuery1, locale]);

  const searchResults2 = useMemo(() => {
    if (!searchQuery2.trim()) return [];
    const query = searchQuery2.toLowerCase();
    return nodes.filter(node => {
      const name = locale === 'ar'
        ? (node.person.full_name_ar || node.person.given_name)
        : (node.person.full_name_en || node.person.given_name);
      return name.toLowerCase().includes(query);
    }).slice(0, 8);
  }, [nodes, searchQuery2, locale]);

  // Build node map for quick lookup
  const nodeMap = useMemo(() => {
    const map = new Map<string, TreeNode>();
    // Safety check for undefined nodes
    if (nodes && Array.isArray(nodes)) {
      nodes.forEach(node => map.set(node.id, node));
    }
    return map;
  }, [nodes]);

  // Find relationship path using BFS
  const findPath = useCallback((start: TreeNode, end: TreeNode): PathStep[] | null => {
    if (start.id === end.id) return [];

    const queue: Array<{ node: TreeNode; path: PathStep[] }> = [];
    const visited = new Set<string>();

    // Initialize with start node
    queue.push({ node: start, path: [] });
    visited.add(start.id);

    while (queue.length > 0) {
      const { node, path } = queue.shift()!;

      // Check parents (with safety check)
      const nodeParents = node.parents || [];
      for (const parent of nodeParents) {
        if (visited.has(parent.id)) continue;
        visited.add(parent.id);

        const newPath = [...path, {
          node: parent,
          relationship: parent.person.gender === 'male' ? t.relationships.father : t.relationships.mother,
          direction: 'up' as const,
        }];

        if (parent.id === end.id) return newPath;
        queue.push({ node: parent, path: newPath });
      }

      // Check children (with safety check)
      const nodeChildren = node.children || [];
      for (const child of nodeChildren) {
        if (visited.has(child.id)) continue;
        visited.add(child.id);

        const newPath = [...path, {
          node: child,
          relationship: child.person.gender === 'male' ? t.relationships.son : t.relationships.daughter,
          direction: 'down' as const,
        }];

        if (child.id === end.id) return newPath;
        queue.push({ node: child, path: newPath });
      }

      // Check spouses (with safety check)
      const nodeSpouses = node.spouses || [];
      for (const spouse of nodeSpouses) {
        if (visited.has(spouse.node.id)) continue;
        visited.add(spouse.node.id);

        const newPath = [...path, {
          node: spouse.node,
          relationship: spouse.node.person.gender === 'male' ? t.relationships.husband : t.relationships.wife,
          direction: 'spouse' as const,
        }];

        if (spouse.node.id === end.id) return newPath;
        queue.push({ node: spouse.node, path: newPath });
      }
    }

    return null;
  }, [t.relationships]);

  // Calculate path when both persons are selected
  const relationshipPath = useMemo(() => {
    if (!person1 || !person2) return null;
    return findPath(person1, person2);
  }, [person1, person2, findPath]);

  // Handle highlighting the path
  const handleHighlightPath = useCallback(() => {
    if (!relationshipPath || !person1) return;
    const pathIds = [person1.id, ...relationshipPath.map(step => step.node.id)];
    onHighlightPath?.(pathIds);
  }, [relationshipPath, person1, onHighlightPath]);

  // Clear selections
  const handleClear = useCallback(() => {
    setPerson1(null);
    setPerson2(null);
    setSearchQuery1('');
    setSearchQuery2('');
    onHighlightPath?.([]);
  }, [onHighlightPath]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
        onClick={e => e.stopPropagation()}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl">
                <Link2 size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold">{t.title}</h2>
                <p className="text-white/80 text-sm">{t.subtitle}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Person 1 Selection */}
          <PersonSelector
            label={t.firstPerson}
            person={person1}
            searchQuery={searchQuery1}
            setSearchQuery={setSearchQuery1}
            searchResults={searchResults1}
            showResults={showResults1}
            setShowResults={setShowResults1}
            onSelect={(node) => {
              setPerson1(node);
              setSearchQuery1('');
              setShowResults1(false);
            }}
            locale={locale}
            placeholder={t.searchPlaceholder}
            colorClass="bg-blue-500"
          />

          {/* Connection indicator */}
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-2 text-gray-400">
              <div className="h-px w-12 bg-gray-200" />
              {isRTL ? <ArrowLeft size={20} /> : <ArrowRight size={20} />}
              <div className="h-px w-12 bg-gray-200" />
            </div>
          </div>

          {/* Person 2 Selection */}
          <PersonSelector
            label={t.secondPerson}
            person={person2}
            searchQuery={searchQuery2}
            setSearchQuery={setSearchQuery2}
            searchResults={searchResults2}
            showResults={showResults2}
            setShowResults={setShowResults2}
            onSelect={(node) => {
              setPerson2(node);
              setSearchQuery2('');
              setShowResults2(false);
            }}
            locale={locale}
            placeholder={t.searchPlaceholder}
            colorClass="bg-purple-500"
          />

          {/* Results */}
          {person1 && person2 && (
            <div className="mt-6">
              {relationshipPath === null ? (
                <div className="text-center py-6 text-gray-500">
                  <Users size={40} className="mx-auto mb-3 opacity-50" />
                  <p>{t.noPath}</p>
                </div>
              ) : (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                  <div className="flex items-center gap-2 text-green-700 font-medium mb-4">
                    <Sparkles size={18} />
                    <span>{t.pathFound}</span>
                    <span className="text-sm text-green-600">
                      ({relationshipPath.length} {t.steps})
                    </span>
                  </div>

                  {/* Path visualization */}
                  <div className="flex flex-wrap items-center gap-2">
                    <PersonBadge node={person1} locale={locale} />

                    {relationshipPath.map((step, idx) => (
                      <React.Fragment key={step.node.id}>
                        <div className="flex items-center gap-1 px-2 py-1 bg-white rounded-full text-xs text-gray-600 border">
                          {step.direction === 'up' && '↑'}
                          {step.direction === 'down' && '↓'}
                          {step.direction === 'spouse' && '♥'}
                          <span>{step.relationship}</span>
                        </div>
                        <PersonBadge node={step.node} locale={locale} />
                      </React.Fragment>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={handleHighlightPath}
                      className="flex-1 py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                    >
                      {t.highlightPath}
                    </button>
                    <button
                      onClick={handleClear}
                      className="py-2 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                    >
                      {t.clearSelection}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Person selector component
 */
function PersonSelector({
  label,
  person,
  searchQuery,
  setSearchQuery,
  searchResults,
  showResults,
  setShowResults,
  onSelect,
  locale,
  placeholder,
  colorClass,
}: {
  label: string;
  person: TreeNode | null;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  searchResults: TreeNode[];
  showResults: boolean;
  setShowResults: (show: boolean) => void;
  onSelect: (node: TreeNode) => void;
  locale: 'ar' | 'en';
  placeholder: string;
  colorClass: string;
}) {
  if (person) {
    const displayName = locale === 'ar'
      ? (person.person.full_name_ar || person.person.given_name)
      : (person.person.full_name_en || person.person.given_name);
    const avatarColor = generateAvatarColor(person.id);

    return (
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
            style={{ backgroundColor: avatarColor }}
          >
            {getInitials(person.person.given_name)}
          </div>
          <span className="font-medium text-gray-900 flex-1">{displayName}</span>
          <button
            onClick={() => onSelect(null as any)}
            className="p-1 hover:bg-gray-200 rounded-full transition-colors"
          >
            <X size={16} className="text-gray-400" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <div className="relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => {
            setSearchQuery(e.target.value);
            setShowResults(true);
          }}
          onFocus={() => setShowResults(true)}
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
        />
      </div>

      {/* Search results dropdown */}
      {showResults && searchResults.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 max-h-64 overflow-y-auto z-10">
          {searchResults.map(node => {
            const displayName = locale === 'ar'
              ? (node.person.full_name_ar || node.person.given_name)
              : (node.person.full_name_en || node.person.given_name);
            const avatarColor = generateAvatarColor(node.id);

            return (
              <button
                key={node.id}
                onClick={() => onSelect(node)}
                className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors text-left"
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                  style={{ backgroundColor: avatarColor }}
                >
                  {getInitials(node.person.given_name)}
                </div>
                <div>
                  <div className="font-medium text-gray-900">{displayName}</div>
                  {node.person.birth_date && (
                    <div className="text-xs text-gray-500">
                      {new Date(node.person.birth_date).getFullYear()}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * Person badge for path visualization
 */
function PersonBadge({ node, locale }: { node: TreeNode; locale: 'ar' | 'en' }) {
  const displayName = locale === 'ar'
    ? (node.person.full_name_ar || node.person.given_name)
    : (node.person.full_name_en || node.person.given_name);
  const avatarColor = generateAvatarColor(node.id);

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-full border shadow-sm">
      <div
        className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
        style={{ backgroundColor: avatarColor }}
      >
        {getInitials(node.person.given_name)}
      </div>
      <span className="text-sm font-medium text-gray-900">{displayName}</span>
    </div>
  );
}

export default RelationshipFinder;
