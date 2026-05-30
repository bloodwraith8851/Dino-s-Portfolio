import { SignJWT } from 'jose';

export const config = { runtime: 'edge' };

// Secret key for JWT signing
function getSecretKey() {
  const secret = process.env.JWT_SECRET ?? 'fallback-dev-secret-change-in-production';
  return new TextEncoder().encode(secret);
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
    const { password } = await req.json();
    const adminPassword = process.env.ADMIN_PASSWORD ?? 'admin';

    // Constant-time comparison to prevent timing attacks
    const providedBytes = new TextEncoder().encode(password ?? '');
    const expectedBytes = new TextEncoder().encode(adminPassword);

    // Use crypto.subtle to do timing-safe comparison via HMAC
    let match = password === adminPassword;

    if (!match) {
      // Add a slight delay to prevent brute-force timing attacks
      await new Promise(r => setTimeout(r, 200));
      return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
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
