#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Environment Variable Detective');
console.log('================================\n');

// Function to safely mask sensitive data
function maskSensitive(str) {
  if (!str) return 'Not set';
  return str.replace(/:\/\/([^:]+):([^@]+)@/, '://[USER]:[PASS]@');
}

// 1. Check current working directory
console.log('📁 Current Directory Information:');
console.log(`Working Directory: ${process.cwd()}`);
console.log(`User Home: ${process.env.HOME || 'Not set'}`);
console.log(`Node.js Version: ${process.version}`);
console.log('');

// 2. Look for environment files
console.log('📄 Looking for Environment Files:');
const envFiles = ['.env', '.env.local', '.env.development', '.env.production', 'env.example'];
for (const file of envFiles) {
  try {
    const stats = fs.statSync(file);
    console.log(`✅ ${file} exists (${stats.size} bytes, modified: ${stats.mtime.toISOString()})`);
  } catch (error) {
    console.log(`❌ ${file} not found`);
  }
}
console.log('');

// 3. Check MongoDB-related environment variables
console.log('🗄️  MongoDB Environment Variables:');
const mongoVars = Object.keys(process.env).filter(key => 
  key.toLowerCase().includes('mongo') || 
  key.toLowerCase().includes('database') ||
  key.toLowerCase().includes('db_')
);

if (mongoVars.length > 0) {
  mongoVars.forEach(key => {
    const value = process.env[key];
    console.log(`${key}: ${maskSensitive(value)}`);
  });
} else {
  console.log('No MongoDB-related environment variables found');
}
console.log('');

// 4. Check Replit-specific environment variables
console.log('🤖 Replit Environment Variables:');
const replitVars = Object.keys(process.env).filter(key => 
  key.toLowerCase().includes('replit') || 
  key.toLowerCase().includes('repl')
);

if (replitVars.length > 0) {
  replitVars.forEach(key => {
    console.log(`${key}: ${process.env[key]}`);
  });
} else {
  console.log('No Replit-specific variables found');
}
console.log('');

// 5. Show how dotenv loads variables
console.log('⚙️  Testing dotenv loading:');
try {
  // Test without dotenv first
  console.log(`Before dotenv: MONGODB_URI = ${maskSensitive(process.env.MONGODB_URI)}`);
  
  // Now load dotenv
  const dotenv = require('dotenv');
  const result = dotenv.config();
  
  if (result.error) {
    console.log(`❌ Dotenv error: ${result.error.message}`);
  } else {
    console.log('✅ Dotenv loaded successfully');
    console.log(`After dotenv: MONGODB_URI = ${maskSensitive(process.env.MONGODB_URI)}`);
    
    if (result.parsed) {
      console.log('Variables loaded from .env:');
      Object.keys(result.parsed).forEach(key => {
        if (key.toLowerCase().includes('mongo')) {
          console.log(`  ${key}: ${maskSensitive(result.parsed[key])}`);
        }
      });
    }
  }
} catch (error) {
  console.log(`❌ Error testing dotenv: ${error.message}`);
}
console.log('');

// 6. Check file system permissions
console.log('🔐 File System Information:');
try {
  const currentDir = fs.readdirSync('.');
  const envFilesFound = currentDir.filter(file => file.includes('.env'));
  console.log(`Files containing '.env': ${envFilesFound.join(', ') || 'None'}`);
  
  // Check if .env is readable
  if (envFilesFound.includes('.env')) {
    try {
      const envContent = fs.readFileSync('.env', 'utf8');
      console.log(`✅ .env file is readable (${envContent.length} characters)`);
      
      // Look for MONGODB_URI specifically
      const lines = envContent.split('\n');
      const mongoLines = lines.filter(line => line.includes('MONGODB'));
      if (mongoLines.length > 0) {
        console.log('MongoDB lines in .env:');
        mongoLines.forEach(line => {
          console.log(`  ${maskSensitive(line)}`);
        });
      }
    } catch (readError) {
      console.log(`❌ Cannot read .env: ${readError.message}`);
    }
  }
} catch (error) {
  console.log(`❌ Error reading directory: ${error.message}`);
}
console.log('');

// 7. Show environment variable resolution order
console.log('🔄 Environment Variable Resolution:');
console.log('In Node.js/Replit, environment variables come from (in order of precedence):');
console.log('1. Replit Secrets (highest priority)');
console.log('2. System environment variables');
console.log('3. .env files (lowest priority)');
console.log('');

// 8. Provide solution
console.log('💡 How to Fix This:');
console.log('');
console.log('The MONGODB_URI you see comes from one of these sources:');
console.log('');
console.log('🔒 If using Replit Secrets (recommended):');
console.log('  1. Open your Replit project');
console.log('  2. Click the "Secrets" tab (🔒 icon) on the left sidebar');
console.log('  3. Find "MONGODB_URI" key');
console.log('  4. Update the value to your correct connection string');
console.log('  5. Restart your Replit application');
console.log('');
console.log('📄 If using .env file:');
console.log('  1. Edit the .env file in your project root');
console.log('  2. Update MONGODB_URI line');
console.log('  3. Save the file');
console.log('  4. Restart your application');
console.log('');
console.log('🎯 Your target connection string should be:');
console.log('mongodb+srv://blog-admin-new:YOUR_PASSWORD@cluster0.br3z5.mongodb.net/blog_database?retryWrites=true&w=majority&appName=Cluster0'); 