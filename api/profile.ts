import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Return demo profile data since full auth isn't implemented
    const profile = {
      id: "demo-user",
      name: "Demo User",
      email: "demo@example.com",
      isAdmin: true,
      avatar: null
    };

    res.status(200).json(profile);
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
} 