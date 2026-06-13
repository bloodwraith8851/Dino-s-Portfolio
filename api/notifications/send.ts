import { handlePreflight, json } from '../_lib/cors';
import { getRedis, rateLimit } from '../_lib/redis';

export const config = { runtime: 'edge' };

const INNGEST_EVENT_KEY = process.env.INNGEST_EVENT_KEY ?? '';
const INNGEST_API = 'https://inn.gs/e/';

// Surface whether we are running in a real Vercel production deployment.
const isProduction = process.env.VERCEL_ENV === 'production';

const MAX_NAME_LENGTH = 500;
const MAX_MESSAGE_LENGTH = 500;
const MAX_EMAIL_LENGTH = 254;

function stripHtml(input: string): string {
  return input.replace(/<[^>]*>/g, '');
}

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
  // Handle CORS preflight via shared helper.
  const preflight = handlePreflight(req);
  if (preflight) return preflight;

  if (req.method !== 'POST') {
    return json({ error: 'Method Not Allowed' }, 405);
  }

  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';

    // Rate limiting via shared Redis helper — fails open on any Redis error.
    const redis = getRedis();
    if (redis) {
      try {
        const limited = await rateLimit(redis, `notify:${ip}`, 3, 300);
        if (limited) {
          return json({ error: 'Rate limit exceeded.' }, 429);
        }
      } catch (e) {
        console.warn('[notifications/send] Redis rate limiting failed:', e);
      }
    }

    const body = await req.json();
    const { type, ...data } = body;
    const timestamp = new Date().toISOString();

    // Validate notification type first so we fail fast with a clean 400.
    if (!type || !['guestbook', 'hire'].includes(type)) {
      return json({ error: 'Invalid notification type' }, 400);
    }

    // Sanitize each expected field and collect any validation errors.
    const validationErrors: string[] = [];
    if (data.name !== undefined) {
      const s = sanitizeField(data.name, MAX_NAME_LENGTH);
      if (s === null) validationErrors.push('invalid name');
      else data.name = s;
    }
    if (data.message !== undefined) {
      const s = sanitizeField(data.message, MAX_MESSAGE_LENGTH);
      if (s === null) validationErrors.push('invalid message');
      else data.message = s;
    }
    if (data.email !== undefined) {
      const s = sanitizeField(data.email, MAX_EMAIL_LENGTH);
      if (s === null) validationErrors.push('invalid email');
      else data.email = s;
    }

    if (validationErrors.length > 0) {
      return json({ error: 'Validation failed', details: validationErrors }, 400);
    }

    // Dispatch the appropriate Inngest event based on type.
    if (type === 'hire') {
      await sendInngestEvent('portfolio/hire.message', { ...data, ip, timestamp });
    } else if (type === 'guestbook') {
      await sendInngestEvent('portfolio/guestbook.signed', { ...data, ip, timestamp });
    }

    return json({ ok: true, type, method: 'inngest' }, 200);
  } catch (err: any) {
    console.error('[notifications/send] Unhandled error:', err);

    // In production we must surface a proper 500 so monitoring tools can alert.
    // In development we mask it as 200 so local tooling (e.g. Next.js overlay)
    // does not swallow the error body before the developer can read it.
    const status = isProduction ? 500 : 200;
    return json({ ok: false, error: 'Internal server error' }, status);
  }
}
