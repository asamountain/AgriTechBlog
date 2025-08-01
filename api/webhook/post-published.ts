import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { postId, action } = req.body;
    
    // Validate the webhook payload
    if (!postId || action !== 'published') {
      res.status(400).json({ error: 'Invalid webhook payload' });
      return;
    }

    console.log(`🔄 Webhook: Post ${postId} was ${action}`);

    const baseUrl = 'https://tech-san.vercel.app';
    
    // Notify search engines about the new content
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
    
    // Also ping RSS feed aggregators
    const rssAggregators = [
      'https://feedly.com/i/subscription/feed/' + encodeURIComponent(baseUrl + '/api/rss.xml'),
      'https://www.newsblur.com/?url=' + encodeURIComponent(baseUrl + '/api/rss.xml')
    ];

    const rssPromises = rssAggregators.map(async (url) => {
      try {
        const response = await fetch(url, { method: 'GET' });
        return { url, status: response.status, success: response.ok };
      } catch (error) {
        return { url, status: 'error', success: false, error: error.message };
      }
    });

    const rssResults = await Promise.all(rssPromises);
    
    res.status(200).json({
      message: `Post ${postId} published successfully`,
      timestamp: new Date().toISOString(),
      searchEnginePings: results,
      rssAggregatorPings: rssResults
    });

  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ error: 'Error processing webhook' });
  }
} 