#!/usr/bin/env node

import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, colors.green);
}

function logError(message) {
  log(`❌ ${message}`, colors.red);
}

function logWarning(message) {
  log(`⚠️  ${message}`, colors.yellow);
}

function logInfo(message) {
  log(`ℹ️  ${message}`, colors.blue);
}

function maskCredentials(uri) {
  if (!uri) return 'Not set';
  return uri.replace(/:\/\/([^:]+):([^@]+)@/, '://****:****@');
}

function analyzeCurrentUri() {
  log('\n🔍 Current MongoDB Configuration Analysis', colors.bright);
  log('===========================================', colors.bright);
  
  const currentUri = process.env.MONGODB_URI;
  const currentDb = process.env.MONGODB_DATABASE;
  
  if (!currentUri) {
    logError('MONGODB_URI is not set in environment variables');
    return null;
  }
  
  logInfo(`Current URI: ${maskCredentials(currentUri)}`);
  logInfo(`Current Database: ${currentDb || 'Not set'}`);
  
  // Parse URI to extract components
  try {
    const url = new URL(currentUri.replace('mongodb+srv://', 'https://').replace('mongodb://', 'http://'));
    const username = url.username;
    const hostname = url.hostname;
    const pathname = url.pathname;
    const search = url.search;
    
    log('\n📋 URI Components:', colors.cyan);
    log(`  Username: ${username}`, colors.cyan);
    log(`  Host: ${hostname}`, colors.cyan);
    log(`  Database Path: ${pathname || 'Not specified'}`, colors.cyan);
    log(`  Options: ${search}`, colors.cyan);
    
    return { username, hostname, pathname, search, fullUri: currentUri };
    
  } catch (error) {
    logError('Could not parse MongoDB URI');
    return null;
  }
}

function provideSolution(analysis) {
  log('\n🛠️  Solution: Fix MongoDB Credentials', colors.bright);
  log('====================================', colors.bright);
  
  if (analysis && analysis.username === 'sjisyours') {
    logWarning('Problem detected: Using incorrect username "sjisyours"');
    logInfo('You need to update to the working credentials: "blog-admin-new"');
  }
  
  log('\n📝 Steps to Fix in Replit:', colors.yellow);
  log('1. 🔒 Click on "Secrets" tab in Replit (lock icon on left sidebar)');
  log('2. 🔍 Find the key "MONGODB_URI"');
  log('3. ✏️  Update the value to your working MongoDB connection string');
  log('4. 🔄 Restart your Replit application');
  
  log('\n🔗 Correct MongoDB URI Format:', colors.green);
  log('mongodb+srv://blog-admin-new:YOUR_PASSWORD@cluster0.br3z5.mongodb.net/blog_database?retryWrites=true&w=majority&appName=Cluster0');
  
  log('\n📁 Also add this secret (optional):', colors.green);
  log('MONGODB_DATABASE=blog_database');
  
  log('\n⚠️  Security Notes:', colors.yellow);
  log('• Never commit actual credentials to code repositories');
  log('• Use Replit Secrets for sensitive environment variables');
  log('• Rotate passwords regularly for security');
  
  log('\n🧪 After Making Changes:', colors.blue);
  log('1. Restart your Replit application');
  log('2. Run: npm run db:test');
  log('3. Verify connection is successful');
}

function checkReplicationIssues() {
  log('\n🔄 Common Replit Environment Issues:', colors.bright);
  log('===================================', colors.bright);
  
  logInfo('Environment variables in Replit come from:');
  log('  1. Replit Secrets (recommended for credentials)', colors.cyan);
  log('  2. .env files (if they exist)', colors.cyan);
  log('  3. Shell environment variables', colors.cyan);
  
  logWarning('If you see different credentials than expected:');
  log('  • Check Replit Secrets tab for MONGODB_URI');
  log('  • Clear any old .env files that might conflict');
  log('  • Restart the Replit application completely');
  
  logInfo('Replit Secrets take precedence over .env files');
}

function showTroubleshooting() {
  log('\n🆘 Troubleshooting Guide:', colors.bright);
  log('========================', colors.bright);
  
  log('\n1. "Authentication failed" error:', colors.yellow);
  log('   • Wrong username or password in MONGODB_URI');
  log('   • Database user does not exist in MongoDB Atlas');
  log('   • User permissions are incorrect');
  
  log('\n2. "Connection timeout" error:', colors.yellow);
  log('   • IP address not whitelisted in MongoDB Atlas');
  log('   • Network connectivity issues');
  log('   • Firewall blocking connections');
  
  log('\n3. "Different credentials showing up":', colors.yellow);
  log('   • Old environment variables cached in Replit');
  log('   • Multiple sources of environment variables');
  log('   • Need to restart Replit application');
  
  log('\n🔧 Quick Fixes:', colors.green);
  log('• Update Replit Secrets with correct MONGODB_URI');
  log('• Restart Replit application completely');
  log('• Test connection with: npm run db:test');
  log('• Check MongoDB Atlas user permissions');
}

async function main() {
  log('🔐 MongoDB Credentials Fixer', colors.bright);
  log('============================', colors.bright);
  
  // Analyze current configuration
  const analysis = analyzeCurrentUri();
  
  // Provide solution
  provideSolution(analysis);
  
  // Show Replit-specific guidance
  checkReplicationIssues();
  
  // Troubleshooting guide
  showTroubleshooting();
  
  log('\n💡 Next Steps:', colors.green + colors.bright);
  log('1. Update MONGODB_URI in Replit Secrets');
  log('2. Restart your application');
  log('3. Run: npm run db:test');
  log('4. Verify successful connection');
  
  log('\n📞 Need More Help?', colors.cyan);
  log('• Check MONGODB_SETUP_GUIDE.md for detailed instructions');
  log('• Run npm run db:test after making changes');
  log('• Verify your MongoDB Atlas user exists and has permissions');
}

main().catch(error => {
  logError(`Error: ${error.message}`);
  process.exit(1);
}); 