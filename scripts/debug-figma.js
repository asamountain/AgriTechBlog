#!/usr/bin/env node

import 'dotenv/config';
import { Api } from 'figma-api';

async function debugFigmaConnection() {
  console.log('🔍 Debugging Figma Connection...\n');
  
  // Check environment variables
  const token = process.env.FIGMA_ACCESS_TOKEN;
  const fileKey = process.env.FIGMA_FILE_KEY;
  
  console.log('📋 Environment Check:');
  console.log(`Token exists: ${token ? '✅' : '❌'}`);
  console.log(`Token format: ${token ? (token.startsWith('figd_') ? '✅' : '❌ (should start with figd_)') : 'N/A'}`);
  console.log(`File key exists: ${fileKey ? '✅' : '❌'}`);
  console.log(`File key: ${fileKey || 'Not found'}`);
  console.log();
  
  if (!token || !fileKey) {
    console.log('❌ Missing credentials. Check your .env file.');
    return;
  }
  
  // Test Figma API connection
  const api = new Api({ personalAccessToken: token });
  
  console.log('🌐 Testing Figma API Connection...');
  
  // Skip user validation and go directly to file test
  
  try {
    // Test 2: Check if we can access the specific file
    console.log('   Testing file access...');
    const file = await api.getFile(fileKey);
    console.log(`   ✅ File accessible! Name: "${file.name}"`);
    console.log(`   📅 Last modified: ${file.lastModified}`);
  } catch (error) {
    console.log(`   ❌ File access failed: ${error.message}`);
    
    if (error.message.includes('404')) {
      console.log('   💡 Possible issues:');
      console.log('      - File key is incorrect');
      console.log('      - File is private and you don\'t have access');
      console.log('      - File was deleted or moved');
      console.log(`   🔗 Try accessing: https://www.figma.com/file/${fileKey}/`);
    }
    return;
  }
  
  try {
    // Test 3: Check if we can access file styles
    console.log('   Testing file styles access...');
    const styles = await api.getFileStyles(fileKey);
    console.log(`   ✅ Styles accessible! Found ${Object.keys(styles.meta?.styles || {}).length} styles`);
  } catch (error) {
    console.log(`   ❌ Styles access failed: ${error.message}`);
    console.log('   💡 This might be normal if the file has no published styles');
  }
  
  console.log('\n🎉 Figma connection debugged successfully!');
  console.log('   Your token and file access are working.');
  console.log('   You can now run: bun run figma:sync');
}

debugFigmaConnection().catch(console.error); 