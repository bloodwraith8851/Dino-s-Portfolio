import { Redis } from '@upstash/redis/cloudflare';

export const config = { runtime: 'edge' };

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
    const { projectId } = await req.json();
    if (!projectId) {
      return new Response(JSON.stringify({ error: 'projectId is required' }), { status: 400 });
    }

    // Get visitor IP for rate limiting
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';

    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });

    // Rate limit: max 5 likes per project per IP per hour
    const rateLimitKey = `like:${ip}:${projectId}`;
    const currentCount = await redis.incr(rateLimitKey);
    if (currentCount === 1) {
      // Set expiry on first use
      await redis.expire(rateLimitKey, 3600);
    }

    if (currentCount > 5) {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded. Try again later.' }), {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Retry-After': '3600',
        },
      });
    }

    // Call Supabase RPC to increment like
    const supabaseUrl = process.env.VITE_SUPABASE_URL!;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;

    const rpcRes = await fetch(`${supabaseUrl}/rest/v1/rpc/increment_project_like`, {
      method: 'POST',
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ pid: projectId }),
    });

    if (!rpcRes.ok) {
      const error = await rpcRes.text();
      throw new Error(`Supabase RPC failed: ${error}`);
    }

    // Invalidate the cached project list
    await redis.del('projects:list:v1');

    return new Response(JSON.stringify({ ok: true, remainingLikes: 5 - currentCount }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  } catch (err: any) {
    console.error('[projects/like] Error:', err);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
