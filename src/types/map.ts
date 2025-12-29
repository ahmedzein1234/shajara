/**
 * Map-related TypeScript types for Shajara Family Tree
 * Defines interfaces for map visualization, locations, and migration paths
 */

import type { Person, Event } from '@/lib/db/schema';
import type { Map, LngLatLike, MapOptions } from 'maplibre-gl';

// =====================================================
// LOCATION TYPES
// =====================================================

/**
 * Geographic coordinates
 */
export interface Coordinates {
  lat: number;
  lng: number;
}

/**
 * Place information with optional Arabic name
 */
export interface Place {
  name: string;
  nameAr?: string;
  coordinates: Coordinates;
  type?: 'city' | 'village' | 'country' | 'region' | 'custom';
}

/**
 * Geocoding search result
 */
export interface GeocodingResult {
  place_id: string;
  name: string;
  display_name: string;
  lat: string;
  lon: string;
  type: string;
  importance: number;
  address?: {
    city?: string;
    state?: string;
    country?: string;
    country_code?: string;
  };
}

/**
 * Cached geocoding result with timestamp
 */
export interface CachedGeocodingResult {
  result: GeocodingResult[];
  timestamp: number;
}

// =====================================================
// MAP MARKER TYPES
// =====================================================

/**
 * Marker type for different life events
 */
export type MarkerType = 'birth' | 'death' | 'marriage' | 'migration' | 'residence' | 'event';

/**
 * Marker data for displaying person on map
 */
export interface PersonMarker {
  id: string;
  person: Person;
  coordinates: Coordinates;
  type: MarkerType;
  label: string;
  generation?: number;
  eventDate?: string;
}

/**
 * Cluster of markers (when zoomed out)
 */
export interface MarkerCluster {
  id: string;
  coordinates: Coordinates;
  count: number;
  markers: PersonMarker[];
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
}

// =====================================================
// MIGRATION TYPES
// =====================================================

/**
 * Migration path between two locations
 */
export interface MigrationPath {
  id: string;
  personId: string;
  personName: string;
  from: Place;
  to: Place;
  startDate?: string;
  endDate?: string;
  generation: number;
  reason?: string;
}

/**
 * Migration animation state
 */
export interface MigrationAnimation {
  pathId: string;
  progress: number; // 0 to 1
  isPlaying: boolean;
  speed: number; // Animation speed multiplier
}

/**
 * Migration layer filter options
 */
export interface MigrationFilter {
  generations?: number[];
  dateRange?: {
    start: string;
    end: string;
  };
  showAnimation?: boolean;
}

// =====================================================
// MAP CONFIGURATION TYPES
// =====================================================

/**
 * Map style options
 */
export type MapStyle = 'streets' | 'satellite' | 'terrain' | 'osm' | 'osm-arabic';

/**
 * Map theme for light/dark mode
 */
export type MapTheme = 'light' | 'dark';

/**
 * Map layer visibility
 */
export interface MapLayerVisibility {
  birthPlaces: boolean;
  deathPlaces: boolean;
  residences: boolean;
  events: boolean;
  migrationPaths: boolean;
  clusters: boolean;
}

/**
 * Map initialization options
 */
export interface MapInitOptions extends Partial<MapOptions> {
  container: string | HTMLElement;
  style?: MapStyle;
  theme?: MapTheme;
  center?: LngLatLike;
  zoom?: number;
  rtl?: boolean;
  appLocale?: 'ar' | 'en';
}

/**
 * Map view state
 */
export interface MapViewState {
  center: Coordinates;
  zoom: number;
  bearing: number;
  pitch: number;
}

// =====================================================
// MAP CONTROL TYPES
// =====================================================

/**
 * Timeline filter state
 */
export interface TimelineFilter {
  enabled: boolean;
  startYear?: number;
  endYear?: number;
  selectedGenerations?: number[];
}

/**
 * Map control state
 */
export interface MapControlState {
  isFullscreen: boolean;
  currentStyle: MapStyle;
  currentTheme: MapTheme;
  layerVisibility: MapLayerVisibility;
  timelineFilter: TimelineFilter;
  showClusters: boolean;
  showPopups: boolean;
}

// =====================================================
// POPUP TYPES
// =====================================================

/**
 * Person popup data
 */
export interface PersonPopupData {
  person: Person;
  markerType: MarkerType;
  location: Place;
  events?: Event[];
  generation?: number;
}

/**
 * Cluster popup data
 */
export interface ClusterPopupData {
  cluster: MarkerCluster;
  topPersons: Person[];
}

// =====================================================
// MAP EVENT TYPES
// =====================================================

/**
 * Map click event data
 */
export interface MapClickEvent {
  coordinates: Coordinates;
  lngLat: LngLatLike;
  features?: any[];
}

/**
 * Marker click event data
 */
export interface MarkerClickEvent {
  marker: PersonMarker;
  coordinates: Coordinates;
}

/**
 * Location selection event (for LocationPicker)
 */
export interface LocationSelectEvent {
  place: Place;
  coordinates: Coordinates;
  fromSearch?: boolean;
}

// =====================================================
// HOOK RETURN TYPES
// =====================================================

/**
 * Return type for useMapLibre hook
 */
export interface UseMapLibreReturn {
  map: Map | null;
  isLoaded: boolean;
  error: Error | null;
  addMarker: (marker: PersonMarker) => void;
  removeMarker: (markerId: string) => void;
  clearMarkers: () => void;
  fitBounds: (coordinates: Coordinates[]) => void;
  flyTo: (coordinates: Coordinates, zoom?: number) => void;
  updateStyle: (style: MapStyle, theme: MapTheme) => void;
  setLayerVisibility: (layer: keyof MapLayerVisibility, visible: boolean) => void;
}

/**
 * Return type for useGeocoding hook
 */
export interface UseGeocodingReturn {
  search: (query: string, locale?: 'ar' | 'en') => Promise<GeocodingResult[]>;
  reverse: (coordinates: Coordinates) => Promise<GeocodingResult | null>;
  isLoading: boolean;
  error: Error | null;
}

// =====================================================
// COMPONENT PROP TYPES
// =====================================================

/**
 * FamilyMap component props
 */
export interface FamilyMapProps {
  persons: Person[];
  events?: Event[];
  migrationPaths?: MigrationPath[];
  initialCenter?: Coordinates;
  initialZoom?: number;
  style?: MapStyle;
  theme?: MapTheme;
  locale?: 'ar' | 'en';
  height?: string;
  className?: string;
  onMarkerClick?: (marker: PersonMarker) => void;
  onLocationSelect?: (event: LocationSelectEvent) => void;
  showControls?: boolean;
  showTimeline?: boolean;
}

/**
 * MigrationPath component props
 */
export interface MigrationPathProps {
  map: Map;
  paths: MigrationPath[];
  filter?: MigrationFilter;
  animated?: boolean;
  theme?: MapTheme;
  onPathClick?: (path: MigrationPath) => void;
}

/**
 * LocationPicker component props
 */
export interface LocationPickerProps {
  initialLocation?: Place;
  locale?: 'ar' | 'en';
  placeholder?: string;
  onLocationSelect: (place: Place) => void;
  onLocationClear?: () => void;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

/**
 * MapControls component props
 */
export interface MapControlsProps {
  map: Map;
  controlState: MapControlState;
  onControlChange: (state: Partial<MapControlState>) => void;
  locale?: 'ar' | 'en';
  className?: string;
}
