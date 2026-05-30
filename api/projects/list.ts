import { Redis } from '@upstash/redis/cloudflare';

export const config = { runtime: 'edge' };

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  try {
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });

    // Try to get cached project list from Redis
    const CACHE_KEY = 'projects:list:v1';
    const cached = await redis.get<string>(CACHE_KEY);

    if (cached) {
      return new Response(JSON.stringify({ ok: true, data: cached, source: 'cache' }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, max-age=60',
        },
      });
    }

    // Fetch from Supabase
    const supabaseUrl = process.env.VITE_SUPABASE_URL!;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;

    const res = await fetch(
      `${supabaseUrl}/rest/v1/project_likes?select=project_id,likes_count`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      }
    );

    const likesData = await res.json();

    const projects = [
      { number: '01', category: 'Personal', name: 'Forge', liveUrl: '#' },
      { number: '02', category: 'Personal', name: 'LawLab', liveUrl: '#' },
      { number: '03', category: 'Personal · GenAI', name: 'ResumeIQ', liveUrl: '#' },
      { number: '04', category: 'Personal · Design', name: 'Notch', liveUrl: '#' },
    ].map((p) => ({
      ...p,
      likes: likesData.find((l: any) => l.project_id === p.number)?.likes_count ?? 0,
    }));

    // Cache for 60 seconds
    await redis.set(CACHE_KEY, projects, { ex: 60 });

    return new Response(JSON.stringify({ ok: true, data: projects, source: 'db' }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=60',
      },
    });
  } catch (err: any) {
    console.error('[projects/list] Error:', err);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
