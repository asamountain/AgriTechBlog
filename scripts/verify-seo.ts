import dotenv from 'dotenv';

dotenv.config();

const BASE_URL = process.env.BACKEND_URL || 'http://localhost:5001';
const TEST_SLUG = process.argv[2] || 'autonomous-farming-future-is-here'; // Allow custom slug via CLI

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  details?: string;
}

const results: TestResult[] = [];

/**
 * Utility function to fetch and handle errors
 */
async function safeFetch(url: string): Promise<{ success: boolean; data?: string; error?: string }> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}: ${response.statusText}` };
    }
    const data = await response.text();
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Test 1: Sitemap XML
 */
async function testSitemap(): Promise<TestResult> {
  console.log('\n🔍 Testing Sitemap XML...');
  const url = `${BASE_URL}/sitemap.xml`;
  
  const result = await safeFetch(url);
  
  if (!result.success) {
    return {
      name: 'Sitemap XML',
      passed: false,
      message: `Failed to fetch sitemap: ${result.error}`,
    };
  }

  const data = result.data!;

  // Check if it's valid XML
  if (!data.includes('<?xml') || !data.includes('<urlset')) {
    return {
      name: 'Sitemap XML',
      passed: false,
      message: 'Response is not valid XML sitemap format',
      details: data.substring(0, 200),
    };
  }

  // Count URLs
  const urlMatches = data.match(/<url>/g);
  const urlCount = urlMatches ? urlMatches.length : 0;

  if (urlCount === 0) {
    return {
      name: 'Sitemap XML',
      passed: false,
      message: 'Sitemap contains 0 URLs',
    };
  }

  return {
    name: 'Sitemap XML',
    passed: true,
    message: `Found ${urlCount} URLs in sitemap`,
    details: `First URL: ${data.match(/<loc>(.*?)<\/loc>/)?.[1] || 'N/A'}`,
  };
}

/**
 * Test 2: RSS Feed
 */
async function testRSS(): Promise<TestResult> {
  console.log('\n🔍 Testing RSS Feed...');
  const url = `${BASE_URL}/rss.xml`;
  
  const result = await safeFetch(url);
  
  if (!result.success) {
    return {
      name: 'RSS Feed',
      passed: false,
      message: `Failed to fetch RSS feed: ${result.error}`,
    };
  }

  const data = result.data!;

  // Check if it's valid RSS XML
  if (!data.includes('<?xml') || !data.includes('<rss') || !data.includes('<channel>')) {
    return {
      name: 'RSS Feed',
      passed: false,
      message: 'Response is not valid RSS 2.0 format',
      details: data.substring(0, 200),
    };
  }

  // Count items
  const itemMatches = data.match(/<item>/g);
  const itemCount = itemMatches ? itemMatches.length : 0;

  if (itemCount === 0) {
    return {
      name: 'RSS Feed',
      passed: false,
      message: 'RSS feed contains 0 items',
    };
  }

  // Check for required RSS elements
  const hasTitle = data.includes('<title>');
  const hasLink = data.includes('<link>');
  const hasDescription = data.includes('<description>');
  const hasPubDate = data.includes('<pubDate>');

  if (!hasTitle || !hasLink || !hasDescription) {
    return {
      name: 'RSS Feed',
      passed: false,
      message: 'RSS feed missing required elements (title, link, or description)',
    };
  }

  return {
    name: 'RSS Feed',
    passed: true,
    message: `Found ${itemCount} items in RSS feed`,
    details: `Has pubDate: ${hasPubDate ? 'Yes' : 'No'}`,
  };
}

/**
 * Test 3: Open Graph Meta Tag Generator
 */
async function testOGMeta(): Promise<TestResult> {
  console.log('\n🔍 Testing Open Graph Meta Tag Generator...');
  const url = `${BASE_URL}/api/meta/${TEST_SLUG}`;
  
  const result = await safeFetch(url);
  
  if (!result.success) {
    return {
      name: 'OG Meta Generator',
      passed: false,
      message: `Failed to fetch meta data: ${result.error}`,
      details: `Tested slug: "${TEST_SLUG}"`,
    };
  }

  const data = result.data!;

  // Try to parse as JSON
  let json;
  try {
    json = JSON.parse(data);
  } catch (error) {
    return {
      name: 'OG Meta Generator',
      passed: false,
      message: 'Response is not valid JSON',
      details: data.substring(0, 200),
    };
  }

  // Check for required fields
  const hasTitle = json.title && typeof json.title === 'string';
  const hasDescription = json.description && typeof json.description === 'string';
  const hasOGImage = json['og:image'] && typeof json['og:image'] === 'string';
  const hasKeywords = json.keywords !== undefined;

  if (!hasTitle || !hasDescription || !hasOGImage) {
    return {
      name: 'OG Meta Generator',
      passed: false,
      message: 'Missing required fields: title, description, or og:image',
      details: JSON.stringify(json, null, 2),
    };
  }

  return {
    name: 'OG Meta Generator',
    passed: true,
    message: 'All required OG meta fields present',
    details: `Title: "${json.title.substring(0, 50)}${json.title.length > 50 ? '...' : ''}"`,
  };
}

/**
 * Test 4: OG Image Generator
 */
async function testOGImage(): Promise<TestResult> {
  console.log('\n🔍 Testing Open Graph Image Generator...');
  const url = `${BASE_URL}/api/og-image?title=Test%20Title&category=Agriculture&author=San&excerpt=Testing`;
  
  const result = await safeFetch(url);
  
  if (!result.success) {
    return {
      name: 'OG Image Generator',
      passed: false,
      message: `Failed to fetch OG image: ${result.error}`,
    };
  }

  const data = result.data!;

  // Check if it's SVG
  if (!data.includes('<svg') || !data.includes('</svg>')) {
    return {
      name: 'OG Image Generator',
      passed: false,
      message: 'Response is not valid SVG',
      details: data.substring(0, 200),
    };
  }

  // Check if it contains the test title
  if (!data.includes('Test Title')) {
    return {
      name: 'OG Image Generator',
      passed: false,
      message: 'SVG does not contain the provided title',
    };
  }

  return {
    name: 'OG Image Generator',
    passed: true,
    message: 'Valid SVG image generated with correct content',
  };
}

/**
 * Test 5: Robots.txt
 */
async function testRobotsTxt(): Promise<TestResult> {
  console.log('\n🔍 Testing robots.txt...');
  const url = `${BASE_URL}/robots.txt`;
  
  const result = await safeFetch(url);
  
  if (!result.success) {
    return {
      name: 'robots.txt',
      passed: false,
      message: `Failed to fetch robots.txt: ${result.error}`,
    };
  }

  const data = result.data!;

  // Check for required directives
  const hasUserAgent = data.includes('User-agent:');
  const hasSitemap = data.includes('Sitemap:');

  if (!hasUserAgent) {
    return {
      name: 'robots.txt',
      passed: false,
      message: 'robots.txt missing User-agent directive',
    };
  }

  return {
    name: 'robots.txt',
    passed: true,
    message: 'Valid robots.txt found',
    details: `Has Sitemap reference: ${hasSitemap ? 'Yes' : 'No'}`,
  };
}

/**
 * Test 6: Structured Data
 */
async function testStructuredData(): Promise<TestResult> {
  console.log('\n🔍 Testing Structured Data (JSON-LD)...');
  const url = `${BASE_URL}/api/structured-data`;
  
  const result = await safeFetch(url);
  
  if (!result.success) {
    return {
      name: 'Structured Data',
      passed: false,
      message: `Failed to fetch structured data: ${result.error}`,
    };
  }

  const data = result.data!;

  // Try to parse as JSON
  let json;
  try {
    json = JSON.parse(data);
  } catch (error) {
    return {
      name: 'Structured Data',
      passed: false,
      message: 'Response is not valid JSON',
      details: data.substring(0, 200),
    };
  }

  // Check for JSON-LD context
  if (!json['@context'] || !json['@type']) {
    return {
      name: 'Structured Data',
      passed: false,
      message: 'Missing required JSON-LD fields (@context, @type)',
    };
  }

  return {
    name: 'Structured Data',
    passed: true,
    message: 'Valid JSON-LD structured data found',
    details: `Type: ${json['@type']}`,
  };
}

/**
 * Main execution
 */
async function runTests() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║         🌾 AgriTech Blog SEO Verification 🌾          ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log(`\n🔗 Testing backend at: ${BASE_URL}`);
  console.log(`📝 Test slug: "${TEST_SLUG}"\n`);

  // Run all tests
  results.push(await testSitemap());
  results.push(await testRSS());
  results.push(await testOGMeta());
  results.push(await testOGImage());
  results.push(await testRobotsTxt());
  results.push(await testStructuredData());

  // Print results
  console.log('\n\n╔════════════════════════════════════════════════════════╗');
  console.log('║                    TEST RESULTS                        ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  results.forEach((result, index) => {
    const status = result.passed ? '✅ PASS' : '❌ FAIL';
    const icon = result.passed ? '✓' : '✗';
    
    console.log(`${index + 1}. ${status} - ${result.name}`);
    console.log(`   ${icon} ${result.message}`);
    if (result.details) {
      console.log(`   ℹ️  ${result.details}`);
    }
    console.log('');
  });

  // Summary
  const passedCount = results.filter(r => r.passed).length;
  const totalCount = results.length;
  const allPassed = passedCount === totalCount;

  console.log('═══════════════════════════════════════════════════════');
  console.log(`📊 Summary: ${passedCount}/${totalCount} tests passed`);
  console.log('═══════════════════════════════════════════════════════\n');

  if (allPassed) {
    console.log('🎉 All SEO endpoints are working correctly!');
    console.log('✨ Your blog is ready for search engines and social media.\n');
    process.exit(0);
  } else {
    console.log('⚠️  Some tests failed. Please check the errors above.');
    console.log('💡 Tip: Make sure your backend is running on the correct port.\n');
    process.exit(1);
  }
}

// Handle errors gracefully
process.on('unhandledRejection', (error) => {
  console.error('\n❌ Unhandled error:', error);
  process.exit(1);
});

// Run the tests
runTests();
