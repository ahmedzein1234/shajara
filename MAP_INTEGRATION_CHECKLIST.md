# Map Integration Checklist

Use this checklist to integrate the map components into your Shajara app.

## ✅ Completed

- [x] Install MapLibre GL JS (`maplibre-gl@5.15.0`)
- [x] Install MapLibre TypeScript types (`@types/maplibre-gl@1.13.2`)
- [x] Create map types (`src/types/map.ts`)
- [x] Create geocoding utilities (`src/lib/geocoding.ts`)
- [x] Create useMapLibre hook (`src/hooks/useMapLibre.ts`)
- [x] Create FamilyMap component (`src/components/map/FamilyMap.tsx`)
- [x] Create MigrationPath component (`src/components/map/MigrationPath.tsx`)
- [x] Create LocationPicker component (`src/components/map/LocationPicker.tsx`)
- [x] Create MapControls component (`src/components/map/MapControls.tsx`)
- [x] Create index exports (`src/components/map/index.ts`)
- [x] Create documentation (`src/components/map/README.md`)
- [x] Create examples (`src/components/map/example.tsx`)

## 🔲 Todo - Integration Steps

### 1. Import MapLibre CSS

Add to your root layout or global CSS:

```tsx
// src/app/layout.tsx or src/app/[locale]/layout.tsx
import 'maplibre-gl/dist/maplibre-gl.css';
```

**Or** in your global CSS file:

```css
/* src/app/globals.css */
@import 'maplibre-gl/dist/maplibre-gl.css';
```

### 2. Create Map Page

Create a new page to display the family map:

```tsx
// src/app/[locale]/tree/[treeId]/map/page.tsx

import { FamilyMap } from '@/components/map';
// Import your data fetching function
// import { getTreePersons } from '@/lib/api/...';

export default async function TreeMapPage({
  params,
}: {
  params: { locale: string; treeId: string };
}) {
  // Fetch persons for this tree
  // const persons = await getTreePersons(params.treeId);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4" dir={params.locale === 'ar' ? 'rtl' : 'ltr'}>
        {params.locale === 'ar' ? 'خريطة العائلة' : 'Family Map'}
      </h1>

      <FamilyMap
        persons={persons}
        locale={params.locale as 'ar' | 'en'}
        height="calc(100vh - 200px)"
        showControls={true}
      />
    </div>
  );
}
```

### 3. Add LocationPicker to Person Form

Update your person creation/edit form:

```tsx
// In your person form component
import { LocationPicker } from '@/components/map';
import { useState } from 'react';

function PersonForm() {
  const [birthPlace, setBirthPlace] = useState(null);

  const handleSubmit = async (formData) => {
    const personData = {
      ...formData,
      birth_place: birthPlace?.name,
      birth_place_lat: birthPlace?.coordinates.lat,
      birth_place_lng: birthPlace?.coordinates.lng,
    };

    // Save to database
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Other form fields */}

      <div>
        <label>Birth Place</label>
        <LocationPicker
          locale="ar"
          placeholder="ابحث عن مكان الولادة..."
          onLocationSelect={setBirthPlace}
        />
      </div>

      {/* More fields */}
    </form>
  );
}
```

### 4. Add Navigation Link

Add a link to the map page in your navigation:

```tsx
// In your navigation component
<Link href={`/${locale}/tree/${treeId}/map`}>
  <MapIcon className="w-5 h-5" />
  {locale === 'ar' ? 'الخريطة' : 'Map'}
</Link>
```

### 5. Test the Integration

- [ ] Navigate to the map page
- [ ] Verify map loads correctly
- [ ] Check that markers appear for persons with locations
- [ ] Test clicking on markers (popups should appear)
- [ ] Test map controls (zoom, layers, style switching)
- [ ] Test LocationPicker in person form
- [ ] Verify geocoding search works
- [ ] Test RTL layout in Arabic
- [ ] Test dark mode (if implemented)
- [ ] Test responsive design on mobile

### 6. Optional Enhancements

- [ ] Add migration path visualization
- [ ] Add timeline filtering
- [ ] Add generation-based filtering
- [ ] Create a dedicated map view for each person
- [ ] Add export/share map functionality
- [ ] Add print map functionality
- [ ] Add clustering configuration

## 📝 Notes

### Performance Tips

1. **Limit Initial Data**: Don't load all persons at once
   ```tsx
   // Only fetch persons with location data
   const personsWithLocations = persons.filter(
     p => p.birth_place_lat || p.death_place_lat
   );
   ```

2. **Enable Clustering**: Automatic for 50+ markers
   ```tsx
   <FamilyMap
     persons={persons}
     showClusters={true}
   />
   ```

3. **Lazy Load**: Consider lazy loading the map component
   ```tsx
   import dynamic from 'next/dynamic';

   const FamilyMap = dynamic(() => import('@/components/map').then(m => m.FamilyMap), {
     ssr: false,
     loading: () => <div>Loading map...</div>
   });
   ```

### Styling Customization

All components use Tailwind classes. Customize by:
- Adjusting colors in `tailwind.config.ts`
- Overriding component styles with custom classes
- Using dark mode variants

### Geocoding Limits

Nominatim API (free):
- Rate limit: 1 request per second
- No API key required
- Results cached for 7 days
- Usage policy: https://operations.osmfoundation.org/policies/nominatim/

For higher usage, consider:
- Self-hosting Nominatim
- Using a paid geocoding service
- Implementing server-side caching

### Map Tiles

Current configuration uses free tiles:
- OpenStreetMap (no key required)
- CartoDB (no key required)

For satellite/terrain:
- Get free MapTiler API key
- Update in `src/hooks/useMapLibre.ts`

### Browser Testing

Test on:
- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

### Accessibility

- All controls have ARIA labels
- Keyboard navigation supported
- Screen reader compatible
- High contrast mode supported

## 🐛 Common Issues

### Issue: Map not displaying
**Solution**:
1. Check MapLibre CSS is imported
2. Verify container has explicit height
3. Check browser console for errors

### Issue: Markers not showing
**Solution**:
1. Verify persons have lat/lng coordinates
2. Check console for coordinate parsing errors
3. Verify coordinates are valid (-90 to 90 lat, -180 to 180 lng)

### Issue: Geocoding not working
**Solution**:
1. Check internet connection
2. Verify Nominatim API is accessible
3. Check rate limiting (max 1 req/sec)
4. Clear cache if needed: `clearGeocodingCache()`

### Issue: RTL layout issues
**Solution**:
1. Ensure `locale="ar"` prop is set
2. Check parent element has `dir="rtl"`
3. Verify RTL plugin loaded successfully

### Issue: Dark mode not working
**Solution**:
1. Check `theme` prop is set correctly
2. Verify Tailwind dark mode is configured
3. Check parent has `dark` class

## 📚 Resources

- [Component Documentation](src/components/map/README.md)
- [Example Usage](src/components/map/example.tsx)
- [MapLibre Docs](https://maplibre.org/maplibre-gl-js/docs/)
- [Nominatim API](https://nominatim.org/release-docs/develop/api/Overview/)

## ✨ Future Enhancements

Consider adding:
- [ ] Offline map support
- [ ] Custom map styles
- [ ] 3D terrain view
- [ ] Heat maps for density visualization
- [ ] Advanced timeline controls
- [ ] Multi-tree comparison
- [ ] Export map as image
- [ ] Share map link
- [ ] Geofencing for regions
- [ ] Historical map overlays

---

**Questions or Issues?**

Refer to the detailed documentation in `src/components/map/README.md` or check the examples in `src/components/map/example.tsx`.
