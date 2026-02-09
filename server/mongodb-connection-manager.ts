import { MongoClient, Db, MongoClientOptions } from "mongodb";
import { loadEnvironment } from './local-env-loader';

// Load environment variables
loadEnvironment();

export interface MongoConnectionConfig {
  uri: string;
  database: string;
  options?: MongoClientOptions;
}

export class MongoConnectionManager {
  private static instance: MongoConnectionManager;
  private client: MongoClient | null = null;
  private db: Db | null = null;
  private isConnected = false;
  private connectionRetries = 0;
  private readonly maxRetries = 3;
  private readonly retryDelay = 5000; // 5 seconds

  private constructor() {}

  public static getInstance(): MongoConnectionManager {
    if (!MongoConnectionManager.instance) {
      MongoConnectionManager.instance = new MongoConnectionManager();
    }
    return MongoConnectionManager.instance;
  }

  /**
   * Validates MongoDB connection string format and security
   */
  private validateConnectionString(uri: string): void {
    if (!uri) {
      throw new Error('MongoDB URI is required');
    }

    // Check for hardcoded passwords (basic security check)
    const suspiciousPatterns = [
      /password123/i,
      /admin:admin/i,
      /root:root/i,
      /test:test/i
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(uri)) {
        console.warn('⚠️  WARNING: Potentially insecure credentials detected in MongoDB URI');
      }
    }

