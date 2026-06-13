/**
 * GET /api/analytics/dashboard
 *
 * Admin-only analytics dashboard endpoint.
 * Requires a valid admin JWT in the Authorization: Bearer <token> header.
 * Returns structured analytics data for an admin dashboard or terminal display.
 *
 * Data sources:
 *   - Neon Postgres: page_views, analytics_events
 *   - Supabase: messages (hire requests), guestbook, command_logs
 *   - Redis: live visitor count proxy
 */
import { neon } from '@neondatabase/serverless';
import { verifyAdminToken } from '../_lib/auth';
import { getRedis } from '../_lib/redis';
import { handlePreflight, json } from '../_lib/cors';

export const config = { runtime: 'edge' };

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return handlePreflight();
  if (req.method !== 'GET') return json({ error: 'Method Not Allowed' }, 405);

  // Verify admin JWT
  const isAdmin = await verifyAdminToken(req);
  if (!isAdmin) {
    return json({ error: 'Unauthorized' }, 401);
  }

  if (!process.env.NEON_DATABASE_URL) {
    return json({ error: 'Analytics database not configured' }, 503);
  }

  const sql = neon(process.env.NEON_DATABASE_URL);
  const redis = getRedis();

  try {
    // Run all DB queries concurrently
    const [todayViews, weekViews, monthViews, allTimeViews, topCommands, eventBreakdown, liveKeys] =
      await Promise.allSettled([
        // Today's page views
        sql`SELECT COALESCE(SUM(count), 0) as total FROM page_views WHERE view_date = CURRENT_DATE`,
        // This week's page views
        sql`SELECT COALESCE(SUM(count), 0) as total FROM page_views WHERE view_date >= CURRENT_DATE - INTERVAL '7 days'`,
        // This month's page views
        sql`SELECT COALESCE(SUM(count), 0) as total FROM page_views WHERE view_date >= DATE_TRUNC('month', CURRENT_DATE)`,
        // All-time page views
        sql`SELECT COALESCE(SUM(count), 0) as total FROM page_views`,
        // Top terminal commands from metadata JSON
        sql`
        SELECT
          metadata::json->>'command' AS command,
          COUNT(*)::int AS usage_count
        FROM analytics_events
        WHERE event_type = 'command'
          AND metadata::json->>'command' IS NOT NULL
          AND created_at >= NOW() - INTERVAL '30 days'
        GROUP BY metadata::json->>'command'
        ORDER BY usage_count DESC
        LIMIT 15
      `,
        // Event type breakdown (last 7 days)
        sql`
        SELECT event_type, COUNT(*)::int as count
        FROM analytics_events
        WHERE created_at >= NOW() - INTERVAL '7 days'
        GROUP BY event_type
        ORDER BY count DESC
      `,
        // Live visitor proxy — Redis key count is a rough proxy
        redis ? redis.dbsize() : Promise.resolve(0),
      ]);

    // Supabase stats
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

    const hireRequests = { total: 0, thisWeek: 0, new: 0 };
    let guestbookTotal = 0;

    if (supabaseUrl && supabaseKey) {
      const headers = {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        'Content-Range': '*',
        Prefer: 'count=exact',
      };

      const [messagesRes, newMessagesRes, guestbookRes] = await Promise.allSettled([
        fetch(`${supabaseUrl}/rest/v1/messages?select=count`, { headers }),
        fetch(`${supabaseUrl}/rest/v1/messages?status=eq.new&select=count`, { headers }),
        fetch(`${supabaseUrl}/rest/v1/guestbook?select=count`, { headers }),
      ]);

      if (messagesRes.status === 'fulfilled' && messagesRes.value.ok) {
        const total = messagesRes.value.headers.get('content-range')?.split('/')[1];
        hireRequests.total = total ? parseInt(total, 10) : 0;
      }
      if (newMessagesRes.status === 'fulfilled' && newMessagesRes.value.ok) {
        const newCount = newMessagesRes.value.headers.get('content-range')?.split('/')[1];
        hireRequests.new = newCount ? parseInt(newCount, 10) : 0;
      }
      if (guestbookRes.status === 'fulfilled' && guestbookRes.value.ok) {
        const count = guestbookRes.value.headers.get('content-range')?.split('/')[1];
        guestbookTotal = count ? parseInt(count, 10) : 0;
      }
    }

    const extract = <T>(result: PromiseSettledResult<T>, fallback: T): T =>
      result.status === 'fulfilled' ? result.value : fallback;

    return json({
      pageViews: {
        today: Number(extract(todayViews, [{ total: 0 }])[0]?.total ?? 0),
        thisWeek: Number(extract(weekViews, [{ total: 0 }])[0]?.total ?? 0),
        thisMonth: Number(extract(monthViews, [{ total: 0 }])[0]?.total ?? 0),
        allTime: Number(extract(allTimeViews, [{ total: 0 }])[0]?.total ?? 0),
      },
      topCommands: extract(topCommands, []),
      eventBreakdown: extract(eventBreakdown, []),
      hireRequests,
      guestbook: { total: guestbookTotal },
      liveKeys: extract(liveKeys, 0),
      generatedAt: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[analytics/dashboard] Error:', message);
    return json({ error: 'Failed to fetch analytics' }, 500);
  }
}
