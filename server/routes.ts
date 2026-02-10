import type { Express } from "express";
import { createServer, type Server } from "http";
import passport from "passport";
import { storage, getStorage, type IStorage } from "./storage";
import { insertBlogPostSchema, insertAuthorSchema, insertCommentSchema } from "@shared/schema";
import { requireAuth } from "./auth";
import { getAITaggingService } from "./ai-tagging";
import { insertUserSchema, type User, type BlogPost, type Author } from "@shared/schema";
import { z } from "zod";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { Request, Response, NextFunction } from "express";
import { setupVite, log } from "./vite";
import type { BlogPostWithDetails, InsertBlogPost, InsertAuthor, Comment, InsertComment, InsertUser } from "@shared/schema";
import { NotionContentExtractor } from './services/notion-content-extractor';
import { BlogAutomationPipeline } from './services/blog-automation-pipeline';
import { config as notionConfig, validateConfig as validateNotionConfig, getConfigSummary } from './config/notion-claude.config';
import { uploadToCloudinary, deleteFromCloudinary, isCloudinaryConfigured } from './config/cloudinary.config';

// Function to initialize sample data if database is empty
async function initializeSampleData(storage: any) {
  try {
    // Create author first
    const author = await storage.createAuthor({
      name: "San",
      email: "san@example.com",
      bio: "Sustainable Abundance Seeker",
      avatar: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADb/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAGQAXQDASIAAhEBAxEB/8QAHAAAAAc",
      userId: "demo-user-001",
      linkedinUrl: null,
      instagramUrl: null,
      youtubeUrl: null,
      githubUrl: null,
      portfolioUrl: null
    });

    // Create blog posts
    const posts = [
      {
        title: "Autonomous Farming: The Future is Here",
        slug: "autonomous-farming-future-is-here",
        excerpt: "Discover how autonomous farming technologies are revolutionizing agriculture with AI-powered tractors, drones, and smart irrigation systems.",
        content: `# Autonomous Farming: The Future is Here

Autonomous farming represents a paradigm shift in agricultural practices, combining cutting-edge technology with traditional farming wisdom. This revolution is transforming how we grow food, manage resources, and approach sustainability.

## Key Technologies Driving Change

### AI-Powered Tractors
Modern autonomous tractors use GPS, computer vision, and machine learning to navigate fields with precision accuracy. These machines can work 24/7, optimizing planting patterns and reducing fuel consumption.

### Drone Technology
Agricultural drones provide real-time crop monitoring, pest detection, and precision spraying capabilities. They enable farmers to make data-driven decisions about irrigation, fertilization, and pest control.

### Smart Irrigation Systems
IoT-enabled irrigation systems monitor soil moisture, weather conditions, and crop water requirements to deliver precise amounts of water when and where needed.

## Benefits of Autonomous Farming

- **Increased Efficiency**: Automated systems work continuously without fatigue
- **Precision Agriculture**: Exact application of inputs reduces waste
- **Labor Cost Reduction**: Automation addresses labor shortages
- **Environmental Impact**: Reduced chemical usage and optimized resource consumption
- **Data-Driven Insights**: Continuous monitoring provides valuable analytics

## Challenges and Considerations

While autonomous farming offers tremendous potential, challenges include high initial investment costs, the need for reliable internet connectivity, and the requirement for technical expertise to operate and maintain these systems.

## The Path Forward

As technology continues to evolve, we can expect even more sophisticated autonomous farming solutions. The integration of 5G networks, advanced AI algorithms, and improved sensor technology will further enhance the capabilities of autonomous farming systems.

The future of agriculture is autonomous, sustainable, and efficient. By embracing these technologies, farmers can increase productivity while reducing their environmental footprint.`,
        featuredImage: "",
        tags: ["autonomous farming", "AI", "technology", "agriculture"],
        readTime: 8,
        isFeatured: true,
        isPublished: true,
        userId: "demo-user-001"
      },
      {
        title: "Agrivoltaics: Farming Under Solar Panels",
        slug: "agrivoltaics-farming-under-solar-panels",
        excerpt: "Explore the innovative practice of agrivoltaics, where crops grow beneath solar panels, maximizing land use for both food and energy production.",
        content: `# Agrivoltaics: Farming Under Solar Panels

Agrivoltaics, also known as agri-photovoltaics or solar farming, represents an innovative approach to land use that combines agricultural production with solar energy generation. This dual-purpose system offers promising solutions to the growing demands for both food and renewable energy.

## What is Agrivoltaics?

Agrivoltaics involves installing elevated solar panels over agricultural land, allowing crops to grow underneath while generating clean electricity above. This symbiotic relationship benefits both agricultural and energy sectors.

## Benefits of Agrivoltaic Systems

### Improved Crop Performance
- **Shade Protection**: Solar panels provide partial shade, protecting crops from extreme heat and reducing water stress
- **Microclimate Creation**: The panels create a more stable microclimate with reduced temperature fluctuations
- **Extended Growing Seasons**: Protection from harsh weather conditions can extend productive growing periods

### Energy Generation
- **Dual Revenue Streams**: Farmers can earn income from both crop sales and electricity generation
- **Grid Contribution**: Clean energy production contributes to renewable energy goals
- **Energy Independence**: On-farm energy generation reduces dependence on external power sources

### Water Conservation
- **Reduced Evaporation**: Panels reduce water evaporation from soil surface
- **Improved Water Use Efficiency**: Shade conditions often require less irrigation
- **Rainwater Collection**: Panel systems can be designed to collect and channel rainwater

## Suitable Crops for Agrivoltaic Systems

Certain crops perform particularly well under agrivoltaic conditions:
- Leafy greens (lettuce, spinach, kale)
- Herbs (basil, cilantro, parsley)
- Berries (strawberries, blueberries)
- Root vegetables (carrots, radishes)
- Shade-tolerant crops

## Design Considerations

Successful agrivoltaic installations require careful planning:
- **Panel Height**: Sufficient clearance for farming equipment
- **Panel Spacing**: Optimal light transmission for crop growth
- **Orientation**: Balancing energy production with agricultural needs
- **Accessibility**: Maintaining access for farming operations

## Economic Viability

The economics of agrivoltaics depend on several factors:
- Initial installation costs
- Energy prices and incentives
- Crop yields and market prices
- Maintenance requirements
- Long-term system durability

## Future Prospects

Research continues to optimize agrivoltaic systems for various climates, crops, and economic conditions. As technology advances and costs decrease, agrivoltaics may become an increasingly attractive option for sustainable land use.

The integration of agriculture and solar energy represents a promising pathway toward sustainable development, addressing the dual challenges of food security and clean energy transition.`,
        featuredImage: "",
        tags: ["agrivoltaics", "solar energy", "sustainable agriculture", "renewable energy"],
        readTime: 7,
        isFeatured: true,
        isPublished: true,
        userId: "demo-user-001"
      }
    ];

    for (const postData of posts) {
      await storage.createBlogPost(postData);
    }

    console.log("Sample data initialized successfully");
  } catch (error) {
    console.error("Error initializing sample data:", error);
  }
}

// In-memory reference to the current MongoDB connection config
let dynamicMongoConfig: { uri: string; dbName: string } | null = null;

// Shared active storage instance for all routes
let activeStorage: IStorage;

// Helper to re-initialize storage with new MongoDB connection
async function setDynamicMongoConnection(uri: string, dbName: string) {
  const { MongoStorage } = await import('./mongodb-storage-updated');
  const storage = new MongoStorage(uri, dbName);
  await storage.connect();
  activeStorage = storage;
  dynamicMongoConfig = { uri, dbName };
}

