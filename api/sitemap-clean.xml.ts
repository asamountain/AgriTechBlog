import { VercelRequest, VercelResponse } from '@vercel/node';
import { mongoConnectionManager } from '../server/mongodb-connection-manager';

const uri = process.env.MONGODB_URI;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CRITICAL: Set headers to prevent any client-side JavaScript execution
  res.setHeader('Content-Type', 'text/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Content-Security-Policy', "default-src 'none'");

  // Minimal XML structure - absolutely no dynamic content that could be modified
  try {
    const db = await mongoConnectionManager.getDatabase();
    const posts = await db.collection('posts')
      .find({ draft: { $ne: true } })
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();

    // Build completely static XML string
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    
    // Add homepage
    xml += '<url>\n';
    xml += '<loc>https://tech-san.vercel.app/</loc>\n';
    xml += '<lastmod>2025-08-02T08:00:00.000Z</lastmod>\n';
    xml += '<changefreq>daily</changefreq>\n';
    xml += '<priority>1.0</priority>\n';
    xml += '</url>\n';
    
    // Add posts page
    xml += '<url>\n';
    xml += '<loc>https://tech-san.vercel.app/posts</loc>\n';
    xml += '<lastmod>2025-08-02T08:00:00.000Z</lastmod>\n';
    xml += '<changefreq>daily</changefreq>\n';
    xml += '<priority>0.8</priority>\n';
    xml += '</url>\n';
    
    // Add each post
    for (const post of posts) {
      if (post.slug) {
        xml += '<url>\n';
        xml += `<loc>https://tech-san.vercel.app/post/${post.slug}</loc>\n`;
        xml += `<lastmod>${new Date(post.updatedAt || post.date || post.createdAt).toISOString()}</lastmod>\n`;
        xml += '<changefreq>weekly</changefreq>\n';
        xml += '<priority>0.7</priority>\n';
        xml += '</url>\n';
      }
    }
    
    xml += '</urlset>';
    
    // Send raw XML with explicit encoding
    res.status(200);
    res.write(xml, 'utf8');
    res.end();
    
  } catch (error) {
    console.error('Clean sitemap error:', error);
    
    // Ultra-minimal fallback
    const fallback = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
<url>
<loc>https://tech-san.vercel.app/</loc>
<lastmod>2025-08-02T08:00:00.000Z</lastmod>
<changefreq>daily</changefreq>
<priority>1.0</priority>
</url>
</urlset>`;
    
    res.status(200);
    res.write(fallback, 'utf8');
    res.end();
  }
} 