import { VercelRequest, VercelResponse } from '@vercel/node';
import { mongoConnectionManager } from '../server/mongodb-connection-manager';

const uri = process.env.MONGODB_URI;

// XML Entity escaping function according to sitemaps.org standards
function escapeXmlEntities(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// URL encoding according to RFC-3986 standards
function encodeUrl(url: string): string {
  try {
    return new URL(url).href;
  } catch (error) {
    // Fallback for invalid URLs
    return url.replace(/[^\w\-._~:/?#[\]@!$&'()*+,;=]/g, (char) => 
      encodeURIComponent(char)
    );
  }
}

// Date formatting according to W3C DateTime format (ISO 8601)
function formatXmlDate(date: string | Date): string {
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) {
      return new Date().toISOString();
    }
    return d.toISOString();
  } catch (error) {
    return new Date().toISOString();
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set proper headers first
  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
  res.setHeader('X-Robots-Tag', 'noindex');

  // Handle test mode for debugging
  if (req.query.test === 'true') {
    const testSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
<url>
<loc>https://tech-san.vercel.app/</loc>
<lastmod>${formatXmlDate(new Date())}</lastmod>
<changefreq>daily</changefreq>
<priority>1.0</priority>
</url>
</urlset>`;
    return res.status(200).end(testSitemap);
  }

  if (!uri) {
    console.error('MONGODB_URI environment variable is not set');
    const errorXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
<url>
<loc>https://tech-san.vercel.app/</loc>
<lastmod>${formatXmlDate(new Date())}</lastmod>
<changefreq>daily</changefreq>
<priority>1.0</priority>
</url>
</urlset>`;
    return res.status(200).end(errorXml);
  }

  try {
    const db = await mongoConnectionManager.getDatabase();
    
    // Fetch only published posts (not drafts)
    const posts = await db.collection('posts')
      .find({ 
        draft: { $ne: true },
        isPublished: { $ne: false }
      })
      .sort({ createdAt: -1 })
      .limit(50000) // Sitemap limit according to sitemaps.org
      .toArray();

    const baseUrl = 'https://tech-san.vercel.app';
    const currentDate = formatXmlDate(new Date());

    // Build sitemap according to official sitemaps.org protocol
    const xmlDeclaration = '<?xml version="1.0" encoding="UTF-8"?>';
    const urlsetOpen = '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
    const urlsetClose = '</urlset>';

    // Required pages with proper priority and changefreq
    const staticUrls = [
      {
        loc: baseUrl + '/',
        lastmod: currentDate,
        changefreq: 'daily',
        priority: '1.0'
      },
      {
        loc: baseUrl + '/posts',
        lastmod: currentDate,
        changefreq: 'daily',
        priority: '0.8'
      },
         ];

    // Generate URL entries
    let urlEntries = '';

    // Add static URLs
    for (const urlData of staticUrls) {
      urlEntries += `<url><loc>${escapeXmlEntities(encodeUrl(urlData.loc))}</loc><lastmod>${urlData.lastmod}</lastmod><changefreq>${urlData.changefreq}</changefreq><priority>${urlData.priority}</priority></url>`;
    }

    // Add blog post URLs
    for (const post of posts) {
      if (post.slug) {
        const postUrl = `${baseUrl}/post/${escapeXmlEntities(post.slug)}`;
        const lastmod = formatXmlDate(post.updatedAt || post.date || post.createdAt || new Date());
        
        urlEntries += `<url><loc>${encodeUrl(postUrl)}</loc><lastmod>${lastmod}</lastmod><changefreq>weekly</changefreq><priority>0.7</priority></url>`;
      }
    }

    // Construct final sitemap
    const sitemap = xmlDeclaration + '\n' + urlsetOpen + '\n' + urlEntries + '\n' + urlsetClose;

    return res.status(200).end(sitemap);

  } catch (error) {
    console.error('Error generating sitemap:', error);
    
    // Return minimal valid sitemap on error
    const fallbackSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
<url>
<loc>https://tech-san.vercel.app/</loc>
<lastmod>${formatXmlDate(new Date())}</lastmod>
<changefreq>daily</changefreq>
<priority>1.0</priority>
</url>
</urlset>`;
    
    return res.status(200).end(fallbackSitemap);
  }
} 