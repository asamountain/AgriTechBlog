import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

/**
 * Custom environment loader that completely ignores Replit Secrets
 * and forces the use of local environment variables only.
 * 
 * This ensures the project works independently from Replit's environment system.
 */

interface LocalEnvironmentConfig {
  MONGODB_URI: string;
  MONGODB_DATABASE: string;
  SESSION_SECRET: string;
  NODE_ENV: string;
  PORT: string;
  BCRYPT_ROUNDS: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
}

// Local-only configuration - completely independent from Replit
const LOCAL_CONFIG: LocalEnvironmentConfig = {
  MONGODB_URI: 'mongodb+srv://blog-admin-new:dIGhkAFqirrk8Gva@cluster0.br3z5.mongodb.net/blog_database?retryWrites=true&w=majority&appName=Cluster0',
  MONGODB_DATABASE: 'blog_database',
  SESSION_SECRET: 'super-secret-local-session-key-for-cursor-development',
  NODE_ENV: 'development',
  PORT: '5000',
  BCRYPT_ROUNDS: '12',
  GOOGLE_CLIENT_ID: 'your-google-client-id',
  GOOGLE_CLIENT_SECRET: 'your-google-client-secret'
};

export function loadLocalEnvironment(): void {
  console.log('🔒 Loading LOCAL environment (ignoring Replit Secrets)...');
  
  // Step 1: Force clear any Replit environment variables
  clearReplitEnvironment();
  
  // Step 2: Try to load from .env file first
  const envLoaded = loadFromEnvFile();
  
  // Step 3: If no .env file, use hardcoded local config
  if (!envLoaded) {
    console.log('📝 Using hardcoded local configuration...');
    setLocalConfiguration();
  }
  
  // Step 4: Verify critical variables are set
  validateEnvironment();
  
  console.log('✅ Local environment loaded successfully');
  console.log(`🔗 MongoDB URI: ${maskCredentials(process.env.MONGODB_URI!)}`);
  console.log(`🗄️  Database: ${process.env.MONGODB_DATABASE}`);
}

function clearReplitEnvironment(): void {
  // Remove any existing MongoDB-related environment variables
  // This ensures Replit Secrets don't interfere
  const replitKeys = [
    'MONGODB_URI',
    'MONGODB_DATABASE',
    'MONGODB_URL',
    'DATABASE_URL'
  ];
  
  let clearedCount = 0;
  replitKeys.forEach(key => {
    if (process.env[key]) {
      delete process.env[key];
      clearedCount++;
    }
  });
  
  if (clearedCount > 0) {
    console.log(`🧹 Cleared ${clearedCount} Replit environment variables`);
  }
}

function loadFromEnvFile(): boolean {
  const envPath = join(process.cwd(), '.env');
  
  if (!existsSync(envPath)) {
    console.log('📄 No .env file found, using local configuration');
    return false;
  }
  
  try {
    const envContent = readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    
    let loadedCount = 0;
    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').trim();
          process.env[key.trim()] = value;
          loadedCount++;
        }
      }
    });
    
    console.log(`📄 Loaded ${loadedCount} variables from .env file`);
    return true;
  } catch (error) {
    console.log(`❌ Failed to read .env file: ${(error as Error).message}`);
    return false;
  }
}

function setLocalConfiguration(): void {
  Object.entries(LOCAL_CONFIG).forEach(([key, value]) => {
    process.env[key] = value;
  });
  
  console.log(`📝 Set ${Object.keys(LOCAL_CONFIG).length} local environment variables`);
}

function validateEnvironment(): void {
  const required = ['MONGODB_URI', 'MONGODB_DATABASE', 'SESSION_SECRET'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error(`❌ Missing required environment variables: ${missing.join(', ')}`);
    throw new Error('Invalid environment configuration');
  }
  
  // Validate MongoDB URI format
  const mongoUri = process.env.MONGODB_URI!;
  if (!mongoUri.startsWith('mongodb+srv://') && !mongoUri.startsWith('mongodb://')) {
    throw new Error('Invalid MONGODB_URI format');
  }
  
  console.log('✅ Environment validation passed');
}

function maskCredentials(uri: string): string {
  return uri.replace(/:\/\/([^:]+):([^@]+)@/, '://[USER]:[PASS]@');
}

// Helper function to check if we're in local development
export function isLocalDevelopment(): boolean {
  return process.env.NODE_ENV === 'development' && !process.env.VERCEL;
}

// Helper function to display environment status
export function displayEnvironmentStatus(): void {
  console.log('\n🔧 Environment Status:');
  console.log('========================');
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(`MongoDB URI: ${maskCredentials(process.env.MONGODB_URI || 'Not set')}`);
  console.log(`Database: ${process.env.MONGODB_DATABASE || 'Not set'}`);
  console.log(`Port: ${process.env.PORT || 'Not set'}`);
  console.log(`Local Development: ${isLocalDevelopment() ? 'Yes' : 'No'}`);
  console.log('========================\n');
} 