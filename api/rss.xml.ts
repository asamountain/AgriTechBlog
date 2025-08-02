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
      .limit(50) // Limit to latest 50 posts
      .toArray();
    
    console.log(`RSS: Found ${posts.length} published posts`);
    
    await client.close();
    
    const baseUrl = 'https://tech-san.vercel.app';
    
    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" 
     xmlns:content="http://purl.org/rss/1.0/modules/content/"
     xmlns:wfw="http://wellformedweb.org/CommentAPI/"
     xmlns:dc="http://purl.org/dc/elements/1.1/"
     xmlns:atom="http://www.w3.org/2005/Atom"
     xmlns:sy="http://purl.org/rss/1.0/modules/syndication/"
     xmlns:slash="http://purl.org/rss/1.0/modules/slash/"
     xmlns:georss="http://www.georss.org/georss"
     xmlns:geo="http://www.w3.org/2003/01/geo/wgs84_pos#">
  <channel>
    <title>San's Agricultural Technology Blog</title>
    <atom:link href="${baseUrl}/api/rss.xml" rel="self" type="application/rss+xml" />
    <link>${baseUrl}</link>
    <description>Advanced agrotech blog platform delivering intelligent content for agricultural technology professionals. Discover precision farming, IoT solutions, and sustainable agriculture innovations.</description>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <language>en-US</language>
    <sy:updatePeriod>daily</sy:updatePeriod>
    <sy:updateFrequency>1</sy:updateFrequency>
    <generator>San's AgriTech Blog</generator>
    <category>Technology</category>
    <category>Agriculture</category>
    <category>Innovation</category>
    
    ${posts.map(post => {
      const safeTitle = (post.title || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const safeExcerpt = (post.excerpt || post.content.substring(0, 300)).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const safeContent = (post.content || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      
      return `<item><title>${safeTitle}</title><link>${baseUrl}/post/${post.slug}</link><pubDate>${new Date(post.date || post.createdAt).toUTCString()}</pubDate><dc:creator>${post.author || 'San'}</dc:creator><category>${post.category || post.tags?.[0] || 'Technology'}</category><guid isPermaLink="true">${baseUrl}/post/${post.slug}</guid><description><![CDATA[${safeExcerpt}...]]></description><content:encoded><![CDATA[${safeContent}]]></content:encoded><slash:comments>0</slash:comments>${post.tags ? post.tags.map((tag: string) => `<category>${tag}</category>`).join('') : ''}</item>`;
    }).join('')}
    
  </channel>
</rss>`;

    res.setHeader('Content-Type', 'application/rss+xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=1800, s-maxage=1800');
    res.status(200).send(rss);
  } catch (error) {
    console.error('Error generating RSS feed:', error);
    res.status(500).json({ error: 'Error generating RSS feed' });
  }
} 