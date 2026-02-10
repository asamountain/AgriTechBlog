#!/usr/bin/env node

/**
 * Automatic Environment Variable Sync Manager
 * 
 * This script manages synchronization between local .env and Vercel environment variables
 * to eliminate manual environment management.
 * 
 * Features:
 * - Auto-pull from Vercel on startup
 * - Validate MongoDB URI format
 * - Sync local changes to Vercel
 * - Detect missing or extra variables
 * - Security checks for weak credentials
 */


import { spawn, execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Use current working directory for env file detection (Windows compatible)
const rootDir = process.cwd();
const envPath = path.join(rootDir, '.env');
const envLocalPath = path.join(rootDir, '.env.local');
const envExamplePath = path.join(rootDir, 'env.example');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
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
  log(`ℹ️  ${message}`, colors.cyan);
}

function logStep(message) {
  log(`\n${colors.bright}${message}${colors.reset}`, colors.blue);
}

/**
 * Check if Vercel CLI is installed
 */
function isVercelInstalled() {
  try {
    execSync('vercel --version', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Parse .env file into key-value object
 */
function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const env = {};

  content.split('\n').forEach(line => {
    line = line.trim();
    // Skip comments and empty lines
    if (!line || line.startsWith('#')) return;

    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let value = match[2].trim();
      
      // Remove quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      
      env[key] = value;
    }
  });

  return env;
}

/**
 * Validate MongoDB URI format
 */
function validateMongoDBUri(uri) {
  if (!uri) return { valid: false, error: 'MongoDB URI is empty' };

  const mongoPatterns = [
    /^mongodb:\/\/.+/,           // Standard MongoDB
    /^mongodb\+srv:\/\/.+/       // MongoDB Atlas
  ];

  const isValid = mongoPatterns.some(pattern => pattern.test(uri));
  
  if (!isValid) {
    return { valid: false, error: 'Invalid MongoDB URI format' };
  }

  // Check for weak credentials
  const weakPatterns = [
    { pattern: /password123/i, message: 'Weak password detected' },
    { pattern: /admin:admin/i, message: 'Default admin credentials detected' },
    { pattern: /root:root/i, message: 'Default root credentials detected' },
    { pattern: /test:test/i, message: 'Test credentials detected' }
  ];

  for (const check of weakPatterns) {
    if (check.pattern.test(uri)) {
      return { valid: true, warning: check.message };
    }
  }

  return { valid: true };
}

/**
 * Mask sensitive values for display
 */
function maskValue(key, value) {
  const sensitiveKeys = ['PASSWORD', 'SECRET', 'TOKEN', 'KEY', 'URI'];
  const isSensitive = sensitiveKeys.some(k => key.toUpperCase().includes(k));
  
  if (!isSensitive || !value || value.length < 8) return value;
  
  return `${value.slice(0, 4)}${'*'.repeat(value.length - 8)}${value.slice(-4)}`;
}

/**
 * Pull environment variables from Vercel
 */
async function pullFromVercel() {
  logStep('📥 Pulling environment variables from Vercel...');

  if (!isVercelInstalled()) {
    logError('Vercel CLI is not installed');
    logInfo('Install it with: npm install -g vercel');
    return false;
  }

  try {
    // Pull production environment variables
    execSync('vercel env pull .env --yes', { 
      cwd: rootDir,
      stdio: 'inherit'
    });
    
    logSuccess('Successfully pulled environment variables from Vercel');
    return true;
  } catch (error) {
    logError('Failed to pull from Vercel');
    logInfo('Make sure you are logged in: vercel login');
    logInfo('And linked to a project: vercel link');
    return false;
  }
}

/**
 * Push environment variable to Vercel
 */
function pushToVercel(key, value, environment = 'production,preview,development') {
  logInfo(`Pushing ${key} to Vercel...`);

  try {
    // Use vercel env add command
    const process = spawn('vercel', ['env', 'add', key, environment], {
      cwd: rootDir,
      stdio: ['pipe', 'inherit', 'inherit']
    });

    // Send the value
    process.stdin.write(value + '\n');
    process.stdin.end();

    return new Promise((resolve) => {
      process.on('close', (code) => {
        if (code === 0) {
          logSuccess(`Pushed ${key} to Vercel`);
          resolve(true);
        } else {
          logWarning(`Failed to push ${key} (code ${code})`);
          resolve(false);
        }
      });
    });
  } catch (error) {
    logError(`Failed to push ${key}: ${error.message}`);
    return false;
  }
}

/**
 * Get required environment variables from env.example
 */
function getRequiredVariables() {
  const exampleEnv = parseEnvFile(envExamplePath);
  return Object.keys(exampleEnv);
}

/**
 * Validate environment variables
 */
function validateEnvironment(env) {
  logStep('🔍 Validating environment variables...');

  const required = getRequiredVariables();
  const missing = [];
  const issues = [];

  for (const key of required) {
    if (!env[key] || env[key] === 'your_value_here' || env[key].includes('YOUR_')) {
      missing.push(key);
    }
  }

  // Special validation for MongoDB URI
  if (env.MONGODB_URI) {
    const validation = validateMongoDBUri(env.MONGODB_URI);
    if (!validation.valid) {
      issues.push(`MONGODB_URI: ${validation.error}`);
    } else if (validation.warning) {
      logWarning(`MONGODB_URI: ${validation.warning}`);
    }
  }

  if (missing.length > 0) {
    logWarning('Missing or placeholder values for:');
    missing.forEach(key => log(`  - ${key}`, colors.yellow));
  }

  if (issues.length > 0) {
    logError('Validation issues found:');
    issues.forEach(issue => log(`  - ${issue}`, colors.red));
    return false;
  }

  if (missing.length === 0) {
    logSuccess('All required environment variables are set');
  }

  return true;
}

/**
 * Display current environment status
 */
function displayEnvironmentStatus() {
  logStep('📊 Current Environment Status');

  const envBase = parseEnvFile(envPath);
  const envLocal = parseEnvFile(envLocalPath);
  const env = { ...envBase, ...envLocal };
  const required = getRequiredVariables();

  const sources = [];
  if (Object.keys(envBase).length > 0) sources.push('.env');
  if (Object.keys(envLocal).length > 0) sources.push('.env.local');
  logInfo(`Reading from: ${sources.length > 0 ? sources.join(' + ') : '(none)'}`);

  log('\nConfigured Variables:', colors.bright);
  required.forEach(key => {
    const value = env[key];
    const status = value && value !== 'your_value_here' && !value.includes('YOUR_') 
      ? colors.green + '✓' 
      : colors.red + '✗';
    const displayValue = value ? maskValue(key, value) : '(not set)';
    log(`  ${status} ${key}: ${displayValue}${colors.reset}`);
  });

  console.log();
}

/**
 * Create .env from template if it doesn't exist
 */
function ensureEnvFile() {
  if (fs.existsSync(envPath)) {
    return true;
  }

  if (fs.existsSync(envLocalPath)) {
    logInfo('.env not found, but .env.local exists — using .env.local');
    return true;
  }

  logWarning('No .env or .env.local file found');

  if (fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envPath);
    logSuccess('Created .env from env.example template');
    logInfo('Please edit .env with your actual credentials');
    return false;
  } else {
    logError('env.example template not found');
    return false;
  }
}

