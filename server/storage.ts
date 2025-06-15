import { 
  users, categories, authors, blogPosts,
  type User, type InsertUser,
  type Category, type InsertCategory,
  type Author, type InsertAuthor,
  type BlogPost, type InsertBlogPost,
  type BlogPostWithDetails
} from "@shared/schema";
import { MongoStorage } from "./mongodb-storage-updated";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Categories
  getCategories(): Promise<Category[]>;
  getCategoryBySlug(slug: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  
  // Authors
  getAuthors(): Promise<Author[]>;
  getAuthor(id: number): Promise<Author | undefined>;
  createAuthor(author: InsertAuthor): Promise<Author>;
  
  // Blog Posts
  getBlogPosts(options?: { categorySlug?: string; limit?: number; offset?: number; featured?: boolean }): Promise<BlogPostWithDetails[]>;
  getBlogPostBySlug(slug: string): Promise<BlogPostWithDetails | undefined>;
  getBlogPost(id: number): Promise<BlogPostWithDetails | undefined>;
  createBlogPost(post: InsertBlogPost): Promise<BlogPost>;
  searchBlogPosts(query: string): Promise<BlogPostWithDetails[]>;
  getRelatedPosts(postId: number, categoryId: number, limit?: number): Promise<BlogPostWithDetails[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private categories: Map<number, Category>;
  private authors: Map<number, Author>;
  private blogPosts: Map<number, BlogPost>;
  private currentUserId: number;
  private currentCategoryId: number;
  private currentAuthorId: number;
  private currentBlogPostId: number;

  constructor() {
    this.users = new Map();
    this.categories = new Map();
    this.authors = new Map();
    this.blogPosts = new Map();
    this.currentUserId = 1;
    this.currentCategoryId = 1;
    this.currentAuthorId = 1;
    this.currentBlogPostId = 1;
    
    this.seedData();
  }

  private seedData() {
    // Seed categories
    const sampleCategories: InsertCategory[] = [
      { name: "Precision Farming", slug: "precision-farming", description: "Advanced technology in farming", color: "#52B788" },
      { name: "Hydroponics", slug: "hydroponics", description: "Soilless farming techniques", color: "#95D5B2" },
      { name: "Sustainability", slug: "sustainability", description: "Sustainable agriculture practices", color: "#95D5B2" },
      { name: "Biotechnology", slug: "biotechnology", description: "Agricultural biotechnology advances", color: "#FFD60A" },
      { name: "Automation", slug: "automation", description: "Farm automation and robotics", color: "#8B4513" },
      { name: "Smart Irrigation", slug: "smart-irrigation", description: "Water-smart farming solutions", color: "#52B788" },
      { name: "Vertical Farming", slug: "vertical-farming", description: "Indoor and vertical farming", color: "#FFD60A" },
    ];

    sampleCategories.forEach(category => {
      this.createCategory(category);
    });

    // Seed authors
    const sampleAuthors: InsertAuthor[] = [
      { name: "Dr. Sarah Chen", email: "sarah@agrotech.com", bio: "Agricultural technology researcher", avatar: "" },
      { name: "Mark Johnson", email: "mark@agrotech.com", bio: "Precision farming specialist", avatar: "" },
      { name: "Emma Rodriguez", email: "emma@agrotech.com", bio: "Sustainability expert", avatar: "" },
      { name: "Alex Thompson", email: "alex@agrotech.com", bio: "Smart irrigation engineer", avatar: "" },
      { name: "Lisa Park", email: "lisa@agrotech.com", bio: "Vertical farming researcher", avatar: "" },
      { name: "Dr. James Wilson", email: "james@agrotech.com", bio: "Agricultural geneticist", avatar: "" },
      { name: "Rachel Kim", email: "rachel@agrotech.com", bio: "Robotics engineer", avatar: "" },
    ];

    sampleAuthors.forEach(author => {
      this.createAuthor(author);
    });

    // Seed blog posts
    const samplePosts: InsertBlogPost[] = [
      {
        title: "Revolutionary Hydroponic Systems",
        slug: "revolutionary-hydroponic-systems",
        excerpt: "Exploring how soilless farming techniques are transforming agricultural productivity and resource efficiency in modern farming operations.",
        content: "Hydroponic systems represent a paradigm shift in agricultural production...",
        featuredImage: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=600",
        categoryId: 2,
        authorId: 1,
        readTime: 5,
        isFeatured: true,
        isPublished: true,
      },
      {
        title: "AI-Powered Crop Monitoring",
        slug: "ai-powered-crop-monitoring",
        excerpt: "How artificial intelligence and drone technology are revolutionizing crop health monitoring and yield prediction systems.",
        content: "Artificial intelligence is transforming agriculture through advanced monitoring systems...",
        featuredImage: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=600",
        categoryId: 1,
        authorId: 2,
        readTime: 8,
        isFeatured: true,
        isPublished: true,
      },
      {
        title: "Agrivoltaics: Farming Under Solar",
        slug: "agrivoltaics-farming-under-solar",
        excerpt: "Combining solar energy production with agricultural practices to maximize land use efficiency and create sustainable farming solutions.",
        content: "Agrivoltaics represents an innovative approach to sustainable agriculture...",
        featuredImage: "https://images.unsplash.com/photo-1466611653911-95081537e5b7?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=600",
        categoryId: 3,
        authorId: 3,
        readTime: 6,
        isFeatured: true,
        isPublished: true,
      },
      {
        title: "Water-Smart Solutions for Modern Agriculture",
        slug: "water-smart-solutions-modern-agriculture",
        excerpt: "Implementing IoT-based irrigation systems that optimize water usage while maximizing crop yield through real-time monitoring.",
        content: "Smart irrigation systems are becoming essential for sustainable agriculture...",
        featuredImage: "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=400",
        categoryId: 6,
        authorId: 4,
        readTime: 7,
        isFeatured: false,
        isPublished: true,
      },
      {
        title: "The Rise of Vertical Farming Technologies",
        slug: "rise-vertical-farming-technologies",
        excerpt: "How controlled environment agriculture is revolutionizing food production in urban areas with minimal space requirements.",
        content: "Vertical farming is transforming urban agriculture with innovative technologies...",
        featuredImage: "https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=400",
        categoryId: 7,
        authorId: 5,
        readTime: 9,
        isFeatured: false,
        isPublished: true,
      },
      {
        title: "Autonomous Farming: The Future is Here",
        slug: "autonomous-farming-future-is-here",
        excerpt: "Exploring how robotic systems are transforming agricultural labor and enabling 24/7 farm monitoring and maintenance.",
        content: "Autonomous farming technologies are revolutionizing agricultural operations...",
        featuredImage: "https://images.unsplash.com/photo-1500595046743-cd271d694d30?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=400",
        categoryId: 5,
        authorId: 7,
        readTime: 6,
        isFeatured: false,
        isPublished: true,
      },
    ];

    samplePosts.forEach(post => {
      this.createBlogPost(post);
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Category methods
  async getCategories(): Promise<Category[]> {
    return Array.from(this.categories.values());
  }

  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    return Array.from(this.categories.values()).find(category => category.slug === slug);
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const id = this.currentCategoryId++;
    const category: Category = { 
      ...insertCategory, 
      id,
      color: insertCategory.color || "#52B788",
      description: insertCategory.description || null
    };
    this.categories.set(id, category);
    return category;
  }

  // Author methods
  async getAuthors(): Promise<Author[]> {
    return Array.from(this.authors.values());
  }

  async getAuthor(id: number): Promise<Author | undefined> {
    return this.authors.get(id);
  }

  async createAuthor(insertAuthor: InsertAuthor): Promise<Author> {
    const id = this.currentAuthorId++;
    const author: Author = { 
      ...insertAuthor, 
      id,
      bio: insertAuthor.bio || null,
      avatar: insertAuthor.avatar || null
    };
    this.authors.set(id, author);
    return author;
  }

  // Blog post methods
  async getBlogPosts(options: { categorySlug?: string; limit?: number; offset?: number; featured?: boolean } = {}): Promise<BlogPostWithDetails[]> {
    let posts = Array.from(this.blogPosts.values()).filter(post => post.isPublished);
    
    if (options.featured !== undefined) {
      posts = posts.filter(post => post.isFeatured === options.featured);
    }
    
    if (options.categorySlug) {
      const category = await this.getCategoryBySlug(options.categorySlug);
      if (category) {
        posts = posts.filter(post => post.categoryId === category.id);
      }
    }
    
    // Sort by creation date (newest first)
    posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    if (options.offset) {
      posts = posts.slice(options.offset);
    }
    
    if (options.limit) {
      posts = posts.slice(0, options.limit);
    }
    
    return Promise.all(posts.map(async post => {
      const category = await this.categories.get(post.categoryId)!;
      const author = await this.authors.get(post.authorId)!;
      return { ...post, category, author };
    }));
  }

  async getBlogPostBySlug(slug: string): Promise<BlogPostWithDetails | undefined> {
    const post = Array.from(this.blogPosts.values()).find(post => post.slug === slug && post.isPublished);
    if (!post) return undefined;
    
    const category = this.categories.get(post.categoryId)!;
    const author = this.authors.get(post.authorId)!;
    return { ...post, category, author };
  }

  async getBlogPost(id: number): Promise<BlogPostWithDetails | undefined> {
    const post = this.blogPosts.get(id);
    if (!post || !post.isPublished) return undefined;
    
    const category = this.categories.get(post.categoryId)!;
    const author = this.authors.get(post.authorId)!;
    return { ...post, category, author };
  }

  async createBlogPost(insertPost: InsertBlogPost): Promise<BlogPost> {
    const id = this.currentBlogPostId++;
    const now = new Date();
    const post: BlogPost = { 
      ...insertPost, 
      id, 
      readTime: insertPost.readTime || 5,
      isFeatured: insertPost.isFeatured || false,
      isPublished: insertPost.isPublished || true,
      createdAt: now,
      updatedAt: now
    };
    this.blogPosts.set(id, post);
    return post;
  }

  async searchBlogPosts(query: string): Promise<BlogPostWithDetails[]> {
    const searchTerm = query.toLowerCase();
    const posts = Array.from(this.blogPosts.values()).filter(post => 
      post.isPublished && (
        post.title.toLowerCase().includes(searchTerm) ||
        post.excerpt.toLowerCase().includes(searchTerm) ||
        post.content.toLowerCase().includes(searchTerm)
      )
    );
    
    return Promise.all(posts.map(async post => {
      const category = this.categories.get(post.categoryId)!;
      const author = this.authors.get(post.authorId)!;
      return { ...post, category, author };
    }));
  }

  async getRelatedPosts(postId: number, categoryId: number, limit: number = 3): Promise<BlogPostWithDetails[]> {
    const posts = Array.from(this.blogPosts.values()).filter(post => 
      post.id !== postId && 
      post.categoryId === categoryId && 
      post.isPublished
    ).slice(0, limit);
    
    return Promise.all(posts.map(async post => {
      const category = this.categories.get(post.categoryId)!;
      const author = this.authors.get(post.authorId)!;
      return { ...post, category, author };
    }));
  }
}

// Storage instance
let storageInstance: IStorage | null = null;

// Create storage instance based on environment
async function createStorage(): Promise<IStorage> {
  const mongoUri = process.env.MONGODB_URI;
  
  if (mongoUri && (mongoUri.startsWith('mongodb://') || mongoUri.startsWith('mongodb+srv://'))) {
    try {
      console.log('Connecting to MongoDB...');
      const mongoStorage = new MongoStorage(mongoUri, 'test');
      await mongoStorage.connect();
      console.log('Successfully connected to MongoDB');
      return mongoStorage;
    } catch (error) {
      console.error('Failed to connect to MongoDB, falling back to memory storage:', error);
    }
  } else if (mongoUri) {
    console.log('Invalid MongoDB URI format. Must start with "mongodb://" or "mongodb+srv://". Using in-memory storage.');
  }
  
  console.log('Using in-memory storage');
  return new MemStorage();
}

// Initialize storage
async function initStorage(): Promise<IStorage> {
  if (!storageInstance) {
    storageInstance = await createStorage();
  }
  return storageInstance;
}

// Export a function that returns the storage instance
export async function getStorage(): Promise<IStorage> {
  return await initStorage();
}

// For backward compatibility, create a default instance
export const storage = new MemStorage();
