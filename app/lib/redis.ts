import { Redis } from '@upstash/redis';

// Allow build to succeed without Redis credentials
// In production, set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN for real-time features
// When missing, the mock Redis implementation below will be used (no actual Redis operations)
if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
  console.warn('Redis environment variables not set - using mock Redis implementation below');
}

export const redis = (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : {
      // Mock Redis for build time
      publish: async () => {},
      hset: async () => {},
      hgetall: async () => null,
      hdel: async () => {},
      expire: async () => {},
    } as any;

// Helper functions for collaboration
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
  
  return Object.entries(presence).map(([userId, data]) => ({
    userId,
    ...JSON.parse(data),
  }));
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
  
  return Object.entries(states).map(([elementId, data]) => ({
    elementId,
    ...JSON.parse(data),
  }));
};
