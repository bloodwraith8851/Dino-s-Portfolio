/**
 * Upstash Redis client wrapper (browser-compatible REST API calls)
 *
 * This is intentionally thin — do NOT import this in Edge Functions directly.
 * In Edge Functions, use @upstash/redis/cloudflare import directly.
 *
 * This file is a type-safe convenience wrapper for server-side use
 * and is NOT imported by browser-side components.
 */

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

interface RedisResponse<T = unknown> {
  result: T;
  error?: string;
}

async function redisCommand<T>(commands: string[]): Promise<T> {
  if (!UPSTASH_URL || !UPSTASH_TOKEN) {
    throw new Error('Upstash Redis credentials not configured');
  }

  const res = await fetch(`${UPSTASH_URL}/${commands.join('/')}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${UPSTASH_TOKEN}`,
    },
  });

  const data: RedisResponse<T> = await res.json();
  if (data.error) throw new Error(`Redis error: ${data.error}`);
  return data.result;
}

export const redis = {
  /** Get a value by key */
  get: <T>(key: string) => redisCommand<T>(['GET', encodeURIComponent(key)]),

  /** Set a value with optional expiry in seconds */
  set: async (key: string, value: string | number, expirySeconds?: number): Promise<void> => {
    const parts = ['SET', encodeURIComponent(key), encodeURIComponent(String(value))];
    if (expirySeconds) parts.push('EX', String(expirySeconds));
    await redisCommand<string>(parts);
  },

  /** Increment a counter */
  incr: (key: string) => redisCommand<number>(['INCR', encodeURIComponent(key)]),

  /** Delete a key */
  del: (key: string) => redisCommand<number>(['DEL', encodeURIComponent(key)]),
};

export default redis;
