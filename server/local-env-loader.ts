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
}

// Default configuration for development (no credentials — must come from .env or .env.local)
const DEFAULT_CONFIG: EnvironmentConfig = {
  MONGODB_URI: '',
  MONGODB_DATABASE: 'blog_database',
  SESSION_SECRET: '',
  NODE_ENV: 'development',
  PORT: '5000',
  BCRYPT_ROUNDS: '12',
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

function loadEnvFromFile(filePath: string): number {
  const content = readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  let count = 0;

  lines.forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        let value = valueParts.join('=').trim();
        // Remove surrounding quotes
        if ((value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        process.env[key.trim()] = value;
        count++;
      }
    }
  });

  return count;
}

function loadFromEnvFile(): boolean {
  const cwd = process.cwd();
  const envPath = join(cwd, '.env');
  const envLocalPath = join(cwd, '.env.local');

  let loaded = false;

  // Load .env first (base)
  if (existsSync(envPath)) {
    try {
      const count = loadEnvFromFile(envPath);
      console.log(`📄 Loaded ${count} variables from .env`);
      loaded = true;
    } catch (error) {
      console.log(`❌ Failed to read .env: ${(error as Error).message}`);
    }
  }

  // Load .env.local second (overrides .env)
  if (existsSync(envLocalPath)) {
    try {
      const count = loadEnvFromFile(envLocalPath);
      console.log(`📄 Loaded ${count} variables from .env.local (overrides .env)`);
      loaded = true;
    } catch (error) {
      console.log(`❌ Failed to read .env.local: ${(error as Error).message}`);
    }
  }

  if (!loaded) {
    console.log('📄 No .env or .env.local file found, using default configuration');
  }

  return loaded;
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

export function displayEnvironmentStatus(): void {
  console.log('\n🔧 Environment Status:');
  console.log('========================');
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(`MongoDB URI: ${maskCredentials(process.env.MONGODB_URI || 'Not set')}`);
  console.log(`Database: ${process.env.MONGODB_DATABASE || 'Not set'}`);
  console.log(`Port: ${process.env.PORT || 'Not set'}`);
  console.log(`Cloudinary Cloud: ${process.env.CLOUDINARY_CLOUD_NAME || '❌ NOT SET'}`);
  console.log(`Cloudinary API Key: ${process.env.CLOUDINARY_API_KEY ? '✅ SET' : '❌ NOT SET'}`);
  console.log(`Local Development: ${isLocalDevelopment() ? 'Yes' : 'No'}`);
  console.log('========================\n');
} 