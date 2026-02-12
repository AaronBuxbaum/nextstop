import { useState, useEffect } from 'react';

export interface Coordinates {
  lat: number;
  lon: number;
}

// Midtown NYC coordinates as fallback
const MIDTOWN_NYC: Coordinates = {
  lat: 40.7580,
  lon: -73.9855,
};

export function useGeolocation(): Coordinates {
  const [coords, setCoords] = useState<Coordinates>(MIDTOWN_NYC);

  useEffect(() => {
    // Check if geolocation is available
    if (!navigator.geolocation) {
      return;
    }

    // Try to get user's location
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        });
      },
      (error) => {
        // On error (permission denied, timeout, etc.), keep default
        console.log('Geolocation not available, using default location:', error.message);
      },
      {
        timeout: 5000,
        maximumAge: 300000, // Cache for 5 minutes
      }
    );
  }, []);

  return coords;
}
