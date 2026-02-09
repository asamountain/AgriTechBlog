import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

/**
 * Standard environment loader for the application
 * Loads environment variables from .env file or uses defaults
 */

interface EnvironmentConfig {
  MONGODB_URI: string;
  MONGODB_DATABASE: string;
  SESSION_SECRET: string;
  NODE_ENV: string;
  PORT: string;
  BCRYPT_ROUNDS: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
}

// Default configuration for development
const DEFAULT_CONFIG: EnvironmentConfig = {
  MONGODB_URI: 'mongodb+srv://blog-admin-new:dIGhkAFqirrk8Gva@cluster0.br3z5.mongodb.net/blog_database?retryWrites=true&w=majority&appName=Cluster0',
  MONGODB_DATABASE: 'blog_database',
  SESSION_SECRET: 'super-secret-local-session-key-for-development',
  NODE_ENV: 'development',
  PORT: '5000',
  BCRYPT_ROUNDS: '12',
  GOOGLE_CLIENT_ID: 'your-google-client-id',
  GOOGLE_CLIENT_SECRET: 'your-google-client-secret'
};

export function loadEnvironment(): void {
  console.log('🔒 Loading environment configuration...');
  
  // Try to load from .env file first
  const envLoaded = loadFromEnvFile();
  
  // If no .env file, use default config
  if (!envLoaded) {
    console.log('📝 Using default configuration...');
    setDefaultConfiguration();
  }
  
  // Validate critical variables are set
  validateEnvironment();
  
  console.log('✅ Environment loaded successfully');
  console.log(`🔗 MongoDB URI: ${maskCredentials(process.env.MONGODB_URI!)}`);
  console.log(`🗄️  Database: ${process.env.MONGODB_DATABASE}`);
}

function loadFromEnvFile(): boolean {
  const envPath = join(process.cwd(), '.env');
  
  if (!existsSync(envPath)) {
    console.log('📄 No .env file found, using default configuration');
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

function setDefaultConfiguration(): void {
  Object.entries(DEFAULT_CONFIG).forEach(([key, value]) => {
    if (!process.env[key]) {
      process.env[key] = value;
    }
  });
  
  console.log(`📝 Set ${Object.keys(DEFAULT_CONFIG).length} default environment variables`);
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