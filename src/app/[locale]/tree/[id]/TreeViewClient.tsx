'use client';

import { Person, Relationship } from '@/lib/db/schema';
import FamilyTree from '@/components/tree/FamilyTree';

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
  const handlePersonClick = (person: Person) => {
    console.log('Person clicked:', person);
  };

  const handlePersonDoubleClick = (person: Person) => {
    console.log('Person double-clicked:', person);
  };

  return (
    <FamilyTree
      persons={persons}
      relationships={relationships}
      rootPersonId={rootPersonId}
      locale={locale}
      onPersonClick={handlePersonClick}
      onPersonDoubleClick={handlePersonDoubleClick}
      className="w-full h-full"
    />
  );
}
