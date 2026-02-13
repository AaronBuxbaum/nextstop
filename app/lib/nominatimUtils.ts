/**
 * Utilities for interacting with OpenStreetMap Nominatim API
 * to validate and normalize addresses
 */

interface NominatimSearchResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  importance?: number;
}

/**
 * Validates and normalizes an address using OpenStreetMap Nominatim API.
 * 
 * Takes a potentially incomplete or informal address and returns the full
 * OpenStreetMap display name, ensuring consistency and validity.
 * 
 * @param address - The address to validate/normalize
 * @param centerLat - Optional latitude for geographic centering
 * @param centerLon - Optional longitude for geographic centering
 * @returns The validated OpenStreetMap display_name, or the original address if validation fails
 */
export async function validateAndNormalizeAddress(
  address: string,
  centerLat?: number,
  centerLon?: number
): Promise<string> {
  if (!address || address.trim().length === 0) {
    return address;
  }

  try {
    // Build URL with optional viewbox parameter for centering
    let url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=5`;
    
    // Add viewbox parameter if center coordinates are provided
    // Viewbox creates a ~10 mile radius around the center point
    if (centerLat !== undefined && centerLon !== undefined) {
      const latDelta = 0.15; // approximately 10 miles
      const lonDelta = 0.15;
      const viewbox = `${centerLon - lonDelta},${centerLat + latDelta},${centerLon + lonDelta},${centerLat - latDelta}`;
      url += `&viewbox=${viewbox}&bounded=0`;
    }
    
    const response = await fetch(url, { 
      headers: { 'User-Agent': 'NextStop/1.0' },
      // Add a timeout to prevent hanging
      signal: AbortSignal.timeout(5000)
    });

    if (!response.ok) {
      console.warn(`Nominatim API returned status ${response.status} for address: ${address}`);
      return address;
    }

    const results: NominatimSearchResult[] = await response.json();
    
    // If we have results, return the most relevant one (first result, or highest importance)
    if (results.length > 0) {
      // Sort by importance if available, otherwise use first result
      const bestResult = results.sort((a, b) => 
        (b.importance || 0) - (a.importance || 0)
      )[0];
      
      return bestResult.display_name;
    }

    // No results found - return original address
    console.warn(`No Nominatim results found for address: ${address}`);
    return address;
  } catch (error) {
    // On error (network, timeout, etc.), return original address
    console.error('Error validating address with Nominatim:', error);
    return address;
  }
}

/**
 * Extracts geographic center from a list of addresses
 * @param addresses - Array of addresses to analyze
 * @returns Average lat/lon or undefined if no valid addresses
 */
export async function getGeographicCenter(
  addresses: string[]
): Promise<{ lat: number; lon: number } | undefined> {
  if (addresses.length === 0) return undefined;

  const coordinates: { lat: number; lon: number }[] = [];

  for (const address of addresses) {
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`;
      const response = await fetch(url, { 
        headers: { 'User-Agent': 'NextStop/1.0' },
        signal: AbortSignal.timeout(5000)
      });

      if (response.ok) {
        const results: NominatimSearchResult[] = await response.json();
        if (results.length > 0) {
          coordinates.push({
            lat: parseFloat(results[0].lat),
            lon: parseFloat(results[0].lon)
          });
        }
      }
    } catch (error) {
      // Skip this address on error
      console.warn(`Could not geocode address: ${address}`, error);
    }
  }

  if (coordinates.length === 0) return undefined;

  // Calculate average
  const avgLat = coordinates.reduce((sum, c) => sum + c.lat, 0) / coordinates.length;
  const avgLon = coordinates.reduce((sum, c) => sum + c.lon, 0) / coordinates.length;

  return { lat: avgLat, lon: avgLon };
}
