import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Return admin profile data
    const adminProfile = {
      id: "admin-user",
      name: "Admin User", 
      email: "admin@tech-san.vercel.app",
      isAdmin: true,
      avatar: null,
      role: "administrator",
      permissions: ["create", "read", "update", "delete"],
      lastLogin: new Date().toISOString()
    };

    res.status(200).json(adminProfile);
  } catch (error) {
    console.error('Admin profile error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
} 