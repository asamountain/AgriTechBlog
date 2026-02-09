import type { VercelRequest, VercelResponse } from '@vercel/node';
import { MongoClient } from 'mongodb';
import type { BlogPostWithDetails } from '../shared/schema';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  let client: MongoClient | null = null;
  
  try {
    const { slug } = req.query;
    
    if (!slug || typeof slug !== 'string') {
      return res.status(400).json({ message: 'Slug parameter is required' });
    }

    // Connect to MongoDB
    client = new MongoClient(process.env.MONGODB_URI!);
    await client.connect();
    const db = client.db(process.env.MONGODB_DATABASE || 'blog_database');
    const collection = db.collection('posts');
    
    const post = await collection.findOne({ 
      slug: slug,
      draft: false // Only published posts
    }) as BlogPostWithDetails | null;

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Generate Open Graph HTML
    const currentUrl = `https://tech-san.vercel.app/blog/${post.slug}`;
    const ogImageUrl = post.featuredImage || 
      `https://tech-san.vercel.app/api/og-image?title=${encodeURIComponent(post.title)}&category=${encodeURIComponent(post.tags?.[0] || 'Technology')}&author=${encodeURIComponent(post.author?.name || 'San')}&excerpt=${encodeURIComponent(post.excerpt.substring(0, 100))}`;
    
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${post.title} | San's Agricultural Technology Blog</title>
  <meta name="description" content="${post.excerpt}">
  
  <!-- Open Graph Meta Tags -->
  <meta property="og:title" content="${post.title}">
  <meta property="og:description" content="${post.excerpt}">
  <meta property="og:type" content="article">
  <meta property="og:url" content="${currentUrl}">
  <meta property="og:site_name" content="San's Agricultural Technology Blog">
  <meta property="og:image" content="${ogImageUrl}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  
  <!-- Article Meta Tags -->
  <meta property="article:author" content="${post.author?.name || 'San'}">
  <meta property="article:published_time" content="${post.createdAt}">
  <meta property="article:modified_time" content="${post.updatedAt}">
  <meta property="article:section" content="${post.tags?.[0] || 'Technology'}">
  ${post.tags?.map(tag => `<meta property="article:tag" content="${tag}">`).join('\n  ')}
  
  <!-- Twitter Card Meta Tags -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${post.title}">
  <meta name="twitter:description" content="${post.excerpt}">
  <meta name="twitter:image" content="${ogImageUrl}">
  
  <!-- Keywords -->
  <meta name="keywords" content="${post.tags?.join(', ')}, agricultural technology, precision farming, smart agriculture">
  
  <!-- Redirect to actual blog post -->
  <script>
    window.location.href = '/blog/${post.slug}';
  </script>
  <noscript>
    <meta http-equiv="refresh" content="0; url=/blog/${post.slug}">
  </noscript>
</head>
<body>
  <p>If you are not redirected automatically, <a href="/blog/${post.slug}">click here</a>.</p>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html');
    return res.send(html);
  } catch (error) {
    console.error('Error generating blog post meta:', error);
    return res.status(500).json({ message: 'Internal server error' });
  } finally {
    // Close the MongoDB connection
    if (client) {
      await client.close();
    }
  }
} 