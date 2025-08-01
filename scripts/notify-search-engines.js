#!/usr/bin/env node

/**
 * Search Engine Notification Script
 * Run this script after publishing a new blog post to notify search engines
 * 
 * Usage: node scripts/notify-search-engines.js [post-slug]
 */

const https = require('https');
const http = require('http');

const BASE_URL = 'https://tech-san.vercel.app';

// Search engines to notify
const SEARCH_ENGINES = [
  {
    name: 'Google',
    url: `https://www.google.com/ping?sitemap=${encodeURIComponent(BASE_URL + '/api/sitemap.xml')}`
  },
  {
    name: 'Bing',
    url: `https://www.bing.com/ping?sitemap=${encodeURIComponent(BASE_URL + '/api/sitemap.xml')}`
  },
  {
    name: 'Yandex',
    url: `https://www.yandex.com/ping?sitemap=${encodeURIComponent(BASE_URL + '/api/sitemap.xml')}`
  }
];

// RSS aggregators to notify
const RSS_AGGREGATORS = [
  {
    name: 'Feedly',
    url: `https://feedly.com/i/subscription/feed/${encodeURIComponent(BASE_URL + '/api/rss.xml')}`
  },
  {
    name: 'NewsBlur',
    url: `https://www.newsblur.com/?url=${encodeURIComponent(BASE_URL + '/api/rss.xml')}`
  }
];

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https:') ? https : http;
    
    const req = protocol.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          success: res.statusCode >= 200 && res.statusCode < 300,
          data: data
        });
      });
    });

    req.on('error', (error) => {
      reject({
        status: 'error',
        success: false,
        error: error.message
      });
    });

    req.setTimeout(10000, () => {
      req.destroy();
      reject({
        status: 'timeout',
        success: false,
        error: 'Request timeout'
      });
    });
  });
}

async function notifySearchEngines() {
  console.log('🚀 Notifying search engines about new content...\n');

  const results = [];

  // Notify search engines
  for (const engine of SEARCH_ENGINES) {
    try {
      console.log(`📡 Pinging ${engine.name}...`);
      const result = await makeRequest(engine.url);
      results.push({ name: engine.name, ...result });
      console.log(`✅ ${engine.name}: ${result.success ? 'Success' : 'Failed'} (${result.status})`);
    } catch (error) {
      console.log(`❌ ${engine.name}: Error - ${error.error}`);
      results.push({ name: engine.name, ...error });
    }
  }

  console.log('\n📰 Notifying RSS aggregators...\n');

  // Notify RSS aggregators
  for (const aggregator of RSS_AGGREGATORS) {
    try {
      console.log(`📡 Pinging ${aggregator.name}...`);
      const result = await makeRequest(aggregator.url);
      results.push({ name: aggregator.name, ...result });
      console.log(`✅ ${aggregator.name}: ${result.success ? 'Success' : 'Failed'} (${result.status})`);
    } catch (error) {
      console.log(`❌ ${aggregator.name}: Error - ${error.error}`);
      results.push({ name: aggregator.name, ...error });
    }
  }

  console.log('\n📊 Summary:');
  const successful = results.filter(r => r.success).length;
  const total = results.length;
  console.log(`✅ Successful: ${successful}/${total}`);
  console.log(`📈 Success rate: ${Math.round((successful / total) * 100)}%`);

  return results;
}

// Run the script
if (require.main === module) {
  const postSlug = process.argv[2];
  
  if (postSlug) {
    console.log(`🎯 Notifying search engines about new post: ${postSlug}`);
  } else {
    console.log('🎯 Notifying search engines about updated content');
  }

  notifySearchEngines()
    .then(() => {
      console.log('\n✨ Search engine notification complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error:', error);
      process.exit(1);
    });
}

module.exports = { notifySearchEngines }; 