// Temporary mock storage for testing when MongoDB is unavailable
function createMockStorage(): IStorage {
  console.log("🧪 Creating mock storage for testing...");
  
  // Mock data with the specific post ID the user is trying to access
  const mockPosts: BlogPostWithDetails[] = [
    {
      id: 4367658208,
      title: "Test Post for Editing",
      content: "# Welcome to the Test Post\n\nThis is a test post with **markdown content** that you can edit.\n\n## Features\n\n- Edit functionality\n- Markdown support\n- Live preview\n- Auto-save\n\n*This post is served from mock storage since MongoDB is not available.*",
      slug: "test-post-for-editing",
      excerpt: "This is a test post for testing the edit functionality when MongoDB is not available.",
      featuredImage: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: "demo-user-001",
      tags: ["test", "editing", "mock"],
      isFeatured: false,
      isPublished: false,
      readTime: 2
    }
  ];

  return {
    // User methods
    async createUser(user: InsertUser): Promise<User> {
      throw new Error("Mock storage: User operations not implemented");
    },
    async getUserByUsername(username: string): Promise<User | undefined> {
      return undefined;
    },

    // Author methods
    async getAuthors(): Promise<Author[]> {
      return [];
    },
    async createAuthor(insertAuthor: InsertAuthor): Promise<Author> {
      throw new Error("Mock storage: Author creation not implemented");
    },
    async getAuthorByUserId(userId: string): Promise<Author | undefined> {
      return undefined;
    },
    async updateAuthor(id: number, updates: Partial<Author>): Promise<Author> {
      throw new Error("Mock storage: Author update not implemented");
    },
    async updateAuthorByUserId(userId: string, updates: Partial<Author>): Promise<Author> {
      throw new Error("Mock storage: Author update not implemented");
    },

    // Blog post methods
    async getBlogPosts(options?: { limit?: number; offset?: number; featured?: boolean; includeDrafts?: boolean; userId?: string }): Promise<BlogPostWithDetails[]> {
      console.log("🧪 Mock storage: Returning mock posts");
      return mockPosts;
    },
    async getBlogPost(id: string | number): Promise<BlogPostWithDetails | undefined> {
      console.log(`🧪 Mock storage: Fetching post with ID: ${id}`);
      const numId = typeof id === 'string' ? parseInt(id) : id;
      const post = mockPosts.find(p => p.id === numId);
      if (post) {
        console.log(`✅ Mock storage: Found post "${post.title}"`);
      } else {
        console.log(`❌ Mock storage: Post not found for ID ${id}`);
      }
      return post;
    },
    async getBlogPostBySlug(slug: string, userId?: string): Promise<BlogPostWithDetails | undefined> {
      return mockPosts.find(p => p.slug === slug);
    },
    async createBlogPost(insertBlogPost: InsertBlogPost): Promise<BlogPost> {
      console.log("🧪 Mock storage: Creating new post");
      const newPost = {
        id: Date.now(),
        ...insertBlogPost,
        createdAt: new Date(),
        updatedAt: new Date()
      } as BlogPost;
      return newPost;
    },
    async updateBlogPost(id: string | number, updates: Partial<InsertBlogPost>, userId?: string): Promise<BlogPost> {
      console.log(`🧪 Mock storage: Updating post ${id} with:`, updates);
      const numId = typeof id === 'string' ? parseInt(id) : id;
      const postIndex = mockPosts.findIndex(p => p.id === numId);
      if (postIndex >= 0) {
        mockPosts[postIndex] = { ...mockPosts[postIndex], ...updates, updatedAt: new Date() };
        console.log(`✅ Mock storage: Updated post "${mockPosts[postIndex].title}"`);
        return mockPosts[postIndex] as BlogPost;
      }
      throw new Error(`Post not found: ${id}`);
    },
    async searchBlogPosts(query: string): Promise<BlogPostWithDetails[]> {
      return mockPosts.filter(p => 
        p.title.toLowerCase().includes(query.toLowerCase()) ||
        p.content.toLowerCase().includes(query.toLowerCase())
      );
    },
    async getRelatedPosts(postId: string | number): Promise<BlogPostWithDetails[]> {
      return [];
    },
    async getBlogPostsByTag(tag: string): Promise<BlogPostWithDetails[]> {
      return mockPosts.filter(p => p.tags.includes(tag));
    },

    // Comment methods
    async getCommentsByPostId(postId: number): Promise<Comment[]> {
      return [];
    },
    async createComment(insertComment: InsertComment): Promise<Comment> {
      throw new Error("Mock storage: Comment creation not implemented");
    },
    async approveComment(id: number): Promise<Comment> {
      throw new Error("Mock storage: Comment approval not implemented");
    },
    async deleteComment(id: number): Promise<void> {
      console.log("Mock storage: Comment deletion not implemented");
    }
  };
}

