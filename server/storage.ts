import dotenv from "dotenv";
dotenv.config();

import { 
  users, authors, blogPosts, comments,
  type User, type InsertUser,
  type Author, type InsertAuthor,
  type BlogPost, type InsertBlogPost,
  type Comment, type InsertComment,
  type BlogPostWithDetails
} from "@shared/schema";
import { MongoStorage } from "./mongodb-storage-updated";

export interface IStorage {
  // User methods
  createUser(user: InsertUser): Promise<User>;
  getUserByUsername(username: string): Promise<User | undefined>;

  // Author methods
  getAuthors(): Promise<Author[]>;
  createAuthor(insertAuthor: InsertAuthor): Promise<Author>;
  getAuthorByUserId(userId: string): Promise<Author | undefined>;
  updateAuthor(id: number, updates: Partial<Author>): Promise<Author>;
  updateAuthorByUserId(userId: string, updates: Partial<Author>): Promise<Author>;

  // Blog post methods
  getBlogPosts(options?: { limit?: number; offset?: number; featured?: boolean; includeDrafts?: boolean; userId?: string }): Promise<BlogPostWithDetails[]>;
  getBlogPost(id: string | number): Promise<BlogPostWithDetails | undefined>;
  getBlogPostBySlug(slug: string, userId?: string): Promise<BlogPostWithDetails | undefined>;
  createBlogPost(insertBlogPost: InsertBlogPost): Promise<BlogPost>;
  updateBlogPost(id: string | number, updates: Partial<InsertBlogPost>, userId?: string): Promise<BlogPost>;
  searchBlogPosts(query: string): Promise<BlogPostWithDetails[]>;
  getRelatedPosts(postId: string | number): Promise<BlogPostWithDetails[]>;
  getBlogPostsByTag(tag: string): Promise<BlogPostWithDetails[]>;

  // Comment methods
  getCommentsByPostId(postId: number): Promise<Comment[]>;
  createComment(insertComment: InsertComment): Promise<Comment>;
  approveComment(id: number): Promise<Comment>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private authors: Map<number, Author>;
  private blogPosts: Map<number, BlogPost>;
  private comments: Map<number, Comment>;
  private currentUserId: number;
  private currentAuthorId: number;
  private currentBlogPostId: number;
  private currentCommentId: number;

  constructor() {
    this.users = new Map();
    this.authors = new Map();
    this.blogPosts = new Map();
    this.comments = new Map();
    this.currentUserId = 1;
    this.currentAuthorId = 1;
    this.currentBlogPostId = 1;
    this.currentCommentId = 1;
    
    this.seedData();
  }

