/**
 * LocationPicker Component
 * Allows users to search for and select locations with map interaction
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, MapPin, X, Loader2 } from 'lucide-react';
import { searchPlaces, geocodingResultToPlace } from '@/lib/geocoding';
import type { LocationPickerProps, Place, GeocodingResult } from '@/types/map';
import 'maplibre-gl/dist/maplibre-gl.css';

// =====================================================
// MAIN COMPONENT
// =====================================================

export function LocationPicker({
  initialLocation,
  locale = 'ar',
  placeholder,
  onLocationSelect,
  onLocationClear,
  required = false,
  disabled = false,
  className = '',
}: LocationPickerProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeocodingResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<Place | undefined>(initialLocation);
  const [error, setError] = useState<string | null>(null);

  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // =====================================================
  // SEARCH HANDLER
  // =====================================================

  const handleSearch = useCallback(
    async (searchQuery: string) => {
      if (!searchQuery || searchQuery.trim().length < 2) {
        setResults([]);
        setShowResults(false);
        return;
      }

      setIsSearching(true);
      setError(null);

      try {
        const searchResults = await searchPlaces(searchQuery, locale, 10);
        setResults(searchResults);
        setShowResults(true);
      } catch (err) {
        console.error('Search error:', err);
        setError(locale === 'ar' ? 'خطأ في البحث' : 'Search error');
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    },
    [locale]
  );

  // =====================================================
  // INPUT CHANGE HANDLER
  // =====================================================

  const handleInputChange = (value: string) => {
    setQuery(value);

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Debounce search
    searchTimeoutRef.current = setTimeout(() => {
      handleSearch(value);
    }, 500);
  };

  // =====================================================
  // LOCATION SELECT HANDLER
  // =====================================================

  const handleLocationSelect = (result: GeocodingResult) => {
    const place = geocodingResultToPlace(result);
    setSelectedPlace(place);
    setQuery(place.name);
    setShowResults(false);
    onLocationSelect(place);
  };

  // =====================================================
  // CLEAR HANDLER
  // =====================================================

  const handleClear = () => {
    setQuery('');
    setSelectedPlace(undefined);
    setResults([]);
    setShowResults(false);
    setError(null);

    if (onLocationClear) {
      onLocationClear();
    }
  };

  // =====================================================
  // CLICK OUTSIDE HANDLER
  // =====================================================

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // =====================================================
  // CLEANUP
  // =====================================================

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // =====================================================
  // UPDATE INITIAL LOCATION
  // =====================================================

  useEffect(() => {
    if (initialLocation) {
      setSelectedPlace(initialLocation);
      setQuery(initialLocation.name);
    }
  }, [initialLocation]);

  // =====================================================
  // RENDER
  // =====================================================

  const placeholderText =
    placeholder ||
    (locale === 'ar' ? 'ابحث عن موقع...' : 'Search for a location...');

  return (
    <div
      ref={containerRef}
      className={`relative w-full ${className}`}
      dir={locale === 'ar' ? 'rtl' : 'ltr'}
    >
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 start-3 flex items-center pointer-events-none">
          {isSearching ? (
            <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
          ) : (
            <Search className="w-5 h-5 text-gray-400" />
          )}
        </div>

        <input
          type="text"
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => {
            if (results.length > 0) {
              setShowResults(true);
            }
          }}
          placeholder={placeholderText}
          disabled={disabled}
          required={required}
          className={`
            w-full px-10 py-3
            bg-white dark:bg-gray-800
            border border-gray-300 dark:border-gray-600
            rounded-lg
            text-gray-900 dark:text-gray-100
            placeholder-gray-400 dark:placeholder-gray-500
            focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
            disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed
            transition-colors
          `}
        />

        {/* Clear Button */}
        {query && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute inset-y-0 end-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Selected Location Display */}
      {selectedPlace && (
        <div className="mt-2 flex items-center gap-2 px-3 py-2 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg">
          <MapPin className="w-4 h-4 text-primary-600 dark:text-primary-400" />
          <span className="text-sm text-primary-700 dark:text-primary-300 flex-1">
            {selectedPlace.name}
          </span>
          <span className="text-xs text-primary-500 dark:text-primary-400">
            {selectedPlace.coordinates.lat.toFixed(4)}, {selectedPlace.coordinates.lng.toFixed(4)}
          </span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mt-2 px-3 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Search Results Dropdown */}
      {showResults && results.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-80 overflow-y-auto">
          {results.map((result, index) => (
            <button
              key={result.place_id || index}
              type="button"
              onClick={() => handleLocationSelect(result)}
              className="w-full px-4 py-3 text-start hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-b-0 transition-colors"
            >
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-primary-500 dark:text-primary-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {result.name || result.display_name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                    {result.display_name}
                  </p>
                  {result.address && (
                    <div className="flex gap-2 mt-1 text-xs text-gray-400">
                      {result.address.city && (
                        <span>{result.address.city}</span>
                      )}
                      {result.address.country && (
                        <span>• {result.address.country}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No Results Message */}
      {showResults && !isSearching && results.length === 0 && query.trim().length >= 2 && (
        <div className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
            {locale === 'ar' ? 'لم يتم العثور على نتائج' : 'No results found'}
          </p>
        </div>
      )}
    </div>
  );
}

// =====================================================
// LOCATION PICKER WITH MAP
// =====================================================

/**
 * Enhanced LocationPicker with integrated map for clicking locations
 * This is a more advanced version that shows a mini map
 */
export function LocationPickerWithMap({
  initialLocation,
  locale = 'ar',
  onLocationSelect,
  onLocationClear,
  height = '300px',
  className = '',
}: LocationPickerProps & { height?: string }) {
  const [showMap, setShowMap] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Place | undefined>(initialLocation);

  const handleLocationSelect = (place: Place) => {
    setSelectedLocation(place);
    onLocationSelect(place);
    setShowMap(false);
  };

  const handleClear = () => {
    setSelectedLocation(undefined);
    if (onLocationClear) {
      onLocationClear();
    }
  };

  return (
    <div className={className}>
      {/* Search Input */}
      <LocationPicker
        initialLocation={selectedLocation}
        locale={locale}
        onLocationSelect={handleLocationSelect}
        onLocationClear={handleClear}
      />

      {/* Toggle Map Button */}
      <button
        type="button"
        onClick={() => setShowMap(!showMap)}
        className="mt-2 w-full px-4 py-2 text-sm font-medium text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-900/20 hover:bg-primary-100 dark:hover:bg-primary-900/30 border border-primary-200 dark:border-primary-800 rounded-lg transition-colors"
      >
        {showMap
          ? locale === 'ar'
            ? 'إخفاء الخريطة'
            : 'Hide Map'
          : locale === 'ar'
          ? 'اختر من الخريطة'
          : 'Pick from Map'}
      </button>

      {/* Mini Map (placeholder - would integrate actual map) */}
      {showMap && (
        <div
          className="mt-2 bg-gray-200 dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600 flex items-center justify-center"
          style={{ height }}
        >
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            {locale === 'ar'
              ? 'انقر على الخريطة لتحديد الموقع'
              : 'Click on map to select location'}
          </p>
        </div>
      )}
    </div>
  );
}
