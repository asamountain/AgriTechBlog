import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
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
    
    <item>
      <title>Welcome to San's Agricultural Technology Blog</title>
      <link>${baseUrl}/</link>
      <pubDate>${new Date().toUTCString()}</pubDate>
      <dc:creator>San</dc:creator>
      <category>Technology</category>
      <guid isPermaLink="true">${baseUrl}/</guid>
      <description><![CDATA[Discover cutting-edge agricultural technology, IoT solutions, and sustainable farming practices. Expert insights on precision agriculture, crop monitoring, and smart farming innovations.]]></description>
      <content:encoded><![CDATA[<p>Welcome to San's Agricultural Technology Blog - your source for the latest insights in agricultural technology, precision farming, and sustainable agriculture solutions.</p><p>Our blog covers topics including:</p><ul><li>Precision Agriculture Technologies</li><li>IoT Farming Solutions</li><li>Smart Agriculture Systems</li><li>Crop Monitoring Technology</li><li>Sustainable Farming Practices</li><li>Agricultural Innovation</li></ul>]]></content:encoded>
      <slash:comments>0</slash:comments>
    </item>
    
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