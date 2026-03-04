#!/usr/bin/env node

// Server status checker - run with: node check-server.js

async function checkServerStatus() {
  console.log('🔍 Checking development server status...\n');
  
  // Test ports 5000-5010
  for (let port = 5000; port <= 5010; port++) {
    try {
      const response = await fetch(`http://localhost:${port}/api/blog-posts`);
      if (response.ok) {
        console.log(`✅ Server found on port ${port}`);
        console.log(`🌐 Blog URL: http://localhost:${port}`);
        console.log(`📊 API URL: http://localhost:${port}/api/blog-posts`);
        console.log(`⚙️  Admin URL: http://localhost:${port}/admin`);
        return;
      }
    } catch (error) {
      // Port not available, continue checking
    }
  }
  
  console.log('❌ No development server found on ports 5000-5010');
  console.log('💡 To start server: npm run dev');
}

checkServerStatus().catch(console.error); 