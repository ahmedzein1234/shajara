/**
 * FamilyMap Component
 * Main map component for displaying family members and their locations
 */

'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { useMapLibre } from '@/hooks/useMapLibre';
import type {
  FamilyMapProps,
  PersonMarker,
  Coordinates,
  MapControlState,
} from '@/types/map';
import type { Person } from '@/lib/db/schema';
import 'maplibre-gl/dist/maplibre-gl.css';

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Convert Person to PersonMarker array (birth and death locations)
 */
function personToMarkers(person: Person): PersonMarker[] {
  const markers: PersonMarker[] = [];

  // Birth marker
  if (person.birth_place_lat && person.birth_place_lng) {
    markers.push({
      id: `birth-${person.id}`,
      person,
      coordinates: {
        lat: person.birth_place_lat,
        lng: person.birth_place_lng,
      },
      type: 'birth',
      label: `${person.birth_place || 'مكان الولادة'} ${person.birth_date ? `(${person.birth_date})` : ''}`,
    });
  }

  // Death marker
  if (person.death_place_lat && person.death_place_lng && !person.is_living) {
    markers.push({
      id: `death-${person.id}`,
      person,
      coordinates: {
        lat: person.death_place_lat,
        lng: person.death_place_lng,
      },
      type: 'death',
      label: `${person.death_place || 'مكان الوفاة'} ${person.death_date ? `(${person.death_date})` : ''}`,
    });
  }

  return markers;
}

/**
 * Calculate generation number (simple heuristic based on birth year)
 */
function estimateGeneration(person: Person, allPersons: Person[]): number {
  if (!person.birth_date) return 0;

  // Extract year from date string (assuming ISO format or year)
  const yearMatch = person.birth_date.match(/(\d{4})/);
  if (!yearMatch) return 0;

  const birthYear = parseInt(yearMatch[1], 10);

  // Find earliest birth year in dataset
  const earliestYear = allPersons.reduce((earliest, p) => {
    if (!p.birth_date) return earliest;
    const match = p.birth_date.match(/(\d{4})/);
    if (!match) return earliest;
    const year = parseInt(match[1], 10);
    return Math.min(earliest, year);
  }, birthYear);

  // Estimate generation (assuming 25 years per generation)
  return Math.floor((birthYear - earliestYear) / 25) + 1;
}

// =====================================================
// MAIN COMPONENT
// =====================================================

