/**
 * MigrationPath Component
 * Visualizes migration paths and family movements on the map
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import type { MigrationPathProps, MigrationPath as MigrationPathType } from '@/types/map';

// =====================================================
// CONSTANTS
// =====================================================

const ANIMATION_DURATION = 2000; // 2 seconds per path

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Generate GeoJSON for migration paths
 */
function generatePathGeoJSON(paths: MigrationPathType[]) {
  return {
    type: 'FeatureCollection' as const,
    features: paths.map(path => ({
      type: 'Feature' as const,
      id: path.id,
      geometry: {
        type: 'LineString' as const,
        coordinates: [
          [path.from.coordinates.lng, path.from.coordinates.lat],
          [path.to.coordinates.lng, path.to.coordinates.lat],
        ],
      },
      properties: {
        pathId: path.id,
        personId: path.personId,
        personName: path.personName,
        generation: path.generation,
        fromName: path.from.name,
        toName: path.to.name,
        startDate: path.startDate,
        endDate: path.endDate,
        reason: path.reason,
      },
    })),
  };
}

/**
 * Get color for generation
 */
function getGenerationColor(generation: number, theme: 'light' | 'dark'): string {
  const colors = [
    { light: '#10b981', dark: '#34d399' }, // Generation 1 - Emerald
    { light: '#3b82f6', dark: '#60a5fa' }, // Generation 2 - Blue
    { light: '#8b5cf6', dark: '#a78bfa' }, // Generation 3 - Violet
    { light: '#ec4899', dark: '#f472b6' }, // Generation 4 - Pink
    { light: '#f59e0b', dark: '#fbbf24' }, // Generation 5 - Amber
    { light: '#ef4444', dark: '#f87171' }, // Generation 6 - Red
  ];

  const colorIndex = (generation - 1) % colors.length;
  return theme === 'dark' ? colors[colorIndex].dark : colors[colorIndex].light;
}

// =====================================================
// MAIN COMPONENT
// =====================================================

