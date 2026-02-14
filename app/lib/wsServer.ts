import { WebSocketServer, WebSocket } from 'ws';
import type { IncomingMessage } from 'http';

interface WSClient {
  ws: WebSocket;
  userId: string;
  userName: string;
  planId: string;
  lastActive: number;
}

interface EditingState {
  elementId: string;
  userId: string;
  elementType: 'event' | 'branch' | 'plan';
  timestamp: number;
}

// Store clients per plan
const planClients = new Map<string, Set<WSClient>>();
const editingStates = new Map<string, EditingState[]>();

let wss: WebSocketServer | null = null;

export function getWSS() {
  return wss;
}

export function initWebSocketServer(port: number = 3001) {
  if (wss) return wss;

  try {
    wss = new WebSocketServer({ port });

    wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
      const url = new URL(req.url || '', `http://localhost:${port}`);
      const planId = url.searchParams.get('planId');
      const userId = url.searchParams.get('userId');
      const userName = url.searchParams.get('userName') || 'Anonymous';

      if (!planId || !userId) {
        ws.close(1008, 'Missing planId or userId');
        return;
      }

      const client: WSClient = { ws, userId, userName, planId, lastActive: Date.now() };

      // Add to plan's client set
      if (!planClients.has(planId)) {
        planClients.set(planId, new Set());
      }
      planClients.get(planId)!.add(client);

      // Send initial state
      broadcastToPlan(planId);

      ws.on('message', (data: Buffer | ArrayBuffer | Buffer[]) => {
        try {
          const message = JSON.parse(data.toString());
          handleMessage(client, message);
        } catch {
          // Ignore malformed messages
        }
      });

      ws.on('close', () => {
        const clients = planClients.get(planId);
        if (clients) {
          clients.delete(client);
          if (clients.size === 0) {
            planClients.delete(planId);
            editingStates.delete(planId);
          }
        }
        // Clear any editing states for this user
        clearUserEditingStates(planId, userId);
        broadcastToPlan(planId);
      });

      ws.on('error', () => {
        const clients = planClients.get(planId);
        if (clients) {
          clients.delete(client);
        }
      });
    });

    wss.on('error', (error: Error) => {
      console.error('WebSocket server error:', error);
    });

    // Cleanup stale clients every 30s
    setInterval(() => {
      const now = Date.now();
      for (const [planId, clients] of planClients.entries()) {
        for (const client of clients) {
          if (now - client.lastActive > 60000) {
            client.ws.close();
            clients.delete(client);
            clearUserEditingStates(planId, client.userId);
          }
        }
        if (clients.size === 0) {
          planClients.delete(planId);
          editingStates.delete(planId);
        }
      }
    }, 30000);

    console.log(`WebSocket server started on port ${port}`);
    return wss;
  } catch (error) {
    console.error('Failed to start WebSocket server:', error);
    return null;
  }
}

interface WSMessage {
  action: string;
  elementId?: string;
  elementType?: 'event' | 'branch' | 'plan';
}

function handleMessage(client: WSClient, message: WSMessage) {
  client.lastActive = Date.now();

  switch (message.action) {
    case 'heartbeat':
      broadcastToPlan(client.planId);
      break;

    case 'startEditing':
      if (message.elementId && message.elementType) {
        const states = editingStates.get(client.planId) || [];
        // Remove existing editing state for this element
        const filtered = states.filter(s => s.elementId !== message.elementId);
        filtered.push({
          elementId: message.elementId,
          userId: client.userId,
          elementType: message.elementType,
          timestamp: Date.now(),
        });
        editingStates.set(client.planId, filtered);
        broadcastToPlan(client.planId);
      }
      break;

    case 'stopEditing':
      if (message.elementId) {
        const states = editingStates.get(client.planId) || [];
        editingStates.set(
          client.planId,
          states.filter(s => s.elementId !== message.elementId)
        );
        broadcastToPlan(client.planId);
      }
      break;
  }
}

function clearUserEditingStates(planId: string, userId: string) {
  const states = editingStates.get(planId);
  if (states) {
    editingStates.set(planId, states.filter(s => s.userId !== userId));
  }
}

function broadcastToPlan(planId: string) {
  const clients = planClients.get(planId);
  if (!clients || clients.size === 0) return;

  const activeUsers = Array.from(clients).map(c => ({
    userId: c.userId,
    userName: c.userName,
    lastActive: c.lastActive,
  }));

  const states = editingStates.get(planId) || [];

  const payload = JSON.stringify({
    type: 'collaboration',
    activeUsers,
    editingStates: states,
  });

  for (const client of clients) {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(payload);
    }
  }
}
