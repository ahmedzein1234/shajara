/**
 * Example Usage of Map Components
 * This file demonstrates how to use all map components together
 *
 * NOTE: This is an example file for reference only.
 * You can use this code in your actual pages/components.
 */

'use client';

import { useState, useEffect } from 'react';
import { FamilyMap } from './FamilyMap';
import { LocationPicker } from './LocationPicker';
import type { Person } from '@/lib/db/schema';
import type { Place, MigrationPath } from '@/types/map';

// =====================================================
// EXAMPLE 1: Basic Family Map
// =====================================================

export function BasicMapExample({ persons }: { persons: Person[] }) {
  return (
    <div className="w-full">
      <h2 className="text-2xl font-bold mb-4">خريطة العائلة</h2>

      <FamilyMap
        persons={persons}
        locale="ar"
        theme="light"
        style="osm-arabic"
        height="600px"
        showControls={true}
      />
    </div>
  );
}

// =====================================================
// EXAMPLE 2: Map with Migration Paths
// =====================================================

export function MigrationMapExample({
  persons,
  migrationPaths,
}: {
  persons: Person[];
  migrationPaths: MigrationPath[];
}) {
  return (
    <div className="w-full">
      <h2 className="text-2xl font-bold mb-4">مسارات الهجرة</h2>

      <FamilyMap
        persons={persons}
        migrationPaths={migrationPaths}
        locale="ar"
        theme="light"
        style="osm-arabic"
        height="700px"
        showControls={true}
        showTimeline={true}
      />
    </div>
  );
}

// =====================================================
// EXAMPLE 3: Interactive Person Form with Location Picker
// =====================================================