export function FamilyMap({
  persons,
  events = [],
  migrationPaths: _migrationPaths = [],
  initialCenter,
  initialZoom = 5,
  style = 'osm',
  theme = 'light',
  locale = 'ar',
  height = '600px',
  className = '',
  onMarkerClick: _onMarkerClick,
  onLocationSelect: _onLocationSelect,
  showControls: _showControls = true,
  showTimeline: _showTimeline = true,
}: FamilyMapProps) {
  // Features to be implemented
  void _migrationPaths;
  void _onMarkerClick;
  void _onLocationSelect;
  void _showControls;
  void _showTimeline;
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [controlState, setControlState] = useState<MapControlState>({
    isFullscreen: false,
    currentStyle: style,
    currentTheme: theme,
    layerVisibility: {
      birthPlaces: true,
      deathPlaces: true,
      residences: true,
      events: true,
      migrationPaths: true,
      clusters: true,
    },
    timelineFilter: {
      enabled: false,
    },
    showClusters: true,
    showPopups: true,
  });

  // Initialize map
  const {
    map,
    isLoaded,
    error,
    addMarker,
    clearMarkers,
    fitBounds,
  } = useMapLibre({
    container: mapContainerRef.current || 'map',
    style: controlState.currentStyle,
    theme: controlState.currentTheme,
    center: initialCenter ? [initialCenter.lng, initialCenter.lat] : undefined,
    zoom: initialZoom,
    rtl: locale === 'ar',
  });

  // Convert persons to markers
  const allMarkers = useMemo(() => {
    const markers: PersonMarker[] = [];

    persons.forEach(person => {
      const personMarkers = personToMarkers(person);
      const generation = estimateGeneration(person, persons);

      // Add generation to markers
      personMarkers.forEach(marker => {
        marker.generation = generation;
        markers.push(marker);
      });
    });

    // Add event markers
    events.forEach(event => {
      if (event.latitude && event.longitude) {
        const person = persons.find(p => p.id === event.person_id);
        if (person) {
          markers.push({
            id: `event-${event.id}`,
            person,
            coordinates: {
              lat: event.latitude,
              lng: event.longitude,
            },
            type: 'event',
            label: `${event.description || event.event_type} ${event.event_date ? `(${event.event_date})` : ''}`,
            eventDate: event.event_date || undefined,
          });
        }
      }
    });

    return markers;
  }, [persons, events]);

  // Filter markers based on layer visibility
  const visibleMarkers = useMemo(() => {
    return allMarkers.filter(marker => {
      switch (marker.type) {
        case 'birth':
          return controlState.layerVisibility.birthPlaces;
        case 'death':
          return controlState.layerVisibility.deathPlaces;
        case 'event':
          return controlState.layerVisibility.events;
        default:
          return true;
      }
    });
  }, [allMarkers, controlState.layerVisibility]);

  // Add markers to map when loaded
  useEffect(() => {
    if (!isLoaded || !map) return;

    // Clear existing markers
    clearMarkers();

    // Add visible markers
    visibleMarkers.forEach(marker => {
      addMarker(marker);
    });

    // Fit bounds to show all markers
    if (visibleMarkers.length > 0 && !initialCenter) {
      const coordinates: Coordinates[] = visibleMarkers.map(m => m.coordinates);
      fitBounds(coordinates);
    }
  }, [isLoaded, map, visibleMarkers, addMarker, clearMarkers, fitBounds, initialCenter]);

  // Handle fullscreen toggle
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const container = mapContainerRef.current;

    const handleFullscreenChange = () => {
      const isFullscreen = document.fullscreenElement === container;
      setControlState(prev => ({
        ...prev,
        isFullscreen,
      }));
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // =====================================================
  // RENDER
  // =====================================================

  if (error) {
    return (
      <div
        className={`flex items-center justify-center bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg ${className}`}
        style={{ height }}
        dir={locale === 'ar' ? 'rtl' : 'ltr'}
      >
        <div className="text-center p-6">
          <p className="text-red-600 dark:text-red-400 font-semibold mb-2">
            {locale === 'ar' ? 'خطأ في تحميل الخريطة' : 'Error loading map'}
          </p>
          <p className="text-sm text-red-500 dark:text-red-300">
            {error.message}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative rounded-lg overflow-hidden shadow-lg ${className}`}
      style={{ height: controlState.isFullscreen ? '100vh' : height }}
      dir={locale === 'ar' ? 'rtl' : 'ltr'}
    >
      {/* Map Container */}
      <div
        ref={mapContainerRef}
        className="w-full h-full"
        id="family-map"
      />

      {/* Loading Overlay */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 z-10">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">
              {locale === 'ar' ? 'جاري تحميل الخريطة...' : 'Loading map...'}
            </p>
          </div>
        </div>
      )}

      {/* Stats Overlay */}
      {isLoaded && (
        <div className="absolute top-4 left-4 bg-white dark:bg-gray-800 rounded-lg shadow-md p-3 z-10">
          <div className="text-sm">
            <p className="text-gray-600 dark:text-gray-400">
              {locale === 'ar' ? 'عدد الأشخاص' : 'People'}: {persons.length}
            </p>
            <p className="text-gray-600 dark:text-gray-400">
              {locale === 'ar' ? 'عدد المواقع' : 'Locations'}: {visibleMarkers.length}
            </p>
          </div>
        </div>
      )}

      {/* Inline Styles for Popup */}
      <style jsx global>{`
        .maplibregl-popup-content {
          padding: 0;
          border-radius: 0.5rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .maplibregl-popup-close-button {
          font-size: 20px;
          padding: 4px 8px;
          color: #6b7280;
        }

        .maplibregl-popup-close-button:hover {
          background-color: #f3f4f6;
          color: #111827;
        }

        .dark .maplibregl-popup-content {
          background-color: #1f2937;
          color: #f9fafb;
        }

        .dark .maplibregl-popup-close-button {
          color: #9ca3af;
        }

        .dark .maplibregl-popup-close-button:hover {
          background-color: #374151;
          color: #f9fafb;
        }

        .maplibregl-popup-anchor-top .maplibregl-popup-tip {
          border-bottom-color: white;
        }

        .dark .maplibregl-popup-anchor-top .maplibregl-popup-tip {
          border-bottom-color: #1f2937;
        }

        .maplibregl-popup-anchor-bottom .maplibregl-popup-tip {
          border-top-color: white;
        }

        .dark .maplibregl-popup-anchor-bottom .maplibregl-popup-tip {
          border-top-color: #1f2937;
        }

        .maplibregl-ctrl-attrib {
          font-size: 10px;
        }

        .custom-marker {
          transition: all 0.2s ease;
        }

        .custom-marker:hover {
          z-index: 1000;
        }
      `}</style>
    </div>
  );
}
