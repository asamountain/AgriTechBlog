#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Building project for Vercel deployment...');

// Build the client
console.log('Building client...');
execSync('npm run build', { stdio: 'inherit', cwd: process.cwd() });

// Copy necessary files for Vercel
console.log('Preparing deployment files...');

// Ensure api directory exists
if (!fs.existsSync('api')) {
  fs.mkdirSync('api');
}

// Create a simple package.json for Vercel
const vercelPackage = {
  "name": "agrotech-blog-vercel",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "build": "echo 'Build completed'"
  },
  "dependencies": {
    "express": "^4.18.2",
    "mongodb": "^6.3.0",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "passport": "^0.7.0",
    "passport-google-oauth20": "^2.0.0",
    "express-session": "^1.18.0",
    "connect-pg-simple": "^9.0.1",
    "ws": "^8.16.0"
  }
};

fs.writeFileSync('package.json.vercel-backup', JSON.stringify(vercelPackage, null, 2));

console.log('✅ Build completed! Ready for Vercel deployment.');
console.log('📋 Next steps:');
console.log('1. Push your code to GitHub');
console.log('2. Connect your repo to Vercel');
console.log('3. Add environment variables in Vercel dashboard');
console.log('4. Deploy!');