#!/usr/bin/env node

import 'dotenv/config';
import { Api } from 'figma-api';

async function testFigmaAPI() {
  const api = new Api({ personalAccessToken: process.env.FIGMA_ACCESS_TOKEN });
  const fileKey = process.env.FIGMA_FILE_KEY;

  console.log('🔍 Testing Figma API calls...');
  console.log('File Key:', fileKey);

  try {
    console.log('\n📁 Testing getFile...');
    const file = await api.getFile(fileKey);
    console.log('✅ getFile successful!');
    console.log('File name:', file.name);
    
    try {
      console.log('\n🎨 Testing getFileStyles...');
      const styles = await api.getFileStyles(fileKey);
      console.log('✅ getFileStyles successful!');
      console.log('Styles count:', styles.meta?.styles ? Object.keys(styles.meta.styles).length : 0);
    } catch (stylesError) {
      console.log('❌ getFileStyles failed:', stylesError.message);
    }
    
  } catch (fileError) {
    console.log('❌ getFile failed:', fileError.message);
  }
}

testFigmaAPI().catch(console.error); 