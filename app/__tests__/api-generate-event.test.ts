import { describe, it, expect, vi } from 'vitest';
import { POST } from '@/app/api/ai/generate-event/route';
import { NextRequest } from 'next/server';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';

// Mock next-auth
vi.mock('next-auth', () => ({
  default: vi.fn(() => ({ 
    handlers: { GET: vi.fn(), POST: vi.fn() } 
  })),
  getServerSession: vi.fn(() => Promise.resolve({
    user: { id: 'user-1', email: 'test@test.com', name: 'Test User' }
  }))
}));

// Mock database
vi.mock('@/lib/db', () => ({
  sql: vi.fn((strings: TemplateStringsArray, ...values: unknown[]) => {
    const query = strings.join('?');
    
    // Mock plan query
    if (query.includes('SELECT p.* FROM plans')) {
      return Promise.resolve([{
        id: 'plan-1',
        title: 'Weekend Trip',
        description: 'A fun weekend',
        theme: 'Adventure',
        date: '2026-03-15',
        user_id: 'user-1'
      }]);
    }
    
    // Mock events query
    if (query.includes('SELECT * FROM events')) {
      return Promise.resolve([
        {
          id: 'event-1',
          title: 'Breakfast',
          location: 'Central Park Cafe, 123 Park Ave, New York, NY',
          start_time: '09:00',
          duration: 60
        }
      ]);
    }
    
    return Promise.resolve([]);
  })
}));

// Mock AI SDK
vi.mock('ai', () => ({
  generateText: vi.fn(() => Promise.resolve({
    text: JSON.stringify({
      options: [
        {
          event: {
            title: 'Coffee Break',
            description: 'Morning coffee',
            location: 'Starbucks on Main Street',
            startTime: '10:30',
            duration: 30,
            notes: null
          },
          placement: {
            strategy: 'after',
            referenceEvent: 'Breakfast',
            explanation: 'After breakfast'
          },
          style: 'Quick & Casual'
        }
      ]
    })
  }))
}));

describe('POST /api/ai/generate-event', () => {
  it('validates and normalizes addresses using OpenStreetMap', async () => {
    // Mock Nominatim API to validate the AI-generated address
    let nominatimCalled = false;
    server.use(
      http.get('https://nominatim.openstreetmap.org/search', ({ request }) => {
        const url = new URL(request.url);
        const query = url.searchParams.get('q');
        
        nominatimCalled = true;
        
        // Return full OSM display name for Starbucks
        if (query?.includes('Starbucks')) {
          return HttpResponse.json([
            {
              place_id: 123,
              display_name: 'Starbucks, 456 Main Street, Manhattan, New York, NY 10001, United States',
              lat: '40.7128',
              lon: '-74.0060',
              importance: 0.8
            }
          ]);
        }
        
        // Return full OSM display name for existing location (for center calculation)
        if (query?.includes('Central Park Cafe')) {
          return HttpResponse.json([
            {
              place_id: 456,
              display_name: 'Central Park Cafe, 123 Park Avenue, Manhattan, New York, NY 10022, United States',
              lat: '40.7580',
              lon: '-73.9855',
              importance: 0.7
            }
          ]);
        }
        
        return HttpResponse.json([]);
      })
    );

    const request = new NextRequest('http://localhost:3000/api/ai/generate-event', {
      method: 'POST',
      body: JSON.stringify({
        planId: 'plan-1',
        userInput: 'Add a coffee break after breakfast'
      })
    });

    const response = await POST(request);
    const data = await response.json();

    // Verify the response was successful
    expect(response.status).toBe(200);
    expect(data.options).toBeDefined();
    expect(data.options.length).toBeGreaterThan(0);

    // Verify that Nominatim was called to validate the address
    expect(nominatimCalled).toBe(true);

    // Verify the address was normalized to full OpenStreetMap display name
    const firstOption = data.options[0];
    expect(firstOption.event.location).toContain('Starbucks');
    expect(firstOption.event.location).toContain('Manhattan');
    expect(firstOption.event.location).toContain('United States');
    // It should be the full OSM address, not the AI's short version
    expect(firstOption.event.location).not.toBe('Starbucks on Main Street');
  });

  it('returns original address if Nominatim validation fails', async () => {
    // Mock Nominatim to return no results
    server.use(
      http.get('https://nominatim.openstreetmap.org/search', () => {
        return HttpResponse.json([]);
      })
    );

    const request = new NextRequest('http://localhost:3000/api/ai/generate-event', {
      method: 'POST',
      body: JSON.stringify({
        planId: 'plan-1',
        userInput: 'Add an event at a nonexistent place'
      })
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.options).toBeDefined();
    // Should still return the AI-generated address even if not validated
    expect(data.options[0].event.location).toBe('Starbucks on Main Street');
  });

  it('handles multiple event options with different locations', async () => {
    // Mock AI to return multiple options
    const { generateText } = await import('ai');
    vi.mocked(generateText).mockResolvedValueOnce({
      text: JSON.stringify({
        options: [
          {
            event: {
              title: 'Coffee at Starbucks',
              location: 'Starbucks',
              startTime: '10:30',
              duration: 30
            },
            placement: { strategy: 'after', referenceEvent: 'Breakfast', explanation: 'After breakfast' },
            style: 'Chain'
          },
          {
            event: {
              title: 'Coffee at Local Cafe',
              location: 'Blue Bottle Coffee',
              startTime: '10:30',
              duration: 30
            },
            placement: { strategy: 'after', referenceEvent: 'Breakfast', explanation: 'After breakfast' },
            style: 'Artisan'
          }
        ]
      }),
      finishReason: 'stop',
      usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
      rawResponse: { headers: {} as any }
    } as any);

    // Mock Nominatim for both locations
    server.use(
      http.get('https://nominatim.openstreetmap.org/search', ({ request }) => {
        const url = new URL(request.url);
        const query = url.searchParams.get('q');
        
        if (query?.includes('Starbucks')) {
          return HttpResponse.json([{
            place_id: 1,
            display_name: 'Starbucks, 100 Broadway, New York, NY 10001, United States',
            lat: '40.7128',
            lon: '-74.0060'
          }]);
        }
        
        if (query?.includes('Blue Bottle')) {
          return HttpResponse.json([{
            place_id: 2,
            display_name: 'Blue Bottle Coffee, 200 5th Ave, New York, NY 10010, United States',
            lat: '40.7410',
            lon: '-73.9896'
          }]);
        }
        
        return HttpResponse.json([]);
      })
    );

    const request = new NextRequest('http://localhost:3000/api/ai/generate-event', {
      method: 'POST',
      body: JSON.stringify({
        planId: 'plan-1',
        userInput: 'Add a coffee break'
      })
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.options.length).toBe(2);
    
    // Both addresses should be validated
    expect(data.options[0].event.location).toContain('United States');
    expect(data.options[1].event.location).toContain('United States');
  });
});
