# Shajara Map Integration - Summary

## Installation Complete ✅

MapLibre GL JS and its TypeScript types have been successfully installed:
- `maplibre-gl@5.15.0`
- `@types/maplibre-gl@1.13.2`

## Files Created

### 1. Type Definitions
- **`src/types/map.ts`** - Comprehensive TypeScript types for all map-related functionality
  - Location types (Coordinates, Place, GeocodingResult)
  - Marker types (PersonMarker, MarkerCluster)
  - Migration types (MigrationPath, MigrationAnimation)
  - Map configuration types (MapStyle, MapTheme, MapControlState)
  - Component prop types

### 2. Utilities
- **`src/lib/geocoding.ts`** - Geocoding utilities using Nominatim API
  - `searchPlaces()` - Forward geocoding (search for places)
  - `reverseGeocode()` - Reverse geocoding (coordinates to address)
  - `geocodingResultToPlace()` - Convert API result to Place object
  - Built-in caching (7-day cache)
  - Rate limiting (1 request/second)
  - Distance calculation helpers

### 3. Hooks
- **`src/hooks/useMapLibre.ts`** - React hook for map management
  - Map initialization with RTL support
  - Marker management (add, remove, clear)
  - Navigation controls
  - Style switching
  - Layer visibility control
  - Bounds fitting and fly-to animations

### 4. Components

#### Main Components
- **`src/components/map/FamilyMap.tsx`** - Primary map component
  - Displays family members on map
  - Automatic marker clustering
  - Generation-based filtering
  - Interactive popups
  - RTL and dark mode support

- **`src/components/map/MigrationPath.tsx`** - Migration visualization
  - Animated migration paths
  - Generation-based coloring
  - Timeline filtering
  - Interactive path popups

- **`src/components/map/LocationPicker.tsx`** - Location input component
  - Search autocomplete with geocoding
  - Displays selected location with coordinates
  - Debounced search
  - RTL support

- **`src/components/map/MapControls.tsx`** - Control panel
  - Zoom controls
  - Fullscreen toggle
  - Layer visibility toggles
  - Map style switcher
  - Timeline filter
  - Theme toggle

#### Supporting Files
- **`src/components/map/index.ts`** - Centralized exports
- **`src/components/map/README.md`** - Comprehensive documentation
- **`src/components/map/example.tsx`** - Usage examples

## Quick Start

### 1. Import CSS (Required)

In your layout or page component:

```tsx
import 'maplibre-gl/dist/maplibre-gl.css';
```

### 2. Basic Usage

```tsx
import { FamilyMap } from '@/components/map';

export default function MapPage({ persons }) {
  return (
    <FamilyMap
      persons={persons}
      locale="ar"
      theme="light"
      height="600px"
    />
  );
}
```

### 3. Location Picker in Forms

```tsx
import { LocationPicker } from '@/components/map';

function PersonForm() {
  const handleLocationSelect = (place) => {
    // Save place.name, place.coordinates.lat, place.coordinates.lng
  };

  return (
    <LocationPicker
      locale="ar"
      placeholder="ابحث عن موقع..."
      onLocationSelect={handleLocationSelect}
    />
  );
}
```

## Features

### ✅ Implemented
- MapLibre GL JS integration
- Arabic RTL support
- Dark/light theme support
- Free geocoding with Nominatim
- Automatic marker clustering
- Migration path visualization
- Generation-based coloring
- Interactive popups
- Map controls (zoom, layers, style)
- Location search component
- Responsive design
- TypeScript support

### 🎨 Styling
- Matches Shajara theme colors (Emerald/Teal)
- Supports light and dark modes
- RTL-aware layout
- Arabic font support (Noto Sans Arabic)
- Custom marker styles
- Smooth animations

### 🗺️ Map Styles
1. **osm** - OpenStreetMap (default)
2. **osm-arabic** - OpenStreetMap with Arabic labels
3. **streets** - CartoDB clean style (light/dark)
4. **satellite** - Satellite imagery (requires API key)
5. **terrain** - Topographic map (requires API key)

