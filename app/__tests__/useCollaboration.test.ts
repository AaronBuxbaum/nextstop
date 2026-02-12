import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import { useCollaboration } from '@/lib/useCollaboration';

const mockCollaborationResponse = {
  activeUsers: [
    { userId: 'user-1', userName: 'Alice', lastActive: Date.now() },
  ],
  editingStates: [],
};

describe('useCollaboration Hook', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fetchSpy = vi.spyOn(global, 'fetch');
    server.use(
      http.post('/api/collaboration', () => {
        return HttpResponse.json(mockCollaborationResponse);
      }),
      http.get('/api/collaboration', () => {
        return HttpResponse.json(mockCollaborationResponse);
      })
    );
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it('sends heartbeat on mount when enabled', async () => {
    renderHook(() =>
      useCollaboration({ planId: 'plan-1', enabled: true })
    );

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith('/api/collaboration', expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('"action":"heartbeat"'),
      }));
    });
  });

  it('does not send heartbeat when disabled', async () => {
    renderHook(() =>
      useCollaboration({ planId: 'plan-1', enabled: false })
    );

    // Wait a tick and check that no collaboration calls were made
    await new Promise((r) => setTimeout(r, 50));
    const collaborationCalls = fetchSpy.mock.calls.filter(
      (call) => typeof call[0] === 'string' && call[0].includes('/api/collaboration')
    );
    expect(collaborationCalls).toHaveLength(0);
  });

  it('provides startEditing function', async () => {
    const { result } = renderHook(() =>
      useCollaboration({ planId: 'plan-1', enabled: true })
    );

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalled();
    });

    await act(async () => {
      result.current.startEditing('event-1', 'event');
    });

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith('/api/collaboration', expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('"action":"startEditing"'),
      }));
    });
  });

  it('provides stopEditing function', async () => {
    const { result } = renderHook(() =>
      useCollaboration({ planId: 'plan-1', enabled: true })
    );

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalled();
    });

    await act(async () => {
      result.current.stopEditing('event-1');
    });

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith('/api/collaboration', expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('"action":"stopEditing"'),
      }));
    });
  });

  it('updates state from server response', async () => {
    const { result } = renderHook(() =>
      useCollaboration({ planId: 'plan-1', enabled: true })
    );

    await waitFor(() => {
      expect(result.current.activeUsers).toHaveLength(1);
      expect(result.current.activeUsers[0].userName).toBe('Alice');
    });
  });

  it('handles fetch errors gracefully', async () => {
    server.use(
      http.post('/api/collaboration', () => {
        return HttpResponse.error();
      })
    );

    const { result } = renderHook(() =>
      useCollaboration({ planId: 'plan-1', enabled: true })
    );

    // Should not throw, state should remain default
    await new Promise((r) => setTimeout(r, 50));
    expect(result.current.activeUsers).toEqual([]);
    expect(result.current.editingStates).toEqual([]);
  });
});
