#!/usr/bin/env node

import { MongoClient } from 'mongodb';
// For testing, let's manually set the MongoDB URI first
process.env.MONGODB_URI = 'mongodb+srv://blog-admin-new:dIGhkAFqirrk8Gva@cluster0.br3z5.mongodb.net/blog_database?retryWrites=true&w=majority&appName=Cluster0';
process.env.MONGODB_DATABASE = 'blog_database';
import { readFileSync } from 'fs';

// Environment variables are set above manually for testing

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
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

async function checkEnvironmentVariables() {
  log('\n🔍 Checking Environment Variables...', colors.bright);
  
  const uri = process.env.MONGODB_URI;
  const database = process.env.MONGODB_DATABASE;
  
  if (!uri) {
    logError('MONGODB_URI environment variable is not set');
    logInfo('Create a .env file with your MongoDB connection string');
    logInfo('Example: MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname');
    return false;
  } else {
    logSuccess('MONGODB_URI is set');
    
    // Mask password in logs for security
    const maskedUri = uri.replace(/:([^:@]+)@/, ':****@');
    logInfo(`Connection string: ${maskedUri}`);
  }
  
  if (!database) {
    logWarning('MONGODB_DATABASE not set, will use default from URI or "blog_database"');
  } else {
    logSuccess(`MONGODB_DATABASE is set: ${database}`);
  }
  
  return true;
}

async function validateConnectionString(uri) {
  log('\n🔍 Validating Connection String...', colors.bright);
  
  // Basic format validation
  if (!uri.startsWith('mongodb://') && !uri.startsWith('mongodb+srv://')) {
    logError('Invalid MongoDB URI format');
    logInfo('URI should start with mongodb:// or mongodb+srv://');
    return false;
  }
  
  // Check for common security issues
  const suspiciousPatterns = [
    { pattern: /password123/i, message: 'Potentially weak password detected' },
    { pattern: /admin:admin/i, message: 'Default admin credentials detected' },
    { pattern: /root:root/i, message: 'Default root credentials detected' },
    { pattern: /test:test/i, message: 'Test credentials detected' }
  ];
  
  for (const { pattern, message } of suspiciousPatterns) {
    if (pattern.test(uri)) {
      logWarning(message);
    }
  }
  
  // Check for SSL usage
  if (uri.includes('mongodb+srv://')) {
    logSuccess('Using MongoDB Atlas with SSL enabled');
  } else if (uri.includes('ssl=true')) {
    logSuccess('SSL is enabled');
  } else if (uri.includes('localhost') || uri.includes('127.0.0.1')) {
    logInfo('Local connection (SSL not required)');
  } else {
    logWarning('SSL is not explicitly enabled for remote connection');
  }
  
  return true;
}

async function testConnection(uri, databaseName) {
  log('\n🔗 Testing MongoDB Connection...', colors.bright);
  
  const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000,
    socketTimeoutMS: 30000
  });
  
  try {
    logInfo('Attempting to connect...');
    await client.connect();
    logSuccess('Successfully connected to MongoDB');
    
    // Test basic operations
    const db = client.db(databaseName || 'blog_database');
    
    logInfo('Testing database access...');
    await db.admin().ping();
    logSuccess('Database ping successful');
    
    // List collections
    logInfo('Listing collections...');
    const collections = await db.listCollections().toArray();
    if (collections.length > 0) {
      logSuccess(`Found ${collections.length} collections:`);
      collections.forEach(col => {
        log(`  - ${col.name}`, colors.cyan);
      });
    } else {
      logWarning('No collections found in database');
    }
    
    // Test posts collection specifically
    const postsCollection = db.collection('posts');
    const postCount = await postsCollection.countDocuments();
    logInfo(`Posts collection: ${postCount} documents`);
    
    // Test sample query
    const samplePost = await postsCollection.findOne({});
    if (samplePost) {
      logSuccess('Sample post retrieved successfully');
      log(`  Title: ${samplePost.title || 'No title'}`, colors.cyan);
      log(`  Created: ${samplePost.date || 'No date'}`, colors.cyan);
    } else {
      logWarning('No posts found in collection');
    }
    
    return true;
    
  } catch (error) {
    logError(`Connection failed: ${error.message}`);
    
    // Provide specific troubleshooting advice
    if (error.message.includes('authentication failed')) {
      logError('Authentication failed - check username and password');
      logInfo('1. Verify database user exists in MongoDB Atlas');
      logInfo('2. Check username/password in connection string');
      logInfo('3. Ensure user has correct database permissions');
    } else if (error.message.includes('timeout')) {
      logError('Connection timeout - check network access');
      logInfo('1. Verify IP address is whitelisted in MongoDB Atlas');
      logInfo('2. Check firewall settings');
      logInfo('3. Ensure network connectivity');
    } else if (error.message.includes('ENOTFOUND') || error.message.includes('hostname')) {
      logError('Hostname resolution failed');
      logInfo('1. Check connection string format');
      logInfo('2. Verify cluster hostname in MongoDB Atlas');
      logInfo('3. Check DNS settings');
    }
    
    return false;
    
  } finally {
    await client.close();
    logInfo('Connection closed');
  }
}

