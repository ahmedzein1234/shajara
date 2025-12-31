/**
 * FamilyTree Component Usage Example
 * Demonstrates how to use the family tree visualization with sample data
 */

'use client';

import React, { useState } from 'react';
import { Person, Relationship } from '@/lib/db/schema';
import FamilyTree from './FamilyTree';

/**
 * Sample data for demonstration
 */
// Helper to create sample person with all required fields
const createSamplePerson = (data: Partial<Person> & Pick<Person, 'id' | 'tree_id' | 'given_name' | 'gender'>): Person => ({
  patronymic_chain: null,
  family_name: null,
  kunya: null,
  laqab: null,
  nisba: null,
  full_name_ar: null,
  full_name_en: null,
  nasab_chain: null,
  nasab_chain_en: null,
  tribe_id: null,
  tribal_branch: null,
  tribal_verified: false,
  is_sayyid: false,
  sayyid_verified: false,
  sayyid_lineage: null,
  birth_date: null,
  birth_date_hijri: null,
  birth_place: null,
  birth_place_lat: null,
  birth_place_lng: null,
  death_date: null,
  death_date_hijri: null,
  death_place: null,
  death_place_lat: null,
  death_place_lng: null,
  is_living: true,
  photo_url: null,
  notes: null,
  created_at: Date.now(),
  updated_at: Date.now(),
  ...data,
});

const samplePersons: Person[] = [
  createSamplePerson({
    id: '1',
    tree_id: 'tree-1',
    given_name: 'محمد',
    patronymic_chain: 'بن أحمد بن علي',
    family_name: 'الفلاني',
    full_name_ar: 'محمد بن أحمد بن علي الفلاني',
    full_name_en: 'Muhammad bin Ahmad bin Ali Al-Fulani',
    gender: 'male',
    birth_date: '1950-01-15',
    birth_place: 'الرياض',
    birth_place_lat: 24.7136,
    birth_place_lng: 46.6753,
    is_living: true,
    notes: 'الجد الأكبر للعائلة',
  }),
  createSamplePerson({
    id: '2',
    tree_id: 'tree-1',
    given_name: 'فاطمة',
    patronymic_chain: 'بنت خالد',
    family_name: 'العمري',
    full_name_ar: 'فاطمة بنت خالد العمري',
    full_name_en: 'Fatima bint Khalid Al-Omari',
    gender: 'female',
    birth_date: '1955-03-20',
    birth_place: 'جدة',
    birth_place_lat: 21.5433,
    birth_place_lng: 39.1728,
    notes: 'زوجة محمد',
  }),
  createSamplePerson({
    id: '3',
    tree_id: 'tree-1',
    given_name: 'أحمد',
    patronymic_chain: 'بن محمد',
    family_name: 'الفلاني',
    full_name_ar: 'أحمد بن محمد الفلاني',
    full_name_en: 'Ahmad bin Muhammad Al-Fulani',
    gender: 'male',
    birth_date: '1980-06-10',
    birth_place: 'الرياض',
    birth_place_lat: 24.7136,
    birth_place_lng: 46.6753,
    notes: 'الابن الأول',
  }),
  createSamplePerson({
    id: '4',
    tree_id: 'tree-1',
    given_name: 'سارة',
    patronymic_chain: 'بنت محمد',
    family_name: 'الفلاني',
    full_name_ar: 'سارة بنت محمد الفلاني',
    full_name_en: 'Sarah bint Muhammad Al-Fulani',
    gender: 'female',
    birth_date: '1985-12-05',
    birth_place: 'الرياض',
    birth_place_lat: 24.7136,
    birth_place_lng: 46.6753,
    notes: 'الابنة الثانية',
  }),
  createSamplePerson({
    id: '5',
    tree_id: 'tree-1',
    given_name: 'نورة',
    patronymic_chain: 'بنت عبدالله',
    family_name: 'السديري',
    full_name_ar: 'نورة بنت عبدالله السديري',
    full_name_en: 'Noura bint Abdullah Al-Sudairi',
    gender: 'female',
    birth_date: '1982-08-15',
    birth_place: 'الدمام',
    birth_place_lat: 26.4207,
    birth_place_lng: 50.0888,
    notes: 'زوجة أحمد',
  }),
  createSamplePerson({
    id: '6',
    tree_id: 'tree-1',
    given_name: 'عبدالله',
    patronymic_chain: 'بن أحمد',
    family_name: 'الفلاني',
    full_name_ar: 'عبدالله بن أحمد الفلاني',
    full_name_en: 'Abdullah bin Ahmad Al-Fulani',
    gender: 'male',
    birth_date: '2005-04-22',
    birth_place: 'الرياض',
    birth_place_lat: 24.7136,
    birth_place_lng: 46.6753,
    notes: 'حفيد محمد',
  }),
  createSamplePerson({
    id: '7',
    tree_id: 'tree-1',
    given_name: 'ريم',
    patronymic_chain: 'بنت أحمد',
    family_name: 'الفلاني',
    full_name_ar: 'ريم بنت أحمد الفلاني',
    full_name_en: 'Reem bint Ahmad Al-Fulani',
    gender: 'female',
    birth_date: '2008-11-30',
    birth_place: 'الرياض',
    birth_place_lat: 24.7136,
    birth_place_lng: 46.6753,
    notes: 'حفيدة محمد',
  }),
];