  private seedData() {
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
        authorId: 1,
        userId: "demo-user-001",
        readTime: 5,
        isFeatured: true,
        isPublished: true,
        tags: ["hydroponics", "farming", "technology"]
      },
      {
        title: "AI-Powered Crop Monitoring",
        slug: "ai-powered-crop-monitoring",
        excerpt: "How artificial intelligence and drone technology are revolutionizing crop health monitoring and yield prediction systems.",
        content: "Artificial intelligence is transforming agriculture through advanced monitoring systems...",
        featuredImage: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=600",
        authorId: 2,
        userId: "demo-user-001",
        readTime: 8,
        isFeatured: true,
        isPublished: true,
        tags: ["ai", "monitoring", "precision-farming"]
      },
      {
        title: "Agrivoltaics: Farming Under Solar",
        slug: "agrivoltaics-farming-under-solar",
        excerpt: "Combining solar energy production with agricultural practices to maximize land use efficiency and create sustainable farming solutions.",
        content: "Agrivoltaics represents an innovative approach to sustainable agriculture...",
        featuredImage: "https://images.unsplash.com/photo-1466611653911-95081537e5b7?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=600",
        authorId: 3,
        userId: "demo-user-001",
        readTime: 6,
        isFeatured: true,
        isPublished: true,
        tags: ["sustainability", "solar", "energy"]
      },
      {
        title: "Water-Smart Solutions for Modern Agriculture",
        slug: "water-smart-solutions-modern-agriculture",
        excerpt: "Implementing IoT-based irrigation systems that optimize water usage while maximizing crop yield through real-time monitoring.",
        content: "Smart irrigation systems are becoming essential for sustainable agriculture...",
        featuredImage: "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=400",
        authorId: 4,
        userId: "demo-user-001",
        readTime: 7,
        isFeatured: false,
        isPublished: true,
        tags: ["irrigation", "iot", "water-management"]
      },
      {
        title: "The Rise of Vertical Farming Technologies",
        slug: "rise-vertical-farming-technologies",
        excerpt: "How controlled environment agriculture is revolutionizing food production in urban areas with minimal space requirements.",
        content: "Vertical farming is transforming urban agriculture with innovative technologies...",
        featuredImage: "https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=400",
        authorId: 5,
        userId: "demo-user-001",
        readTime: 9,
        isFeatured: false,
        isPublished: true,
        tags: ["vertical-farming", "urban-agriculture", "controlled-environment"]
      },
      {
        title: "Autonomous Farming: The Future is Here",
        slug: "autonomous-farming-future-is-here",
        excerpt: "Exploring how robotic systems are transforming agricultural labor and enabling 24/7 farm monitoring and maintenance.",
        content: "Autonomous farming technologies are revolutionizing agricultural operations...",
        featuredImage: "https://images.unsplash.com/photo-1500595046743-cd271d694d30?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=400",
        authorId: 7,
        userId: "demo-user-001",
        readTime: 6,
        isFeatured: false,
        isPublished: true,
        tags: ["automation", "robotics", "farming"]
      },
    ];

    samplePosts.forEach(post => {
      this.createBlogPost(post);
    });
  }

  // User methods
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Author methods
  async getAuthors(): Promise<Author[]> {
    return Array.from(this.authors.values());
  }

  async createAuthor(insertAuthor: InsertAuthor): Promise<Author> {
    const id = this.currentAuthorId++;
    const author: Author = { 
      ...insertAuthor, 
      id,
      bio: insertAuthor.bio || null,
      avatar: insertAuthor.avatar || null,
      userId: insertAuthor.userId || null,
      linkedinUrl: insertAuthor.linkedinUrl || null,
      instagramUrl: insertAuthor.instagramUrl || null,
      youtubeUrl: insertAuthor.youtubeUrl || null,
      githubUrl: insertAuthor.githubUrl || null,
      portfolioUrl: insertAuthor.portfolioUrl || null
    };
    this.authors.set(id, author);
    return author;
  }

  async getAuthorByUserId(userId: string): Promise<Author | undefined> {
    return Array.from(this.authors.values()).find(author => author.userId === userId);
  }

  async updateAuthor(id: number, updates: Partial<Author>): Promise<Author> {
    const existingAuthor = this.authors.get(id);
    if (!existingAuthor) {
      throw new Error("Author not found");
    }
    const updatedAuthor = { ...existingAuthor, ...updates };
    this.authors.set(id, updatedAuthor);
    return updatedAuthor;
  }

  async updateAuthorByUserId(userId: string, updates: Partial<Author>): Promise<Author> {
    const existingAuthor = Array.from(this.authors.values()).find(a => a.userId === userId);
    if (!existingAuthor) {
      throw new Error("Author not found");
    }
    const updatedAuthor = { ...existingAuthor, ...updates };
    this.authors.set(existingAuthor.id, updatedAuthor);
    return updatedAuthor;
  }

  // Blog post methods
  async getBlogPosts(options: { limit?: number; offset?: number; featured?: boolean; includeDrafts?: boolean; userId?: string } = {}): Promise<BlogPostWithDetails[]> {
    const { limit, offset = 0, featured, includeDrafts = false, userId } = options;
    
    let posts = Array.from(this.blogPosts.values()).filter(post => {
      if (!includeDrafts && !post.isPublished) return false;
      if (featured !== undefined && post.isFeatured !== featured) return false;
      if (userId && post.userId !== userId) return false;
      return true;
    });

    // Sort by creation date (newest first)
    posts.sort((a, b) => b.id - a.id);

    if (limit) {
      posts = posts.slice(offset, offset + limit);
    }

    return Promise.all(posts.map(async post => {
      const author = this.authors.get(post.authorId)!;
      return { ...post, author };
    }));
  }

  async getBlogPost(id: string | number): Promise<BlogPostWithDetails | undefined> {
    const numericId = typeof id === 'string' ? parseInt(id) : id;
    const post = this.blogPosts.get(numericId);
    if (!post) return undefined;

    const author = this.authors.get(post.authorId)!;
    return { ...post, author };
  }

  async getBlogPostBySlug(slug: string, userId?: string): Promise<BlogPostWithDetails | undefined> {
    const post = Array.from(this.blogPosts.values()).find(p => p.slug === slug);
    if (!post) return undefined;
    
    if (userId && post.userId !== userId) return undefined;
    
    const author = this.authors.get(post.authorId)!;
    return { ...post, author };
  }

  async createBlogPost(insertPost: InsertBlogPost): Promise<BlogPost> {
    const id = this.currentBlogPostId++;
    const post: BlogPost = { 
      ...insertPost, 
      id,
      tags: insertPost.tags || [],
      readTime: insertPost.readTime || 5,
      isFeatured: insertPost.isFeatured || false,
      isPublished: insertPost.isPublished !== false, // default to true
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.blogPosts.set(id, post);
    return post;
  }

  async updateBlogPost(id: string | number, updateData: Partial<InsertBlogPost>, userId?: string): Promise<BlogPost> {
    const numericId = typeof id === 'string' ? parseInt(id) : id;
    const existingPost = this.blogPosts.get(numericId);
    
    if (!existingPost) {
      throw new Error("Blog post not found");
    }

    if (userId && existingPost.userId !== userId) {
      throw new Error("Not authorized to update this post");
    }

    const updatedPost = { 
      ...existingPost, 
      ...updateData,
      updatedAt: new Date()
    };
    this.blogPosts.set(numericId, updatedPost);
    return updatedPost;
  }

  async searchBlogPosts(query: string): Promise<BlogPostWithDetails[]> {
    const searchTerm = query.toLowerCase();
    const posts = Array.from(this.blogPosts.values()).filter(post => 
      post.isPublished && (
        post.title.toLowerCase().includes(searchTerm) ||
        post.excerpt.toLowerCase().includes(searchTerm) ||
        post.content.toLowerCase().includes(searchTerm) ||
        post.tags.some(tag => tag.toLowerCase().includes(searchTerm))
      )
    );

    return Promise.all(posts.map(async post => {
      const author = this.authors.get(post.authorId)!;
      return { ...post, author };
    }));
  }

  async getRelatedPosts(postId: string | number): Promise<BlogPostWithDetails[]> {
    const numericId = typeof postId === 'string' ? parseInt(postId) : postId;
    const post = this.blogPosts.get(numericId);
    if (!post || !post.isPublished) return [];
    
    // Find posts with similar tags
    const relatedPosts = Array.from(this.blogPosts.values()).filter(p => 
      p.id !== numericId && 
      p.isPublished &&
      p.tags && post.tags && p.tags.some(tag => post.tags!.includes(tag))
    ).slice(0, 3);
    
    return Promise.all(relatedPosts.map(async p => {
      const author = this.authors.get(p.authorId)!;
      return { ...p, author };
    }));
  }

  async getBlogPostsByTag(tag: string): Promise<BlogPostWithDetails[]> {
    const posts = Array.from(this.blogPosts.values()).filter(post => 
      post.isPublished && post.tags && post.tags.includes(tag)
    );
    
    return Promise.all(posts.map(async post => {
      const author = this.authors.get(post.authorId)!;
      return { ...post, author };
    }));
  }

  // Comment methods
  async getCommentsByPostId(postId: number): Promise<Comment[]> {
    return Array.from(this.comments.values()).filter(comment => comment.blogPostId === postId);
  }

  async createComment(insertComment: InsertComment): Promise<Comment> {
    const id = this.currentCommentId++;
    const comment: Comment = { 
      ...insertComment, 
      id,
      parentId: insertComment.parentId || null,
      createdAt: new Date(),
      isApproved: false
    };
    this.comments.set(id, comment);
    return comment;
  }

  async approveComment(id: number): Promise<Comment> {
    const comment = this.comments.get(id);
    if (!comment) {
      throw new Error("Comment not found");
    }
    const approvedComment = { ...comment, isApproved: true };
    this.comments.set(id, approvedComment);
    return approvedComment;
  }
}

// Create a new storage instance for MongoDB or fallback to in-memory
async function createStorage(): Promise<IStorage> {
  try {
    const mongoUri = process.env.MONGODB_URI;
    const databaseName = process.env.MONGODB_DATABASE || 'blog';
    
    if (!mongoUri) {
      console.log('MONGODB_URI not found in environment variables, using in-memory storage');
      return new MemStorage();
    }
    
    console.log('Attempting to connect to MongoDB...');
    const mongoStorage = new MongoStorage(mongoUri, databaseName);
    await mongoStorage.connect();
    console.log('Successfully connected to MongoDB');
    return mongoStorage;
  } catch (error) {
    console.log('MongoDB connection failed, using in-memory storage:', error);
    return new MemStorage();
  }
}

// Initialize storage once
let storageInstance: Promise<IStorage> | null = null;

async function initStorage(): Promise<IStorage> {
  if (!storageInstance) {
    storageInstance = createStorage();
  }
  return storageInstance;
}

export const storage = new MemStorage();

export async function getStorage(): Promise<IStorage> {
  return initStorage();
}
