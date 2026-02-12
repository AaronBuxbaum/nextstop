'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface ActiveUser {
  userId: string;
  userName: string;
  lastActive: number;
}

interface EditingState {
  elementId: string;
  userId: string;
  elementType: 'event' | 'branch' | 'plan';
  timestamp: number;
}

interface CollaborationState {
  activeUsers: ActiveUser[];
  editingStates: EditingState[];
}

interface UseCollaborationOptions {
  planId: string;
  enabled?: boolean;
  heartbeatInterval?: number;
}

export function useCollaboration({
  planId,
  enabled = true,
  heartbeatInterval = 15000,
}: UseCollaborationOptions): CollaborationState & {
  startEditing: (elementId: string, elementType: 'event' | 'branch' | 'plan') => void;
  stopEditing: (elementId: string) => void;
} {
  const [state, setState] = useState<CollaborationState>({
    activeUsers: [],
    editingStates: [],
  });

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const sendHeartbeat = useCallback(async () => {
    if (!enabled || !planId) return;
    try {
      const response = await fetch('/api/collaboration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, action: 'heartbeat' }),
      });
      if (response.ok) {
        const data = await response.json();
        setState({
          activeUsers: data.activeUsers || [],
          editingStates: data.editingStates || [],
        });
      }
    } catch {
      // Silently fail - collaboration is optional
    }
  }, [planId, enabled]);

  const startEditing = useCallback(
    async (elementId: string, elementType: 'event' | 'branch' | 'plan') => {
      if (!enabled || !planId) return;
      try {
        const response = await fetch('/api/collaboration', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ planId, action: 'startEditing', elementId, elementType }),
        });
        if (response.ok) {
          const data = await response.json();
          setState({
            activeUsers: data.activeUsers || [],
            editingStates: data.editingStates || [],
          });
        }
      } catch {
        // Silently fail
      }
    },
    [planId, enabled]
  );

  const stopEditing = useCallback(
    async (elementId: string) => {
      if (!enabled || !planId) return;
      try {
        const response = await fetch('/api/collaboration', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ planId, action: 'stopEditing', elementId }),
        });
        if (response.ok) {
          const data = await response.json();
          setState({
            activeUsers: data.activeUsers || [],
            editingStates: data.editingStates || [],
          });
        }
      } catch {
        // Silently fail
      }
    },
    [planId, enabled]
  );

  useEffect(() => {
    if (!enabled || !planId) return;

    // Use a separate async function to avoid calling setState synchronously in the effect
    const initialHeartbeat = setTimeout(() => sendHeartbeat(), 0);
    intervalRef.current = setInterval(sendHeartbeat, heartbeatInterval);

    return () => {
      clearTimeout(initialHeartbeat);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, planId, heartbeatInterval, sendHeartbeat]);

  return {
    ...state,
    startEditing,
    stopEditing,
  };
}
