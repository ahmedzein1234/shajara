# Shajara Map Integration

This directory contains all map-related components for the Shajara Arabic Family Tree application. The map integration uses **MapLibre GL JS** for rendering and **Nominatim (OpenStreetMap)** for geocoding.

## Components

### 1. FamilyMap
The main map component that displays family members and their locations.

```tsx
import { FamilyMap } from '@/components/map';
import type { Person } from '@/lib/db/schema';

function MyTreePage({ persons }: { persons: Person[] }) {
  return (
    <FamilyMap
      persons={persons}
      locale="ar"
      theme="light"
      height="600px"
      showControls={true}
      onMarkerClick={(marker) => console.log('Clicked:', marker)}
    />
  );
}
```

**Props:**
- `persons` - Array of Person objects to display on map
- `events?` - Optional array of Event objects
- `migrationPaths?` - Optional array of migration paths
- `locale?` - 'ar' or 'en' (default: 'ar')
- `theme?` - 'light' or 'dark' (default: 'light')
- `style?` - Map style ('osm', 'osm-arabic', 'streets')
- `height?` - Map container height (default: '600px')
- `showControls?` - Show control buttons (default: true)
- `onMarkerClick?` - Callback when marker is clicked

### 2. LocationPicker
A search input component for selecting locations with geocoding.

```tsx
import { LocationPicker } from '@/components/map';
import type { Place } from '@/types/map';

function PersonForm() {
  const handleLocationSelect = (place: Place) => {
    console.log('Selected:', place);
    // Save place.coordinates.lat and place.coordinates.lng
  };

  return (
    <LocationPicker
      locale="ar"
      placeholder="ابحث عن مكان الولادة..."
      onLocationSelect={handleLocationSelect}
      required
    />
  );
}
```

**Props:**
- `onLocationSelect` - Callback when location is selected (required)
- `initialLocation?` - Initial place to display
- `locale?` - 'ar' or 'en'
- `placeholder?` - Input placeholder text
- `onLocationClear?` - Callback when location is cleared
- `required?` - Make input required
- `disabled?` - Disable input

### 3. MigrationPath
Visualizes migration paths on an existing map instance.

```tsx
import { FamilyMap, MigrationPath } from '@/components/map';
import { useMapLibre } from '@/hooks/useMapLibre';

function MigrationView() {
  const { map } = useMapLibre({
    container: 'map',
    style: 'osm',
    theme: 'light',
  });

  const migrationPaths = [
    {
      id: '1',
      personId: 'person-1',
      personName: 'أحمد بن خالد',
      from: {
        name: 'مكة المكرمة',
        coordinates: { lat: 21.4225, lng: 39.8262 },
      },
      to: {
        name: 'المدينة المنورة',
        coordinates: { lat: 24.5247, lng: 39.5692 },
      },
      generation: 1,
      startDate: '1950',
    },
  ];

  return (
    <>
      <div id="map" style={{ height: '600px' }} />
      {map && (
        <MigrationPath
          map={map}
          paths={migrationPaths}
          animated={true}
          theme="light"
        />
      )}
    </>
  );
}
```

### 4. MapControls
Control panel for map interactions (zoom, layers, style switching).

```tsx
import { MapControls } from '@/components/map';
import type { MapControlState } from '@/types/map';

function MapWithControls() {
  const [controlState, setControlState] = useState<MapControlState>({
    isFullscreen: false,
    currentStyle: 'osm',
    currentTheme: 'light',
    layerVisibility: {
      birthPlaces: true,
      deathPlaces: true,
      residences: true,
      events: true,
      migrationPaths: true,
      clusters: true,
    },
    timelineFilter: { enabled: false },
    showClusters: true,
    showPopups: true,
  });

  return (
    <div style={{ position: 'relative', height: '600px' }}>
      <div id="map" style={{ height: '100%' }} />
      {map && (
        <MapControls
          map={map}
          controlState={controlState}
          onControlChange={(changes) =>
            setControlState(prev => ({ ...prev, ...changes }))
          }
          locale="ar"
        />
      )}
    </div>
  );
}
```

## Hooks

### useMapLibre
Hook for managing MapLibre GL JS map instance.

```tsx
import { useMapLibre } from '@/hooks/useMapLibre';

function MyMap() {
  const {
    map,
    isLoaded,
    error,
    addMarker,
    removeMarker,
    clearMarkers,
    fitBounds,
    flyTo,
  } = useMapLibre({
    container: 'map-container',
    style: 'osm',
    theme: 'light',
    locale: 'ar',
  });

  // Add a marker when loaded
  useEffect(() => {
    if (isLoaded && map) {
      addMarker({
        id: 'marker-1',
        person: myPerson,
        coordinates: { lat: 21.4225, lng: 39.8262 },
        type: 'birth',
        label: 'مكة المكرمة',
      });
    }
  }, [isLoaded, map]);

  return <div id="map-container" style={{ height: '600px' }} />;
}
```

## Utilities

### Geocoding Functions

```tsx
import {
  searchPlaces,
  reverseGeocode,
  geocodingResultToPlace,
} from '@/lib/geocoding';

// Search for places
const results = await searchPlaces('مكة المكرمة', 'ar');
console.log(results);

// Reverse geocode coordinates
const place = await reverseGeocode({ lat: 21.4225, lng: 39.8262 }, 'ar');
console.log(place);

// Convert result to Place object
const placeObject = geocodingResultToPlace(results[0]);
```

## Features

### RTL Support
All components support RTL (Right-to-Left) layout for Arabic:
- Map controls positioned on the left in RTL mode
- Arabic text rendering with proper shaping
- RTL-aware popups and tooltips

