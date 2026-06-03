import { Redis } from '@upstash/redis/cloudflare';

export const config = { runtime: 'edge' };

const INNGEST_EVENT_KEY = process.env.INNGEST_EVENT_KEY ?? '';
const INNGEST_API = 'https://inn.gs/e/';

/** Maximum allowed lengths for user-provided fields */
const MAX_NAME_LENGTH = 500;
const MAX_MESSAGE_LENGTH = 500;
const MAX_EMAIL_LENGTH = 254;

/**
 * Strips HTML tags from a string to prevent injection.
 */
function stripHtml(input: string): string {
  return input.replace(/<[^>]*>/g, '');
}

/**
 * Sanitizes and validates a string field. Returns the sanitized value or null if invalid.
 */
function sanitizeField(value: unknown, maxLength: number): string | null {
  if (typeof value !== 'string') return null;
  const cleaned = stripHtml(value).trim();
  if (cleaned.length > maxLength) return null;
  return cleaned;
}

async function sendInngestEvent(name: string, data: Record<string, any>) {
  if (!INNGEST_EVENT_KEY || INNGEST_EVENT_KEY.length < 10) return false;
  try {
    const res = await fetch(`${INNGEST_API}${INNGEST_EVENT_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, data }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export default async function handler(req: Request): Promise<Response> {
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
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';

    // Graceful check for Redis — if missing, bypass rate limit locally rather than 500
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
      try {
        const redis = new Redis({
          url: process.env.UPSTASH_REDIS_REST_URL,
          token: process.env.UPSTASH_REDIS_REST_TOKEN,
        });

        // Rate limit: max 3 notifications per IP per 5 minutes
        const rateLimitKey = `notify:${ip}`;
        const count = await redis.incr(rateLimitKey);
        if (count === 1) await redis.expire(rateLimitKey, 300);
        if (count > 3) {
          return new Response(JSON.stringify({ error: 'Rate limit exceeded. Try again in 5 minutes.' }), {
            status: 429,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
          });
        }
      } catch (e) {
        console.warn('Redis rate limiting failed, proceeding anyway', e);
      }
    }

    const body = await req.json();
    const { type, ...data } = body;
    const timestamp = new Date().toISOString();

    if (!type || !['guestbook', 'hire'].includes(type)) {
      return new Response(JSON.stringify({ error: 'Invalid notification type' }), { status: 400 });
    }

    // --- Input length validation & HTML sanitization ---
    const validationErrors: string[] = [];

    if (data.name !== undefined) {
      const sanitized = sanitizeField(data.name, MAX_NAME_LENGTH);
      if (sanitized === null) {
        validationErrors.push(`name must be a string of at most ${MAX_NAME_LENGTH} characters`);
      } else {
        data.name = sanitized;
      }
    }

    if (data.message !== undefined) {
      const sanitized = sanitizeField(data.message, MAX_MESSAGE_LENGTH);
      if (sanitized === null) {
        validationErrors.push(`message must be a string of at most ${MAX_MESSAGE_LENGTH} characters`);
      } else {
        data.message = sanitized;
      }
    }

    if (data.email !== undefined) {
      const sanitized = sanitizeField(data.email, MAX_EMAIL_LENGTH);
      if (sanitized === null) {
        validationErrors.push(`email must be a string of at most ${MAX_EMAIL_LENGTH} characters`);
      } else {
        data.email = sanitized;
      }
    }

    if (validationErrors.length > 0) {
      return new Response(JSON.stringify({ error: 'Validation failed', details: validationErrors }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    // ONLY send to Inngest as requested by user
    if (type === 'hire') {
      await sendInngestEvent('portfolio/hire.message', { ...data, ip, timestamp });
    } else if (type === 'guestbook') {
      await sendInngestEvent('portfolio/guestbook.signed', { ...data, ip, timestamp });
    }

    return new Response(JSON.stringify({ ok: true, type, method: 'inngest' }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });

  } catch (err: any) {
    console.error('[notifications/send] Error:', err);
    // Even if it fails, return 200 so the client doesn't see a scary 500 in dev
    return new Response(JSON.stringify({ ok: false, error: 'Silently caught' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
