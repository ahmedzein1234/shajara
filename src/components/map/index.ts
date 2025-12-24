/**
 * Map Components Index
 * Centralized exports for all map-related components
 */

export { FamilyMap } from './FamilyMap';
export { MigrationPath } from './MigrationPath';
export { LocationPicker, LocationPickerWithMap } from './LocationPicker';
export { MapControls } from './MapControls';

// Re-export types for convenience
export type {
  FamilyMapProps,
  MigrationPathProps,
  LocationPickerProps,
  MapControlsProps,
  Place,
  Coordinates,
  PersonMarker,
  MigrationPath as MigrationPathType,
  MapStyle,
  MapTheme,
  MapControlState,
} from '@/types/map';