### Dark Mode
All components support dark mode:
- Automatic theme switching
- Dark-themed map styles
- Consistent UI colors

### Arabic Place Names
- Uses Nominatim with Arabic language preference
- Falls back to English when Arabic unavailable
- Displays both Arabic and English names when available

### Geocoding Cache
- 7-day cache for geocoding results
- Reduces API calls
- Respects Nominatim rate limits (1 request/second)

### Marker Types
Different colored markers for different life events:
- 🟢 Birth (Green/Emerald)
- ⚪ Death (Gray)
- 💗 Marriage (Pink)
- 🔵 Migration (Blue)
- 🔷 Residence (Teal)
- 🟣 Event (Violet)

### Generation Colors
Migration paths are colored by generation:
- Generation 1: Emerald
- Generation 2: Blue
- Generation 3: Violet
- Generation 4: Pink
- Generation 5: Amber
- Generation 6: Red

## Map Styles

### Available Styles
1. **osm** - OpenStreetMap (Liberty style)
2. **osm-arabic** - OpenStreetMap with Arabic labels
3. **streets** - CartoDB Positron (clean, minimal)
4. **satellite** - Satellite imagery (requires MapTiler key)
5. **terrain** - Terrain/topographic map

### Changing Styles
```tsx
<FamilyMap
  persons={persons}
  style="osm-arabic"  // Use Arabic labels
  theme="light"
/>
```

## Performance

### Clustering
When many markers are close together:
- Automatically clusters at low zoom levels
- Shows count badge on cluster
- Expands on click/zoom

### Optimization Tips
1. Filter persons before passing to map
2. Use virtualization for large datasets
3. Limit migration paths to relevant generations
4. Enable clustering for 50+ markers

## Best Practices

### Saving Location Data
When using LocationPicker in forms:

```tsx
const [birthPlace, setBirthPlace] = useState<Place | null>(null);

function handleLocationSelect(place: Place) {
  setBirthPlace(place);

  // Save to database
  await updatePerson({
    birth_place: place.name,
    birth_place_lat: place.coordinates.lat,
    birth_place_lng: place.coordinates.lng,
  });
}
```

### Error Handling
Always handle map loading errors:

```tsx
<FamilyMap persons={persons} />

// The component handles errors internally and shows error UI
```

### Responsive Design
```tsx
<FamilyMap
  persons={persons}
  height="min(600px, 80vh)"  // Responsive height
  className="w-full"
/>
```

## CSS Requirements

The map components require MapLibre GL CSS to be imported:

```tsx
// In your page/layout component
import 'maplibre-gl/dist/maplibre-gl.css';
```

Or in your global CSS:

```css
@import 'maplibre-gl/dist/maplibre-gl.css';
```

## TypeScript Types

All map-related types are defined in `@/types/map.ts`:

```tsx
import type {
  Place,
  Coordinates,
  PersonMarker,
  MigrationPath,
  MapStyle,
  MapTheme,
  GeocodingResult,
} from '@/types/map';
```

## Examples

### Complete Family Map Page

```tsx
'use client';

import { FamilyMap } from '@/components/map';
import { useTheme } from 'next-themes';
import type { Person } from '@/lib/db/schema';

export default function FamilyMapPage({
  persons,
}: {
  persons: Person[];
}) {
  const { theme } = useTheme();

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">خريطة العائلة</h1>

      <FamilyMap
        persons={persons}
        locale="ar"
        theme={theme as 'light' | 'dark'}
        style="osm-arabic"
        height="calc(100vh - 200px)"
        showControls={true}
        showTimeline={true}
      />
    </div>
  );
}
```

### Person Form with Location Picker

```tsx
'use client';

import { LocationPicker } from '@/components/map';
import { useState } from 'react';
import type { Place } from '@/types/map';

export default function PersonForm() {
  const [birthPlace, setBirthPlace] = useState<Place | null>(null);
  const [deathPlace, setDeathPlace] = useState<Place | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    await createPerson({
      given_name: 'أحمد',
      birth_place: birthPlace?.name,
      birth_place_lat: birthPlace?.coordinates.lat,
      birth_place_lng: birthPlace?.coordinates.lng,
      death_place: deathPlace?.name,
      death_place_lat: deathPlace?.coordinates.lat,
      death_place_lng: deathPlace?.coordinates.lng,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block mb-2">مكان الولادة</label>
        <LocationPicker
          locale="ar"
          onLocationSelect={setBirthPlace}
          placeholder="ابحث عن مكان الولادة..."
        />
      </div>

      <div>
        <label className="block mb-2">مكان الوفاة</label>
        <LocationPicker
          locale="ar"
          onLocationSelect={setDeathPlace}
          placeholder="ابحث عن مكان الوفاة..."
        />
      </div>

      <button type="submit">حفظ</button>
    </form>
  );
}
```

## Troubleshooting

### Map Not Displaying
- Ensure MapLibre CSS is imported
- Check that container has explicit height
- Verify map container exists before initialization

### Geocoding Not Working
- Check internet connection
- Verify Nominatim is not blocked by firewall
- Check browser console for CORS errors

### RTL Issues
- Ensure `locale="ar"` prop is set
- Check that RTL plugin loaded successfully
- Verify `dir="rtl"` on parent elements

### Performance Issues
- Reduce number of markers
- Enable clustering
- Filter data before passing to map
- Use React.memo for expensive components

## Future Enhancements

Planned features for future versions:
- [ ] Offline map tiles
- [ ] Custom map styles
- [ ] 3D terrain view
- [ ] Heat maps for density
- [ ] Export map as image
- [ ] Share map link
- [ ] Print map view
- [ ] Mobile gestures optimization
- [ ] Advanced timeline controls
- [ ] Multi-tree comparison
