import { SignJWT } from 'jose';
import { Redis } from '@upstash/redis/cloudflare';

export const config = { runtime: 'edge' };

/** Maximum failed login attempts before lockout */
const MAX_FAILED_ATTEMPTS = 5;
/** Lockout / tracking window in seconds (15 minutes) */
const LOCKOUT_WINDOW_SECONDS = 900;

/**
 * Returns the JWT signing key. Throws if JWT_SECRET is not set — no fallback.
 */
function getSecretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('[auth/admin] JWT_SECRET environment variable is required');
  }
  return new TextEncoder().encode(secret);
}

/**
 * Timing-safe string comparison using HMAC via crypto.subtle.
 * Signs both values with the same key and compares the resulting digests.
 */
async function timingSafeEqual(a: string, b: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode('timing-safe-compare-key'),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const [sigA, sigB] = await Promise.all([
    crypto.subtle.sign('HMAC', key, encoder.encode(a)),
    crypto.subtle.sign('HMAC', key, encoder.encode(b)),
  ]);
  const viewA = new Uint8Array(sigA);
  const viewB = new Uint8Array(sigB);
  if (viewA.length !== viewB.length) return false;
  let result = 0;
  for (let i = 0; i < viewA.length; i++) {
    result |= viewA[i] ^ viewB[i];
  }
  return result === 0;
}

/**
 * Attempts to get a Redis client. Returns null if env vars are missing.
 */
function getRedis(): Redis | null {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    return new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
  return null;
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

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';

  try {
    // --- Brute-force lockout check (gracefully skips if Redis unavailable) ---
    let redis: Redis | null = null;
    const rateLimitKey = `auth:fail:${ip}`;
    try {
      redis = getRedis();
      if (redis) {
        const failCount = await redis.get<number>(rateLimitKey);
        if (failCount !== null && failCount >= MAX_FAILED_ATTEMPTS) {
          return new Response(
            JSON.stringify({ error: 'Too many failed attempts. Try again in 15 minutes.' }),
            {
              status: 429,
              headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            },
          );
        }
      }
    } catch (e) {
      console.warn('[auth/admin] Redis lockout check failed, proceeding without:', e);
      redis = null;
    }

    // --- Validate required env vars ---
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminPassword) {
      throw new Error('[auth/admin] ADMIN_PASSWORD environment variable is required');
    }

    const { password } = await req.json();
    const match = await timingSafeEqual(password ?? '', adminPassword);

    if (!match) {
      // Record failed attempt in Redis (best-effort)
      try {
        if (redis) {
          const count = await redis.incr(rateLimitKey);
          if (count === 1) {
            await redis.expire(rateLimitKey, LOCKOUT_WINDOW_SECONDS);
          }
        }
      } catch (e) {
        console.warn('[auth/admin] Redis failed attempt recording error:', e);
      }

      return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    // Successful login — clear failed attempts counter
    try {
      if (redis) {
        await redis.del(rateLimitKey);
      }
    } catch (e) {
      console.warn('[auth/admin] Redis clear failed attempts error:', e);
    }

    // Issue a short-lived JWT (30 min)
    const token = await new SignJWT({ role: 'admin', sub: 'rakesh-portfolio-admin' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('30m')
      .setIssuer('rakesh.dev')
      .sign(getSecretKey());

    return new Response(JSON.stringify({ ok: true, token }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  } catch (err: any) {
    console.error('[auth/admin] Error:', err);
    return new Response(JSON.stringify({ error: 'Authentication failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
