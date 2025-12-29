/**
 * useMapLibre Hook
 * Manages MapLibre GL JS map instance, markers, and interactions
 */

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import maplibregl, { Map as MapLibreMap, Marker, LngLatBoundsLike } from 'maplibre-gl';
import type {
  MapInitOptions,
  MapStyle,
  MapTheme,
  Coordinates,
  PersonMarker,
  MapLayerVisibility,
  UseMapLibreReturn,
} from '@/types/map';

// =====================================================
// MAP STYLE URLS
// =====================================================

/**
 * Get map style URL based on style type and theme
 */
function getMapStyleUrl(style: MapStyle, theme: MapTheme): string {
  const isDark = theme === 'dark';

  const styleUrls: Record<MapStyle, string> = {
    'osm': 'https://tiles.openfreemap.org/styles/liberty',
    'osm-arabic': 'https://tiles.openfreemap.org/styles/liberty',
    'streets': isDark
      ? 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'
      : 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
    'satellite': 'https://api.maptiler.com/maps/hybrid/style.json?key=get_your_own_key',
    'terrain': isDark
      ? 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'
      : 'https://api.maptiler.com/maps/topo/style.json?key=get_your_own_key',
  };

  return styleUrls[style] || styleUrls['osm'];
}

// =====================================================
// MARKER COLORS BY TYPE
// =====================================================

/**
 * Get marker color based on marker type and theme
 */
function getMarkerColor(type: PersonMarker['type'], theme: MapTheme): string {
  const isDark = theme === 'dark';

  const colors: Record<PersonMarker['type'], { light: string; dark: string }> = {
    birth: { light: '#10b981', dark: '#34d399' }, // primary-500/400
    death: { light: '#6b7280', dark: '#9ca3af' }, // gray-500/400
    marriage: { light: '#ec4899', dark: '#f472b6' }, // pink-500/400
    migration: { light: '#3b82f6', dark: '#60a5fa' }, // blue-500/400
    residence: { light: '#14b8a6', dark: '#2dd4bf' }, // teal-500/400
    event: { light: '#8b5cf6', dark: '#a78bfa' }, // violet-500/400
  };

  return isDark ? colors[type].dark : colors[type].light;
}

// =====================================================
// CUSTOM HOOK
// =====================================================

