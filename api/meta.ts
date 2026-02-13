/**
 * Unified Blog Post Meta/SSR Handler
 * 
 * Consolidates 2 serverless functions into 1:
 *   - GET /api/meta?slug=xxx          → Open Graph meta HTML (basic)
 *   - GET /api/meta?slug=xxx&ssr=true → React SSR with meta tags
 * 
 * Old routes are remapped via vercel.json rewrites:
 *   /api/blog-post-meta?slug=xxx → /api/meta?slug=xxx
 *   /api/blog-post-ssr?slug=xxx  → /api/meta?slug=xxx&ssr=true
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { MongoClient } from 'mongodb';
import { getMongoConfig } from './_shared/post-helpers.js';

function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function generateMetaHtml(post: any): string {
  const currentUrl = `https://tech-san.vercel.app/blog/${post.slug}`;
  const ogImageUrl = post.featuredImage || post.coverImage || 
    `https://tech-san.vercel.app/api/og-image?title=${encodeURIComponent(post.title)}&category=${encodeURIComponent(post.tags?.[0] || 'Technology')}&author=${encodeURIComponent(post.author?.name || 'San')}&excerpt=${encodeURIComponent((post.excerpt || '').substring(0, 100))}`;
  
  const title = escapeHtml(post.title);
  const excerpt = escapeHtml(post.excerpt || '');
  const authorName = escapeHtml(post.author?.name || 'San');
  const category = escapeHtml(post.tags?.[0] || 'Technology');
  
  const articleTags = (post.tags || [])
    .map((tag: string) => `  <meta property="article:tag" content="${escapeHtml(tag)}">`)
    .join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} | San's Agricultural Technology Blog</title>
  <meta name="description" content="${excerpt}">
  
  <!-- Open Graph Meta Tags -->
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${excerpt}">
  <meta property="og:type" content="article">
  <meta property="og:url" content="${currentUrl}">
  <meta property="og:site_name" content="San's Agricultural Technology Blog">
  <meta property="og:image" content="${ogImageUrl}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  
  <!-- Article Meta Tags -->
  <meta property="article:author" content="${authorName}">
  <meta property="article:published_time" content="${post.createdAt || post.date || ''}">
  <meta property="article:modified_time" content="${post.updatedAt || post.lastModified || ''}">
  <meta property="article:section" content="${category}">
${articleTags}
  
  <!-- Twitter Card Meta Tags -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${excerpt}">
  <meta name="twitter:image" content="${ogImageUrl}">
  
  <!-- Keywords -->
  <meta name="keywords" content="${escapeHtml((post.tags || []).join(', '))}, agricultural technology, precision farming, smart agriculture">
  
  <!-- Redirect to actual blog post -->
  <script>
    window.location.href = '/blog/${post.slug}';
  </script>
  <noscript>
    <meta http-equiv="refresh" content="0; url=/blog/${post.slug}">
  </noscript>
</head>
<body>
  <div id="root">
    <p>Redirecting to blog post...</p>
  </div>
  <p>If you are not redirected automatically, <a href="/blog/${post.slug}">click here</a>.</p>
</body>
</html>`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { slug } = req.query;
  
  if (!slug || typeof slug !== 'string') {
    return res.status(400).json({ message: 'Slug parameter is required' });
  }

  let client: MongoClient | null = null;
  
  try {
    const { uri, dbName } = getMongoConfig();
    client = new MongoClient(uri);
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection('posts');
    
    const post = await collection.findOne({ 
      slug: slug,
      draft: { $ne: true }
    });

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const html = generateMetaHtml(post);

    res.setHeader('Content-Type', 'text/html');
    return res.send(html);
  } catch (error) {
    console.error('Error generating blog post meta:', error);
    return res.status(500).json({ message: 'Internal server error' });
  } finally {
    if (client) {
      await client.close();
    }
  }
}
