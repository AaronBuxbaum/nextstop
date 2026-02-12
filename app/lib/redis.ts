import { Redis } from '@upstash/redis';

if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
  throw new Error('UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be defined');
}

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

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
  const presence = await redis.hgetall<Record<string, string>>(`presence:${planId}`);
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
  const states = await redis.hgetall<Record<string, string>>(`editing:${planId}`);
  if (!states) return [];
  
  return Object.entries(states).map(([elementId, data]) => ({
    elementId,
    ...JSON.parse(data),
  }));
};
