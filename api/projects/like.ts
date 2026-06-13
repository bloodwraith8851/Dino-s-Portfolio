import { handlePreflight, json } from '../_lib/cors';
import { getRedis, rateLimit } from '../_lib/redis';

export const config = { runtime: 'edge' };

/** Maximum likes one IP can send per project within the rate-limit window. */
const MAX_LIKES = 5;
/** Rate-limit window in seconds (1 hour). */
const WINDOW_SECONDS = 3600;

export default async function handler(req: Request): Promise<Response> {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return handlePreflight();
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method Not Allowed' }, 405);
  }

  try {
    // --- Parse & validate request body ---
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return json({ error: 'Invalid JSON body' }, 400);
    }

    const { projectId } = body as Record<string, unknown>;

    if (projectId === undefined || projectId === null || projectId === '') {
      return json({ error: 'projectId is required' }, 400);
    }

    // projectId arrives as a string like '01' — parse to integer
    const pid = parseInt(String(projectId), 10);

    if (isNaN(pid) || pid < 1 || pid > 20) {
      return json({ error: 'projectId must be an integer between 1 and 20' }, 400);
    }

    // --- Rate limiting: 5 likes per project per IP per hour ---
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';

    const redis = getRedis();
    const rateLimitKey = `like:${ip}:${pid}`;

    const { limited, count } = await rateLimit(redis, rateLimitKey, MAX_LIKES, WINDOW_SECONDS);

    if (limited) {
      return json({ error: 'Rate limit exceeded. You may like each project up to 5 times per hour.' }, 429, {
        'Retry-After': String(WINDOW_SECONDS),
      });
    }

    // --- Call Supabase RPC to increment the like count ---
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('[projects/like] Missing Supabase env vars');
      return json({ error: 'Server misconfiguration' }, 500);
    }

    const rpcRes = await fetch(`${supabaseUrl}/rest/v1/rpc/increment_project_like`, {
      method: 'POST',
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
      // Send the properly-typed integer to Supabase
      body: JSON.stringify({ pid }),
    });

    if (!rpcRes.ok) {
      const errorText = await rpcRes.text();
      console.error(`[projects/like] Supabase RPC failed (${rpcRes.status}): ${errorText}`);
      return json({ error: 'Failed to record like' }, 502);
    }

    // --- Invalidate the cached project list so fresh data is served ---
    if (redis) {
      try {
        await redis.del('projects:list:v1');
      } catch (cacheErr) {
        // Non-fatal: log and continue
        console.warn('[projects/like] Cache invalidation failed:', cacheErr);
      }
    }

    // remainingLikes = MAX_LIKES - current incr count, floored at 0
    const remainingLikes = Math.max(0, MAX_LIKES - count);

    return json({ ok: true, remainingLikes });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[projects/like] Unhandled error:', message);
    return json({ error: 'Internal Server Error' }, 500);
  }
}
