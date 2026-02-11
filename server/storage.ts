import { loadEnvironment } from './local-env-loader';
loadEnvironment();

import { 
  type User, type InsertUser,
  type Author, type InsertAuthor,
  type BlogPost, type InsertBlogPost,
  type Comment, type InsertComment,
  type BlogPostWithDetails,
  type Annotation, type InsertAnnotation
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
  deleteComment(id: number): Promise<void>;

  // Annotation methods
  getAnnotations(postId: number, options?: { type?: string; parentId?: string; userId?: string }): Promise<Annotation[]>;
  createAnnotation(insertAnnotation: InsertAnnotation): Promise<Annotation>;
  deleteAnnotation(id: string, userId: string, isAdmin?: boolean, adminEmail?: string): Promise<void>;
  toggleAnnotationLike(annotationId: string, userId: string): Promise<{ likes: number; hasLiked: boolean }>;
}

// MONGODB-ONLY STORAGE CREATION
async function createStorage(): Promise<IStorage> {
  console.log("🔄 Creating MongoDB-only storage...");
  
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI environment variable is required - no fallback storage available");
  }
  
  const mongoStorage = new MongoStorage(
    process.env.MONGODB_URI,
    process.env.MONGODB_DATABASE || 'blog_database'
  );
  
      await mongoStorage.connect();
  console.log("✅ MongoDB storage created successfully");
      return mongoStorage;
    }
    
let globalStorage: IStorage | null = null;

async function initStorage(): Promise<IStorage> {
  if (!globalStorage) {
    globalStorage = await createStorage();
  }
  return globalStorage;
}

export async function getStorage(): Promise<IStorage> {
  return await initStorage();
}

// Export MongoDB-only storage instance (lazy-loaded)
export const storage = {
  async getInstance(): Promise<IStorage> {
    return await initStorage();
}
};
