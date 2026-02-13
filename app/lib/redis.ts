import { Redis } from '@upstash/redis';

// Support Upstash environment variables (KV_REST_API_*) with fallback to legacy names (UPSTASH_REDIS_REST_*)
// In production, set KV_REST_API_URL and KV_REST_API_TOKEN for real-time features
// When missing, the mock Redis implementation below will be used (no actual Redis operations)
const redisUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

if (!redisUrl || !redisToken) {
  console.warn('Redis environment variables not set - using mock Redis implementation below');
}

export const redis = (redisUrl && redisToken)
  ? new Redis({
      url: redisUrl,
      token: redisToken,
    })
  : {
      // Mock Redis for build time
      publish: async () => {},
      hset: async () => {},
      hgetall: async () => null,
      hdel: async () => {},
      expire: async () => {},
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;

// Helper functions for collaboration
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const publishUpdate = async (planId: string, update: any) => {
  await redis.publish(`plan:${planId}`, JSON.stringify(update));
};

export const setUserPresence = async (planId: string, userId: string, userName: string) => {
  await redis.hset(`presence:${planId}`, {
    [userId]: JSON.stringify({
      userName,
      lastActive: Date.now(),
    }),
  });
  // Set expiry for 5 minutes
  await redis.expire(`presence:${planId}`, 300);
};

export const getUserPresence = async (planId: string) => {
  const presence = await redis.hgetall(`presence:${planId}`) as Record<string, string> | null;
  if (!presence) return [];
  
  return Object.entries(presence).map(([userId, data]) => {
    try {
      // Ensure data is a string before parsing
      const dataStr = typeof data === 'string' ? data : JSON.stringify(data);
      return {
        userId,
        ...JSON.parse(dataStr),
      };
    } catch (error) {
      console.error(`Failed to parse presence data for user ${userId}:`, error, 'Data:', data);
      // Return a default presence object if parsing fails
      return {
        userId,
        userName: 'Unknown',
        lastActive: Date.now(),
      };
    }
  });
};

export const setEditingState = async (
  planId: string,
  userId: string,
  elementId: string,
  elementType: 'event' | 'branch' | 'plan'
) => {
  await redis.hset(`editing:${planId}`, {
    [elementId]: JSON.stringify({ userId, elementType, timestamp: Date.now() }),
  });
  await redis.expire(`editing:${planId}`, 300);
};

export const clearEditingState = async (planId: string, elementId: string) => {
  await redis.hdel(`editing:${planId}`, elementId);
};

export const getEditingStates = async (planId: string) => {
  const states = await redis.hgetall(`editing:${planId}`) as Record<string, string> | null;
  if (!states) return [];
  
  return Object.entries(states).map(([elementId, data]) => {
    try {
      // Ensure data is a string before parsing
      const dataStr = typeof data === 'string' ? data : JSON.stringify(data);
      return {
        elementId,
        ...JSON.parse(dataStr),
      };
    } catch (error) {
      console.error(`Failed to parse editing state for element ${elementId}:`, error, 'Data:', data);
      // Return a default editing state if parsing fails
      return {
        elementId,
        userId: 'unknown',
        elementType: 'event' as const,
        timestamp: Date.now(),
      };
    }
  });
};