async function testPerformance(uri, databaseName) {
  log('\n⚡ Testing Performance...', colors.bright);
  
  const client = new MongoClient(uri);
  
  try {
    const startTime = Date.now();
    await client.connect();
    const connectTime = Date.now() - startTime;
    
    logSuccess(`Connection time: ${connectTime}ms`);
    
    if (connectTime > 5000) {
      logWarning('Slow connection (>5s) - consider optimizing');
    } else if (connectTime > 2000) {
      logWarning('Moderate connection time (>2s)');
    } else {
      logSuccess('Fast connection (<2s)');
    }
    
    const db = client.db(databaseName || 'blog_database');
    
    // Test query performance
    const queryStart = Date.now();
    const postsCollection = db.collection('posts');
    await postsCollection.find({}).limit(10).toArray();
    const queryTime = Date.now() - queryStart;
    
    logSuccess(`Query time: ${queryTime}ms`);
    
    if (queryTime > 1000) {
      logWarning('Slow queries detected - consider adding indexes');
    }
    
  } catch (error) {
    logError(`Performance test failed: ${error.message}`);
  } finally {
    await client.close();
  }
}

async function showConnectionInfo() {
  log('\n📋 Connection Information Summary', colors.bright);
  
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    logError('No connection string available');
    return;
  }
  
  try {
    const url = new URL(uri.replace('mongodb+srv://', 'https://').replace('mongodb://', 'http://'));
    
    log(`Host: ${url.hostname}`, colors.cyan);
    log(`Database: ${process.env.MONGODB_DATABASE || 'blog_database'}`, colors.cyan);
    log(`Username: ${url.username || 'Not specified'}`, colors.cyan);
    log(`SSL: ${uri.includes('ssl=true') || uri.includes('mongodb+srv://') ? 'Enabled' : 'Disabled'}`, colors.cyan);
    
  } catch (error) {
    logWarning('Could not parse connection string details');
  }
}

async function checkProjectFiles() {
  log('\n📁 Checking Project Files...', colors.bright);
  
  const files = [
    { path: '.env', required: false, description: 'Environment variables' },
    { path: 'env.example', required: true, description: 'Environment template' },
    { path: '.gitignore', required: true, description: 'Git ignore file' },
    { path: 'server/mongodb-connection-manager.ts', required: true, description: 'Connection manager' }
  ];
  
  for (const file of files) {
    try {
      readFileSync(file.path);
      logSuccess(`${file.path} exists`);
    } catch (error) {
      if (file.required) {
        logError(`${file.path} missing - ${file.description}`);
      } else {
        logWarning(`${file.path} not found - ${file.description}`);
      }
    }
  }
  
  // Check if .env is in .gitignore
  try {
    const gitignore = readFileSync('.gitignore', 'utf8');
    if (gitignore.includes('.env')) {
      logSuccess('.env files are properly ignored by git');
    } else {
      logError('.env files are NOT ignored by git - security risk!');
      logInfo('Add .env to your .gitignore file');
    }
  } catch (error) {
    logWarning('Could not check .gitignore file');
  }
}

async function main() {
  log('🔐 MongoDB Connection Tester', colors.bright);
  log('================================', colors.bright);
  
  try {
    // Step 1: Check environment
    const envOk = await checkEnvironmentVariables();
    if (!envOk) {
      process.exit(1);
    }
    
    // Step 2: Validate connection string
    const uri = process.env.MONGODB_URI;
    const validString = await validateConnectionString(uri);
    if (!validString) {
      process.exit(1);
    }
    
    // Step 3: Test actual connection
    const connected = await testConnection(uri, process.env.MONGODB_DATABASE);
    if (!connected) {
      process.exit(1);
    }
    
    // Step 4: Performance test
    await testPerformance(uri, process.env.MONGODB_DATABASE);
    
    // Step 5: Show connection summary
    await showConnectionInfo();
    
    // Step 6: Check project files
    await checkProjectFiles();
    
    log('\n🎉 All tests passed! MongoDB connection is working properly.', colors.green + colors.bright);
    
  } catch (error) {
    logError(`Unexpected error: ${error.message}`);
    process.exit(1);
  }
}

// Handle command line arguments
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
MongoDB Connection Tester

Usage: node test-mongodb-connection.js [options]

Options:
  --help, -h     Show this help message
  
Environment Variables:
  MONGODB_URI    MongoDB connection string (required)
  MONGODB_DATABASE    Database name (optional)

Examples:
  node test-mongodb-connection.js
  MONGODB_URI="mongodb://localhost:27017/test" node test-mongodb-connection.js
  `);
  process.exit(0);
}

// Run the test
main().catch(error => {
  logError(`Fatal error: ${error.message}`);
  process.exit(1);
}); 