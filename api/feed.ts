import type { VercelRequest, VercelResponse } from '@vercel/node';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;

// XML Entity escaping function
function escapeXmlEntities(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
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
  const { type } = req.query;
  const baseUrl = 'https://tech-san.vercel.app';

  if (!uri) {
    console.error('MONGODB_URI environment variable is not set');
    return res.status(500).json({ error: 'Database configuration error' });
  }

  try {
    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db('blog_database');
    const postsCollection = db.collection('posts');

    // Fetch published posts
    const posts = await postsCollection
      .find({ draft: { $ne: true } })
      .sort({ date: -1, createdAt: -1 })
      .limit(type === 'rss' ? 50 : 50000)
      .toArray();

    await client.close();

    if (type === 'rss') {
      // RSS Feed Generation
      const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" 
     xmlns:content="http://purl.org/rss/1.0/modules/content/"
     xmlns:wfw="http://wellformedweb.org/CommentAPI/"
     xmlns:dc="http://purl.org/dc/elements/1.1/"
     xmlns:atom="http://www.w3.org/2005/Atom"
     xmlns:sy="http://purl.org/rss/1.0/modules/syndication/"
     xmlns:slash="http://purl.org/rss/1.0/modules/slash/">
  <channel>
    <title>San's Agricultural Technology Blog</title>
    <atom:link href="${baseUrl}/api/rss.xml" rel="self" type="application/rss+xml" />
    <link>${baseUrl}</link>
    <description>Advanced agrotech blog platform delivering intelligent content for agricultural technology professionals.</description>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <language>en-US</language>
    <sy:updatePeriod>daily</sy:updatePeriod>
    <sy:updateFrequency>1</sy:updateFrequency>
    <generator>San's AgriTech Blog</generator>
    
    ${posts.map(post => {
      const safeTitle = escapeXmlEntities(post.title || '');
      const safeExcerpt = escapeXmlEntities(post.excerpt || post.content?.substring(0, 300) || '');
      const safeContent = escapeXmlEntities(post.content || '');
      const postUrl = `${baseUrl}/post/${post.slug}`;
      const pubDate = new Date(post.date || post.createdAt || new Date()).toUTCString();
      
      return `<item>
        <title>${safeTitle}</title>
        <link>${postUrl}</link>
        <pubDate>${pubDate}</pubDate>
        <dc:creator>${post.author || 'San'}</dc:creator>
        <category>${post.category || post.tags?.[0] || 'Technology'}</category>
        <guid isPermaLink="true">${postUrl}</guid>
        <description><![CDATA[${safeExcerpt}...]]></description>
        <content:encoded><![CDATA[${safeContent}]]></content:encoded>
        ${post.tags ? post.tags.map((tag: string) => `<category>${escapeXmlEntities(tag)}</category>`).join('') : ''}
      </item>`;
    }).join('')}
  </channel>
</rss>`;

      res.setHeader('Content-Type', 'application/rss+xml; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=1800, s-maxage=1800');
      return res.status(200).send(rss);
    } else {
      // Sitemap Generation (Default)
      const currentDate = formatXmlDate(new Date());
      let urlEntries = `<url><loc>${baseUrl}/</loc><lastmod>${currentDate}</lastmod><changefreq>daily</changefreq><priority>1.0</priority></url>
      <url><loc>${baseUrl}/posts</loc><lastmod>${currentDate}</lastmod><changefreq>daily</changefreq><priority>0.8</priority></url>`;

      for (const post of posts) {
        if (post.slug) {
          const postUrl = `${baseUrl}/post/${escapeXmlEntities(post.slug)}`;
          const lastmod = formatXmlDate(post.updatedAt || post.date || post.createdAt || new Date());
          urlEntries += `<url><loc>${postUrl}</loc><lastmod>${lastmod}</lastmod><changefreq>weekly</changefreq><priority>0.7</priority></url>`;
        }
      }

      const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>`;

      res.setHeader('Content-Type', 'application/xml; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
      return res.status(200).send(sitemap);
    }
  } catch (error) {
    console.error('Feed generation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
