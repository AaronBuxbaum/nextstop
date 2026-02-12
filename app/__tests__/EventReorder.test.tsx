import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the database module
vi.mock('@/lib/db', () => ({
  sql: vi.fn(),
}));

// Mock next-auth
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

// Mock the auth options
vi.mock('@/app/api/auth/[...nextauth]/route', () => ({
  authOptions: {},
}));

import { PATCH } from '@/app/api/events/[id]/route';
import { sql } from '@/lib/db';
import { getServerSession } from 'next-auth';

describe('Event Reordering on Time Change', () => {
  const mockSession = {
    user: {
      id: 'user-1',
      email: 'test@example.com',
      name: 'Test User',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession);
  });

  it('reorders events when start time changes to earlier', async () => {
    const eventId = 'event-2';
    const planId = 'plan-1';

    // Mock the current event (Event 2 with start time 12:00)
    const currentEvent = {
      id: eventId,
      plan_id: planId,
      title: 'Lunch',
      start_time: '12:00',
      position: 1,
    };

    // Mock all events in plan
    const allEvents = [
      { id: 'event-1', start_time: '09:00', position: 0 },
      { id: 'event-2', start_time: '12:00', position: 1 },
      { id: 'event-3', start_time: '15:00', position: 2 },
    ];

    // Setup mock responses
    let callCount = 0;
    (sql as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        // First call: fetch current event
        return Promise.resolve([currentEvent]);
      } else if (callCount === 2) {
        // Second call: fetch all events for reordering
        return Promise.resolve(allEvents);
      } else if (callCount === 3) {
        // Third call: update event
        return Promise.resolve({ rowCount: 1 });
      } else if (callCount === 4) {
        // Fourth call: fetch all events again for position updates
        return Promise.resolve(allEvents);
      } else if (callCount <= 7) {
        // Calls 5-7: update positions
        return Promise.resolve({ rowCount: 1 });
      } else {
        // Final call: fetch updated event
        return Promise.resolve([{ ...currentEvent, start_time: '08:00', position: 0 }]);
      }
    });

    const req = {
      json: async () => ({ startTime: '08:00' }),
    } as any;

    const params = Promise.resolve({ id: eventId });

    const response = await PATCH(req, { params });
    expect(response.status).toBe(200);
  });

  it('reorders events when start time changes to later', async () => {
    const eventId = 'event-1';
    const planId = 'plan-1';

    // Mock the current event (Event 1 with start time 09:00)
    const currentEvent = {
      id: eventId,
      plan_id: planId,
      title: 'Breakfast',
      start_time: '09:00',
      position: 0,
    };

    // Mock all events in plan
    const allEvents = [
      { id: 'event-1', start_time: '09:00', position: 0 },
      { id: 'event-2', start_time: '12:00', position: 1 },
      { id: 'event-3', start_time: '15:00', position: 2 },
    ];

    // Setup mock responses
    let callCount = 0;
    (sql as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        // First call: fetch current event
        return Promise.resolve([currentEvent]);
      } else if (callCount === 2) {
        // Second call: fetch all events for reordering
        return Promise.resolve(allEvents);
      } else if (callCount === 3) {
        // Third call: update event
        return Promise.resolve({ rowCount: 1 });
      } else if (callCount === 4) {
        // Fourth call: fetch all events again for position updates
        return Promise.resolve(allEvents);
      } else if (callCount <= 7) {
        // Calls 5-7: update positions
        return Promise.resolve({ rowCount: 1 });
      } else {
        // Final call: fetch updated event
        return Promise.resolve([{ ...currentEvent, start_time: '14:00', position: 2 }]);
      }
    });

    const req = {
      json: async () => ({ startTime: '14:00' }),
    } as any;

    const params = Promise.resolve({ id: eventId });

    const response = await PATCH(req, { params });
    expect(response.status).toBe(200);
  });

  it('does not reorder when time changes but position stays the same', async () => {
    const eventId = 'event-2';
    const planId = 'plan-1';

    const currentEvent = {
      id: eventId,
      plan_id: planId,
      title: 'Lunch',
      start_time: '12:00',
      position: 1,
    };

    const allEvents = [
      { id: 'event-1', start_time: '09:00', position: 0 },
      { id: 'event-2', start_time: '12:00', position: 1 },
      { id: 'event-3', start_time: '15:00', position: 2 },
    ];

    let callCount = 0;
    (sql as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.resolve([currentEvent]);
      } else if (callCount === 2) {
        return Promise.resolve(allEvents);
      } else if (callCount === 3) {
        // Update event
        return Promise.resolve({ rowCount: 1 });
      } else {
        // Fetch updated event (no reordering calls)
        return Promise.resolve([{ ...currentEvent, start_time: '12:30' }]);
      }
    });

    const req = {
      json: async () => ({ startTime: '12:30' }),
    } as any;

    const params = Promise.resolve({ id: eventId });

    const response = await PATCH(req, { params });
    expect(response.status).toBe(200);
    
    // Should only have 4 calls (no reordering queries)
    expect(callCount).toBe(4);
  });

  it('does not reorder when no time is provided in update', async () => {
    const eventId = 'event-2';

    const currentEvent = {
      id: eventId,
      plan_id: 'plan-1',
      title: 'Lunch',
      start_time: '12:00',
      position: 1,
    };

    let callCount = 0;
    (sql as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.resolve([currentEvent]);
      } else if (callCount === 2) {
        // Update event
        return Promise.resolve({ rowCount: 1 });
      } else {
        // Fetch updated event
        return Promise.resolve([{ ...currentEvent, title: 'Updated Lunch' }]);
      }
    });

    const req = {
      json: async () => ({ title: 'Updated Lunch' }),
    } as any;

    const params = Promise.resolve({ id: eventId });

    const response = await PATCH(req, { params });
    expect(response.status).toBe(200);
    
    // Should only have 3 calls (no reordering logic triggered)
    expect(callCount).toBe(3);
  });
});
