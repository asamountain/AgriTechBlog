#!/usr/bin/env node

// Test script for AgriTech Blog deployment
import https from 'https';
import { URL } from 'url';

console.log('🧪 Testing AgriTech Blog Deployment...\n');

// Possible deployment URLs based on your setup
const possibleUrls = [
  'https://agri-tech-blog.vercel.app',
  'https://agri-tech-blog-git-main.vercel.app',
  'https://agri-tech-blog-asamountain.vercel.app',
  'https://agritech-blog.vercel.app'
];

// Test endpoints
const tests = [
  {
    name: 'Homepage',
    path: '/',
    expected: 200
  },
  {
    name: 'Blog Posts API',
    path: '/api/blog-posts',
    expected: 200
  }
];

// Test function
function testEndpoint(baseUrl, test) {
  return new Promise((resolve) => {
    const url = new URL(test.path, baseUrl);
    
    console.log(`🔍 Testing ${test.name}: ${url.href}`);
    
    const req = https.get(url.href, (res) => {
      const success = res.statusCode === test.expected;
      const status = success ? '✅' : '❌';
      console.log(`   ${status} Status: ${res.statusCode} ${res.statusMessage}`);
      
      if (res.headers['content-type']) {
        console.log(`   📄 Content-Type: ${res.headers['content-type']}`);
      }
      
      resolve({ ...test, status: res.statusCode, success, url: url.href });
    });
    
    req.on('error', (err) => {
      console.log(`   ❌ Error: ${err.message}`);
      resolve({ ...test, status: 'ERROR', success: false, error: err.message });
    });
    
    req.setTimeout(5000, () => {
      console.log(`   ⏰ Timeout`);
      req.destroy();
      resolve({ ...test, status: 'TIMEOUT', success: false });
    });
  });
}

// Test a URL
async function testUrl(baseUrl) {
  console.log(`\n🌐 Testing: ${baseUrl}`);
  console.log('─'.repeat(50));
  
  let workingUrl = null;
  let allPassed = true;
  
  for (const test of tests) {
    const result = await testEndpoint(baseUrl, test);
    if (result.success) {
      workingUrl = baseUrl;
    } else {
      allPassed = false;
    }
  }
  
  return { url: baseUrl, working: workingUrl !== null, allPassed };
}

// Main function
async function findWorkingDeployment() {
  const results = [];
  
  // Test if custom URL provided
  if (process.argv[2]) {
    const customUrl = process.argv[2];
    console.log(`🎯 Testing custom URL: ${customUrl}`);
    const result = await testUrl(customUrl);
    results.push(result);
  } else {
    // Test all possible URLs
    console.log('🔍 Searching for your deployment...');
    for (const url of possibleUrls) {
      const result = await testUrl(url);
      results.push(result);
    }
  }
  
  // Summary
  console.log('\n📊 Deployment Test Summary:');
  console.log('='.repeat(60));
  
  const workingUrls = results.filter(r => r.working);
  
  if (workingUrls.length > 0) {
    console.log('✅ Found working deployments:');
    workingUrls.forEach(r => {
      console.log(`   🌐 ${r.url} ${r.allPassed ? '(Full)' : '(Partial)'}`);
    });
    
    const bestUrl = workingUrls.find(r => r.allPassed) || workingUrls[0];
    console.log(`\n🎯 Your live blog: ${bestUrl.url}`);
  } else {
    console.log('❌ No working deployments found');
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check Vercel dashboard for deployment status');
    console.log('2. Verify environment variables are set');
    console.log('3. Check function logs for errors');
  }
}

findWorkingDeployment().catch(console.error); 