/**
 * Geocoding utilities for Shajara Family Tree
 * Uses Nominatim (OpenStreetMap) API for free geocoding with caching
 */

import type { Coordinates, GeocodingResult, CachedGeocodingResult, Place } from '@/types/map';

// =====================================================
// CONSTANTS
// =====================================================

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
const REQUEST_DELAY = 1000; // 1 second delay between requests (Nominatim usage policy)

// Cache for geocoding results
const geocodingCache: Map<string, CachedGeocodingResult> = new Map();

// Last request timestamp for rate limiting
let lastRequestTime = 0;

// =====================================================
// RATE LIMITING
// =====================================================

/**
 * Delay to respect Nominatim rate limiting (1 request per second)
 */
async function respectRateLimit(): Promise<void> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;

  if (timeSinceLastRequest < REQUEST_DELAY) {
    await new Promise(resolve => setTimeout(resolve, REQUEST_DELAY - timeSinceLastRequest));
  }

  lastRequestTime = Date.now();
}

// =====================================================
// CACHE HELPERS
// =====================================================

/**
 * Generate cache key from query and locale
 */
function getCacheKey(query: string, locale?: string): string {
  return `${query.toLowerCase().trim()}:${locale || 'en'}`;
}

/**
 * Check if cached result is still valid
 */
function isCacheValid(cached: CachedGeocodingResult): boolean {
  return Date.now() - cached.timestamp < CACHE_DURATION;
}

/**
 * Get cached result if available and valid
 */
function getFromCache(key: string): GeocodingResult[] | null {
  const cached = geocodingCache.get(key);

  if (cached && isCacheValid(cached)) {
    return cached.result;
  }

  // Remove expired cache entry
  if (cached) {
    geocodingCache.delete(key);
  }

  return null;
}

/**
 * Save result to cache
 */
function saveToCache(key: string, result: GeocodingResult[]): void {
  geocodingCache.set(key, {
    result,
    timestamp: Date.now(),
  });
}

// =====================================================
// FORWARD GEOCODING (Address -> Coordinates)
// =====================================================

/**
 * Search for places by query string
 * Supports both Arabic and English queries
 *
 * @param query - Search query (address, place name, etc.)
 * @param locale - Preferred language ('ar' or 'en')
 * @param limit - Maximum number of results (default: 5)
 * @returns Array of geocoding results
 */
