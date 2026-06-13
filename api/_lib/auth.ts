/**
 * Shared JWT verification for admin-protected Edge endpoints.
 * Validates the Bearer token in the Authorization header against JWT_SECRET.
 */
import { jwtVerify } from 'jose';

export async function verifyAdminToken(req: Request): Promise<boolean> {
  const secret = process.env.JWT_SECRET;
  if (!secret) return false;

  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return false;

  const token = authHeader.slice(7);
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret), { issuer: 'rakesh.dev' });
    return payload.role === 'admin';
  } catch {
    return false;
  }
}
