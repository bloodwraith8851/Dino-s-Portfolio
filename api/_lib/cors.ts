/**
 * Shared CORS helpers for all Vercel Edge API handlers.
 *
 * In production ALLOWED_ORIGIN should be set to your Vercel domain
 * (e.g. https://dino-s-portfolio.vercel.app). Falls back to '*' only
 * when the env var is absent so local dev still works.
 */

export function getAllowedOrigin(): string {
  return process.env.ALLOWED_ORIGIN ?? '*';
}

export function corsHeaders(methods = 'POST, OPTIONS'): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': getAllowedOrigin(),
    'Access-Control-Allow-Methods': methods,
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

/** Respond to CORS preflight requests. */
export function handlePreflight(): Response {
  return new Response(null, { headers: corsHeaders() });
}

/** JSON response with CORS headers and correct Content-Type. */
export function json(body: unknown, status = 200, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders('GET, POST, PUT, DELETE, OPTIONS'),
      ...extra,
    },
  });
}
