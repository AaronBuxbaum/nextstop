'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import styles from './LocationAutocomplete.module.css';

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

interface LocationAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (displayName: string) => void;
  placeholder?: string;
  className?: string;
  centerLat?: number;
  centerLon?: number;
}

export function LocationAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = 'Search location...',
  className,
  centerLat,
  centerLon,
}: LocationAutocompleteProps) {
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const searchLocation = useCallback(async (query: string) => {
    if (query.length < 3) {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    setIsLoading(true);
    try {
      // Build URL with optional viewbox parameter for centering
      let url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`;
      
      // Add viewbox parameter if center coordinates are provided
      // Viewbox creates a ~10 mile radius around the center point
      if (centerLat !== undefined && centerLon !== undefined) {
        const latDelta = 0.15; // approximately 10 miles
        const lonDelta = 0.15;
        const viewbox = `${centerLon - lonDelta},${centerLat + latDelta},${centerLon + lonDelta},${centerLat - latDelta}`;
        url += `&viewbox=${viewbox}&bounded=0`;
      }
      
      const response = await fetch(url, { 
        headers: { 'User-Agent': 'NextStop/1.0' } 
      });
      if (response.ok) {
        const data: NominatimResult[] = await response.json();
        setResults(data);
        setShowDropdown(data.length > 0);
      }
    } catch {
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [centerLat, centerLon]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onChange(val);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      searchLocation(val);
    }, 300);
  };

  const handleSelect = (result: NominatimResult) => {
    onSelect(result.display_name);
    onChange(result.display_name);
    setShowDropdown(false);
    setResults([]);
    setFocusedIndex(-1);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return (
    <div className={styles.container} ref={containerRef}>
      <input
        type="text"
        value={value}
        onChange={handleInputChange}
        onFocus={() => results.length > 0 && setShowDropdown(true)}
        placeholder={placeholder}
        className={`${styles.input} ${className || ''}`}
        aria-label="Location search"
        aria-expanded={showDropdown}
        aria-controls="location-autocomplete-list"
        role="combobox"
        aria-autocomplete="list"
      />
      {isLoading && <span className={styles.spinner}>⏳</span>}
      {showDropdown && (
        <ul className={styles.dropdown} role="listbox" id="location-autocomplete-list">
          {results.map((result, index) => (
            <li
              key={result.place_id}
              className={styles.option}
              onClick={() => handleSelect(result)}
              role="option"
              aria-selected={index === focusedIndex}
            >
              <span className={styles.optionIcon}>📍</span>
              <span className={styles.optionText}>{result.display_name}</span>
            </li>
          ))}
          {results.length === 0 && !isLoading && (
            <li className={styles.noResults}>No results found</li>
          )}
        </ul>
      )}
    </div>
  );
}
