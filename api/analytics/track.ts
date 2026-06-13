import { neon } from '@neondatabase/serverless';
import { handlePreflight, json } from '../_lib/cors';
import { getRedis, rateLimit } from '../_lib/redis';

export const config = { runtime: 'edge' };

const ALLOWED_EVENT_TYPES = ['page_view', 'command', 'interaction'] as const;
const MAX_METADATA_BYTES = 2048;
const RATE_LIMIT_MAX = 30;
const RATE_LIMIT_WINDOW = 60;

/**
 * Derives a privacy-safe visitor ID from the request IP + User-Agent.
 * Uses SHA-256 via the Web Crypto API (available in all Edge runtimes).
 * Returns the first 16 hex characters — enough entropy to distinguish
 * visitors without storing any PII.
 */
async function deriveVisitorId(ip: string, userAgent: string): Promise<string> {
  const raw = `${ip}:${userAgent}`;
  const encoded = new TextEncoder().encode(raw);
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  return hex.slice(0, 16);
}

export default async function handler(req: Request): Promise<Response> {
  // Handle CORS preflight
  const preflight = handlePreflight(req);
  if (preflight) return preflight;

  if (req.method !== 'POST') {
    return json({ error: 'Method Not Allowed' }, 405);
  }

  try {
    const body = await req.json();
    const { event_type = 'page_view', metadata = {}, visitor_alias = 'anonymous' } = body;

    // Validate event type against the allowlist
    if (!ALLOWED_EVENT_TYPES.includes(event_type)) {
      return json({ error: `Invalid event_type. Allowed: ${ALLOWED_EVENT_TYPES.join(', ')}` }, 400);
    }

    // Guard against oversized metadata payloads
    const metadataStr = JSON.stringify(metadata);
    if (new TextEncoder().encode(metadataStr).length > MAX_METADATA_BYTES) {
      return json({ error: `metadata exceeds ${MAX_METADATA_BYTES} byte limit` }, 400);
    }

    // Extract client IP (first entry from x-forwarded-for chain)
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
    const userAgent = req.headers.get('user-agent') ?? '';

    // Derive a server-side, privacy-safe visitor ID (no PII stored)
    const visitor_id = await deriveVisitorId(ip, userAgent);

    // Rate limiting via Upstash Redis — soft-fail so a Redis outage never
    // blocks analytics writes.
    const redis = getRedis();
    if (redis) {
      try {
        const limited = await rateLimit(redis, `track:${ip}`, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW);
        if (limited) {
          return json({ error: 'Rate limit exceeded.' }, 429);
        }
      } catch (e) {
        console.warn('[track] Redis rate limiting failed, proceeding anyway:', e);
      }
    }

    // If no DB is configured, acknowledge the event without persisting it
    if (!process.env.NEON_DATABASE_URL) {
      return json({ ok: true });
    }

    const sql = neon(process.env.NEON_DATABASE_URL);

    // Upsert the daily page_view counter
    if (event_type === 'page_view') {
      const date = new Date().toISOString().split('T')[0];
      await sql`
        INSERT INTO page_views (view_date, count)
        VALUES (${date}, 1)
        ON CONFLICT (view_date)
        DO UPDATE SET count = page_views.count + 1
      `;
    }

    // Persist the analytics event, including the derived visitor_id
    await sql`
      INSERT INTO analytics_events (event_type, metadata, visitor_alias, visitor_id)
      VALUES (${event_type}, ${metadataStr}, ${visitor_alias}, ${visitor_id})
    `;

    return json({ ok: true });
  } catch (err: unknown) {
    console.error('[track] Unhandled error:', err);
    // Return 500 so callers and monitoring tools can distinguish real failures
    // from intentional no-ops.
    return json({ ok: false, error: 'Internal server error' }, 500);
  }
}
