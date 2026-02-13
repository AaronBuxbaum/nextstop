// Next.js instrumentation file
// This runs once when the server starts, before any requests are handled
// https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation

import { initDatabase } from '@/lib/db';

export async function register() {
  // Only run on server side (not during build)
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    try {
      console.log('Initializing database...');
      await initDatabase();
      console.log('Database initialization complete');
    } catch (error) {
      console.error('Failed to initialize database on startup:', error);
      // Don't throw - allow server to start even if DB init fails
      // This prevents startup failures if DATABASE_URL is temporarily unavailable
    }

    // Start WebSocket server for real-time collaboration
    try {
      const { initWebSocketServer } = await import('@/lib/wsServer');
      const wsPort = parseInt(process.env.WS_PORT || '3001', 10);
      initWebSocketServer(wsPort);
    } catch (error) {
      console.error('Failed to start WebSocket server:', error);
      // Don't throw - collaboration will fall back to polling
    }
  }
}
