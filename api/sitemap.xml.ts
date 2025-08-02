import type { VercelRequest, VercelResponse } from '@vercel/node';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!uri) {
    console.error('MONGODB_URI environment variable is not set');
    res.status(500).json({ error: 'Database configuration error' });
    return;
  }

  try {
    const client = new MongoClient(uri);
    await client.connect();
    
    const db = client.db('blog_database');
    const postsCollection = db.collection('posts');
    
    // Fetch all published posts using the same logic as working blog-posts API
    const posts = await postsCollection
      .find({ draft: { $ne: true } }) // Use same logic as working blog-posts API
      .sort({ date: -1 })
      .toArray();
    
    console.log(`Sitemap: Found ${posts.length} published posts`);
    
    await client.close();
    
    const baseUrl = 'https://tech-san.vercel.app';
    const timestamp = new Date().toISOString();
    
    // Helper function to escape XML entities
    const escapeXml = (unsafe: string): string => {
      if (!unsafe) return '';
      return unsafe
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
    };

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
<url><loc>${baseUrl}/</loc><lastmod>${timestamp}</lastmod><changefreq>daily</changefreq><priority>1.0</priority></url>
<url><loc>${baseUrl}/posts</loc><lastmod>${timestamp}</lastmod><changefreq>daily</changefreq><priority>0.8</priority></url>
${posts.map(post => {
  const safeSlug = post.slug || '';
  const lastmod = new Date(post.updatedAt || post.date || post.createdAt).toISOString();
  
  return `<url><loc>${baseUrl}/post/${safeSlug}</loc><lastmod>${lastmod}</lastmod><changefreq>weekly</changefreq><priority>0.7</priority></url>`;
}).join('')}
<url><loc>${baseUrl}/about</loc><lastmod>${timestamp}</lastmod><changefreq>monthly</changefreq><priority>0.5</priority></url>
<url><loc>${baseUrl}/contact</loc><lastmod>${timestamp}</lastmod><changefreq>monthly</changefreq><priority>0.5</priority></url>
</urlset>`;

    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
    res.status(200).send(sitemap);
  } catch (error) {
    console.error('Error generating sitemap:', error);
    res.status(500).json({ error: 'Error generating sitemap' });
  }
} 