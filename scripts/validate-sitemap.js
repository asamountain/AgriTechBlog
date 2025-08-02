import fetch from 'node-fetch';
import { XMLParser } from 'fast-xml-parser';

async function validateSitemap(url) {
  console.log(`🔍 Validating sitemap: ${url}`);
  
  try {
    // Fetch the sitemap
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`❌ HTTP ${response.status}: ${response.statusText}`);
      return false;
    }
    
    const contentType = response.headers.get('content-type');
    console.log(`📄 Content-Type: ${contentType}`);
    
    if (!contentType?.includes('xml')) {
      console.error(`❌ Invalid Content-Type: Expected XML, got ${contentType}`);
      return false;
    }
    
    const xmlContent = await response.text();
    console.log(`📏 Size: ${xmlContent.length} characters`);
    
    // Parse XML
    const parser = new XMLParser({
      ignoreAttributes: false,
      parseAttributeValue: false,
      trimValues: true
    });
    
    const parsed = parser.parse(xmlContent);
    
    if (!parsed.urlset) {
      console.error('❌ Missing <urlset> root element');
      return false;
    }
    
    if (!parsed.urlset['@_xmlns'] || !parsed.urlset['@_xmlns'].includes('sitemaps.org')) {
      console.error('❌ Missing or invalid xmlns namespace');
      return false;
    }
    
    const urls = Array.isArray(parsed.urlset.url) ? parsed.urlset.url : [parsed.urlset.url];
    console.log(`📋 Found ${urls.length} URLs`);
    
    // Validate each URL
    let validUrls = 0;
    for (let i = 0; i < Math.min(urls.length, 5); i++) { // Check first 5 URLs
      const url = urls[i];
      if (url.loc && url.lastmod && url.changefreq && url.priority) {
        validUrls++;
        console.log(`✅ URL ${i + 1}: ${url.loc.substring(0, 50)}...`);
      } else {
        console.error(`❌ URL ${i + 1}: Missing required elements`);
      }
    }
    
    console.log(`✅ Validation successful! ${validUrls}/${Math.min(urls.length, 5)} URLs valid`);
    return true;
    
  } catch (error) {
    console.error(`❌ Validation failed: ${error.message}`);
    return false;
  }
}

// Test both sitemaps
async function main() {
  console.log('🚀 Starting sitemap validation...\n');
  
  const sitemaps = [
    'https://tech-san.vercel.app/sitemap.xml',          // Static
    'https://tech-san.vercel.app/api/sitemap.xml',      // Dynamic
    'https://tech-san.vercel.app/api/sitemap.xml?test=true'  // Test mode
  ];
  
  for (const sitemap of sitemaps) {
    await validateSitemap(sitemap);
    console.log('─'.repeat(60));
  }
}

main().catch(console.error); 