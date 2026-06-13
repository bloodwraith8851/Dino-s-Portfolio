/**
 * GET /api/resume/download
 *
 * Tracks resume download events and redirects the visitor to the actual PDF.
 * Also fires an Inngest event so you get a real-time push notification.
 *
 * Rate limit: 3 downloads per IP per hour (Redis).
 */
import { getRedis, rateLimit } from '../_lib/redis';
import { handlePreflight, json, corsHeaders } from '../_lib/cors';

export const config = { runtime: 'edge' };

const INNGEST_EVENT_KEY = process.env.INNGEST_EVENT_KEY ?? '';
const INNGEST_API = 'https://inn.gs/e/';

/** The public URL of your hosted resume PDF. */
const RESUME_PDF_URL = process.env.RESUME_PDF_URL ?? '/Rakesh_Sarkar_Resume.pdf';

async function fireInngestEvent(data: Record<string, unknown>) {
  if (!INNGEST_EVENT_KEY || INNGEST_EVENT_KEY.length < 10) return;
  try {
    await fetch(`${INNGEST_API}${INNGEST_EVENT_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'portfolio/resume.downloaded', data }),
    });
  } catch {
    // Non-critical — don't block the redirect
  }
}

async function logToSupabase(ip: string, userAgent: string, referrer: string) {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) return;

  try {
    await fetch(`${supabaseUrl}/rest/v1/resume_downloads`, {
      method: 'POST',
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({ ip, user_agent: userAgent, referrer }),
    });
  } catch {
    // Non-critical — don't block the redirect
  }
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return handlePreflight();

  if (req.method !== 'GET') {
    return json({ error: 'Method Not Allowed' }, 405);
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const userAgent = req.headers.get('user-agent') ?? '';
  const referrer = req.headers.get('referer') ?? '';

  // Rate limit: max 3 downloads per IP per hour
  const redis = getRedis();
  const { limited } = await rateLimit(redis, `resume:dl:${ip}`, 3, 3600);
  if (limited) {
    return json({ error: 'Too many requests. Try again later.' }, 429, { 'Retry-After': '3600' });
  }

  // Fire-and-forget: log + notify (don't await, don't block the redirect)
  void logToSupabase(ip, userAgent, referrer);
  void fireInngestEvent({
    ip,
    user_agent: userAgent,
    referrer,
    timestamp: new Date().toISOString(),
  });

  // Redirect to the actual PDF
  return new Response(null, {
    status: 302,
    headers: {
      Location: RESUME_PDF_URL,
      'Cache-Control': 'no-store',
      ...corsHeaders('GET, OPTIONS'),
    },
  });
}
