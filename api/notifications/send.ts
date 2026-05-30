import { Redis } from '@upstash/redis/cloudflare';
import { Resend } from 'resend';

export const config = { runtime: 'edge' };

const INNGEST_EVENT_KEY = process.env.INNGEST_EVENT_KEY ?? '';
const INNGEST_API = 'https://inn.gs/e/';

async function sendInngestEvent(name: string, data: Record<string, any>) {
  if (!INNGEST_EVENT_KEY || INNGEST_EVENT_KEY.length < 10) return;
  try {
    await fetch(`${INNGEST_API}${INNGEST_EVENT_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, data }),
    });
  } catch { /* non-blocking */ }
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
    const timestamp = new Date().toISOString();

    if (!type || !['guestbook', 'hire'].includes(type)) {
      return new Response(JSON.stringify({ error: 'Invalid notification type' }), { status: 400 });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    // ── HIRE notification ────────────────────────────────────────────
    if (type === 'hire') {
      const { name, email, message } = data;

      // Send directly via Resend (primary path, no Inngest dependency)
      const { error } = await resend.emails.send({
        // Use onboarding@resend.dev until rakesh.dev domain is verified in Resend dashboard
        from: 'Rakesh Portfolio <onboarding@resend.dev>',
        to: ['rakeshsarkar9711@gmail.com'],
        replyTo: email,
        subject: `🚀 New Lead: ${name} wants to hire you!`,
        html: `
          <!DOCTYPE html><html>
          <head><style>
            body{font-family:'Courier New',monospace;background:#0C0C0C;color:#D7E2EA;margin:0;padding:0}
            .wrap{max-width:600px;margin:40px auto;background:#111;border:1px solid #1e3a4a;border-radius:16px;overflow:hidden}
            .hdr{background:linear-gradient(135deg,#0d1f0f,#1a3a1f,#0f3320);padding:32px;text-align:center}
            .hdr h1{color:#00ff88;font-size:22px;margin:0;letter-spacing:2px}
            .body{padding:32px}
            .field{margin-bottom:20px}
            .label{color:#6b8899;font-size:11px;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px}
            .value{color:#D7E2EA;background:#1a1a1a;padding:12px 16px;border-radius:8px;border-left:3px solid #00ff88;font-size:14px;line-height:1.6}
            .cta{text-align:center;margin-top:28px}
            .cta a{background:#00ff88;color:#000;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:13px}
            .footer{padding:16px 32px;text-align:center;color:#3a5a6a;font-size:11px;border-top:1px solid #1e3a4a}
          </style></head>
          <body><div class="wrap">
            <div class="hdr"><h1>🚀 NEW HIRE REQUEST</h1></div>
            <div class="body">
              <div class="field"><div class="label">👤 From</div><div class="value">${name}</div></div>
              <div class="field"><div class="label">📧 Email</div><div class="value"><a href="mailto:${email}" style="color:#00d4ff">${email}</a></div></div>
              <div class="field"><div class="label">💬 Message</div><div class="value">${message}</div></div>
              <div class="cta"><a href="mailto:${email}?subject=Re: Your inquiry via Portfolio Terminal">Reply to ${name} →</a></div>
            </div>
            <div class="footer">
              rakesh.dev terminal portfolio · ${new Date(timestamp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST<br>
              Visitor IP: ${ip}
            </div>
          </div></body></html>
        `,
      });

      if (error) {
        console.error('[notify/hire] Resend error:', error);
        // Still queue to Inngest as fallback even if Resend failed
        await sendInngestEvent('portfolio/hire.message', { ...data, ip, timestamp });
        return new Response(JSON.stringify({ ok: false, error: error.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
      }

      // Also queue to Inngest (for auto-reply + future digest)
      await sendInngestEvent('portfolio/hire.message', { ...data, ip, timestamp });

      return new Response(JSON.stringify({ ok: true, type: 'hire' }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    // ── GUESTBOOK notification ───────────────────────────────────────
    if (type === 'guestbook') {
      const { visitor_alias, message } = data;

      const { error } = await resend.emails.send({
        from: 'Rakesh Portfolio <onboarding@resend.dev>',
        to: ['rakeshsarkar9711@gmail.com'],
        subject: `✍️ New Guestbook Entry from ${visitor_alias}`,
        html: `
          <!DOCTYPE html><html>
          <head><style>
            body{font-family:'Courier New',monospace;background:#0C0C0C;color:#D7E2EA;margin:0;padding:0}
            .wrap{max-width:600px;margin:40px auto;background:#111;border:1px solid #1e3a4a;border-radius:16px;overflow:hidden}
            .hdr{background:linear-gradient(135deg,#0f2027,#203a43,#2c5364);padding:32px;text-align:center}
            .hdr h1{color:#00d4ff;font-size:22px;margin:0;letter-spacing:2px}
            .body{padding:32px}
            .field{margin-bottom:20px}
            .label{color:#6b8899;font-size:11px;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px}
            .value{color:#D7E2EA;background:#1a1a1a;padding:12px 16px;border-radius:8px;border-left:3px solid #00d4ff;font-size:14px;line-height:1.6}
            .footer{padding:16px 32px;text-align:center;color:#3a5a6a;font-size:11px;border-top:1px solid #1e3a4a}
          </style></head>
          <body><div class="wrap">
            <div class="hdr"><h1>✍️ NEW GUESTBOOK ENTRY</h1></div>
            <div class="body">
              <div class="field"><div class="label">Visitor</div><div class="value">${visitor_alias}</div></div>
              <div class="field"><div class="label">Message</div><div class="value">"${message}"</div></div>
              <div class="field"><div class="label">Timestamp</div><div class="value">${new Date(timestamp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST</div></div>
            </div>
            <div class="footer">rakesh.dev terminal portfolio · automated notification</div>
          </div></body></html>
        `,
      });

      if (error) {
        console.error('[notify/guestbook] Resend error:', error);
        await sendInngestEvent('portfolio/guestbook.signed', { ...data, ip, timestamp });
        return new Response(JSON.stringify({ ok: false, error: error.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
      }

      await sendInngestEvent('portfolio/guestbook.signed', { ...data, ip, timestamp });

      return new Response(JSON.stringify({ ok: true, type: 'guestbook' }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    return new Response(JSON.stringify({ error: 'Unknown type' }), { status: 400 });

  } catch (err: any) {
    console.error('[notifications/send] Error:', err);
    return new Response(JSON.stringify({ error: 'Internal Server Error', detail: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
