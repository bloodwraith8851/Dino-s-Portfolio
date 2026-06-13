/**
 * /api/projects/index.ts  →  GET /api/projects
 *
 * Public endpoint — returns the list of projects with their like counts.
 * Project metadata is now sourced from Supabase `projects` table (single source of truth).
 * Falls back to Redis cache (60s TTL) to keep edge response times fast.
 */
import { getRedis } from '../_lib/redis';
import { handlePreflight, json } from '../_lib/cors';

export const config = { runtime: 'edge' };

const CACHE_KEY = 'projects:list:v2';
const CACHE_TTL = 60;

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return handlePreflight();
  if (req.method !== 'GET') return json({ error: 'Method Not Allowed' }, 405);

  const redis = getRedis();

  // Serve from cache if available
  if (redis) {
    try {
      const cached = await redis.get(CACHE_KEY);
      if (cached) {
        return json({ ok: true, data: cached, source: 'cache' }, 200, {
          'Cache-Control': 'public, max-age=30, stale-while-revalidate=60',
        });
      }
    } catch {
      // Cache miss — fall through
    }
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return json({ error: 'Database not configured' }, 503);
  }

  try {
    // Fetch projects with their like counts in one query via a join
    const res = await fetch(
      `${supabaseUrl}/rest/v1/projects?select=id,slug,name,category,live_url,description,tech_stack,display_order&is_active=eq.true&order=display_order.asc`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      },
    );

    if (!res.ok) {
      throw new Error(`Supabase projects fetch failed: ${res.status}`);
    }

    const projects = await res.json();

    // Fetch like counts
    const likesRes = await fetch(`${supabaseUrl}/rest/v1/project_likes?select=project_id,likes_count`, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
    });

    const likesData = likesRes.ok ? await likesRes.json() : [];
    const likesMap = Object.fromEntries(
      likesData.map((l: { project_id: number; likes_count: number }) => [l.project_id, l.likes_count]),
    );

    const enriched = projects.map((p: { id: number; [key: string]: unknown }) => ({
      ...p,
      likes: likesMap[p.id] ?? 0,
    }));

    // Cache result
    if (redis) {
      try {
        await redis.set(CACHE_KEY, enriched, { ex: CACHE_TTL });
      } catch {
        // Non-critical
      }
    }

    return json({ ok: true, data: enriched, source: 'db' }, 200, {
      'Cache-Control': 'public, max-age=30, stale-while-revalidate=60',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[projects/list] Error:', message);
    return json({ error: 'Failed to fetch projects' }, 500);
  }
}