export function useMapLibre(options: MapInitOptions): UseMapLibreReturn {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<globalThis.Map<string, Marker>>(new globalThis.Map<string, Marker>());

  const [map, setMap] = useState<MapLibreMap | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // =====================================================
  // INITIALIZE MAP
  // =====================================================

  useEffect(() => {
    if (!options.container) return;

    // Get container element
    const container =
      typeof options.container === 'string'
        ? document.getElementById(options.container)
        : options.container;

    if (!container) {
      setError(new Error('Map container not found'));
      return;
    }

    mapContainer.current = container as HTMLDivElement;

    try {
      // Initialize MapLibre GL JS
      const newMapInstance = new maplibregl.Map({
        container: mapContainer.current,
        style: getMapStyleUrl(options.style || 'osm', options.theme || 'light'),
        center: options.center || [39.8, 21.4], // Default to Mecca, Saudi Arabia
        zoom: options.zoom || 5,
      });

      // Enable RTL text plugin for Arabic support
      if (options.rtl !== false) {
        try {
          maplibregl.setRTLTextPlugin(
            'https://unpkg.com/@mapbox/mapbox-gl-rtl-text@0.2.3/mapbox-gl-rtl-text.min.js',
            true // Lazy load
          );
        } catch (err) {
          console.error('RTL plugin error:', err);
        }
      }

      // Add navigation controls
      newMapInstance.addControl(
        new maplibregl.NavigationControl({
          visualizePitch: true,
        }),
        options.rtl ? 'top-left' : 'top-right'
      );

      // Add scale control
      newMapInstance.addControl(
        new maplibregl.ScaleControl({
          maxWidth: 100,
          unit: 'metric',
        }),
        'bottom-right'
      );

      // Map load event
      newMapInstance.on('load', () => {
        setIsLoaded(true);
      });

      // Error handling
      newMapInstance.on('error', (e: any) => {
        console.error('Map error:', e);
        setError(new Error(e.error?.message || 'Map error'));
      });

      mapInstance.current = newMapInstance;
      setMap(newMapInstance);

      // Cleanup
      return () => {
        newMapInstance.remove();
        markersRef.current.clear();
      };
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to initialize map'));
    }
  }, [options.container]);

  // =====================================================
  // ADD MARKER
  // =====================================================

  const addMarker = useCallback(
    (personMarker: PersonMarker) => {
      if (!mapInstance.current) return;

      // Remove existing marker if any
      if (markersRef.current.has(personMarker.id)) {
        markersRef.current.get(personMarker.id)?.remove();
      }

      // Create marker element
      const el = document.createElement('div');
      el.className = 'custom-marker';
      el.style.width = '30px';
      el.style.height = '30px';
      el.style.borderRadius = '50%';
      el.style.backgroundColor = getMarkerColor(
        personMarker.type,
        options.theme || 'light'
      );
      el.style.border = '3px solid white';
      el.style.cursor = 'pointer';
      el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
      el.style.transition = 'transform 0.2s';

      el.addEventListener('mouseenter', () => {
        el.style.transform = 'scale(1.2)';
      });

      el.addEventListener('mouseleave', () => {
        el.style.transform = 'scale(1)';
      });

      // Create popup
      const popupContent = `
        <div class="p-3 min-w-[200px]" dir="${options.rtl ? 'rtl' : 'ltr'}">
          <h3 class="font-semibold text-base mb-2">
            ${personMarker.person.full_name_ar || personMarker.person.given_name}
          </h3>
          ${personMarker.person.full_name_en ? `<p class="text-sm text-gray-600 mb-2">${personMarker.person.full_name_en}</p>` : ''}
          <p class="text-xs text-gray-500">
            ${personMarker.label}
          </p>
          ${personMarker.generation ? `<p class="text-xs text-gray-400 mt-1">الجيل ${personMarker.generation}</p>` : ''}
        </div>
      `;

      const popup = new maplibregl.Popup({
        offset: 25,
        closeButton: true,
        closeOnClick: false,
        className: 'custom-popup',
      }).setHTML(popupContent);

      // Create and add marker
      const marker = new maplibregl.Marker({
        element: el,
        anchor: 'bottom',
      })
        .setLngLat([personMarker.coordinates.lng, personMarker.coordinates.lat])
        .setPopup(popup)
        .addTo(mapInstance.current);

      // Store marker reference
      markersRef.current.set(personMarker.id, marker);
    },
    [options.theme, options.rtl]
  );

  // =====================================================
  // REMOVE MARKER
  // =====================================================

  const removeMarker = useCallback((markerId: string) => {
    const marker = markersRef.current.get(markerId);
    if (marker) {
      marker.remove();
      markersRef.current.delete(markerId);
    }
  }, []);

  // =====================================================
  // CLEAR ALL MARKERS
  // =====================================================

  const clearMarkers = useCallback(() => {
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current.clear();
  }, []);

  // =====================================================
  // FIT BOUNDS TO COORDINATES
  // =====================================================

  const fitBounds = useCallback((coordinates: Coordinates[]) => {
    if (!mapInstance.current || coordinates.length === 0) return;

    if (coordinates.length === 1) {
      // Single point - just center on it
      mapInstance.current.flyTo({
        center: [coordinates[0].lng, coordinates[0].lat],
        zoom: 10,
      });
      return;
    }

    // Multiple points - fit bounds
    const bounds = coordinates.reduce(
      (bounds, coord) => {
        return bounds.extend([coord.lng, coord.lat]);
      },
      new maplibregl.LngLatBounds(
        [coordinates[0].lng, coordinates[0].lat],
        [coordinates[0].lng, coordinates[0].lat]
      )
    );

    mapInstance.current.fitBounds(bounds as LngLatBoundsLike, {
      padding: 50,
      duration: 1000,
    });
  }, []);

  // =====================================================
  // FLY TO COORDINATES
  // =====================================================

  const flyTo = useCallback((coordinates: Coordinates, zoom: number = 12) => {
    if (!mapInstance.current) return;

    mapInstance.current.flyTo({
      center: [coordinates.lng, coordinates.lat],
      zoom,
      duration: 1500,
    });
  }, []);

  // =====================================================
  // UPDATE MAP STYLE
  // =====================================================

  const updateStyle = useCallback((style: MapStyle, theme: MapTheme) => {
    if (!mapInstance.current) return;

    const newStyleUrl = getMapStyleUrl(style, theme);
    mapInstance.current.setStyle(newStyleUrl);

    // Re-add markers after style loads
    mapInstance.current.once('styledata', () => {
      // Markers persist across style changes in MapLibre GL JS
      // Markers will keep their original colors
    });
  }, []);

  // =====================================================
  // SET LAYER VISIBILITY
  // =====================================================

  const setLayerVisibility = useCallback(
    (layer: keyof MapLayerVisibility, visible: boolean) => {
      if (!mapInstance.current) return;

      // This would be implemented based on actual layer IDs in the map
      // For now, we'll handle marker visibility through filtering
      const layerPrefix = layer.replace(/([A-Z])/g, '-$1').toLowerCase();

      markersRef.current.forEach((marker, id) => {
        if (id.startsWith(layerPrefix)) {
          const element = marker.getElement();
          element.style.display = visible ? 'block' : 'none';
        }
      });
    },
    []
  );

  // =====================================================
  // RETURN HOOK API
  // =====================================================

  return {
    map,
    isLoaded,
    error,
    addMarker,
    removeMarker,
    clearMarkers,
    fitBounds,
    flyTo,
    updateStyle,
    setLayerVisibility,
  };
}
