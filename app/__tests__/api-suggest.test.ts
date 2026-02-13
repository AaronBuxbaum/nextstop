import { describe, it, expect, vi } from 'vitest';
import { POST } from '@/app/api/ai/suggest/route';
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
  sql: vi.fn((strings: TemplateStringsArray, ..._values: unknown[]) => {
    const query = strings.join('?');
    
    // Mock plan query
    if (query.includes('SELECT p.* FROM plans')) {
      return Promise.resolve([{
        id: 'plan-1',
        title: 'NYC Day Trip',
        description: 'Exploring Manhattan',
        theme: 'Urban Adventure',
        user_id: 'user-1'
      }]);
    }
    
    // Mock events query
    if (query.includes('SELECT * FROM events')) {
      return Promise.resolve([
        {
          id: 'event-1',
          title: 'Breakfast',
          location: 'Times Square Diner, New York, NY',
          start_time: '09:00',
          duration: 60,
          description: 'Morning meal'
        },
        {
          id: 'event-2',
          title: 'Museum Visit',
          location: 'MoMA, Manhattan, New York',
          start_time: '11:00',
          duration: 120,
          description: 'Art museum'
        }
      ]);
    }
    
    return Promise.resolve([]);
  })
}));

// Mock AI SDK
vi.mock('ai', () => ({
  generateText: vi.fn(() => Promise.resolve({
    text: JSON.stringify([
      {
        type: 'event',
        title: 'Add a lunch break',
        description: 'Take a break for lunch between museum and afternoon activities',
        event: {
          title: 'Lunch at Central Park',
          description: 'Casual lunch near the park',
          location: 'The Loeb Boathouse',
          duration: 90,
          notes: 'Outdoor seating available'
        },
        reasoning: 'Provides a relaxing break and fills the gap in the schedule'
      }
    ])
  }))
}));

