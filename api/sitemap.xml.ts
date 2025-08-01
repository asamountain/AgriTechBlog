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
    
    // Fetch all published posts
    const posts = await postsCollection
      .find({ draft: { $ne: true } }) // Only published posts
      .sort({ date: -1 })
      .toArray();
    
    await client.close();
    
    const baseUrl = 'https://tech-san.vercel.app';
    
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:mobile="http://www.google.com/schemas/sitemap-mobile/1.0"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
  
  <!-- Homepage -->
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  
  <!-- Blog Posts Page -->
  <url>
    <loc>${baseUrl}/posts</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  
  <!-- Individual Blog Posts -->
  ${posts.map(post => `
  <url>
    <loc>${baseUrl}/post/${post.slug}</loc>
    <lastmod>${new Date(post.updatedAt || post.date || post.createdAt).toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
    <image:image>
      <image:loc>${baseUrl}/api/og-image?title=${encodeURIComponent(post.title)}&category=${encodeURIComponent(post.category || post.tags?.[0] || 'Technology')}&author=${encodeURIComponent(post.author || 'San')}&excerpt=${encodeURIComponent(post.excerpt || '')}</image:loc>
      <image:title>${post.title}</image:title>
    </image:image>
  </url>
  `).join('')}
  
  <!-- About Page -->
  <url>
    <loc>${baseUrl}/about</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  
  <!-- Contact Page -->
  <url>
    <loc>${baseUrl}/contact</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  
  <!-- Admin Page -->
  <url>
    <loc>${baseUrl}/admin</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.3</priority>
  </url>
  
</urlset>`;

    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
    res.status(200).send(sitemap);
  } catch (error) {
    console.error('Error generating sitemap:', error);
    res.status(500).json({ error: 'Error generating sitemap' });
  }
} 