import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { TravelTime } from '@/components/TravelTime';

describe('TravelTime Component', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('shows loading state initially', () => {
    render(<TravelTime fromLocation="New York" toLocation="Boston" />);
    expect(screen.getByText('Calculating travel time...')).toBeInTheDocument();
  });

  it('renders without crashing', () => {
    const { container } = render(
      <TravelTime fromLocation="Central Park, New York" toLocation="Times Square, New York" />
    );
    expect(container).toBeTruthy();
  });

  it('accepts timeBetween prop for schedule warnings', () => {
    const { container } = render(
      <TravelTime 
        fromLocation="Central Park, New York" 
        toLocation="Times Square, New York"
        timeBetween={30}
      />
    );
    expect(container).toBeTruthy();
  });

  it('handles null geocoding data gracefully', async () => {
    // Mock fetch to return empty results
    global.fetch = vi.fn((url: RequestInfo | URL, init?: RequestInit) => {
      const urlString = typeof url === 'string' ? url : url.toString();
      // LGTM false positive: This is test mock code, not production sanitization
      // We're checking the URL to determine which mock response to return
      if (urlString.startsWith('https://nominatim.openstreetmap.org')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        } as Response);
      }
      return originalFetch(url, init);
    }) as typeof fetch;

    const { container } = render(
      <TravelTime fromLocation="Invalid Location" toLocation="Another Invalid" />
    );
    
    // Should handle error gracefully - component returns null on error
    // so it renders nothing (empty container)
    await waitFor(() => {
      expect(container).toBeTruthy();
      // When geocoding fails, component returns null (renders nothing)
      // So there should be no travel time display
      expect(container.querySelector('[class*="bar"]')).not.toBeInTheDocument();
    });
  });

  it('handles malformed geocoding data with null lat/lon', async () => {
    // Mock fetch to return data with null lat/lon
    global.fetch = vi.fn((url: RequestInfo | URL, init?: RequestInit) => {
      const urlString = typeof url === 'string' ? url : url.toString();
      // LGTM false positive: This is test mock code, not production sanitization
      // We're checking the URL to determine which mock response to return
      if (urlString.startsWith('https://nominatim.openstreetmap.org')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([{ lat: null, lon: null, display_name: 'Test' }]),
        } as Response);
      }
      return originalFetch(url, init);
    }) as typeof fetch;

    const { container } = render(
      <TravelTime fromLocation="Test Location" toLocation="Another Location" />
    );
    
    // Should not crash with null lat/lon access
    // Component returns null on error, so renders nothing
    await waitFor(() => {
      expect(container).toBeTruthy();
      expect(container.querySelector('[class*="bar"]')).not.toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it('handles response with null data element', async () => {
    // Mock fetch to return array with null element
    global.fetch = vi.fn((url: RequestInfo | URL, init?: RequestInit) => {
      const urlString = typeof url === 'string' ? url : url.toString();
      // LGTM false positive: This is test mock code, not production sanitization
      // We're checking the URL to determine which mock response to return
      if (urlString.startsWith('https://nominatim.openstreetmap.org')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([null]),
        } as Response);
      }
      return originalFetch(url, init);
    }) as typeof fetch;

    const { container } = render(
      <TravelTime fromLocation="Test Location" toLocation="Another Location" />
    );
    
    // Should not crash when data[0] is null
    // Component returns null on error, so renders nothing
    await waitFor(() => {
      expect(container).toBeTruthy();
      expect(container.querySelector('[class*="bar"]')).not.toBeInTheDocument();
    }, { timeout: 2000 });
  });
});
