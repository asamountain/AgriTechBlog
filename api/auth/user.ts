import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // For now, return demo authentication since the OAuth isn't fully set up on Vercel
  // This matches the demo login in admin-login-simple.tsx
  
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Check for demo authentication from localStorage (client-side)
    // Since this is serverless, we can't maintain session state
    // The frontend should use demo login for now
    
    // For demo purposes, always return unauthorized to trigger demo login
    res.status(401).json({ message: 'Not authenticated - use demo login' });
  } catch (error) {
    console.error('Auth verification error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
} 