import { Redis } from '@upstash/redis/cloudflare';

export const config = { runtime: 'edge' };

// Inngest Event Key from environment
const INNGEST_EVENT_KEY = process.env.INNGEST_EVENT_KEY ?? 'NO_KEY';
const INNGEST_API = 'https://inn.gs/e/';

async function sendInngestEvent(name: string, data: Record<string, any>) {
  const res = await fetch(`${INNGEST_API}${INNGEST_EVENT_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, data }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Inngest send failed: ${res.status} ${text}`);
  }
  return res.json();
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

    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
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

    const body = await req.json();
    const { type, ...data } = body;

    if (!type || !['guestbook', 'hire'].includes(type)) {
      return new Response(JSON.stringify({ error: 'Invalid notification type' }), { status: 400 });
    }

    const eventName = type === 'guestbook' ? 'portfolio/guestbook.signed' : 'portfolio/hire.message';
    await sendInngestEvent(eventName, { ...data, ip, timestamp: new Date().toISOString() });

    return new Response(JSON.stringify({ ok: true, queued: eventName }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  } catch (err: any) {
    console.error('[notifications/send] Error:', err);
    // Don't fail silently — return 500 but log
    return new Response(JSON.stringify({ error: 'Failed to queue notification', detail: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
