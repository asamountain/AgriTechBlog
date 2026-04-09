import type { VercelRequest, VercelResponse } from '@vercel/node';
import cookie from 'cookie';
import * as crypto from 'crypto';
import signature from 'cookie-signature';

interface AuthUser {
  id: string;
  email: string;
  name: string;
  provider: 'google' | 'github';
  avatar?: string;
}

// Exchange GitHub code for access token and fetch user profile
async function handleGitHub(code: string, redirectUri: string): Promise<AuthUser> {
  const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: redirectUri,
    }),
  });
  const tokenData = await tokenRes.json();
  if (tokenData.error) throw new Error(tokenData.error_description || tokenData.error);

  const [userRes, emailRes] = await Promise.all([
    fetch('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${tokenData.access_token}`, 'User-Agent': 'AgriTechBlog' },
    }),
    fetch('https://api.github.com/user/emails', {
      headers: { Authorization: `Bearer ${tokenData.access_token}`, 'User-Agent': 'AgriTechBlog' },
    }),
  ]);

  const profile = await userRes.json();
  const emails = await emailRes.json();
  const primaryEmail = Array.isArray(emails)
    ? emails.find((e: any) => e.primary)?.email || emails[0]?.email || ''
    : '';

  return {
    id: String(profile.id),
    email: primaryEmail,
    name: profile.name || profile.login || '',
    provider: 'github',
    avatar: profile.avatar_url,
  };
}

// Exchange Google code for access token and fetch user profile
async function handleGoogle(code: string, redirectUri: string): Promise<AuthUser> {
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      code,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });
  const tokenData = await tokenRes.json();
  if (tokenData.error) throw new Error(tokenData.error_description || tokenData.error);

  const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });
  const profile = await userRes.json();

  return {
    id: profile.id,
    email: profile.email || '',
    name: profile.name || '',
    provider: 'google',
    avatar: profile.picture,
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // GET: Check current session (return user from cookie)
  if (req.method === 'GET') {
    const sessionSecret = process.env.SESSION_SECRET;
    if (!sessionSecret) return res.status(401).json({ message: 'Not configured' });

    const cookies = cookie.parse(req.headers.cookie || '');
    const userCookie = cookies['auth_user'];
    if (!userCookie) return res.status(401).json({ message: 'Not authenticated' });

    try {
      const raw = userCookie.startsWith('s:') ? userCookie.slice(2) : userCookie;
      const unsigned = signature.unsign(raw, sessionSecret);
      if (unsigned === false) return res.status(401).json({ message: 'Invalid session' });
      const user = JSON.parse(unsigned);
      return res.status(200).json(user);
    } catch {
      return res.status(401).json({ message: 'Invalid session' });
    }
  }

  // POST: Exchange OAuth code (or transfer token) for user data and set session cookie
  if (req.method === 'POST') {
    const sessionSecret = process.env.SESSION_SECRET;
    if (!sessionSecret) return res.status(500).json({ message: 'Session secret not configured' });

    // Handle transfer token verification (cross-origin preview auth)
    if (req.body.transferToken) {
      try {
        const decoded = Buffer.from(req.body.transferToken, 'base64url').toString();
        const unsigned = signature.unsign(decoded, sessionSecret);
        if (unsigned === false) return res.status(401).json({ message: 'Invalid transfer token' });

        const { user, exp } = JSON.parse(unsigned);
        if (Date.now() > exp) return res.status(401).json({ message: 'Transfer token expired' });

        // Set cookies on this domain (the preview domain)
        const userJson = JSON.stringify(user);
        const signed = 's:' + signature.sign(userJson, sessionSecret);
        const sessionId = crypto.randomUUID();
        const signedSid = 's:' + signature.sign(sessionId, sessionSecret);

        res.setHeader('Set-Cookie', [
          cookie.serialize('auth_user', signed, {
            httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 30 * 24 * 60 * 60,
          }),
          cookie.serialize('connect.sid', signedSid, {
            httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 30 * 24 * 60 * 60,
          }),
        ]);

        return res.status(200).json(user);
      } catch {
        return res.status(401).json({ message: 'Invalid transfer token' });
      }
    }

    // Normal OAuth code exchange
    const { code, provider, redirectUri } = req.body;
    if (!code || !provider) return res.status(400).json({ message: 'Missing code or provider' });

    try {
      let user: AuthUser;
      if (provider === 'github') {
        user = await handleGitHub(code, redirectUri);
      } else if (provider === 'google') {
        user = await handleGoogle(code, redirectUri);
      } else {
        return res.status(400).json({ message: 'Unknown provider' });
      }

      // Create a signed cookie with user data
      const userJson = JSON.stringify(user);
      const signed = 's:' + signature.sign(userJson, sessionSecret);

      // Also create a connect.sid for backward compatibility with requireAuth
      const sessionId = crypto.randomUUID();
      const signedSid = 's:' + signature.sign(sessionId, sessionSecret);

      res.setHeader('Set-Cookie', [
        cookie.serialize('auth_user', signed, {
          httpOnly: true,
          secure: true,
          sameSite: 'lax',
          path: '/',
          maxAge: 30 * 24 * 60 * 60, // 30 days
        }),
        cookie.serialize('connect.sid', signedSid, {
          httpOnly: true,
          secure: true,
          sameSite: 'lax',
          path: '/',
          maxAge: 30 * 24 * 60 * 60,
        }),
      ]);

      // Create a short-lived transfer token for cross-origin preview auth
      const transferPayload = JSON.stringify({ user, exp: Date.now() + 60000 });
      const transferToken = Buffer.from(
        signature.sign(transferPayload, sessionSecret)
      ).toString('base64url');

      return res.status(200).json({ ...user, transferToken });
    } catch (error) {
      console.error('OAuth exchange error:', error);
      return res.status(500).json({ message: error instanceof Error ? error.message : 'OAuth failed' });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