export async function searchPlaces(
  query: string,
  locale: 'ar' | 'en' = 'en',
  limit: number = 5
): Promise<GeocodingResult[]> {
  if (!query || query.trim().length < 2) {
    return [];
  }

  // Check cache first
  const cacheKey = getCacheKey(query, locale);
  const cachedResult = getFromCache(cacheKey);

  if (cachedResult) {
    return cachedResult;
  }

  // Respect rate limiting
  await respectRateLimit();

  try {
    const params = new URLSearchParams({
      q: query,
      format: 'json',
      addressdetails: '1',
      limit: limit.toString(),
      'accept-language': locale === 'ar' ? 'ar,en' : 'en',
    });

    const response = await fetch(`${NOMINATIM_BASE_URL}/search?${params}`, {
      headers: {
        'User-Agent': 'Shajara-FamilyTree/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`Geocoding failed: ${response.statusText}`);
    }

    const results: GeocodingResult[] = await response.json();

    // Save to cache
    saveToCache(cacheKey, results);

    return results;
  } catch (error) {
    console.error('Forward geocoding error:', error);
    throw error;
  }
}

// =====================================================
// REVERSE GEOCODING (Coordinates -> Address)
// =====================================================

/**
 * Get place information from coordinates
 *
 * @param coordinates - Latitude and longitude
 * @param locale - Preferred language ('ar' or 'en')
 * @returns Place information or null if not found
 */
export async function reverseGeocode(
  coordinates: Coordinates,
  locale: 'ar' | 'en' = 'en'
): Promise<GeocodingResult | null> {
  if (!coordinates.lat || !coordinates.lng) {
    return null;
  }

  // Check cache first
  const cacheKey = getCacheKey(`${coordinates.lat},${coordinates.lng}`, locale);
  const cachedResult = getFromCache(cacheKey);

  if (cachedResult && cachedResult.length > 0) {
    return cachedResult[0];
  }

  // Respect rate limiting
  await respectRateLimit();

  try {
    const params = new URLSearchParams({
      lat: coordinates.lat.toString(),
      lon: coordinates.lng.toString(),
      format: 'json',
      addressdetails: '1',
      'accept-language': locale === 'ar' ? 'ar,en' : 'en',
    });

    const response = await fetch(`${NOMINATIM_BASE_URL}/reverse?${params}`, {
      headers: {
        'User-Agent': 'Shajara-FamilyTree/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`Reverse geocoding failed: ${response.statusText}`);
    }

    const result: GeocodingResult = await response.json();

    // Save to cache
    saveToCache(cacheKey, [result]);

    return result;
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return null;
  }
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Convert GeocodingResult to Place
 */
export function geocodingResultToPlace(result: GeocodingResult): Place {
  return {
    name: result.display_name,
    nameAr: result.display_name, // Nominatim returns localized names
    coordinates: {
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
    },
    type: determinePlaceType(result.type),
  };
}

/**
 * Determine place type from Nominatim result type
 */
function determinePlaceType(type: string): Place['type'] {
  const typeMap: Record<string, Place['type']> = {
    'city': 'city',
    'town': 'city',
    'village': 'village',
    'hamlet': 'village',
    'country': 'country',
    'state': 'region',
    'region': 'region',
    'province': 'region',
  };

  return typeMap[type] || 'custom';
}

/**
 * Format place name for display
 * Shows city, state, country in appropriate language
 */
export function formatPlaceName(result: GeocodingResult, locale: 'ar' | 'en' = 'en'): string {
  const parts: string[] = [];

  if (result.address?.city) {
    parts.push(result.address.city);
  }

  if (result.address?.state && result.address.state !== result.address.city) {
    parts.push(result.address.state);
  }

  if (result.address?.country) {
    parts.push(result.address.country);
  }

  return parts.join(locale === 'ar' ? '، ' : ', ');
}

/**
 * Calculate distance between two coordinates (in kilometers)
 * Uses Haversine formula
 */
export function calculateDistance(from: Coordinates, to: Coordinates): number {
  const R = 6371; // Earth's radius in kilometers

  const dLat = toRadians(to.lat - from.lat);
  const dLng = toRadians(to.lng - from.lng);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(from.lat)) * Math.cos(toRadians(to.lat)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Get bounds for an array of coordinates
 */
export function getCoordinatesBounds(coordinates: Coordinates[]): {
  north: number;
  south: number;
  east: number;
  west: number;
} {
  if (coordinates.length === 0) {
    return { north: 0, south: 0, east: 0, west: 0 };
  }

  let north = -90;
  let south = 90;
  let east = -180;
  let west = 180;

  coordinates.forEach(coord => {
    north = Math.max(north, coord.lat);
    south = Math.min(south, coord.lat);
    east = Math.max(east, coord.lng);
    west = Math.min(west, coord.lng);
  });

  return { north, south, east, west };
}

/**
 * Clear geocoding cache (useful for testing or memory management)
 */
export function clearGeocodingCache(): void {
  geocodingCache.clear();
}

/**
 * Get cache statistics
 */
export function getCacheStats(): {
  size: number;
  validEntries: number;
  expiredEntries: number;
} {
  let validEntries = 0;
  let expiredEntries = 0;

  geocodingCache.forEach(cached => {
    if (isCacheValid(cached)) {
      validEntries++;
    } else {
      expiredEntries++;
    }
  });

  return {
    size: geocodingCache.size,
    validEntries,
    expiredEntries,
  };
}
