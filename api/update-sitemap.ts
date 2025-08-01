import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests for security
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const baseUrl = 'https://tech-san.vercel.app';
    
    // Notify search engines about sitemap updates
    const searchEngines = [
      `https://www.google.com/ping?sitemap=${encodeURIComponent(baseUrl + '/api/sitemap.xml')}`,
      `https://www.bing.com/ping?sitemap=${encodeURIComponent(baseUrl + '/api/sitemap.xml')}`,
      `https://www.yandex.com/ping?sitemap=${encodeURIComponent(baseUrl + '/api/sitemap.xml')}`
    ];

    const pingPromises = searchEngines.map(async (url) => {
      try {
        const response = await fetch(url, { method: 'GET' });
        return { url, status: response.status, success: response.ok };
      } catch (error) {
        return { url, status: 'error', success: false, error: error.message };
      }
    });

    const results = await Promise.all(pingPromises);
    
    res.status(200).json({
      message: 'Sitemap update notifications sent',
      timestamp: new Date().toISOString(),
      results
    });

  } catch (error) {
    console.error('Error updating sitemap:', error);
    res.status(500).json({ error: 'Error updating sitemap' });
  }
} 