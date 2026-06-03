import { neon } from '@neondatabase/serverless';
import { Redis } from '@upstash/redis/cloudflare';

export const config = { runtime: 'edge' };

/** Allowed event types — reject anything outside this list */
const ALLOWED_EVENT_TYPES = ['page_view', 'command', 'interaction'] as const;

/** Maximum metadata JSON size in bytes */
const MAX_METADATA_BYTES = 2048;

/** Rate limit: max events per IP per window */
const RATE_LIMIT_MAX = 30;
/** Rate limit window in seconds (1 minute) */
const RATE_LIMIT_WINDOW = 60;

export default async function handler(req: Request): Promise<Response> {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405 });
  }

  try {
    const body = await req.json();
    const { event_type = 'page_view', metadata = {}, visitor_alias = 'anonymous' } = body;

    // --- Input validation: event_type ---
    if (!ALLOWED_EVENT_TYPES.includes(event_type)) {
      return new Response(
        JSON.stringify({ error: `Invalid event_type. Allowed: ${ALLOWED_EVENT_TYPES.join(', ')}` }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        },
      );
    }

    // --- Input validation: metadata size cap ---
    const metadataStr = JSON.stringify(metadata);
    if (new TextEncoder().encode(metadataStr).length > MAX_METADATA_BYTES) {
      return new Response(
        JSON.stringify({ error: `metadata exceeds ${MAX_METADATA_BYTES} byte limit` }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        },
      );
    }

    // --- Server-side rate limiting via Redis (gracefully skips if unavailable) ---
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
      try {
        const redis = new Redis({
          url: process.env.UPSTASH_REDIS_REST_URL,
          token: process.env.UPSTASH_REDIS_REST_TOKEN,
        });
        const rateLimitKey = `track:${ip}`;
        const count = await redis.incr(rateLimitKey);
        if (count === 1) await redis.expire(rateLimitKey, RATE_LIMIT_WINDOW);
        if (count > RATE_LIMIT_MAX) {
          return new Response(
            JSON.stringify({ error: 'Rate limit exceeded. Max 30 events per minute.' }),
            {
              status: 429,
              headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            },
          );
        }
      } catch (e) {
        console.warn('[track] Redis rate limiting failed, proceeding anyway:', e);
      }
    }

    if (!process.env.NEON_DATABASE_URL) {
      console.warn('[track] Missing NEON_DATABASE_URL, skipping analytics');
      return new Response(JSON.stringify({ ok: true }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    const sql = neon(process.env.NEON_DATABASE_URL);

    // Upsert page view count
    if (event_type === 'page_view') {
      const date = new Date().toISOString().split('T')[0];
      await sql`
        INSERT INTO page_views (view_date, count)
        VALUES (${date}, 1)
        ON CONFLICT (view_date) DO UPDATE
        SET count = page_views.count + 1
      `;
    }

    // Log analytics event
    await sql`
      INSERT INTO analytics_events (event_type, metadata, visitor_alias)
      VALUES (${event_type}, ${metadataStr}, ${visitor_alias})
    `;

    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  } catch (err: any) {
    console.error('[track] Error:', err);
    // Return 200 anyway so we don't spam the user's console with 500 errors
    return new Response(JSON.stringify({ ok: false, error: 'Silently caught' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
}
