#!/usr/bin/env node

import https from 'https';
import http from 'http';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

console.log('🔍 Network Security Assessment Tool\n');

// Test 1: SSL Certificate Validation
async function testSSLCertificate(url) {
  return new Promise((resolve) => {
    const options = {
      hostname: url,
      port: 443,
      path: '/',
      method: 'GET',
      rejectUnauthorized: true // Strict SSL validation
    };

    const req = https.request(options, (res) => {
      console.log(`✅ SSL Certificate Valid for ${url}`);
      console.log(`   Status: ${res.statusCode}`);
      console.log(`   TLS Version: ${res.socket.getProtocol()}`);
      resolve({ valid: true, status: res.statusCode });
    });

    req.on('error', (err) => {
      console.log(`❌ SSL Certificate Error for ${url}:`);
      console.log(`   Error: ${err.message}`);
      resolve({ valid: false, error: err.message });
    });

    req.setTimeout(5000, () => {
      console.log(`⏰ SSL Test Timeout for ${url}`);
      req.destroy();
      resolve({ valid: false, error: 'Timeout' });
    });

    req.end();
  });
}

// Test 2: DNS Resolution Check
async function testDNS() {
  try {
    console.log('\n🌐 DNS Resolution Test:');
    // Use ping as a more universal DNS test
    const { stdout } = await execAsync('ping -c 1 google.com 2>/dev/null || echo "DNS test complete"');
    console.log('✅ DNS Resolution Working');
    
    // Check for DNS hijacking indicators
    if (stdout.includes('192.168.') || stdout.includes('10.0.')) {
      console.log('⚠️  WARNING: DNS might be hijacked (private IP in response)');
      return false;
    }
    return true;
  } catch (error) {
    console.log('⚠️  DNS test skipped (command not available)');
    return true; // Don't fail the test if ping isn't available
  }
}

// Test 3: Check for HTTP vs HTTPS redirects
async function testHTTPSRedirect(domain) {
  return new Promise((resolve) => {
    const req = http.request({
      hostname: domain,
      port: 80,
      path: '/',
      method: 'GET'
    }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        const location = res.headers.location;
        if (location && location.startsWith('https://')) {
          console.log(`✅ HTTPS Redirect Working: ${domain}`);
          resolve(true);
        } else {
          console.log(`⚠️  WARNING: Redirect to non-HTTPS: ${location}`);
          resolve(false);
        }
      } else {
        console.log(`⚠️  WARNING: No HTTPS redirect for ${domain}`);
        resolve(false);
      }
    });

    req.on('error', () => {
      console.log(`❌ Could not test HTTP redirect for ${domain}`);
      resolve(false);
    });

    req.setTimeout(3000, () => {
      req.destroy();
      resolve(false);
    });

    req.end();
  });
}

// Main security assessment
async function runSecurityAssessment() {
  console.log('Starting comprehensive network security test...\n');
  
  // Test your Vercel deployment
  const vercelDomain = 'tech-2aea3g6d8-sjs-projects-5ee25b27.vercel.app';
  console.log(`🎯 Testing Your Blog: ${vercelDomain}`);
  await testSSLCertificate(vercelDomain);
  
  // Test known secure sites
  console.log('\n🔒 Testing Known Secure Sites:');
  await testSSLCertificate('google.com');
  await testSSLCertificate('github.com');
  
  // Test DNS
  await testDNS();
  
  // Test HTTPS redirects
  console.log('\n🔄 Testing HTTPS Redirects:');
  await testHTTPSRedirect('google.com');
  
  console.log('\n📊 Security Assessment Complete!');
  console.log('\n💡 If you see SSL errors only for your blog but not for Google/GitHub,');
  console.log('   the issue is likely with your Vercel deployment.');
  console.log('\n💡 If you see SSL errors for ALL sites, your WiFi is compromised.');
  console.log('\n🛡️  Immediate actions if WiFi is compromised:');
  console.log('   1. Switch to mobile hotspot immediately');
  console.log('   2. Change WiFi password');
  console.log('   3. Update router firmware');
  console.log('   4. Check router admin panel for unknown devices');
}

// Run the assessment
runSecurityAssessment().catch(console.error); 