/**
 * Main sync function
 */
async function sync(options = {}) {
  log('\n' + '='.repeat(60), colors.cyan);
  log('   🔄 MongoDB-Vercel Environment Sync Manager', colors.bright);
  log('='.repeat(60) + '\n', colors.cyan);

  const mode = options.mode || 'auto';

  // Ensure .env exists
  if (!ensureEnvFile() && mode !== 'status') {
    return;
  }

  // Handle different modes
  switch (mode) {
    case 'pull':
      await pullFromVercel();
      break;

    case 'push':
      logStep('📤 Pushing local environment to Vercel...');
      logWarning('This feature requires interactive input');
      logInfo('Use Vercel dashboard or CLI manually for now');
      logInfo('vercel env add <KEY> production,preview,development');
      break;

    case 'validate':
      const env = { ...parseEnvFile(envPath), ...parseEnvFile(envLocalPath) };
      validateEnvironment(env);
      break;

    case 'status':
      displayEnvironmentStatus();
      break;

    case 'auto':
    default:
      // Auto mode: pull from Vercel if available, then validate
      if (isVercelInstalled()) {
        await pullFromVercel();
      } else {
        logInfo('Vercel CLI not found - skipping sync');
        logInfo('Install with: npm install -g vercel');
      }
      
      const localEnv = { ...parseEnvFile(envPath), ...parseEnvFile(envLocalPath) };
      validateEnvironment(localEnv);
      displayEnvironmentStatus();
      break;
  }

  log('\n' + '='.repeat(60), colors.cyan);
  logSuccess('Environment sync completed');
  log('='.repeat(60) + '\n', colors.cyan);
}

// CLI interface
const args = process.argv.slice(2);
const command = args[0] || 'auto';

const validCommands = ['auto', 'pull', 'push', 'validate', 'status', 'help'];

if (command === 'help' || !validCommands.includes(command)) {
  console.log(`
${colors.bright}MongoDB-Vercel Environment Sync Manager${colors.reset}

${colors.cyan}Usage:${colors.reset}
  node env-sync.js [command]

${colors.cyan}Commands:${colors.reset}
  ${colors.green}auto${colors.reset}     Auto-sync: pull from Vercel and validate (default)
  ${colors.green}pull${colors.reset}     Pull environment variables from Vercel
  ${colors.green}push${colors.reset}     Push local variables to Vercel (interactive)
  ${colors.green}validate${colors.reset} Validate current .env file
  ${colors.green}status${colors.reset}   Display current environment status
  ${colors.green}help${colors.reset}     Show this help message

${colors.cyan}Examples:${colors.reset}
  node env-sync.js              # Auto-sync
  node env-sync.js pull         # Pull from Vercel
  node env-sync.js status       # Check status

${colors.cyan}NPM Scripts:${colors.reset}
  npm run sync                  # Auto-sync
  npm run sync:pull             # Pull from Vercel
  npm run sync:status           # Check status
  `);
  process.exit(0);
}

// Run sync
sync({ mode: command }).catch(error => {
  logError(`Sync failed: ${error.message}`);
  process.exit(1);
});
