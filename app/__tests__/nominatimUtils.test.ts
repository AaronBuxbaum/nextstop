import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import { validateAndNormalizeAddress, getGeographicCenter } from '@/lib/nominatimUtils';

describe('nominatimUtils', () => {
  describe('validateAndNormalizeAddress', () => {
    it('returns full OpenStreetMap display_name for valid address', async () => {
      // Mock Nominatim API response
      server.use(
        http.get('https://nominatim.openstreetmap.org/search', () => {
          return HttpResponse.json([
            {
              place_id: 123,
              display_name: 'Starbucks, 123 Main Street, New York, NY 10001, United States',
              lat: '40.7128',
              lon: '-74.0060',
              importance: 0.8
            }
          ]);
        })
      );

      const result = await validateAndNormalizeAddress('Starbucks on Main Street');
      expect(result).toBe('Starbucks, 123 Main Street, New York, NY 10001, United States');
    });

    it('returns most important result when multiple matches', async () => {
      server.use(
        http.get('https://nominatim.openstreetmap.org/search', () => {
          return HttpResponse.json([
            {
              place_id: 123,
              display_name: 'Starbucks, 123 Main Street, New York, NY',
              lat: '40.7128',
              lon: '-74.0060',
              importance: 0.5
            },
            {
              place_id: 456,
              display_name: 'Starbucks Reserve, 456 Broadway, New York, NY 10013, United States',
              lat: '40.7180',
              lon: '-74.0020',
              importance: 0.9
            }
          ]);
        })
      );

      const result = await validateAndNormalizeAddress('Starbucks');
      expect(result).toBe('Starbucks Reserve, 456 Broadway, New York, NY 10013, United States');
    });

    it('returns original address when no results found', async () => {
      server.use(
        http.get('https://nominatim.openstreetmap.org/search', () => {
          return HttpResponse.json([]);
        })
      );

      const result = await validateAndNormalizeAddress('NonexistentPlace12345');
      expect(result).toBe('NonexistentPlace12345');
    });

    it('returns original address on API error', async () => {
      server.use(
        http.get('https://nominatim.openstreetmap.org/search', () => {
          return new HttpResponse(null, { status: 500 });
        })
      );

      const result = await validateAndNormalizeAddress('Test Address');
      expect(result).toBe('Test Address');
    });

    it('returns original address when address is empty', async () => {
      const result = await validateAndNormalizeAddress('');
      expect(result).toBe('');
    });

    it('returns original address when address exceeds maximum length', async () => {
      const longAddress = 'a'.repeat(501);
      const result = await validateAndNormalizeAddress(longAddress);
      expect(result).toBe(longAddress);
    });

    it('includes viewbox in request when center coordinates provided', async () => {
      let requestUrl = '';
      server.use(
        http.get('https://nominatim.openstreetmap.org/search', ({ request }) => {
          requestUrl = request.url;
          return HttpResponse.json([
            {
              place_id: 123,
              display_name: 'Local Starbucks, 100 5th Ave, New York, NY',
              lat: '40.7128',
              lon: '-74.0060'
            }
          ]);
        })
      );

      await validateAndNormalizeAddress('Starbucks', 40.7128, -74.0060);
      expect(requestUrl).toContain('viewbox=');
      expect(requestUrl).toContain('bounded=0');
    });

    it('handles network timeout gracefully', async () => {
      server.use(
        http.get('https://nominatim.openstreetmap.org/search', async () => {
          // Simulate a delay longer than timeout
          await new Promise(resolve => setTimeout(resolve, 6000));
          return HttpResponse.json([]);
        })
      );

      const result = await validateAndNormalizeAddress('Test Address');
      expect(result).toBe('Test Address');
    }, 10000); // Increase test timeout to 10 seconds to accommodate the simulated delay
  });

  describe('getGeographicCenter', () => {
    it('calculates average coordinates from multiple addresses', async () => {
      server.use(
        http.get('https://nominatim.openstreetmap.org/search', ({ request }) => {
          const url = new URL(request.url);
          const query = url.searchParams.get('q');
          
          if (query?.includes('Address 1')) {
            return HttpResponse.json([
              { place_id: 1, display_name: 'Address 1', lat: '40.0', lon: '-74.0' }
            ]);
          } else if (query?.includes('Address 2')) {
            return HttpResponse.json([
              { place_id: 2, display_name: 'Address 2', lat: '42.0', lon: '-72.0' }
            ]);
          }
          return HttpResponse.json([]);
        })
      );

      const result = await getGeographicCenter(['Address 1', 'Address 2']);
      expect(result).toEqual({ lat: 41.0, lon: -73.0 });
    });

    it('returns undefined for empty array', async () => {
      const result = await getGeographicCenter([]);
      expect(result).toBeUndefined();
    });

    it('handles addresses that cannot be geocoded', async () => {
      server.use(
        http.get('https://nominatim.openstreetmap.org/search', ({ request }) => {
          const url = new URL(request.url);
          const query = url.searchParams.get('q');
          
          if (query?.includes('Valid')) {
            return HttpResponse.json([
              { place_id: 1, display_name: 'Valid', lat: '40.0', lon: '-74.0' }
            ]);
          }
          return HttpResponse.json([]);
        })
      );

      const result = await getGeographicCenter(['Valid Address', 'Invalid Address']);
      expect(result).toEqual({ lat: 40.0, lon: -74.0 });
    });

    it('returns undefined when no addresses can be geocoded', async () => {
      server.use(
        http.get('https://nominatim.openstreetmap.org/search', () => {
          return HttpResponse.json([]);
        })
      );

      const result = await getGeographicCenter(['Invalid 1', 'Invalid 2']);
      expect(result).toBeUndefined();
    });
  });
});
