import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { WeatherInfo } from '@/components/WeatherInfo';
import { server } from '@/mocks/server';
import { http, HttpResponse } from 'msw';

describe('WeatherInfo Component', () => {
  it('renders nothing when no location is provided', () => {
    const { container } = render(<WeatherInfo location="" />);
    expect(container.textContent).toBe('');
  });

  it('uses forecast API for dates within 16 days', async () => {
    const today = new Date();
    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + 10);
    const dateStr = futureDate.toISOString().split('T')[0];

    // Mock the APIs
    server.use(
      http.get('https://nominatim.openstreetmap.org/search', () => {
        return HttpResponse.json([{ lat: '40.7128', lon: '-74.0060' }]);
      }),
      http.get('https://api.open-meteo.com/v1/forecast', ({ request }) => {
        const url = new URL(request.url);
        expect(url.searchParams.get('start_date')).toBe(dateStr);
        return HttpResponse.json({
          hourly: {
            time: Array(24).fill('').map((_, i) => `${dateStr}T${String(i).padStart(2, '0')}:00`),
            temperature_2m: Array(24).fill(75),
            weathercode: Array(24).fill(1)
          }
        });
      })
    );

    render(<WeatherInfo location="New York" date={dateStr} />);
    
    await waitFor(() => {
      expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument();
    }, { timeout: 3000 });

    // Should display weather
    expect(screen.getByText(/75°F/i)).toBeInTheDocument();
  });

  it('uses archive API for past dates', async () => {
    const today = new Date();
    const pastDate = new Date(today);
    pastDate.setDate(today.getDate() - 10);
    const dateStr = pastDate.toISOString().split('T')[0];

    // Mock the APIs
    server.use(
      http.get('https://nominatim.openstreetmap.org/search', () => {
        return HttpResponse.json([{ lat: '40.7128', lon: '-74.0060' }]);
      }),
      http.get('https://archive-api.open-meteo.com/v1/archive', ({ request }) => {
        const url = new URL(request.url);
        expect(url.searchParams.get('start_date')).toBe(dateStr);
        return HttpResponse.json({
          hourly: {
            time: Array(24).fill('').map((_, i) => `${dateStr}T${String(i).padStart(2, '0')}:00`),
            temperature_2m: Array(24).fill(68),
            weathercode: Array(24).fill(2)
          }
        });
      })
    );

    render(<WeatherInfo location="New York" date={dateStr} />);
    
    await waitFor(() => {
      expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument();
    }, { timeout: 3000 });

    // Should display weather
    expect(screen.getByText(/68°F/i)).toBeInTheDocument();
  });

  it('skips weather for dates more than 16 days in the future', async () => {
    const today = new Date();
    const farFutureDate = new Date(today);
    farFutureDate.setDate(today.getDate() + 20);
    const dateStr = farFutureDate.toISOString().split('T')[0];

    // Mock geocoding only
    server.use(
      http.get('https://nominatim.openstreetmap.org/search', () => {
        return HttpResponse.json([{ lat: '40.7128', lon: '-74.0060' }]);
      })
    );

    const { container } = render(<WeatherInfo location="New York" date={dateStr} />);
    
    await waitFor(() => {
      expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument();
    }, { timeout: 3000 });

    // Should not display weather (returns null)
    expect(container.textContent).toBe('');
  });

  it('handles location not found gracefully', async () => {
    // Mock geocoding with empty result
    server.use(
      http.get('https://nominatim.openstreetmap.org/search', () => {
        return HttpResponse.json([]);
      })
    );

    const { container } = render(<WeatherInfo location="NonexistentPlace12345" />);
    
    await waitFor(() => {
      expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument();
    }, { timeout: 3000 });

    // Should not display anything when location not found
    expect(container.textContent).toBe('');
  });
});
