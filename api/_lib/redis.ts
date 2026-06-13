/**
 * Shared Redis singleton for all Vercel Edge API handlers.
 *
 * Uses Redis.fromEnv() so UPSTASH_REDIS_REST_URL and
 * UPSTASH_REDIS_REST_TOKEN are read once, not on every request.
 */
import { Redis } from '@upstash/redis/cloudflare';

/** Returns a Redis client, or null if env vars are missing (graceful degradation). */
export function getRedis(): Redis | null {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    return Redis.fromEnv();
  }
  return null;
}

/**
 * Apply a sliding window rate limit.
 * Returns { limited: true } if over the cap, { limited: false } otherwise.
 * Fails open (returns limited=false) if Redis is unavailable.
 */
export async function rateLimit(
  redis: Redis | null,
  key: string,
  max: number,
  windowSeconds: number,
): Promise<{ limited: boolean; count: number }> {
  if (!redis) return { limited: false, count: 0 };
  try {
    const count = await redis.incr(key);
    if (count === 1) await redis.expire(key, windowSeconds);
    return { limited: count > max, count };
  } catch {
    // Redis hiccup — fail open so users aren't blocked
    return { limited: false, count: 0 };
  }
}