export function MigrationPath({
  map,
  paths,
  filter,
  animated = false,
  theme = 'light',
  onPathClick,
}: MigrationPathProps) {
  const [isLayerAdded, setIsLayerAdded] = useState(false);
  const animationRef = useRef<number | null>(null);

  // Filter paths based on filter criteria
  const filteredPaths = paths.filter(path => {
    // Filter by generation
    if (filter?.generations && filter.generations.length > 0) {
      if (!filter.generations.includes(path.generation)) {
        return false;
      }
    }

    // Filter by date range
    if (filter?.dateRange) {
      if (path.startDate) {
        const startYear = parseInt(path.startDate.match(/(\d{4})/)?.[1] || '0', 10);
        const filterStartYear = parseInt(filter.dateRange.start.match(/(\d{4})/)?.[1] || '0', 10);
        const filterEndYear = parseInt(filter.dateRange.end.match(/(\d{4})/)?.[1] || '0', 10);

        if (startYear < filterStartYear || startYear > filterEndYear) {
          return false;
        }
      }
    }

    return true;
  });

  // =====================================================
  // ADD MIGRATION LAYER
  // =====================================================

  useEffect(() => {
    if (!map || !map.isStyleLoaded()) return;

    const sourceId = 'migration-paths';
    const layerId = 'migration-paths-layer';
    const arrowLayerId = 'migration-arrows-layer';

    // Wait for map to be ready
    const addLayers = () => {
      try {
        // Remove existing layers and source
        if (map.getLayer(arrowLayerId)) {
          map.removeLayer(arrowLayerId);
        }
        if (map.getLayer(layerId)) {
          map.removeLayer(layerId);
        }
        if (map.getSource(sourceId)) {
          map.removeSource(sourceId);
        }

        // Add source
        map.addSource(sourceId, {
          type: 'geojson',
          data: generatePathGeoJSON(filteredPaths),
        });

        // Add line layer
        map.addLayer({
          id: layerId,
          type: 'line',
          source: sourceId,
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
          },
          paint: {
            'line-color': [
              'case',
              ['==', ['get', 'generation'], 1],
              getGenerationColor(1, theme),
              ['==', ['get', 'generation'], 2],
              getGenerationColor(2, theme),
              ['==', ['get', 'generation'], 3],
              getGenerationColor(3, theme),
              ['==', ['get', 'generation'], 4],
              getGenerationColor(4, theme),
              ['==', ['get', 'generation'], 5],
              getGenerationColor(5, theme),
              getGenerationColor(6, theme),
            ],
            'line-width': 3,
            'line-opacity': 0.8,
          },
        });

        // Add arrow symbols layer
        map.addLayer({
          id: arrowLayerId,
          type: 'symbol',
          source: sourceId,
          layout: {
            'symbol-placement': 'line',
            'symbol-spacing': 100,
            'icon-image': 'arrow', // This would need a custom arrow icon
            'icon-size': 0.8,
            'text-field': ['get', 'personName'],
            'text-size': 12,
            'text-offset': [0, -1.5],
            'text-font': ['Noto Sans Arabic Regular', 'Arial Unicode MS Regular'],
          },
          paint: {
            'text-color': theme === 'dark' ? '#f9fafb' : '#111827',
            'text-halo-color': theme === 'dark' ? '#111827' : '#ffffff',
            'text-halo-width': 2,
          },
        });

        // Add click handler
        map.on('click', layerId, (e) => {
          if (!e.features || e.features.length === 0) return;

          const feature = e.features[0];
          const properties = feature.properties;

          if (onPathClick && properties) {
            const path = filteredPaths.find(p => p.id === properties.pathId);
            if (path) {
              onPathClick(path);
            }
          }

          // Show popup
          new (window as any).maplibregl.Popup()
            .setLngLat(e.lngLat)
            .setHTML(`
              <div class="p-3" dir="rtl">
                <h3 class="font-semibold mb-2">${properties?.personName || ''}</h3>
                <p class="text-sm mb-1">
                  <span class="text-gray-600">من:</span> ${properties?.fromName || ''}
                </p>
                <p class="text-sm mb-1">
                  <span class="text-gray-600">إلى:</span> ${properties?.toName || ''}
                </p>
                ${properties?.startDate ? `<p class="text-xs text-gray-500">${properties.startDate}</p>` : ''}
                ${properties?.reason ? `<p class="text-xs text-gray-500 mt-2">${properties.reason}</p>` : ''}
              </div>
            `)
            .addTo(map);
        });

        // Change cursor on hover
        map.on('mouseenter', layerId, () => {
          map.getCanvas().style.cursor = 'pointer';
        });

        map.on('mouseleave', layerId, () => {
          map.getCanvas().style.cursor = '';
        });

        setIsLayerAdded(true);
      } catch (error) {
        console.error('Error adding migration layers:', error);
      }
    };

    if (map.isStyleLoaded()) {
      addLayers();
    } else {
      map.once('styledata', addLayers);
    }

    return () => {
      try {
        if (map.getLayer(arrowLayerId)) {
          map.removeLayer(arrowLayerId);
        }
        if (map.getLayer(layerId)) {
          map.removeLayer(layerId);
        }
        if (map.getSource(sourceId)) {
          map.removeSource(sourceId);
        }
      } catch (error) {
        console.error('Error removing migration layers:', error);
      }
      setIsLayerAdded(false);
    };
  }, [map, filteredPaths, theme, onPathClick]);

  // =====================================================
  // ANIMATION
  // =====================================================

  useEffect(() => {
    if (!animated || !isLayerAdded || filteredPaths.length === 0) return;

    let startTime: number | null = null;
    const duration = ANIMATION_DURATION;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Update line-dasharray to create animation effect
      try {
        map.setPaintProperty('migration-paths-layer', 'line-dasharray', [
          0,
          progress * 4,
          progress * 4,
        ]);
      } catch (error) {
        // Layer might not exist yet
      }

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        // Reset and loop
        startTime = null;
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [animated, isLayerAdded, filteredPaths, map]);

  // =====================================================
  // UPDATE LAYER DATA
  // =====================================================

  useEffect(() => {
    if (!map || !isLayerAdded) return;

    try {
      const source = map.getSource('migration-paths') as any;
      if (source && typeof source.setData === 'function') {
        source.setData(generatePathGeoJSON(filteredPaths));
      }
    } catch (error) {
      console.error('Error updating migration paths:', error);
    }
  }, [map, isLayerAdded, filteredPaths]);

  // This component doesn't render anything visible
  // It only manages map layers
  return null;
}
