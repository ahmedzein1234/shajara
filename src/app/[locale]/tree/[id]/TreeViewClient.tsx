'use client';

import { useState, useCallback, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Person, Relationship } from '@/lib/db/schema';
import { ReactFlowTree } from '@/components/tree/flow/ReactFlowTree';
import { DetailsSidePanel } from '@/components/tree/DetailsSidePanel';
import { QuickAddForm } from '@/components/tree/flow/QuickAddForm';
import { createPerson, createRelationship } from '@/lib/db/actions';

interface TreeViewClientProps {
  treeId: string;
  persons: Person[];
  relationships: Relationship[];
  rootPersonId?: string;
  locale: 'ar' | 'en';
}

type QuickAddState = {
  isOpen: boolean;
  relationType: 'parent' | 'spouse' | 'child';
  relatedPerson: Person | null;
  position: { x: number; y: number };
};

export default function TreeViewClient({
  treeId,
  persons,
  relationships,
  rootPersonId,
  locale,
}: TreeViewClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [quickAdd, setQuickAdd] = useState<QuickAddState>({
    isOpen: false,
    relationType: 'child',
    relatedPerson: null,
    position: { x: 0, y: 0 },
  });

  const handlePersonClick = (person: Person) => {
    setSelectedPerson(person);
    setIsPanelOpen(true);
  };

  const handlePersonDoubleClick = (person: Person) => {
    // Could navigate to person's full profile
    console.log('Person double-clicked:', person);
  };

  const handleClosePanel = () => {
    setIsPanelOpen(false);
    setSelectedPerson(null);
  };

  // Quick add handlers
  const openQuickAdd = useCallback((relationType: 'parent' | 'spouse' | 'child', person: Person) => {
    // Position the form in the center of the viewport
    setQuickAdd({
      isOpen: true,
      relationType,
      relatedPerson: person,
      position: {
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
      },
    });
  }, []);

  const handleAddParent = useCallback((person: Person) => {
    openQuickAdd('parent', person);
  }, [openQuickAdd]);

  const handleAddSpouse = useCallback((person: Person) => {
    openQuickAdd('spouse', person);
  }, [openQuickAdd]);

  const handleAddChild = useCallback((person: Person) => {
    openQuickAdd('child', person);
  }, [openQuickAdd]);

  const handleQuickAddCancel = useCallback(() => {
    setQuickAdd(prev => ({ ...prev, isOpen: false }));
  }, []);

  const handleQuickAddSubmit = useCallback(async (data: { givenName: string; gender: 'male' | 'female' }) => {
    if (!quickAdd.relatedPerson) return;

    try {
      // Create the new person
      const newPerson = await createPerson({
        tree_id: treeId,
        given_name: data.givenName,
        gender: data.gender,
        is_living: true,
      });

      // Create the relationship based on type
      if (quickAdd.relationType === 'parent') {
        // New person is parent of the related person
        // In relationship: person1 is parent, person2 is child
        await createRelationship({
          tree_id: treeId,
          person1_id: newPerson.id,
          person2_id: quickAdd.relatedPerson.id,
          relationship_type: 'parent',
        });
      } else if (quickAdd.relationType === 'child') {
        // Related person is parent of the new person
        await createRelationship({
          tree_id: treeId,
          person1_id: quickAdd.relatedPerson.id,
          person2_id: newPerson.id,
          relationship_type: 'parent',
        });
      } else if (quickAdd.relationType === 'spouse') {
        await createRelationship({
          tree_id: treeId,
          person1_id: quickAdd.relatedPerson.id,
          person2_id: newPerson.id,
          relationship_type: 'spouse',
        });
      }

      // Close the form and refresh the page to show new data
      setQuickAdd(prev => ({ ...prev, isOpen: false }));
      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      console.error('Failed to add person:', error);
    }
  }, [quickAdd.relatedPerson, quickAdd.relationType, treeId, router]);

  // Build a node for the details panel matching TreeNode interface
  const selectedNode = selectedPerson ? {
    id: selectedPerson.id,
    person: selectedPerson,
    x: 0,
    y: 0,
    level: 0,
    parents: [],
    children: [],
    spouses: [],
    subtreeWidth: 0,
    isCollapsed: false,
    isHighlighted: false,
  } : null;

  return (
    <div className="w-full h-full relative">
      <ReactFlowTree
        persons={persons}
        relationships={relationships}
        rootPersonId={rootPersonId}
        locale={locale}
        onPersonClick={handlePersonClick}
        onPersonDoubleClick={handlePersonDoubleClick}
        onAddParent={handleAddParent}
        onAddSpouse={handleAddSpouse}
        onAddChild={handleAddChild}
        className="w-full h-full"
      />

      {/* Details Side Panel */}
      {selectedNode && (
        <DetailsSidePanel
          node={selectedNode}
          isOpen={isPanelOpen}
          onClose={handleClosePanel}
          locale={locale}
        />
      )}

      {/* Quick Add Form */}
      {quickAdd.isOpen && quickAdd.relatedPerson && (
        <QuickAddForm
          relationType={quickAdd.relationType}
          relatedToName={
            locale === 'ar'
              ? quickAdd.relatedPerson.full_name_ar || quickAdd.relatedPerson.given_name
              : quickAdd.relatedPerson.full_name_en || quickAdd.relatedPerson.given_name
          }
          position={quickAdd.position}
          locale={locale}
          onSubmit={handleQuickAddSubmit}
          onCancel={handleQuickAddCancel}
        />
      )}

      {/* Loading overlay */}
      {isPending && (
        <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-[1001]">
          <div className="bg-white rounded-xl shadow-xl p-4 flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-gray-600">
              {locale === 'ar' ? 'جاري الإضافة...' : 'Adding...'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