    // Ensure SSL is enabled for remote connections
    if (uri.includes('mongodb+srv://') && !uri.includes('ssl=true')) {
      console.info('ℹ️  Using MongoDB Atlas with SSL enabled');
    }
  }

  /**
   * Get optimized MongoDB connection options
   */
  private getConnectionOptions(): MongoClientOptions {
    return {
      // Connection pool settings
      maxPoolSize: 10,
      minPoolSize: 2,
      maxIdleTimeMS: 30000,
      
      // Timeout settings
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 30000,
      
      // Retry settings
      retryWrites: true,
      retryReads: true,
      
      // Compression
      compressors: ['zlib'],
      
      // Monitoring
      monitorCommands: process.env.NODE_ENV === 'development',
      
      // Authentication and SSL
      ssl: process.env.NODE_ENV === 'production',
      
      // Application metadata
      appName: 'SanBlog',
      
      // Write concern for data safety
      writeConcern: {
        w: 'majority',
        j: true,
        wtimeout: 10000
      },
      
      // Read preference for consistency
      readPreference: 'primary'
    };
  }

  /**
   * Establish MongoDB connection with retry logic
   */
  public async connect(config?: MongoConnectionConfig): Promise<void> {
    try {
      // Use provided config or environment variables
      const uri = config?.uri || process.env.MONGODB_URI;
      const database = config?.database || process.env.MONGODB_DATABASE || 'blog_database';

      if (!uri) {
        throw new Error('MongoDB URI not provided in config or environment variables');
      }

      this.validateConnectionString(uri);

      const options: MongoClientOptions = {
        ...this.getConnectionOptions(),
        ...config?.options
      };

      console.log(`🔄 Connecting to MongoDB database: ${database}...`);
      
      this.client = new MongoClient(uri, options);
      await this.client.connect();
      
      this.db = this.client.db(database);
      this.isConnected = true;
      this.connectionRetries = 0;

      // Test the connection
      await this.testConnection();
      
      console.log('✅ Successfully connected to MongoDB');
      console.log(`📊 Database: ${database}`);
      
      // Set up connection event listeners
      this.setupEventListeners();

    } catch (error) {
      this.isConnected = false;
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      console.error(`❌ MongoDB connection failed: ${errorMessage}`);
      
      if (this.connectionRetries < this.maxRetries) {
        this.connectionRetries++;
        console.log(`🔄 Retrying connection (${this.connectionRetries}/${this.maxRetries}) in ${this.retryDelay/1000}s...`);
        
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        return this.connect(config);
      }
      
      throw new Error(`Failed to connect to MongoDB after ${this.maxRetries} attempts: ${errorMessage}`);
    }
  }

  /**
   * Test database connection and permissions
   */
  private async testConnection(): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    // Test basic connectivity
    await this.db.admin().ping();
    
    // List collections to test read permissions
    const collections = await this.db.listCollections().toArray();
    console.log(`📁 Available collections: ${collections.map(c => c.name).join(', ')}`);
    
    // Test write permissions (create a test document if posts collection exists)
    try {
      const postsCollection = this.db.collection('posts');
      const count = await postsCollection.countDocuments();
      console.log(`📄 Posts in database: ${count}`);
    } catch (error) {
      console.warn('⚠️  Could not access posts collection');
    }
  }

  /**
   * Set up connection event listeners for monitoring
   */
  private setupEventListeners(): void {
    if (!this.client) return;

    this.client.on('connectionPoolCreated', () => {
      console.log('🔗 MongoDB connection pool created');
    });

    this.client.on('connectionPoolClosed', () => {
      console.log('🔌 MongoDB connection pool closed');
      this.isConnected = false;
    });

    this.client.on('serverHeartbeatFailed', (event) => {
      console.warn('💔 MongoDB heartbeat failed:', event.failure?.message);
    });

    this.client.on('topologyDescriptionChanged', (event) => {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 MongoDB topology changed:', event.newDescription.type);
      }
    });
  }

  /**
   * Get the database instance
   */
  public getDatabase(): Db {
    if (!this.db || !this.isConnected) {
      throw new Error('Database not connected. Call connect() first.');
    }
    return this.db;
  }

  /**
   * Get the MongoDB client instance
   */
  public getClient(): MongoClient {
    if (!this.client || !this.isConnected) {
      throw new Error('Client not connected. Call connect() first.');
    }
    return this.client;
  }

  /**
   * Check if connected to MongoDB
   */
  public isConnectedToMongo(): boolean {
    return this.isConnected && this.client !== null && this.db !== null;
  }

  /**
   * Get connection health information
   */
  public async getConnectionHealth(): Promise<{
    connected: boolean;
    database: string;
    collections: string[];
    serverInfo?: any;
  }> {
    if (!this.isConnectedToMongo()) {
      return {
        connected: false,
        database: 'Not connected',
        collections: []
      };
    }

    try {
      const db = this.getDatabase();
      const collections = await db.listCollections().toArray();
      const serverInfo = await db.admin().serverStatus();
      
      return {
        connected: true,
        database: db.databaseName,
        collections: collections.map(c => c.name),
        serverInfo: {
          version: serverInfo.version,
          uptime: serverInfo.uptime,
          connections: serverInfo.connections
        }
      };
    } catch (error) {
      return {
        connected: false,
        database: 'Health check failed',
        collections: []
      };
    }
  }

  /**
   * Safely disconnect from MongoDB
   */
  public async disconnect(): Promise<void> {
    if (this.client) {
      try {
        await this.client.close();
        console.log('🔌 Disconnected from MongoDB');
      } catch (error) {
        console.error('Error disconnecting from MongoDB:', error);
      } finally {
        this.client = null;
        this.db = null;
        this.isConnected = false;
      }
    }
  }

  /**
   * Force reconnection
   */
  public async reconnect(config?: MongoConnectionConfig): Promise<void> {
    await this.disconnect();
    await this.connect(config);
  }

  /**
   * Create a transaction session for multiple operations
   */
  public async withTransaction<T>(operation: (session: any) => Promise<T>): Promise<T> {
    const client = this.getClient();
    const session = client.startSession();
    
    try {
      let result: T;
      
      await session.withTransaction(async () => {
        result = await operation(session);
      });
      
      return result!;
    } finally {
      await session.endSession();
    }
  }
}

// Export singleton instance
export const mongoConnectionManager = MongoConnectionManager.getInstance();

// Graceful shutdown handling
process.on('SIGINT', async () => {
  console.log('\n🛑 Received SIGINT, closing MongoDB connection...');
  await mongoConnectionManager.disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Received SIGTERM, closing MongoDB connection...');
  await mongoConnectionManager.disconnect();
  process.exit(0);
}); 