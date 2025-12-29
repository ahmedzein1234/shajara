/**
 * FamilyTreeWithAI Component
 * Wrapper component that adds AI Assistant to the Family Tree
 */

'use client';

import React, { useState, useCallback } from 'react';
import { FamilyTree } from './FamilyTree';
import { AIAssistant } from './AIAssistant';
import { Person, Relationship } from '@/lib/db/schema';
import { TreeNode } from '@/types/tree';
import { ExtractedRelationship } from '@/lib/ai/openrouter';
import { cn } from '@/lib/utils';
import { Bot, Sparkles, X } from 'lucide-react';

interface FamilyTreeWithAIProps {
  persons: Person[];
  relationships: Relationship[];
  rootPersonId?: string;
  locale?: 'ar' | 'en';
  onPersonClick?: (person: Person) => void;
  onPersonDoubleClick?: (person: Person) => void;
  onAddChild?: (person: Person) => void;
  onAddSpouse?: (person: Person) => void;
  onAddParent?: (person: Person) => void;
  onEdit?: (person: Person) => void;
  onDelete?: (person: Person) => void;
  onAIAddPerson?: (person: Partial<Person>, relationship?: ExtractedRelationship) => void;
  className?: string;
  enableAI?: boolean;
}

export function FamilyTreeWithAI({
  persons,
  relationships,
  rootPersonId,
  locale = 'ar',
  onPersonClick,
  onPersonDoubleClick,
  onAddChild,
  onAddSpouse,
  onAddParent,
  onEdit,
  onDelete,
  onAIAddPerson,
  className,
  enableAI = true,
}: FamilyTreeWithAIProps) {
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);

  // Convert persons to nodes for AI context
  const nodes: TreeNode[] = persons.map(person => ({
    id: person.id,
    person,
    x: 0,
    y: 0,
    level: 0,
    parents: [],
    children: [],
    spouses: [],
    subtreeWidth: 0,
    isCollapsed: false,
    isHighlighted: false,
  }));

  const handlePersonClick = useCallback((person: Person) => {
    const node = nodes.find(n => n.id === person.id);
    setSelectedNode(node || null);
    onPersonClick?.(person);
  }, [nodes, onPersonClick]);

  const handleAIAddPerson = useCallback((
    person: Partial<Person>,
    relationship?: ExtractedRelationship
  ) => {
    if (onAIAddPerson) {
      onAIAddPerson(person, relationship);
    } else {
      // Default behavior: log the extracted data
      console.log('AI extracted person:', person);
      console.log('AI extracted relationship:', relationship);
      // In a real implementation, this would call an API to save the person
    }
  }, [onAIAddPerson]);

  const t = locale === 'ar' ? translations.ar : translations.en;

  return (
    <div className={cn('relative w-full h-full', className)}>
      {/* Main Family Tree */}
      <FamilyTree
        persons={persons}
        relationships={relationships}
        rootPersonId={rootPersonId}
        locale={locale}
        onPersonClick={handlePersonClick}
        onPersonDoubleClick={onPersonDoubleClick}
        onAddChild={onAddChild}
        onAddSpouse={onAddSpouse}
        onAddParent={onAddParent}
        onEdit={onEdit}
        onDelete={onDelete}
      />

      {/* AI Assistant Toggle Button */}
      {enableAI && !showAIAssistant && (
        <button
          onClick={() => setShowAIAssistant(true)}
          className={cn(
            'fixed bottom-24 z-30',
            'bg-gradient-to-r from-violet-600 to-indigo-600',
            'text-white rounded-full px-5 py-3 shadow-xl',
            'hover:scale-105 transition-all duration-200',
            'flex items-center gap-2',
            'border-2 border-white/20',
            'start-6', // RTL-aware positioning
            'min-h-[48px]' // Touch target
          )}
          title={t.openAssistant}
          aria-label={t.openAssistant}
          dir={locale === 'ar' ? 'rtl' : 'ltr'}
        >
          <Bot size={22} />
          <span className="font-medium">{t.aiAssistant}</span>
          <Sparkles size={16} className="text-violet-200 animate-pulse" />
        </button>
      )}

      {/* AI Assistant Panel */}
      {enableAI && showAIAssistant && (
        <AIAssistant
          nodes={nodes}
          selectedNode={selectedNode}
          locale={locale}
          onAddPerson={handleAIAddPerson}
          onClose={() => setShowAIAssistant(false)}
        />
      )}
    </div>
  );
}

const translations = {
  ar: {
    aiAssistant: 'المساعد الذكي',
    openAssistant: 'افتح المساعد الذكي لإضافة أفراد العائلة',
  },
  en: {
    aiAssistant: 'AI Assistant',
    openAssistant: 'Open AI Assistant to add family members',
  },
};

export default FamilyTreeWithAI;
