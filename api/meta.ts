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

function findFirstImage(content: string): string | null {
  if (!content) return null;
  // Match standard markdown images: ![alt](url)
  const match = content.match(/!\[.*?\]\((.*?)\)/);
  return match ? match[1] : null;
}

const HERO_IMAGE = "https://cdn.myportfolio.com/e5b750a4-50d3-4551-bd7b-c4c4e3e39d73/8b70ddf3-e9a7-49a7-a1cd-b84056520f4a.jpg?h=23852e2440450a21161999cbfb84a425";

function generateMetaHtml(data: any, isBot: boolean): string {
  const { 
    title, 
    description, 
    url, 
    image, 
    type = 'website', 
    author = 'San', 
    publishedTime, 
    modifiedTime, 
    tags = [], 
    category = 'Technology' 
  } = data;

  const escapedTitle = escapeHtml(title);
  const escapedDesc = escapeHtml(description || '');
  const ogImageUrl = image || `https://tech-san.vercel.app/api/og-image?title=${encodeURIComponent(title)}&category=${encodeURIComponent(category)}`;
  
  const articleMeta = type === 'article' ? `
  <meta property="article:author" content="${escapeHtml(author)}">
  <meta property="article:published_time" content="${publishedTime || ''}">
  <meta property="article:modified_time" content="${modifiedTime || ''}">
  <meta property="article:section" content="${escapeHtml(category)}">
  ${tags.map((tag: string) => `<meta property="article:tag" content="${escapeHtml(tag)}">`).join('\n  ')}` : '';

  const redirectScript = !isBot ? `
  <script>
    // Prevent infinite loop by adding bypass parameter
    const url = new URL(window.location.href);
    if (!url.searchParams.has('bypass')) {
      url.searchParams.set('bypass', 'true');
      window.location.href = url.pathname + url.search + url.hash;
    }
  </script>` : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapedTitle} | San's AgriTech Blog</title>
  <meta name="description" content="${escapedDesc}">
  
  <!-- Google Analytics -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-LM04J3WC3L"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-LM04J3WC3L');
  </script>

  <!-- Open Graph Meta Tags -->
  <meta property="og:title" content="${escapedTitle}">
  <meta property="og:description" content="${escapedDesc}">
  <meta property="og:type" content="${type}">
  <meta property="og:url" content="${url}">
  <meta property="og:site_name" content="San's Agricultural Technology Blog">
  <meta property="og:image" content="${ogImageUrl}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  ${articleMeta}
  
  <!-- Twitter Card Meta Tags -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapedTitle}">
  <meta name="twitter:description" content="${escapedDesc}">
  <meta name="twitter:image" content="${ogImageUrl}">
  ${redirectScript}
  <noscript>
    <meta http-equiv="refresh" content="0; url=${url}">
  </noscript>
</head>
<body>
  <div id="root">
    <h1>${escapedTitle}</h1>
    <p>${escapedDesc}</p>
    <p>Redirecting to content...</p>
  </div>
</body>
</html>`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { slug, type: pageType } = req.query;
  const userAgent = req.headers['user-agent'] || '';
  const isBot = /bot|googlebot|crawler|spider|robot|crawling|facebookexternalhit|twitterbot|slackbot|discordbot/i.test(userAgent);

  const { uri, dbName } = getMongoConfig();
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db(dbName);
    
    let metaData: any = {
      title: "San's Agricultural Technology Blog",
      description: "Smart farming technology, IoT engineering insights, and agricultural innovation.",
      url: "https://tech-san.vercel.app/",
      image: HERO_IMAGE,
      type: "website"
    };

    if (pageType === 'blog' && slug) {
      const post = await db.collection('posts').findOne({ slug, isPublished: { $ne: false } });
      if (post) {
        metaData = {
          title: post.title,
          description: post.excerpt || post.summary,
          url: `https://tech-san.vercel.app/blog/${post.slug}`,
          image: post.featuredImage || findFirstImage(post.content) || HERO_IMAGE,
          type: "article",
          publishedTime: post.createdAt,
          modifiedTime: post.updatedAt,
          tags: post.tags,
          category: post.tags?.[0] || 'Technology'
        };
      }
    } else if (pageType === 'portfolio') {
      if (slug) {
        // Individual project
        const project = await db.collection('projects').findOne({ slug, isPublished: { $ne: false } });
        if (project) {
          metaData = {
            title: project.title,
            description: project.description,
            url: `https://tech-san.vercel.app/portfolio/${project.slug}`,
            image: project.featuredImage || findFirstImage(project.content) || HERO_IMAGE,
            type: "article",
            category: project.category
          };
        }
      } else {
        // Portfolio list
        metaData = {
          title: "Project Portfolio | San's AgriTech",
          description: "Explore our innovative AgriTech projects, from IoT sensor networks to autonomous farming solutions.",
          url: "https://tech-san.vercel.app/portfolio",
          image: HERO_IMAGE
        };
      }
    } else if (pageType === 'posts') {
      metaData = {
        title: "Agricultural Technology Articles",
        description: "In-depth articles on IoT, smart farming, and precision agriculture engineering.",
        url: "https://tech-san.vercel.app/posts",
        image: HERO_IMAGE
      };
    }

    const html = generateMetaHtml(metaData, isBot);
    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(html);

  } catch (error) {
    console.error('SEO Meta Handler Error:', error);
    return res.status(200).send(generateMetaHtml({
      title: "San's AgriTech Blog",
      description: "Agricultural technology and IoT engineering.",
      url: "https://tech-san.vercel.app/",
      image: HERO_IMAGE
    }, isBot));
  } finally {
    await client.close();
  }
}