export async function registerRoutes(app: Express): Promise<Server> {
  // TEMPORARY: Add fallback storage for testing when MongoDB is unavailable
  console.log("🔄 Connecting to MongoDB (with fallback for testing)...");
  
  if (!process.env.MONGODB_URI) {
    console.error("❌ MONGODB_URI environment variable is required!");
    console.error("❌ Using mock storage for testing...");
    activeStorage = createMockStorage();
  } else {
    try {
      const { MongoStorage } = await import('./mongodb-storage-updated');
      const mongoStorage = new MongoStorage(process.env.MONGODB_URI, process.env.MONGODB_DATABASE || 'blog_database');
      await mongoStorage.connect();
      activeStorage = mongoStorage;
      console.log("✅ Successfully connected to MongoDB");
      
      const existingPosts = await mongoStorage.getBlogPosts({ limit: 5 });
      console.log(`📄 Found ${existingPosts.length} existing posts in MongoDB database`);
      
      // NOTE: No sample data initialization - only use real MongoDB data
      
    } catch (mongoError) {
      console.error("❌ MongoDB connection failed! Using mock storage for testing...");
      console.error("❌ Error:", mongoError instanceof Error ? mongoError.message : mongoError);
      activeStorage = createMockStorage();
    }
  }

  // OAuth routes with passport middleware
  app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
  
  app.get('/auth/google/callback', 
    passport.authenticate('google', { failureRedirect: '/admin' }),
    (req, res) => {
      res.redirect('/auth/callback');
    }
  );

  app.get('/auth/github', passport.authenticate('github', { scope: ['user:email'] }));
  
  app.get('/auth/github/callback',
    passport.authenticate('github', { failureRedirect: '/admin' }),
    (req, res) => {
      res.redirect('/auth/callback');
    }
  );

  // Authentication API endpoint
  app.get("/api/auth/user", (req, res) => {
    if (req.isAuthenticated && req.isAuthenticated()) {
      res.json(req.user);
    } else {
      res.status(401).json({ message: "Not authenticated" });
    }
  });

  // Migration endpoint to assign existing posts to current user
  app.post("/api/admin/migrate-posts", async (req, res) => {
    try {
      if (!req.isAuthenticated || !req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const userId = (req.user as any)?.id;
      if (!userId) {
        return res.status(400).json({ message: "User ID not found" });
      }

      if (activeStorage instanceof (await import('./mongodb-storage-updated')).MongoStorage) {
        const result = await (activeStorage as any).migratePostsToUser(userId);
        res.json({ 
          message: "Posts migration completed", 
          userId: userId,
          migratedCount: result.migratedCount 
        });
      } else {
        res.status(400).json({ message: "Migration only available with MongoDB storage" });
      }
    } catch (error) {
      console.error("Migration error:", error);
      res.status(500).json({ message: "Failed to migrate posts" });
    }
  });

  // Check unassigned posts count
  app.get("/api/admin/unassigned-posts", async (req, res) => {
    try {
      if (!req.isAuthenticated || !req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      if (activeStorage instanceof (await import('./mongodb-storage-updated')).MongoStorage) {
        const count = await (activeStorage as any).getUnassignedPostsCount();
        res.json({ unassignedCount: count });
      } else {
        res.json({ unassignedCount: 0 });
      }
    } catch (error) {
      console.error("Error checking unassigned posts:", error);
      res.status(500).json({ message: "Failed to check unassigned posts" });
    }
  });

  // Public profile endpoint for blog post author information (no auth required)
  app.get("/api/profile", async (req, res) => {
    try {
      // Use the same demo user ID for consistency
      const userId = "demo-user-001";
      
      const author = await activeStorage.getAuthorByUserId(userId);
      if (author) {
        // Return only public information needed for blog posts
        res.json({
          id: author.id,
          name: author.name,
          bio: author.bio,
          avatar: author.avatar,
          linkedinUrl: author.linkedinUrl,
          instagramUrl: author.instagramUrl,
          youtubeUrl: author.youtubeUrl,
          githubUrl: author.githubUrl,
          portfolioUrl: author.portfolioUrl
        });
      } else {
        res.json({});
      }
    } catch (error) {
      console.error("Public profile fetch error:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  // Logout endpoint
  app.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  // Health check endpoint - MongoDB connection status
  app.get("/api/health/mongodb", async (req, res) => {
    try {
      const { MongoConnectionManager } = await import('./mongodb-connection-manager');
      const connectionManager = MongoConnectionManager.getInstance();
      
      const health = await connectionManager.getConnectionHealth();
      
      const statusCode = health.connected ? 200 : 503;
      res.status(statusCode).json({
        status: health.connected ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        database: health.database,
        connected: health.connected,
        collections: health.collections,
        serverInfo: health.serverInfo
      });
    } catch (error) {
      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
        connected: false
      });
    }
  });

  // Authors
  app.get("/api/authors", async (req, res) => {
    try {
      const authors = await activeStorage.getAuthors();
      res.json(authors);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch authors" });
    }
  });

  app.post("/api/authors", async (req, res) => {
    try {
      const authorData = insertAuthorSchema.parse(req.body);
      const author = await activeStorage.createAuthor(authorData);
      res.status(201).json(author);
    } catch (error) {
      res.status(400).json({ message: "Invalid author data" });
    }
  });

  // Debug endpoint
  app.get("/api/debug/posts", async (req, res) => {
    try {
      const allPosts = await activeStorage.getBlogPosts({ includeDrafts: true, limit: 20 });
      const publishedPosts = allPosts.filter(p => p.isPublished);
      const draftPosts = allPosts.filter(p => !p.isPublished);
      
      res.json({
        total: allPosts.length,
        published: publishedPosts.length,
        drafts: draftPosts.length,
        storageType: activeStorage.constructor.name,
        mongoUri: process.env.MONGODB_URI ? 'Set' : 'Not set',
        samplePosts: allPosts.slice(0, 3).map(p => ({
          title: p.title,
          isPublished: p.isPublished,
          tags: p.tags
        }))
      });
    } catch (error) {
      res.status(500).json({ error: (error as any).message });
    }
  });

  // ===============================================
  // MONGODB POST DATA ENDPOINTS - CRITICAL STRUCTURE
  // ===============================================
  // These endpoints serve MongoDB data to the three main pages:
  // 1. Landing Page (/) - uses /api/blog-posts/featured
  // 2. Posts Grid (/posts) - uses /api/blog-posts
  // 3. Admin Page (/admin) - uses /api/admin/blog-posts
  
  // POSTS GRID PAGE: /posts - All published posts with pagination/filtering
  app.get("/api/blog-posts", async (req, res) => {
    try {
      const { category, limit, offset, featured } = req.query;
      const options = {
        categorySlug: category as string,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
        featured: featured ? featured === 'true' : undefined,
        includeDrafts: false, // POSTS GRID: Only published posts
      };
      
      console.log("📄 POSTS GRID: Fetching blog posts with options:", options);
      const posts = await activeStorage.getBlogPosts(options);
      console.log(`📄 POSTS GRID: Found ${posts.length} posts from MongoDB`);
      
      res.json(posts);
    } catch (error) {
      console.error("❌ POSTS GRID: Error fetching blog posts:", error);
      res.status(500).json({ message: "Failed to fetch blog posts", error: (error as any).message });
    }
  });

  // LANDING PAGE: / - Featured posts for homepage hero section
  app.get("/api/blog-posts/featured", async (req, res) => {
    try {
      const posts = await activeStorage.getBlogPosts({ 
        featured: true, 
        limit: 3,
        includeDrafts: false // LANDING PAGE: Only published featured posts
      });
      console.log(`🏠 LANDING PAGE: Found ${posts.length} featured posts from MongoDB`);
      res.json(posts);
    } catch (error) {
      console.error("❌ LANDING PAGE: Error fetching featured posts:", error);
      res.status(500).json({ message: "Failed to fetch featured posts" });
    }
  });

  app.get("/api/blog-posts/search", async (req, res) => {
    try {
      const { q } = req.query;
      if (!q || typeof q !== 'string') {
        return res.status(400).json({ message: "Search query is required" });
      }
      
      const posts = await activeStorage.searchBlogPosts(q);
      res.json(posts);
    } catch (error) {
      res.status(500).json({ message: "Failed to search blog posts" });
    }
  });

  // New endpoint that matches Vercel function: /api/blog-post?slug= or ?id=
  app.get("/api/blog-post", async (req, res) => {
    try {
      const { slug, id } = req.query;
      
      if (!slug && !id) {
        return res.status(400).json({ message: 'Either slug or id parameter is required' });
      }
      
      if (Array.isArray(slug) || Array.isArray(id)) {
        return res.status(400).json({ message: 'Invalid parameters' });
      }
      
      const identifier = (slug || id) as string;
      console.log(`Fetching blog post with identifier: ${identifier}`);
      
      let post;
      // Check if identifier is numeric (ID) or string (slug)
      if (/^\d+$/.test(identifier)) {
        // It's a numeric ID
        const postId = parseInt(identifier);
        post = await activeStorage.getBlogPost(postId);
      } else {
        // It's a slug
        post = await activeStorage.getBlogPostBySlug(identifier);
      }
      
      if (!post) {
        console.log(`Blog post not found for identifier: ${identifier}`);
        return res.status(404).json({ message: "Blog post not found" });
      }
      
      res.json(post);
    } catch (error) {
      console.error(`Error fetching blog post:`, error);
      res.status(500).json({ message: "Failed to fetch blog post", error: (error as any).message });
    }
  });

  // Legacy endpoint: /api/blog-posts/:identifier (kept for backward compatibility)
  app.get("/api/blog-posts/:identifier", async (req, res) => {
    try {
      const { identifier } = req.params;
      console.log(`Fetching blog post with identifier: ${identifier}`);
      
      let post;
      // Check if identifier is numeric (ID) or string (slug)
      if (/^\d+$/.test(identifier)) {
        // It's a numeric ID
        const postId = isNaN(parseInt(identifier)) ? identifier : parseInt(identifier);
        post = await activeStorage.getBlogPost(postId);
      } else {
        // It's a slug
        post = await activeStorage.getBlogPostBySlug(identifier);
      }
      
      if (!post) {
        console.log(`Blog post not found for identifier: ${identifier}`);
        return res.status(404).json({ message: "Blog post not found" });
      }
      
      res.json(post);
    } catch (error) {
      console.error(`Error fetching blog post with identifier ${req.params.identifier}:`, error);
      res.status(500).json({ message: "Failed to fetch blog post", error: (error as any).message });
    }
  });

  app.get("/api/blog-posts/:id/related", async (req, res) => {
    try {
      const { id } = req.params;
      // Handle both string and numeric IDs
      const postId = isNaN(parseInt(id)) ? id : parseInt(id);
      const post = await activeStorage.getBlogPost(postId);
      
      if (!post) {
        return res.status(404).json({ message: "Blog post not found" });
      }
      
      const relatedPosts = await activeStorage.getRelatedPosts(postId);
      res.json(relatedPosts);
    } catch (error) {
      console.error("Related posts error:", error);
      res.status(500).json({ message: "Failed to fetch related posts" });
    }
  });

  app.post("/api/blog-posts", async (req, res) => {
    try {
      const postData = insertBlogPostSchema.parse(req.body);
      const post = await activeStorage.createBlogPost(postData);
      res.status(201).json(post);
    } catch (error) {
      res.status(400).json({ message: "Invalid blog post data" });
    }
  });

  // Generate sitemap.xml with all published blog posts
  app.get("/sitemap.xml", async (req, res) => {
    try {
      const baseUrl = req.get('host')?.includes('localhost') 
        ? 'http://localhost:5001' 
        : `https://${req.get('host')}`;
      
      // Fetch all blog posts (including drafts for debugging)
      const allPosts = await activeStorage.getBlogPosts({ includeDrafts: true });
      const publishedPosts = allPosts.filter(post => post.isPublished);
      console.log(`Sitemap: Total posts: ${allPosts.length}, Published: ${publishedPosts.length}`);
      
      const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/posts</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
${publishedPosts.map(post => `  <url>
    <loc>${baseUrl}/blog/${post.slug}</loc>
    <lastmod>${new Date(post.updatedAt).toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`).join('\n')}
</urlset>`;

      res.setHeader('Content-Type', 'application/xml');
      res.send(sitemap);
    } catch (error) {
      console.error('Error generating sitemap:', error);
      res.status(500).send('Error generating sitemap');
    }
  });

  // Newsletter subscription (placeholder endpoint)
  app.post("/api/newsletter/subscribe", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email || typeof email !== 'string') {
        return res.status(400).json({ message: "Valid email is required" });
      }
      
      // In a real application, this would integrate with an email service
      res.json({ message: "Successfully subscribed to newsletter" });
    } catch (error) {
      res.status(500).json({ message: "Failed to subscribe to newsletter" });
    }
  });

  // Admin profile endpoints
  app.get("/api/admin/profile", async (req, res) => {
    try {
      // For demo purposes, use a default user ID until proper auth is implemented
      const userId = "demo-user-001";
      
      const author = await activeStorage.getAuthorByUserId(userId);
      res.json(author || {});
    } catch (error) {
      console.error("Profile fetch error:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  app.patch("/api/admin/profile", async (req, res) => {
    try {
      // For demo purposes, use a default user ID until proper auth is implemented
      const userId = "demo-user-001";

      const profileData = req.body;
      
      // Find existing author by userId or create one
      let author = await activeStorage.getAuthorByUserId(userId);
      
      if (author) {
        // Update existing author using userId
        const updatedAuthor = await activeStorage.updateAuthorByUserId(userId, {
          name: profileData.name,
          email: profileData.email,
          bio: profileData.bio,
          avatar: profileData.avatar,
          linkedinUrl: profileData.linkedinUrl,
          instagramUrl: profileData.instagramUrl,
          youtubeUrl: profileData.youtubeUrl,
          githubUrl: profileData.githubUrl,
          portfolioUrl: profileData.portfolioUrl
        });
        res.json({ 
          message: "Profile updated successfully",
          profile: updatedAuthor 
        });
      } else {
        // Create new author
        const newAuthor = await activeStorage.createAuthor({
          name: profileData.name || 'Author',
          email: profileData.email || 'author@example.com',
          bio: profileData.bio,
          avatar: profileData.avatar,
          userId: userId,
          linkedinUrl: profileData.linkedinUrl,
          instagramUrl: profileData.instagramUrl,
          youtubeUrl: profileData.youtubeUrl,
          githubUrl: profileData.githubUrl,
          portfolioUrl: profileData.portfolioUrl
        });
        res.json({ 
          message: "Profile created successfully",
          profile: newAuthor 
        });
      }
    } catch (error) {
      console.error("Profile update error:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Admin endpoints
  app.get("/api/admin/blog-posts", async (req, res) => {
    try {
      const posts = await activeStorage.getBlogPosts({ includeDrafts: true });
      res.json(posts);
    } catch (error) {
      console.error("Error fetching admin blog posts:", error);
      res.status(500).json({ message: "Failed to fetch blog posts" });
    }
  });

  app.get("/api/admin/stats", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "User ID not found" });
      }
      
      const posts = await activeStorage.getBlogPosts({ 
        includeDrafts: true, 
        userId: userId 
      });
      const totalPosts = posts.length;
      const publishedPosts = posts.filter(p => p.isPublished).length;
      const draftPosts = totalPosts - publishedPosts;
      const featuredPosts = posts.filter(p => p.isFeatured).length;
      
      res.json({
        totalPosts,
        publishedPosts,
        draftPosts,
        featuredPosts
      });
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ message: "Failed to fetch statistics" });
    }
  });

  app.put("/api/blog-posts/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const postId = isNaN(parseInt(id)) ? id : parseInt(id);
      const userId = req.isAuthenticated && req.isAuthenticated() ? (req.user as any)?.id : undefined;
      
      // Validate the request body but make fields optional for updates
      const updateData = req.body;
      
      const updatedPost = await activeStorage.updateBlogPost(postId, updateData, userId);
      res.json(updatedPost);
    } catch (err) {
      console.error("Update blog post error:", err);
      if (err instanceof Error) {
        if (err.message === "Not authorized to update this post") {
          res.status(403).json({ message: err.message });
        } else if (err.message === "Blog post not found") {
          res.status(404).json({ message: err.message });
        } else {
          res.status(400).json({ message: "Failed to update blog post", error: err.message });
        }
      } else {
        res.status(400).json({ message: "Failed to update blog post" });
      }
    }
  });

  app.patch("/api/blog-posts/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const postId = isNaN(parseInt(id)) ? id : parseInt(id);
      const userId = req.isAuthenticated && req.isAuthenticated() ? (req.user as any)?.id : undefined;
      
      console.log("PATCH request for post:", postId, "with data:", req.body);
      
      // Validate the request body but make fields optional for updates
      const updateData = req.body;
      
      const updatedPost = await activeStorage.updateBlogPost(postId, updateData, userId);
      console.log("Updated post result:", updatedPost);
      res.json(updatedPost);
    } catch (error) {
      console.error("PATCH blog post error:", error);
      const err = error as Error;
      if (err.message === "Not authorized to update this post") {
        res.status(403).json({ message: err.message });
      } else if (err.message === "Blog post not found") {
        res.status(404).json({ message: err.message });
      } else {
        res.status(400).json({ message: "Failed to update blog post", error: err.message });
      }
    }
  });

  app.delete("/api/blog-posts/:id", async (req, res) => {
    try {
      const postId = parseInt(req.params.id);
      
      // This would need to be implemented in the storage layer
      // For now, return success
      res.json({ message: "Post deleted successfully" });
    } catch (error) {
      res.status(400).json({ message: "Failed to delete blog post" });
    }
  });

  // Comments routes
  app.get("/api/blog-posts/:id/comments", async (req, res) => {
    try {
      const { id } = req.params;
      const numericId = parseInt(id);
      if (isNaN(numericId)) {
        res.status(400).json({ message: "Invalid post ID" });
        return;
      }
      const comments = await activeStorage.getCommentsByPostId(numericId);
      res.json(comments);
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).json({ message: "Failed to fetch comments", error: error.message });
      } else {
        res.status(500).json({ message: "Unknown error occurred" });
      }
    }
  });

  app.post("/api/blog-posts/:id/comments", async (req, res) => {
    try {
      const { id } = req.params;
      const commentData = insertCommentSchema.parse({
        ...req.body,
        blogPostId: parseInt(id)
      });
      
      const comment = await activeStorage.createComment(commentData);
      res.status(201).json(comment);
    } catch (error) {
      console.error("Error creating comment:", error);
      res.status(400).json({ message: "Failed to create comment" });
    }
  });

  app.put("/api/comments/:id/approve", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const comment = await activeStorage.approveComment(parseInt(id));
      res.json(comment);
    } catch (error) {
      console.error("Error approving comment:", error);
      res.status(400).json({ message: "Failed to approve comment" });
    }
  });

  app.delete("/api/comments/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      await activeStorage.deleteComment(parseInt(id));
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting comment:", error);
      res.status(400).json({ message: "Failed to delete comment" });
    }
  });

  // Admin comment management endpoints
  app.get("/api/admin/comments", requireAuth, async (req, res) => {
    try {
      const userId = req.isAuthenticated && req.isAuthenticated() ? (req.user as any)?.id : undefined;
      
      // Get all posts for this user to find their comments
      const userPosts = await activeStorage.getBlogPosts({ 
        limit: 1000, 
        includeDrafts: true,
        userId: userId 
      });
      
      // Get comments for all user posts
      const allComments = [];
      for (const post of userPosts) {
        const postComments = await activeStorage.getCommentsByPostId(Number(post.id));
        const commentsWithPost = postComments.map(comment => ({
          ...comment,
          postTitle: post.title,
          postSlug: post.slug
        }));
        allComments.push(...commentsWithPost);
      }
      
      // Sort by creation date (newest first)
      allComments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      res.json(allComments);
    } catch (error) {
      console.error("Error fetching admin comments:", error);
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  // AI-powered categorization endpoints
  app.get("/api/analytics/categories", requireAuth, async (req, res) => {
    try {
      const posts = await activeStorage.getBlogPosts({ includeDrafts: true });
      const distribution = posts.reduce((acc: Record<string, number>, post) => {
        if (post.tags) {
          post.tags.forEach(tag => {
            acc[tag] = (acc[tag] || 0) + 1;
          });
        }
        return acc;
      }, {});
      res.json(distribution);
    } catch (error) {
      console.error("Error analyzing categories:", error);
      res.status(500).json({ message: "Failed to analyze categories" });
    }
  });

  app.get("/api/analytics/trending", async (req, res) => {
    try {
      const posts = await activeStorage.getBlogPosts({ includeDrafts: false });
      const tagCounts = posts.reduce((acc: Record<string, number>, post) => {
        if (post.tags) {
          post.tags.forEach(tag => {
            acc[tag] = (acc[tag] || 0) + 1;
          });
        }
        return acc;
      }, {});
      const trending = Object.entries(tagCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([tag]) => tag);
      res.json(trending);
    } catch (error) {
      console.error("Error getting trending topics:", error);
      res.status(500).json({ message: "Failed to get trending topics" });
    }
  });

  // AI Tagging endpoints
  app.post('/api/ai-tagging/analyze/:id', requireAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const post = await activeStorage.getBlogPost(id);
      if (!post) {
        return res.status(404).json({ message: 'Blog post not found' });
      }

      const aiService = getAITaggingService();
      const analysis = await aiService.analyzeContent(post);
      
      res.json(analysis);
    } catch (error) {
      console.error('AI analysis error:', error);
      res.status(500).json({ message: 'Failed to analyze content' });
    }
  });

  app.post('/api/ai-tagging/generate-tags', requireAuth, async (req: any, res) => {
    try {
      const { content } = req.body;
      
      if (!content || typeof content !== 'string') {
        return res.status(400).json({ message: 'Content is required' });
      }

      const aiService = getAITaggingService();
      // Since we don't have AI tagging yet, generate basic tags from content
      const words = content.toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(word => word.length > 3);
      
      const uniqueWords = Array.from(new Set(words));
      const tags = uniqueWords.slice(0, 5); // Take first 5 unique words as tags
      
      res.json({ tags });
    } catch (error) {
      console.error('Tag generation error:', error);
      res.status(500).json({ message: 'Failed to generate tags' });
    }
  });

  app.post('/api/ai-tagging/bulk-analyze', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const posts = await activeStorage.getBlogPosts({ userId, limit: 50 });
      const aiService = getAITaggingService();
      
      const results = [];
      for (const post of posts) {
        try {
          const analysis = await aiService.analyzeContent(post);
          results.push({
            postId: post.id,
            title: post.title,
            analysis
          });
          
          // Add delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          console.error(`Failed to analyze post ${post.id}:`, error);
          results.push({
            postId: post.id,
            title: post.title,
            error: 'Analysis failed'
          });
        }
      }
      
      res.json({ results });
    } catch (error) {
      console.error('Bulk analysis error:', error);
      res.status(500).json({ message: 'Failed to perform bulk analysis' });
    }
  });

  // AI Excerpt Generation endpoint (for existing posts)
  app.post('/api/ai-tagging/generate-excerpt/:id', requireAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const post = await activeStorage.getBlogPost(id);
      if (!post) {
        return res.status(404).json({ message: 'Blog post not found' });
      }

      const aiService = getAITaggingService();
      const excerptResult = await aiService.generateExcerpt(post);
      
      res.json(excerptResult);
    } catch (error) {
      console.error('AI excerpt generation error:', error);
      res.status(500).json({ message: 'Failed to generate excerpt' });
    }
  });

  // AI Excerpt Generation from content (for new posts)
  app.post('/api/ai-tagging/generate-excerpt-from-content', async (req: any, res) => {
    try {
      const { title, content } = req.body;
      
      if (!title || !content) {
        return res.status(400).json({ message: 'Title and content are required' });
      }

      // Create a temporary post object for AI processing
      const tempPost = {
        id: 0,
        title,
        content,
        slug: '',
        excerpt: '',
        featuredImage: '',
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: '',
        tags: [],
        isFeatured: false,
        isPublished: false,
        readTime: 0
      };

      const aiService = getAITaggingService();
      const excerptResult = await aiService.generateExcerpt(tempPost);
      
      res.json(excerptResult);
    } catch (error) {
      console.error('AI excerpt generation from content error:', error);
      res.status(500).json({ message: 'Failed to generate excerpt' });
    }
  });

  // ADMIN PAGE: /admin - All posts including drafts for management
  app.get("/api/admin/blog-posts", async (req, res) => {
    try {
      const posts = await activeStorage.getBlogPosts({ 
        includeDrafts: true // ADMIN PAGE: Include both published and draft posts
      });
      console.log(`⚙️ ADMIN PAGE: Found ${posts.length} total posts from MongoDB (including drafts)`);
      res.json(posts);
    } catch (error) {
      console.error("❌ ADMIN PAGE: Error fetching admin blog posts:", error);
      res.status(500).json({ message: "Failed to fetch blog posts" });
    }
  });

  // ADMIN EDIT: Get individual post for editing in admin panel
  app.get("/api/admin/blog-posts/:id", async (req, res) => {
    try {
      const { id } = req.params;
      
      if (!id || Array.isArray(id)) {
        return res.status(400).json({ message: 'Invalid post ID' });
      }
      
      console.log(`⚙️ ADMIN EDIT: Fetching post with ID: ${id}`);
      
      // Handle both numeric and string IDs  
      const postId = isNaN(parseInt(id)) ? id : parseInt(id);
      const post = await activeStorage.getBlogPost(postId);
      
      if (!post) {
        console.log(`❌ ADMIN EDIT: Post not found for ID: ${id}`);
        return res.status(404).json({ message: "Blog post not found" });
      }
      
      console.log(`✅ ADMIN EDIT: Found post "${post.title}" for editing`);
      res.json(post);
    } catch (error) {
      console.error("❌ ADMIN EDIT: Error fetching admin blog post:", error);
      res.status(500).json({ message: "Failed to fetch blog post", error: (error as any).message });
    }
  });

  // ── Image Upload to Cloudinary ──────────────────────────────────
  const imageUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
    fileFilter: (_req, file, cb) => {
      const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
      if (allowed.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Only image files (JPEG, PNG, GIF, WebP, SVG) are allowed'));
      }
    },
  });

  app.post("/api/admin/upload-image", imageUpload.single('image'), async (req: any, res) => {
    try {
      if (!isCloudinaryConfigured()) {
        return res.status(503).json({
          message: "Cloudinary is not configured. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET to your environment.",
        });
      }

      if (!req.file) {
        return res.status(400).json({ message: "No image file provided" });
      }

      console.log(`📸 Uploading image: ${req.file.originalname} (${(req.file.size / 1024).toFixed(1)} KB)`);

      const result = await uploadToCloudinary(req.file.buffer, {
        folder: 'agritech-blog',
      });

      console.log(`✅ Image uploaded: ${result.url}`);

      res.json({
        url: result.url,
        publicId: result.publicId,
        width: result.width,
        height: result.height,
      });
    } catch (error) {
      console.error("❌ Image upload error:", error);
      const message = error instanceof Error ? error.message : "Failed to upload image";
      res.status(500).json({ message });
    }
  });

  app.delete("/api/admin/upload-image/:publicId", async (req, res) => {
    try {
      if (!isCloudinaryConfigured()) {
        return res.status(503).json({ message: "Cloudinary is not configured." });
      }

      const { publicId } = req.params;
      await deleteFromCloudinary(publicId);

      console.log(`🗑️ Image deleted: ${publicId}`);
      res.json({ message: "Image deleted successfully" });
    } catch (error) {
      console.error("❌ Image delete error:", error);
      res.status(500).json({ message: "Failed to delete image" });
    }
  });

  app.get("/api/admin/cloudinary-status", (_req, res) => {
    res.json({ configured: isCloudinaryConfigured() });
  });

  app.post("/api/admin/blog-posts", async (req, res) => {
    try {
      console.log("Creating/updating admin blog post with data:", req.body);
      
      const postData = req.body;
      
      // Add default userId for demo purposes
      if (!postData.userId) {
        postData.userId = "demo-user-001";
      }
      
      // If there's an existing post ID, update it; otherwise create new
      if (postData.id) {
        const updatedPost = await activeStorage.updateBlogPost(postData.id, postData, postData.userId);
        res.json(updatedPost);
      } else {
        const newPost = await activeStorage.createBlogPost(postData);
        res.status(201).json(newPost);
      }
    } catch (error) {
      console.error("Error creating/updating admin blog post:", error);
      if (error instanceof Error) {
        res.status(500).json({ message: "Failed to save blog post", error: error.message });
      } else {
        res.status(500).json({ message: "Failed to save blog post" });
      }
    }
  });

  app.patch("/api/admin/blog-posts/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const postId = isNaN(parseInt(id)) ? id : parseInt(id);
      
      console.log("PATCH admin request for post:", postId, "with data:", req.body);
      
      const updateData = req.body;
      // Admin routes bypass user authorization - pass undefined for userId
      const updatedPost = await activeStorage.updateBlogPost(postId, updateData, undefined);
      console.log("Admin updated post result:", updatedPost);
      res.json(updatedPost);
    } catch (error) {
      console.error("PATCH admin blog post error:", error);
      res.status(500).json({ message: "Failed to update blog post", error: (error as any).message });
    }
  });

  app.delete("/api/admin/blog-posts/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const postId = isNaN(parseInt(id)) ? id : parseInt(id);
      
      console.log("DELETE admin request for post:", postId);
      
      // TODO: Implement actual deletion in storage layer
      // For now, return success (same as regular delete route)
      res.json({ message: "Post deleted successfully" });
    } catch (error) {
      console.error("DELETE admin blog post error:", error);
      res.status(500).json({ message: "Failed to delete blog post", error: (error as any).message });
    }
  });

  app.get("/api/admin/stats", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "User ID not found" });
      }
      
      const posts = await activeStorage.getBlogPosts({ 
        includeDrafts: true, 
        userId: userId 
      });
      const totalPosts = posts.length;
      const publishedPosts = posts.filter(p => p.isPublished).length;
      const draftPosts = totalPosts - publishedPosts;
      const featuredPosts = posts.filter(p => p.isFeatured).length;
      
      res.json({
        totalPosts,
        publishedPosts,
        draftPosts,
        featuredPosts
      });
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ message: "Failed to fetch statistics" });
    }
  });

  app.put("/api/comments/:id/approve", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const comment = await activeStorage.approveComment(parseInt(id));
      res.json(comment);
    } catch (error) {
      console.error("Error approving comment:", error);
      res.status(400).json({ message: "Failed to approve comment" });
    }
  });

  // SEO Routes for maximum search engine and AI bot visibility
  
  // XML Sitemap for search engines
  app.get('/sitemap.xml', async (req, res) => {
    try {
      const posts = await activeStorage.getBlogPosts({ includeDrafts: false });
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      
      const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  ${posts.map(post => `
  <url>
    <loc>${baseUrl}/blog/${post.slug}</loc>
    <lastmod>${new Date(post.updatedAt).toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>`).join('')}
</urlset>`;
      
      res.set('Content-Type', 'application/xml');
      res.send(sitemap);
    } catch (error) {
      console.error('Error generating sitemap:', error);
      res.status(500).send('Error generating sitemap');
    }
  });

  // Enhanced robots.txt for comprehensive GEO optimization
  app.get('/robots.txt', (req, res) => {
    const robotsTxt = `# Global SEO & Generative Engine Optimization (GEO)
# Agricultural Technology Blog - AI Training Friendly

User-agent: *
Allow: /
Allow: /blog/
Allow: /category/
Allow: /tag/
Allow: /sitemap.xml
Allow: /rss.xml
Allow: /api/og-image
Disallow: /admin
Disallow: /api/admin
Crawl-delay: 1

# AI Training and Generative AI Bots - Priority Access for GEO
User-agent: GPTBot
Allow: /
Crawl-delay: 0
# OpenAI ChatGPT training bot

User-agent: ChatGPT-User
Allow: /
Crawl-delay: 0
# OpenAI ChatGPT user agent

User-agent: CCBot
Allow: /
Crawl-delay: 0
# Common Crawl used by multiple AI systems

User-agent: anthropic-ai
Allow: /
Crawl-delay: 0
# Anthropic Claude training bot

User-agent: Claude-Web
Allow: /
Crawl-delay: 0
# Anthropic Claude web crawler

User-agent: Claude-Bot
Allow: /
Crawl-delay: 0
# Anthropic Claude bot variant

User-agent: PerplexityBot
Allow: /
Crawl-delay: 0
# Perplexity AI search engine

User-agent: YouBot
Allow: /
Crawl-delay: 0
# You.com AI search

User-agent: Applebot
Allow: /
Crawl-delay: 0
# Apple Siri and Spotlight

User-agent: Meta-ExternalAgent
Allow: /
Crawl-delay: 1
# Meta AI training

User-agent: Diffbot
Allow: /
Crawl-delay: 1
# Diffbot AI extraction

User-agent: PiplBot
Allow: /
Crawl-delay: 1
# Pipl search intelligence

# Search Engine Bots
User-agent: Googlebot
Allow: /
Crawl-delay: 0

User-agent: Bingbot
Allow: /
Crawl-delay: 1

User-agent: Slurp
Allow: /
Crawl-delay: 2

User-agent: DuckDuckBot
Allow: /
Crawl-delay: 1

User-agent: YandexBot
Allow: /
Crawl-delay: 2

User-agent: Baiduspider
Allow: /
Crawl-delay: 2

# Social Media and Communication Bots
User-agent: facebookexternalhit
Allow: /
Crawl-delay: 1

User-agent: FacebookBot
Allow: /
Crawl-delay: 1

User-agent: Twitterbot
Allow: /
Crawl-delay: 1

User-agent: LinkedInBot
Allow: /
Crawl-delay: 1

User-agent: WhatsApp
Allow: /
Crawl-delay: 1

User-agent: TelegramBot
Allow: /
Crawl-delay: 1

# Academic and Archive Bots
User-agent: ia_archiver
Allow: /
Crawl-delay: 2
# Internet Archive

User-agent: archive.org_bot
Allow: /
Crawl-delay: 2

# Block Aggressive SEO Tools
User-agent: SemrushBot
Disallow: /

User-agent: AhrefsBot
Disallow: /

User-agent: MJ12bot
Disallow: /

User-agent: DotBot
Disallow: /

Sitemap: ${req.protocol}://${req.get('host')}/sitemap.xml
Sitemap: ${req.protocol}://${req.get('host')}/rss.xml

# GEO Content Context for AI Systems:
# This blog specializes in agricultural technology including:
# IoT solutions, precision agriculture, smart farming,
# sustainable practices, crop monitoring, and environmental optimization
`;
    
    res.set('Content-Type', 'text/plain');
    res.send(robotsTxt);
  });

  // RSS Feed for content syndication
  app.get('/rss.xml', async (req, res) => {
    try {
      const posts = await activeStorage.getBlogPosts({ limit: 50, includeDrafts: false });
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      
      const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>AgriTech Innovation Hub - Advanced Agricultural Technology Insights</title>
  <link>${baseUrl}</link>
  <description>Discover cutting-edge agricultural technology, IoT solutions, and sustainable farming practices. Expert insights on precision agriculture, crop monitoring, and smart farming innovations for global impact.</description>
  <language>en-us</language>
  <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
  <atom:link href="${baseUrl}/rss.xml" rel="self" type="application/rss+xml"/>
  <managingEditor>contact@agritech.com (AgriTech Innovation Hub)</managingEditor>
  <webMaster>contact@agritech.com (AgriTech Innovation Hub)</webMaster>
  <category>Agricultural Technology</category>
  <category>IoT Solutions</category>
  <category>Precision Agriculture</category>
  <category>Sustainable Farming</category>
  <category>Smart Agriculture</category>
  ${posts.map(post => `
  <item>
    <title><![CDATA[${post.title}]]></title>
    <link>${baseUrl}/blog/${post.slug}</link>
    <guid isPermaLink="true">${baseUrl}/blog/${post.slug}</guid>
    <description><![CDATA[${post.excerpt}]]></description>
    <content:encoded><![CDATA[${post.content}]]></content:encoded>
    <pubDate>${new Date(post.createdAt).toUTCString()}</pubDate>
    <author>San (san@agritech.com)</author>
    <category><![CDATA[${post.tags?.join(", ") || "Uncategorized"}]]></category>
    ${post.tags?.map(tag => `<category><![CDATA[${tag}]]></category>`).join('') || ''}
    ${post.featuredImage ? `<enclosure url="${post.featuredImage}" type="image/jpeg"/>` : ''}
  </item>`).join('')}
</channel>
</rss>`;
      
      res.set('Content-Type', 'application/rss+xml');
      res.send(rss);
    } catch (error) {
      console.error('Error generating RSS feed:', error);
      res.status(500).send('Error generating RSS feed');
    }
  });

  // SEO Meta Tags API - Get specific post metadata for dynamic head tags
  app.get('/api/meta/:slug', async (req, res) => {
    try {
      const { slug } = req.params;
      const post = await activeStorage.getBlogPostBySlug(slug);
      
      if (!post || !post.isPublished) {
        return res.status(404).json({ error: 'Post not found' });
      }

      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const postUrl = `${baseUrl}/blog/${post.slug}`;
      const ogImageUrl = post.featuredImage || 
        `${baseUrl}/api/og-image?title=${encodeURIComponent(post.title)}&category=${encodeURIComponent(post.tags?.[0] || 'Technology')}`;

      res.json({
        title: post.title,
        description: post.excerpt,
        keywords: post.tags?.join(', ') || 'agricultural technology, smart farming',
        'og:title': post.title,
        'og:description': post.excerpt,
        'og:image': ogImageUrl,
        'og:url': postUrl,
        'og:type': 'article',
        'og:site_name': 'AgriTech Innovation Hub',
        'twitter:card': 'summary_large_image',
        'twitter:title': post.title,
        'twitter:description': post.excerpt,
        'twitter:image': ogImageUrl,
        'article:published_time': new Date(post.createdAt).toISOString(),
        'article:modified_time': new Date(post.updatedAt).toISOString(),
        'article:author': 'San',
        'article:section': post.tags?.[0] || 'Technology',
        'article:tag': post.tags || [],
        canonicalUrl: postUrl,
        readTime: post.readTime,
        author: 'San',
        publishedDate: new Date(post.createdAt).toISOString(),
        modifiedDate: new Date(post.updatedAt).toISOString()
      });
    } catch (error) {
      console.error('Error fetching post metadata:', error);
      res.status(500).json({ error: 'Failed to fetch metadata' });
    }
  });

  // Open Graph image generator for social sharing
  app.get('/api/og-image', async (req, res) => {
    const { title, category } = req.query as { title?: string; category?: string };
    
    const ogTitle = title || 'San\'s Blog';
    const ogCategory = category || 'Blog Post';
    
    const svg = `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#2D5016;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#1a3009;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="1200" height="630" fill="url(#bg)"/>
      <text x="60" y="120" font-family="Arial, sans-serif" font-size="32" font-weight="bold" fill="#ffffff" opacity="0.8">${ogCategory}</text>
      <text x="60" y="220" font-family="Arial, sans-serif" font-size="56" font-weight="bold" fill="#ffffff" text-anchor="start">
        <tspan x="60" dy="0">${ogTitle.length > 40 ? ogTitle.substring(0, 40) + '...' : ogTitle}</tspan>
      </text>
      <text x="60" y="520" font-family="Arial, sans-serif" font-size="28" fill="#ffffff" opacity="0.9">San's Blog</text>
      <text x="60" y="560" font-family="Arial, sans-serif" font-size="24" fill="#ffffff" opacity="0.7">Insights on Technology and Innovation</text>
      <circle cx="1050" cy="150" r="80" fill="#ffffff" opacity="0.1"/>
      <circle cx="1100" cy="400" r="60" fill="#ffffff" opacity="0.08"/>
      <circle cx="950" cy="500" r="40" fill="#ffffff" opacity="0.06"/>
    </svg>`;
    
    res.set('Content-Type', 'image/svg+xml');
    res.send(svg);
  });

  // Social media crawler detection utility
  function isSocialMediaCrawler(userAgent: string): boolean {
    const crawlers = [
      'facebookexternalhit', 'twitterbot', 'linkedinbot', 'whatsapp',
      'telegrambot', 'slackbot', 'discordbot', 'pinterestbot',
      'SkypeUriPreview', 'GoogleBot', 'bingbot'
    ];
    return crawlers.some(crawler => 
      userAgent.toLowerCase().includes(crawler.toLowerCase())
    );
  }

  // Blog post route with crawler detection for Open Graph
  app.get('/blog/:slug', async (req, res) => {
    try {
      const { slug } = req.params;
      const userAgent = req.get('User-Agent') || '';
      
      // Check if it's a social media crawler
      if (isSocialMediaCrawler(userAgent)) {
        // Serve Open Graph optimized page for crawlers
        const post = await activeStorage.getBlogPostBySlug(slug);
        
        if (!post || !post.isPublished) {
          return res.status(404).send('Post not found');
        }

        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const currentUrl = `${baseUrl}/blog/${post.slug}`;
        const ogImageUrl = post.featuredImage || 
          `${baseUrl}/api/og-image?title=${encodeURIComponent(post.title)}&category=${encodeURIComponent(post.tags?.[0] || 'Technology')}&author=San&excerpt=${encodeURIComponent(post.excerpt.substring(0, 100))}`;
        
        const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${post.title} | San's Agricultural Technology Blog</title>
  <meta name="description" content="${post.excerpt}">
  
  <!-- Open Graph Meta Tags -->
  <meta property="og:title" content="${post.title}">
  <meta property="og:description" content="${post.excerpt}">
  <meta property="og:type" content="article">
  <meta property="og:url" content="${currentUrl}">
  <meta property="og:site_name" content="San's Agricultural Technology Blog">
  <meta property="og:image" content="${ogImageUrl}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="${post.title} - Featured Image">
  
  <!-- Article Meta Tags -->
  <meta property="article:author" content="San">
  <meta property="article:published_time" content="${post.createdAt}">
  <meta property="article:modified_time" content="${post.updatedAt}">
  <meta property="article:section" content="${post.tags?.[0] || 'Technology'}">
  ${post.tags?.map(tag => `<meta property="article:tag" content="${tag}">`).join('\n  ')}
  
  <!-- Twitter Card Meta Tags -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${post.title}">
  <meta name="twitter:description" content="${post.excerpt}">
  <meta name="twitter:image" content="${ogImageUrl}">
  <meta name="twitter:site" content="@SansAgriTech">
  <meta name="twitter:creator" content="@SansAgriTech">
  
  <!-- Keywords -->
  <meta name="keywords" content="${post.tags?.join(', ')}, agricultural technology, precision farming, smart agriculture">
</head>
<body>
  <h1>${post.title}</h1>
  <p>${post.excerpt}</p>
  <p><a href="${currentUrl}">Read full article</a></p>
</body>
</html>`;

        return res.send(html);
      } else {
        // For regular users, serve the React app
        // This will be handled by the client-side routing
        return res.redirect(`/#/blog/${slug}`);
      }
    } catch (error) {
      console.error('Blog post route error:', error);
      return res.status(500).send('Server error');
    }
  });

  // JSON-LD structured data for enhanced AI understanding
  app.get('/api/structured-data', async (req, res) => {
    try {
      const posts = await activeStorage.getBlogPosts({ limit: 10, includeDrafts: false });
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      
      const structuredData = {
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "WebSite",
            "@id": `${baseUrl}/#website`,
            "url": baseUrl,
            "name": "AgriTech Innovation Hub",
            "description": "Leading platform for agricultural technology insights, IoT solutions, and sustainable farming practices worldwide",
            "keywords": "agricultural technology, precision agriculture, IoT farming, smart agriculture, crop monitoring, sustainable farming, AgriTech innovation",
            "potentialAction": {
              "@type": "SearchAction",
              "target": {
                "@type": "EntryPoint",
                "urlTemplate": `${baseUrl}/search?q={search_term_string}`
              },
              "query-input": "required name=search_term_string"
            },
            "inLanguage": "en-US"
          },
          {
            "@type": "Organization",
            "@id": `${baseUrl}/#organization`,
            "name": "AgriTech Innovation Hub",
            "url": baseUrl,
            "description": "Global leader in agricultural technology innovation and smart farming solutions",
            "foundingDate": "2024",
            "logo": {
              "@type": "ImageObject",
              "url": `${baseUrl}/logo.png`,
              "width": 512,
              "height": 512
            },
            "contactPoint": {
              "@type": "ContactPoint",
              "email": "contact@agritech.com",
              "contactType": "customer service"
            },
            "areaServed": "Worldwide",
            "knowsAbout": [
              "Agricultural Technology",
              "Precision Agriculture", 
              "IoT Solutions",
              "Smart Farming",
              "Crop Monitoring",
              "Sustainable Agriculture",
              "Farm Automation",
              "Agricultural Innovation"
            ]
          },
          {
            "@type": "Person",
            "@id": `${baseUrl}/#author`,
            "name": "AgriTech Expert",
            "email": "contact@agritech.com",
            "description": "Agricultural technology expert and innovation leader specializing in IoT solutions and sustainable farming practices",
            "url": baseUrl,
            "jobTitle": "Agricultural Technology Expert",
            "knowsAbout": [
              "Agricultural Technology",
              "IoT Engineering", 
              "Precision Agriculture",
              "Smart Farming Solutions",
              "Sustainable Agriculture",
              "Crop Data Analytics"
            ]
          },
          ...posts.slice(0, 5).map(post => ({
            "@type": "BlogPosting",
            "@id": `${baseUrl}/blog/${post.slug}#article`,
            "headline": post.title,
            "description": post.excerpt,
            "url": `${baseUrl}/blog/${post.slug}`,
            "datePublished": new Date(post.createdAt).toISOString(),
            "dateModified": new Date(post.updatedAt).toISOString(),
            "author": {
              "@id": `${baseUrl}/#author`
            },
            "publisher": {
              "@id": `${baseUrl}/#organization`
            },
            "mainEntityOfPage": {
              "@type": "WebPage",
              "@id": `${baseUrl}/blog/${post.slug}`
            },
            "image": post.featuredImage,
            "articleSection": post.tags?.join(", ") || "Uncategorized",
            "keywords": post.tags?.join(', ') || '',
            "wordCount": Math.ceil(post.content.length / 5),
            "timeRequired": `PT${post.readTime}M`,
            "inLanguage": "en-US",
            "about": {
              "@type": "Thing",
              "name": "Agricultural Technology",
              "description": "Innovative solutions for modern farming and agricultural practices"
            }
          }))
        ]
      };
      
      res.json(structuredData);
    } catch (error) {
      console.error('Error generating structured data:', error);
      res.status(500).json({ error: 'Error generating structured data' });
    }
  });

  // Admin endpoint to set MongoDB connection
  app.post('/api/admin/connect-mongodb', requireAuth, async (req: any, res) => {
    const { uri, dbName } = req.body;
    const userId = req.user?.id;
    
    if (!uri) {
      return res.status(400).json({ success: false, error: 'Missing MongoDB URI' });
    }
    
    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }
    
    try {
      await setDynamicMongoConnection(uri, dbName || 'blog');
      console.log(`User ${userId} connected to MongoDB: ${dbName || 'blog'}`);
      res.json({ success: true, message: 'Connected to MongoDB successfully' });
    } catch (err) {
      console.error(`MongoDB connection failed for user ${userId}:`, err);
      res.status(500).json({ success: false, error: (err as Error).message });
    }
  });

  // Analytics endpoints
  app.get("/api/analytics/category-distribution", async (req: Request, res: Response) => {
    try {
      const posts = await activeStorage.getBlogPosts();
      // Since we've removed categories, we'll use tags instead
      const distribution = posts.reduce((acc: Record<string, number>, post) => {
        if (post.tags) {
          post.tags.forEach(tag => {
            acc[tag] = (acc[tag] || 0) + 1;
          });
        }
        return acc;
      }, {});
      res.json(distribution);
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).json({ message: "Failed to get tag distribution", error: error.message });
      } else {
        res.status(500).json({ message: "Unknown error occurred" });
      }
    }
  });

  app.get("/api/analytics/trending", async (req: Request, res: Response) => {
    try {
      const posts = await activeStorage.getBlogPosts();
      // Get top 10 most used tags
      const tagCounts = posts.reduce((acc: Record<string, number>, post) => {
        if (post.tags) {
          post.tags.forEach(tag => {
            acc[tag] = (acc[tag] || 0) + 1;
          });
        }
        return acc;
      }, {});
      const trending = Object.entries(tagCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([tag]) => tag);
      res.json(trending);
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).json({ message: "Failed to get trending topics", error: error.message });
      } else {
        res.status(500).json({ message: "Unknown error occurred" });
      }
    }
  });

  // Error handling middleware
  app.use((err: unknown, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof Error) {
    if (err.message === "Not authorized to update this post") {
      res.status(403).json({ message: err.message });
    } else if (err.message === "Blog post not found") {
      res.status(404).json({ message: err.message });
    } else {
      res.status(500).json({ message: "Internal server error", error: err.message });
    }
  } else {
    res.status(500).json({ message: "Unknown error occurred" });
  }
});

  // Notion Sync API Routes
  app.get('/api/notion-sync/list-pages', async (req, res) => {
    try {
      const extractor = new NotionContentExtractor();
      const statusFilter = req.query.status as string | undefined;
      const pages = await extractor.queryDatabase(statusFilter);

      const pageList = await Promise.all(
        pages.map(async (page: any) => {
          try {
            const properties = page.properties;

            // Auto-detect title property
            let title = 'Untitled';
            const titleProperty = properties[notionConfig.notion.propertyMappings.title];
            if (titleProperty && titleProperty.type === 'title') {
              title = titleProperty.title.map((t: any) => t.plain_text).join('');
            } else {
              // Search for any title property
              for (const [key, prop] of Object.entries(properties)) {
                if ((prop as any).type === 'title') {
                  title = (prop as any).title.map((t: any) => t.plain_text).join('') || 'Untitled';
                  break;
                }
              }
            }

            const statusProperty = properties[notionConfig.notion.propertyMappings.status];
            const status = statusProperty && statusProperty.type === 'status'
              ? statusProperty.status?.name || 'Unknown'
              : 'Unknown';

            const tagsProperty = properties[notionConfig.notion.propertyMappings.tags];
            const tags = tagsProperty && tagsProperty.type === 'multi_select'
              ? tagsProperty.multi_select.map((t: any) => t.name)
              : [];

            return {
              id: page.id,
              title,
              status,
              lastEdited: page.last_edited_time,
              created: page.created_time,
              tags,
              url: page.url,
              hasImages: false,
            };
          } catch (error) {
            console.error(`Error processing page ${page.id}:`, error);
            return null;
          }
        })
      );

      const validPages = pageList.filter((p: any) => p !== null);

      res.json({
        success: true,
        pages: validPages,
        total: validPages.length,
        databaseId: notionConfig.notion.databaseId,
      });
    } catch (error: any) {
      console.error('Error fetching Notion pages:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch pages',
      });
    }
  });

  app.post('/api/notion-sync/process-page', async (req, res) => {
    try {
      const { pageId } = req.body;

      if (!pageId) {
        return res.status(400).json({ error: 'Missing pageId parameter' });
      }

      const pipeline = new BlogAutomationPipeline();

      const result = await pipeline.processNotionPage(pageId, async (draft: any) => {
        const activeStore = await storage.getInstance();
        const post = await activeStore.createBlogPost(draft);
        return { id: post.id.toString() };
      });

      if (result.success) {
        res.json({
          success: true,
          message: 'Blog post draft created successfully',
          data: {
            draftId: result.draftId,
            notionPageId: result.notionPageId,
            processingTimeMs: result.metadata?.processingTimeMs,
            imagesAnalyzed: result.metadata?.imagesAnalyzed,
          },
        });
      } else {
        res.status(500).json({
          success: false,
          error: result.error || 'Processing failed',
          notionPageId: result.notionPageId,
        });
      }
    } catch (error: any) {
      console.error('Error processing page:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Unknown error occurred',
      });
    }
  });

  // Preview Notion page as markdown
  app.get('/api/notion-sync/preview/:pageId', async (req, res) => {
    try {
      const { pageId } = req.params;

      if (!pageId) {
        return res.status(400).json({ error: 'Missing pageId parameter' });
      }

      const extractor = new NotionContentExtractor();
      const pageData = await extractor.extractPage(pageId);

      res.json({
        success: true,
        preview: {
          title: pageData.title,
          markdown: pageData.textContent,
          images: pageData.images.map(img => ({
            url: img.url,
            alt: img.caption || 'Image',
          })),
          videos: pageData.videos.map(vid => ({
            url: vid.url,
          })),
          metadata: pageData.metadata,
        },
      });
    } catch (error: any) {
      console.error('Error previewing page:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to preview page',
      });
    }
  });

  app.get('/api/notion-sync/test', async (req, res) => {
    try {
      const configValidation = validateNotionConfig();

      if (!configValidation.valid) {
        return res.status(500).json({
          success: false,
          error: 'Configuration validation failed',
          details: configValidation.errors,
          configSummary: getConfigSummary(),
        });
      }

      const pipeline = new BlogAutomationPipeline();
      const testResults = await pipeline.testPipeline();

      const allPassed = testResults.notionConnected &&
                       testResults.claudeConnected &&
                       testResults.configValid;

      res.status(allPassed ? 200 : 500).json({
        success: allPassed,
        message: allPassed ? 'All systems operational' : 'Some systems failed',
        tests: {
          notionConnection: {
            passed: testResults.notionConnected,
            message: testResults.notionConnected ? 'Connected' : 'Failed',
          },
          claudeConnection: {
            passed: testResults.claudeConnected,
            message: testResults.claudeConnected ? 'Connected' : 'Failed',
          },
          configuration: {
            passed: testResults.configValid,
            message: testResults.configValid ? 'Valid' : 'Invalid',
          },
        },
        errors: testResults.errors,
        config: getConfigSummary(),
      });
    } catch (error: any) {
      console.error('Test failed:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Test failed',
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
