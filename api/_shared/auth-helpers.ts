/**
 * Shared auth helper for Vercel serverless functions.
 * Verifies the user session by checking the connect.sid cookie
 * against the session store (express-session with default MemoryStore
 * won't work across serverless invocations, so we decode the session
 * cookie and verify it's signed with SESSION_SECRET).
 *
 * For Vercel deployments, the Express server handles /auth/* routes
 * and sets a signed session cookie. These serverless functions verify
 * that cookie exists and is validly signed before allowing access.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import cookie from 'cookie';
import signature from 'cookie-signature';

/**
 * Verifies that the incoming request has a valid session cookie.
 * Returns the session ID if valid, or null if not authenticated.
 */
export function verifySession(req: VercelRequest): string | null {
  const sessionSecret = process.env.SESSION_SECRET;
  if (!sessionSecret) {
    return null;
  }

  const cookies = cookie.parse(req.headers.cookie || '');
  const signedCookie = cookies['connect.sid'];

  if (!signedCookie) {
    return null;
  }

  // express-session prefixes signed cookies with 's:'
  const raw = signedCookie.startsWith('s:')
    ? signedCookie.slice(2)
    : signedCookie;

  const sessionId = signature.unsign(raw, sessionSecret);

  // unsign returns false if signature is invalid
  if (sessionId === false) {
    return null;
  }

  return sessionId;
}

/**
 * Middleware-style auth check for Vercel serverless functions.
 * Returns true if authenticated, false if response was already sent with 401.
 */
export function requireAuth(req: VercelRequest, res: VercelResponse): boolean {
  const sessionId = verifySession(req);

  if (!sessionId) {
    res.status(401).json({ message: 'Authentication required' });
    return false;
  }

  return true;
}
