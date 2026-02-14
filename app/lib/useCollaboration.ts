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

  const wsRef = useRef<WebSocket | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const usingWebSocket = useRef(false);

  // Polling fallback
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

  const sendWSMessage = useCallback((message: Record<string, unknown>) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
      return true;
    }
    return false;
  }, []);

  const startEditing = useCallback(
    async (elementId: string, elementType: 'event' | 'branch' | 'plan') => {
      if (!enabled || !planId) return;

      if (sendWSMessage({ action: 'startEditing', elementId, elementType })) {
        return;
      }

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
    [planId, enabled, sendWSMessage]
  );

  const stopEditing = useCallback(
    async (elementId: string) => {
      if (!enabled || !planId) return;

      if (sendWSMessage({ action: 'stopEditing', elementId })) {
        return;
      }

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
    [planId, enabled, sendWSMessage]
  );

  useEffect(() => {
    if (!enabled || !planId) return;

    let wsCleanup: (() => void) | undefined;
    let pollingTimeout: ReturnType<typeof setTimeout> | undefined;

    const startPolling = () => {
      if (usingWebSocket.current) return;
      pollingTimeout = setTimeout(() => sendHeartbeat(), 0);
      intervalRef.current = setInterval(sendHeartbeat, heartbeatInterval);
    };

    const connectWS = async () => {
      try {
        // Get session for WebSocket auth
        const sessionRes = await fetch('/api/auth/session');
        const session = await sessionRes.json();
        const userId = session?.user?.id;
        const userName = session?.user?.name || 'Anonymous';

        if (!userId) {
          startPolling();
          return;
        }

        const wsPort = typeof window !== 'undefined'
          ? (process.env.NEXT_PUBLIC_WS_PORT || '3001')
          : '3001';
        const wsProtocol = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'wss' : 'ws';
        const wsHost = typeof window !== 'undefined' ? window.location.hostname : 'localhost';

        const wsUrl = `${wsProtocol}://${wsHost}:${wsPort}?planId=${encodeURIComponent(planId)}&userId=${encodeURIComponent(userId)}&userName=${encodeURIComponent(userName)}`;
        const ws = new WebSocket(wsUrl);

        const heartbeatTimer = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ action: 'heartbeat' }));
          }
        }, heartbeatInterval);

        ws.onopen = () => {
          usingWebSocket.current = true;
          wsRef.current = ws;
          // Stop polling if it was running
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'collaboration') {
              setState({
                activeUsers: data.activeUsers || [],
                editingStates: data.editingStates || [],
              });
            }
          } catch {
            // Ignore malformed messages
          }
        };

        ws.onclose = () => {
          usingWebSocket.current = false;
          wsRef.current = null;
          clearInterval(heartbeatTimer);
          startPolling();
        };

        ws.onerror = () => {
          ws.close();
        };

        wsCleanup = () => {
          clearInterval(heartbeatTimer);
          ws.close();
        };
      } catch {
        startPolling();
      }
    };

    connectWS();

    return () => {
      if (wsCleanup) wsCleanup();
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      if (pollingTimeout) {
        clearTimeout(pollingTimeout);
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      usingWebSocket.current = false;
    };
  }, [enabled, planId, heartbeatInterval, sendHeartbeat]);

  return {
    ...state,
    startEditing,
    stopEditing,
  };
}
