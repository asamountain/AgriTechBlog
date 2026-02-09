/**
 * Quick test script for the Multi-AI polishing system
 *
 * Usage: POLISHER_API_KEY=your-key node test-polisher.js
 * 
 * Required Environment Variables:
 *   POLISHER_API_KEY - Your Groq API key (https://console.groq.com/keys)
 *   POLISHER_MODEL   - Model to use (default: llama-3.3-70b-versatile)
 */

import { ContentPolisher } from './server/services/grok-polisher.ts';

async function testPolisher() {
  console.log('🧪 Testing Multi-AI Polisher Setup\n');

  // SECURITY: Require API key from environment - never hardcode secrets
  if (!process.env.POLISHER_API_KEY) {
    console.error('❌ ERROR: POLISHER_API_KEY environment variable is required');
    console.error('');
    console.error('Please set your Groq API key:');
    console.error('  export POLISHER_API_KEY=your-groq-api-key');
    console.error('');
    console.error('Or add to .env file:');
    console.error('  POLISHER_API_KEY=your-groq-api-key');
    console.error('');
    console.error('Get your API key from: https://console.groq.com/keys');
    process.exit(1);
  }

  // Get config from environment
  const config = {
    provider: 'groq-llama3',
    apiKey: process.env.POLISHER_API_KEY,
    model: process.env.POLISHER_MODEL || 'llama-3.3-70b-versatile'
  };

  console.log('Configuration:');
  console.log('  Provider:', config.provider);
  console.log('  Model:', config.model);
  console.log('  API Key:', config.apiKey.substring(0, 10) + '...\n');

  const polisher = new ContentPolisher(config);

  // Test 1: Connection
  console.log('Test 1: Testing connection to Groq API...');
  try {
    const connected = await polisher.testConnection();
    console.log(connected ? '  ✅ Connected successfully!' : '  ❌ Connection failed');
  } catch (error) {
    console.log('  ❌ Error:', error.message);
  }

  // Test 2: Polish sample content
  console.log('\nTest 2: Polishing sample blog content...');

  const sampleContent = `
# Smart Irrigation with IoT Sensors

We installed moisture sensors in the greenhouse last week. The sensors send data every 15 minutes to a dashboard.

When moisture drops below 30%, the system automatically triggers irrigation. This saved us 40% water usage!

The setup was relativly easy and dont require much technical knowlege.
`;

  try {
    console.log('  Original content has grammar errors...');
    const result = await polisher.polishContent(
      sampleContent,
      'Smart Irrigation with IoT Sensors',
      'Learn how IoT sensors optimized our greenhouse irrigation'
    );

    console.log('\n  ✅ Polishing complete!');
    console.log('\n  Improvements made:');
    result.improvements.forEach((imp, i) => {
      console.log(`    ${i + 1}. ${imp}`);
    });

    if (result.seoSuggestions?.length > 0) {
      console.log('\n  SEO Suggestions:');
      result.seoSuggestions.forEach((sug, i) => {
        console.log(`    ${i + 1}. ${sug}`);
      });
    }

    console.log('\n  Polished content preview:');
    console.log('  ' + '-'.repeat(60));
    console.log(result.polishedContent.substring(0, 300) + '...');
    console.log('  ' + '-'.repeat(60));

  } catch (error) {
    console.log('  ❌ Polishing failed:', error.message);
  }

  console.log('\n✨ Test complete!\n');
}

// Run the test
testPolisher().catch(console.error);