export function PersonFormExample() {
  const [formData, setFormData] = useState({
    given_name: '',
    birth_place: null as Place | null,
    death_place: null as Place | null,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const personData = {
      given_name: formData.given_name,
      birth_place: formData.birth_place?.name,
      birth_place_lat: formData.birth_place?.coordinates.lat,
      birth_place_lng: formData.birth_place?.coordinates.lng,
      death_place: formData.death_place?.name,
      death_place_lat: formData.death_place?.coordinates.lat,
      death_place_lng: formData.death_place?.coordinates.lng,
    };

    console.log('Submitting person:', personData);
    // Call your API to save the person
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto p-6 space-y-6">
      <h2 className="text-2xl font-bold mb-6">إضافة شخص جديد</h2>

      {/* Name Input */}
      <div>
        <label className="block text-sm font-medium mb-2">
          الاسم الأول
        </label>
        <input
          type="text"
          value={formData.given_name}
          onChange={(e) =>
            setFormData(prev => ({ ...prev, given_name: e.target.value }))
          }
          className="w-full px-4 py-2 border rounded-lg"
          required
        />
      </div>

      {/* Birth Place */}
      <div>
        <label className="block text-sm font-medium mb-2">
          مكان الولادة
        </label>
        <LocationPicker
          locale="ar"
          placeholder="ابحث عن مكان الولادة..."
          onLocationSelect={(place) =>
            setFormData(prev => ({ ...prev, birth_place: place }))
          }
          onLocationClear={() =>
            setFormData(prev => ({ ...prev, birth_place: null }))
          }
        />
      </div>

      {/* Death Place */}
      <div>
        <label className="block text-sm font-medium mb-2">
          مكان الوفاة
        </label>
        <LocationPicker
          locale="ar"
          placeholder="ابحث عن مكان الوفاة..."
          onLocationSelect={(place) =>
            setFormData(prev => ({ ...prev, death_place: place }))
          }
          onLocationClear={() =>
            setFormData(prev => ({ ...prev, death_place: null }))
          }
        />
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        className="w-full px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
      >
        حفظ
      </button>
    </form>
  );
}

// =====================================================
// EXAMPLE 4: Map with Theme Toggle
// =====================================================

export function ThemeAwareMapExample({ persons }: { persons: Person[] }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Sync with system theme
  useEffect(() => {
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setTheme(isDark ? 'dark' : 'light');

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      setTheme(e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return (
    <div className="w-full">
      {/* Theme Toggle Button */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">خريطة العائلة</h2>
        <button
          onClick={() => setTheme(prev => prev === 'light' ? 'dark' : 'light')}
          className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700"
        >
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
      </div>

      <FamilyMap
        persons={persons}
        locale="ar"
        theme={theme}
        style="streets"
        height="600px"
        showControls={true}
      />
    </div>
  );
}

// =====================================================
// EXAMPLE 5: Filtered Map by Generation
// =====================================================

export function FilteredMapExample({ persons }: { persons: Person[] }) {
  const [selectedGenerations, setSelectedGenerations] = useState<number[]>([1, 2, 3]);

  // Calculate generation for each person (simplified)
  const personsWithGeneration = persons.map(person => {
    // In real app, you'd calculate this based on relationships
    const generation = Math.floor(Math.random() * 5) + 1;
    return { ...person, generation };
  });

  // Filter persons by selected generations
  const filteredPersons = personsWithGeneration.filter(person =>
    selectedGenerations.includes(person.generation || 0)
  );

  const toggleGeneration = (gen: number) => {
    setSelectedGenerations(prev =>
      prev.includes(gen)
        ? prev.filter(g => g !== gen)
        : [...prev, gen]
    );
  };

  return (
    <div className="w-full">
      <h2 className="text-2xl font-bold mb-4">خريطة حسب الأجيال</h2>

      {/* Generation Filter */}
      <div className="mb-4 flex gap-2 flex-wrap">
        {[1, 2, 3, 4, 5].map(gen => (
          <button
            key={gen}
            onClick={() => toggleGeneration(gen)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              selectedGenerations.includes(gen)
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            الجيل {gen}
          </button>
        ))}
      </div>

      <div className="mb-2 text-sm text-gray-600">
        عرض {filteredPersons.length} من {persons.length} شخص
      </div>

      <FamilyMap
        persons={filteredPersons}
        locale="ar"
        theme="light"
        style="osm-arabic"
        height="600px"
        showControls={true}
      />
    </div>
  );
}

// =====================================================
// EXAMPLE 6: Map with Click Handler
// =====================================================

export function InteractiveMapExample({ persons }: { persons: Person[] }) {
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Map */}
      <div className="lg:col-span-2">
        <FamilyMap
          persons={persons}
          locale="ar"
          theme="light"
          height="600px"
          showControls={true}
          onMarkerClick={(marker) => setSelectedPerson(marker.person)}
        />
      </div>

      {/* Person Details Sidebar */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold mb-4">تفاصيل الشخص</h3>

        {selectedPerson ? (
          <div className="space-y-3">
            <div>
              <span className="text-sm text-gray-500">الاسم</span>
              <p className="font-semibold">
                {selectedPerson.full_name_ar || selectedPerson.given_name}
              </p>
            </div>

            {selectedPerson.birth_place && (
              <div>
                <span className="text-sm text-gray-500">مكان الولادة</span>
                <p>{selectedPerson.birth_place}</p>
                {selectedPerson.birth_date && (
                  <p className="text-sm text-gray-400">{selectedPerson.birth_date}</p>
                )}
              </div>
            )}

            {selectedPerson.death_place && !selectedPerson.is_living && (
              <div>
                <span className="text-sm text-gray-500">مكان الوفاة</span>
                <p>{selectedPerson.death_place}</p>
                {selectedPerson.death_date && (
                  <p className="text-sm text-gray-400">{selectedPerson.death_date}</p>
                )}
              </div>
            )}

            {selectedPerson.notes && (
              <div>
                <span className="text-sm text-gray-500">ملاحظات</span>
                <p className="text-sm">{selectedPerson.notes}</p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">
            انقر على علامة في الخريطة لعرض التفاصيل
          </p>
        )}
      </div>
    </div>
  );
}

// =====================================================
// EXAMPLE 7: Create Migration Paths from Person Data
// =====================================================

export function createMigrationPathsFromPersons(persons: Person[]): MigrationPath[] {
  const migrationPaths: MigrationPath[] = [];

  persons.forEach(person => {
    // If person has both birth and death locations, create a migration path
    if (
      person.birth_place_lat &&
      person.birth_place_lng &&
      person.death_place_lat &&
      person.death_place_lng &&
      !person.is_living
    ) {
      migrationPaths.push({
        id: `migration-${person.id}`,
        personId: person.id,
        personName: person.full_name_ar || person.given_name,
        from: {
          name: person.birth_place || 'مكان الولادة',
          coordinates: {
            lat: person.birth_place_lat,
            lng: person.birth_place_lng,
          },
        },
        to: {
          name: person.death_place || 'مكان الوفاة',
          coordinates: {
            lat: person.death_place_lat,
            lng: person.death_place_lng,
          },
        },
        generation: 1, // You'd calculate this based on relationships
        startDate: person.birth_date || undefined,
        endDate: person.death_date || undefined,
      });
    }
  });

  return migrationPaths;
}