describe('POST /api/ai/suggest', () => {
  it('validates and normalizes suggestion locations using OpenStreetMap', async () => {
    let nominatimCalledForBoathouse = false;
    
    // Mock Nominatim API
    server.use(
      http.get('https://nominatim.openstreetmap.org/search', ({ request }) => {
        const url = new URL(request.url);
        const query = url.searchParams.get('q');
        
        if (query?.includes('Loeb Boathouse')) {
          nominatimCalledForBoathouse = true;
          return HttpResponse.json([
            {
              place_id: 789,
              display_name: 'The Loeb Boathouse, Central Park East, Manhattan, New York County, New York, 10065, United States',
              lat: '40.7736',
              lon: '-73.9677',
              importance: 0.85
            }
          ]);
        }
        
        // Mock for existing locations (for center calculation)
        if (query?.includes('Times Square')) {
          return HttpResponse.json([{
            place_id: 1,
            display_name: 'Times Square Diner, Broadway, Manhattan, New York, NY 10036, United States',
            lat: '40.7580',
            lon: '-73.9855'
          }]);
        }
        
        if (query?.includes('MoMA')) {
          return HttpResponse.json([{
            place_id: 2,
            display_name: 'MoMA, 11 West 53rd Street, Manhattan, New York County, New York, 10019, United States',
            lat: '40.7614',
            lon: '-73.9776'
          }]);
        }
        
        return HttpResponse.json([]);
      })
    );

    const request = new NextRequest('http://localhost:3000/api/ai/suggest', {
      method: 'POST',
      body: JSON.stringify({
        planId: 'plan-1',
        context: 'Looking for lunch options'
      })
    });

    const response = await POST(request);
    const data = await response.json();

    // Verify the response was successful
    expect(response.status).toBe(200);
    expect(data.suggestions).toBeDefined();
    expect(data.suggestions.length).toBeGreaterThan(0);

    // Verify that Nominatim was called
    expect(nominatimCalledForBoathouse).toBe(true);

    // Verify the address was normalized to full OpenStreetMap display name
    const firstSuggestion = data.suggestions[0];
    expect(firstSuggestion.event.location).toContain('Central Park East');
    expect(firstSuggestion.event.location).toContain('Manhattan');
    expect(firstSuggestion.event.location).toContain('United States');
    // Should not be the short AI-generated name
    expect(firstSuggestion.event.location).not.toBe('The Loeb Boathouse');
  });

  it('handles suggestions without locations', async () => {
    // Mock AI to return a suggestion without location
    const { generateText } = await import('ai');
    vi.mocked(generateText).mockResolvedValueOnce({
      text: JSON.stringify([
        {
          type: 'pacing',
          title: 'Reduce museum time',
          description: 'Consider reducing museum visit to 90 minutes',
          reasoning: 'Allows more time for other activities'
        }
      ]),
      finishReason: 'stop' as const,
      usage: { 
        inputTokens: 0, 
        outputTokens: 0,
        inputTokenDetails: {
          noCacheTokens: 0,
          cacheReadTokens: 0,
          cacheWriteTokens: 0
        },
        outputTokenDetails: {
          textTokens: 0,
          reasoningTokens: 0
        },
        totalTokens: 0
      },
        response: {} as any
    } as any);

    const request = new NextRequest('http://localhost:3000/api/ai/suggest', {
      method: 'POST',
      body: JSON.stringify({
        planId: 'plan-1'
      })
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.suggestions).toBeDefined();
    expect(data.suggestions[0].event).toBeUndefined();
  });

  it('validates multiple event suggestions with locations', async () => {
    // Mock AI to return multiple suggestions with locations
    const { generateText } = await import('ai');
    vi.mocked(generateText).mockResolvedValueOnce({
      text: JSON.stringify([
        {
          type: 'event',
          title: 'Coffee Break',
          description: 'Quick coffee stop',
          event: {
            title: 'Coffee at Bryant Park',
            location: 'Bryant Park Grill',
            duration: 30
          },
          reasoning: 'Good midmorning break'
        },
        {
          type: 'event',
          title: 'Dessert Stop',
          description: 'Sweet treat',
          event: {
            title: 'Dessert at Magnolia Bakery',
            location: 'Magnolia Bakery',
            duration: 20
          },
          reasoning: 'Famous NYC bakery'
        }
      ]),
      finishReason: 'stop' as const,
      usage: { 
        inputTokens: 0, 
        outputTokens: 0,
        inputTokenDetails: {
          noCacheTokens: 0,
          cacheReadTokens: 0,
          cacheWriteTokens: 0
        },
        outputTokenDetails: {
          textTokens: 0,
          reasoningTokens: 0
        },
        totalTokens: 0
      },
        response: {} as any
    } as any);

    // Mock Nominatim for both locations
    server.use(
      http.get('https://nominatim.openstreetmap.org/search', ({ request }) => {
        const url = new URL(request.url);
        const query = url.searchParams.get('q');
        
        if (query?.includes('Bryant Park')) {
          return HttpResponse.json([{
            place_id: 3,
            display_name: 'Bryant Park Grill, West 40th Street, Manhattan, New York, NY 10018, United States',
            lat: '40.7536',
            lon: '-73.9832'
          }]);
        }
        
        if (query?.includes('Magnolia')) {
          return HttpResponse.json([{
            place_id: 4,
            display_name: 'Magnolia Bakery, Bleecker Street, West Village, Manhattan, New York, NY 10012, United States',
            lat: '40.7357',
            lon: '-74.0021'
          }]);
        }
        
        return HttpResponse.json([]);
      })
    );

    const request = new NextRequest('http://localhost:3000/api/ai/suggest', {
      method: 'POST',
      body: JSON.stringify({
        planId: 'plan-1'
      })
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.suggestions.length).toBe(2);
    
    // Both should have validated addresses
    expect(data.suggestions[0].event.location).toContain('United States');
    expect(data.suggestions[1].event.location).toContain('United States');
  });
});
