'use client';

import { useState } from 'react';
import { Person, Relationship } from '@/lib/db/schema';
import { ReactFlowTree } from '@/components/tree/flow/ReactFlowTree';
import { DetailsSidePanel } from '@/components/tree/DetailsSidePanel';

interface TreeViewClientProps {
  persons: Person[];
  relationships: Relationship[];
  rootPersonId?: string;
  locale: 'ar' | 'en';
}

export default function TreeViewClient({
  persons,
  relationships,
  rootPersonId,
  locale,
}: TreeViewClientProps) {
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

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
    </div>
  );
}
