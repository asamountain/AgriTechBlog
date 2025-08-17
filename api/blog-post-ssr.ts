import type { VercelRequest, VercelResponse } from '@vercel/node';
import { renderToString } from 'react-dom/server';
import React from 'react';
import { getStorage } from '../server/storage';

// Simple SSR component
const BlogPostSSR = ({ post }: { post: any }) => {
  return React.createElement('div', { 
    dangerouslySetInnerHTML: { 
      __html: `
        <script>window.location.href = '/blog/${post.slug}';</script>
        <noscript>
          <meta http-equiv="refresh" content="0; url=/blog/${post.slug}">
        </noscript>
      ` 
    } 
  });
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { slug } = req.query;
  
  if (!slug || typeof slug !== 'string') {
    return res.status(400).json({ message: 'Slug required' });
  }

  try {
    const storage = await getStorage();
    const post = await storage.getBlogPostBySlug(slug);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Render React component to string
    const appHtml = renderToString(React.createElement(BlogPostSSR, { post }));
    
    // Generate meta tags
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
  <meta property="og:url" content="https://tech-san.vercel.app/blog/${post.slug}">
  <meta property="og:site_name" content="San's Agricultural Technology Blog">
  <meta property="og:image" content="${ogImageUrl}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  
  <!-- Twitter Card Meta Tags -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${post.title}">
  <meta name="twitter:description" content="${post.excerpt}">
  <meta name="twitter:image" content="${ogImageUrl}">
  
  <!-- Article Meta Tags -->
  <meta property="article:author" content="${post.author?.name || 'San'}">
  <meta property="article:published_time" content="${post.createdAt}">
  <meta property="article:section" content="${post.tags?.[0] || 'Technology'}">
  ${post.tags?.map(tag => `<meta property="article:tag" content="${tag}">`).join('\n  ')}
</head>
<body>
  <div id="root">${appHtml}</div>
  <p>Redirecting to blog post...</p>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html');
    res.send(html);
    
  } catch (error) {
    console.error('SSR Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
} 