import { neon } from '@neondatabase/serverless';

export const config = { runtime: 'edge' };

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
      VALUES (${event_type}, ${JSON.stringify(metadata)}, ${visitor_alias})
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