### 📍 Marker Types
- 🟢 Birth places (Emerald)
- ⚪ Death places (Gray)
- 💗 Marriage locations (Pink)
- 🔵 Migration paths (Blue)
- 🔷 Residence locations (Teal)
- 🟣 Life events (Violet)

## Integration with Existing Database

The map components work seamlessly with your existing Person schema:

```typescript
// Person type already has these fields:
interface Person {
  birth_place: string | null;
  birth_place_lat: number | null;
  birth_place_lng: number | null;
  death_place: string | null;
  death_place_lat: number | null;
  death_place_lng: number | null;
}
```

When saving locations from LocationPicker:

```tsx
const handleLocationSelect = async (place: Place) => {
  await updatePerson({
    birth_place: place.name,
    birth_place_lat: place.coordinates.lat,
    birth_place_lng: place.coordinates.lng,
  });
};
```

## Performance Considerations

### Geocoding Cache
- Results cached for 7 days
- Reduces API calls
- Automatic cleanup of expired entries

### Rate Limiting
- Respects Nominatim's 1 request/second limit
- Automatic request queuing
- No API key required

### Map Optimization
- Marker clustering for 50+ markers
- Lazy loading of map tiles
- Efficient re-rendering with React hooks
- Debounced search (500ms)

## Next Steps

### 1. Add to a Page
Create a map page in your app:
```tsx
// src/app/[locale]/tree/[treeId]/map/page.tsx
import { FamilyMap } from '@/components/map';

export default async function TreeMapPage({ params }) {
  const persons = await getTreePersons(params.treeId);

  return (
    <div className="container mx-auto p-4">
      <h1>خريطة العائلة</h1>
      <FamilyMap
        persons={persons}
        locale="ar"
        height="calc(100vh - 200px)"
      />
    </div>
  );
}
```

### 2. Add LocationPicker to Person Form
Enhance your existing person form:
```tsx
import { LocationPicker } from '@/components/map';

// Add to form fields:
<LocationPicker
  locale="ar"
  placeholder="مكان الولادة"
  onLocationSelect={(place) => {
    setBirthPlace(place.name);
    setBirthLat(place.coordinates.lat);
    setBirthLng(place.coordinates.lng);
  }}
/>
```

### 3. Create Migration Paths
Add migration tracking to your app:
```tsx
import { createMigrationPathsFromPersons } from '@/components/map/example';

const migrationPaths = createMigrationPathsFromPersons(persons);

<FamilyMap
  persons={persons}
  migrationPaths={migrationPaths}
/>
```

## API Keys (Optional)

For satellite and terrain maps, you can get a free MapTiler API key:
1. Sign up at https://www.maptiler.com/
2. Get your API key
3. Replace `get_your_own_key` in `useMapLibre.ts` with your key

**Note:** The default OSM styles work without any API key!

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Accessibility

- Keyboard navigation support
- ARIA labels on controls
- High contrast mode support
- Screen reader compatible

## Troubleshooting

### Map not showing
1. Check that MapLibre CSS is imported
2. Ensure container has explicit height
3. Check browser console for errors

### Geocoding not working
1. Check internet connection
2. Verify Nominatim is accessible
3. Check rate limiting (max 1 req/sec)

### RTL issues
1. Ensure `locale="ar"` prop is set
2. Check that RTL plugin loaded
3. Verify parent has `dir="rtl"`

## Resources

- [MapLibre GL JS Documentation](https://maplibre.org/maplibre-gl-js/docs/)
- [Nominatim API Docs](https://nominatim.org/release-docs/develop/api/Overview/)
- [Component README](src/components/map/README.md)
- [Example Usage](src/components/map/example.tsx)

## License

The map components use:
- MapLibre GL JS (BSD 3-Clause License)
- OpenStreetMap data (ODbL)
- Nominatim API (usage policy applies)

---

**Ready to use!** 🎉

Check `src/components/map/README.md` for detailed documentation and `src/components/map/example.tsx` for working examples.