// Helper to create sample relationship with all required fields
const createSampleRelationship = (data: Partial<Relationship> & Pick<Relationship, 'id' | 'tree_id' | 'person1_id' | 'person2_id' | 'relationship_type'>): Relationship => ({
  marriage_date: null,
  marriage_date_hijri: null,
  marriage_place: null,
  divorce_date: null,
  divorce_date_hijri: null,
  divorce_place: null,
  created_at: Date.now(),
  ...data,
});

const sampleRelationships: Relationship[] = [
  // Muhammad (1) and Fatima (2) are spouses
  createSampleRelationship({
    id: 'rel-1',
    tree_id: 'tree-1',
    person1_id: '1',
    person2_id: '2',
    relationship_type: 'spouse',
    marriage_date: '1975-05-10',
    marriage_place: 'الرياض',
  }),
  // Muhammad (1) is parent of Ahmad (3)
  createSampleRelationship({
    id: 'rel-2',
    tree_id: 'tree-1',
    person1_id: '1',
    person2_id: '3',
    relationship_type: 'parent',
  }),
  // Fatima (2) is parent of Ahmad (3)
  createSampleRelationship({
    id: 'rel-3',
    tree_id: 'tree-1',
    person1_id: '2',
    person2_id: '3',
    relationship_type: 'parent',
  }),
  // Muhammad (1) is parent of Sarah (4)
  createSampleRelationship({
    id: 'rel-4',
    tree_id: 'tree-1',
    person1_id: '1',
    person2_id: '4',
    relationship_type: 'parent',
  }),
  // Fatima (2) is parent of Sarah (4)
  createSampleRelationship({
    id: 'rel-5',
    tree_id: 'tree-1',
    person1_id: '2',
    person2_id: '4',
    relationship_type: 'parent',
  }),
  // Ahmad (3) and Noura (5) are spouses
  createSampleRelationship({
    id: 'rel-6',
    tree_id: 'tree-1',
    person1_id: '3',
    person2_id: '5',
    relationship_type: 'spouse',
    marriage_date: '2003-02-14',
    marriage_place: 'الرياض',
  }),
  // Ahmad (3) is parent of Abdullah (6)
  createSampleRelationship({
    id: 'rel-7',
    tree_id: 'tree-1',
    person1_id: '3',
    person2_id: '6',
    relationship_type: 'parent',
  }),
  // Noura (5) is parent of Abdullah (6)
  createSampleRelationship({
    id: 'rel-8',
    tree_id: 'tree-1',
    person1_id: '5',
    person2_id: '6',
    relationship_type: 'parent',
  }),
  // Ahmad (3) is parent of Reem (7)
  createSampleRelationship({
    id: 'rel-9',
    tree_id: 'tree-1',
    person1_id: '3',
    person2_id: '7',
    relationship_type: 'parent',
  }),
  // Noura (5) is parent of Reem (7)
  createSampleRelationship({
    id: 'rel-10',
    tree_id: 'tree-1',
    person1_id: '5',
    person2_id: '7',
    relationship_type: 'parent',
  }),
];

/**
 * Example component demonstrating FamilyTree usage
 */
export function FamilyTreeExample() {
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);

  const handlePersonClick = (person: Person) => {
    setSelectedPerson(person);
    console.log('Person clicked:', person);
  };

  const handlePersonDoubleClick = (person: Person) => {
    console.log('Person double-clicked:', person);
  };

  return (
    <div className="w-full h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-900">شجرة العائلة - Family Tree</h1>
        {selectedPerson && (
          <p className="text-sm text-gray-600 mt-1">
            Selected: {selectedPerson.full_name_ar || selectedPerson.given_name}
          </p>
        )}
      </div>

      {/* Tree Visualization */}
      <div className="flex-1">
        <FamilyTree
          persons={samplePersons}
          relationships={sampleRelationships}
          rootPersonId="1"
          locale="ar"
          onPersonClick={handlePersonClick}
          onPersonDoubleClick={handlePersonDoubleClick}
        />
      </div>
    </div>
  );
}

/**
 * Usage instructions (as JSDoc comment):
 *
 * @example
 * // Basic usage with Arabic locale (default)
 * <FamilyTree
 *   persons={persons}
 *   relationships={relationships}
 *   locale="ar"
 * />
 *
 * @example
 * // With English locale
 * <FamilyTree
 *   persons={persons}
 *   relationships={relationships}
 *   locale="en"
 * />
 *
 * @example
 * // With specific root person
 * <FamilyTree
 *   persons={persons}
 *   relationships={relationships}
 *   rootPersonId="person-id-123"
 *   locale="ar"
 * />
 *
 * @example
 * // With event handlers
 * <FamilyTree
 *   persons={persons}
 *   relationships={relationships}
 *   onPersonClick={(person) => console.log('Clicked:', person)}
 *   onPersonDoubleClick={(person) => console.log('Double-clicked:', person)}
 *   locale="ar"
 * />
 */

export default FamilyTreeExample;
