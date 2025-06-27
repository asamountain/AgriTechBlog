import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { eq, desc, like, or, and, inArray } from 'drizzle-orm';
import ws from "ws";
import * as schema from "@shared/schema";
import type { IStorage } from './storage';
import type { User, InsertUser, Author, InsertAuthor, BlogPost, InsertBlogPost, Comment, InsertComment, BlogPostWithDetails } from '@shared/schema';

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle({ client: pool, schema });

export class DatabaseStorage implements IStorage {
  
  // User methods
  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(schema.users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.username, username));
    return user || undefined;
  }

  // Author methods
  async getAuthors(): Promise<Author[]> {
    return await db.select().from(schema.authors);
  }

  async createAuthor(insertAuthor: InsertAuthor): Promise<Author> {
    const [author] = await db
      .insert(schema.authors)
      .values(insertAuthor)
      .returning();
    return author;
  }

  async getAuthorByUserId(userId: string): Promise<Author | undefined> {
    const [author] = await db
      .select()
      .from(schema.authors)
      .where(eq(schema.authors.userId, userId));
    return author || undefined;
  }

  async updateAuthor(id: number, updates: Partial<Author>): Promise<Author> {
    const [author] = await db
      .update(schema.authors)
      .set(updates)
      .where(eq(schema.authors.id, id))
      .returning();
    return author;
  }

  async updateAuthorByUserId(userId: string, updates: Partial<Author>): Promise<Author> {
    const [author] = await db
      .update(schema.authors)
      .set(updates)
      .where(eq(schema.authors.userId, userId))
      .returning();
    return author;
  }

  // Blog post methods
  async getBlogPosts(options: { 
    limit?: number; 
    offset?: number; 
    featured?: boolean; 
    includeDrafts?: boolean; 
    userId?: string 
  } = {}): Promise<BlogPostWithDetails[]> {
    const { limit = 50, offset = 0, featured, includeDrafts = false, userId } = options;
    
    let whereConditions = [];
    
    if (!includeDrafts) {
      whereConditions.push(eq(schema.blogPosts.isPublished, true));
    }
    
    if (featured !== undefined) {
      whereConditions.push(eq(schema.blogPosts.isFeatured, featured));
    }
    
    if (userId) {
      whereConditions.push(eq(schema.blogPosts.userId, userId));
    }

    const posts = await db
      .select()
      .from(schema.blogPosts)
      .leftJoin(schema.authors, eq(schema.blogPosts.authorId, schema.authors.id))
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .orderBy(desc(schema.blogPosts.createdAt))
      .limit(limit)
      .offset(offset);

    return posts.map(post => ({
      ...post.blog_posts,
      author: post.authors || {
        id: 0,
        name: 'Unknown Author',
        email: '',
        bio: null,
        avatar: null,
        userId: '',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    }));
  }

  async getBlogPost(id: string | number): Promise<BlogPostWithDetails | undefined> {
    const numericId = typeof id === 'string' ? parseInt(id) : id;
    
    const [result] = await db
      .select()
      .from(schema.blogPosts)
      .leftJoin(schema.authors, eq(schema.blogPosts.authorId, schema.authors.id))
      .where(eq(schema.blogPosts.id, numericId));

    if (!result) return undefined;

    return {
      ...result.blog_posts,
      author: result.authors || {
        id: 0,
        name: 'Unknown Author',
        email: '',
        bio: null,
        avatar: null,
        userId: '',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    };
  }

  async getBlogPostBySlug(slug: string, userId?: string): Promise<BlogPostWithDetails | undefined> {
    let whereConditions = [eq(schema.blogPosts.slug, slug)];
    
    if (!userId) {
      whereConditions.push(eq(schema.blogPosts.isPublished, true));
    }

    const [result] = await db
      .select()
      .from(schema.blogPosts)
      .leftJoin(schema.authors, eq(schema.blogPosts.authorId, schema.authors.id))
      .where(and(...whereConditions));

    if (!result) return undefined;

    return {
      ...result.blog_posts,
      author: result.authors || {
        id: 0,
        name: 'Unknown Author',
        email: '',
        bio: null,
        avatar: null,
        userId: '',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    };
  }

  async createBlogPost(insertPost: InsertBlogPost): Promise<BlogPost> {
    const [post] = await db
      .insert(schema.blogPosts)
      .values(insertPost)
      .returning();
    return post;
  }

  async updateBlogPost(id: string | number, updates: Partial<InsertBlogPost>, userId?: string): Promise<BlogPost> {
    const numericId = typeof id === 'string' ? parseInt(id) : id;
    
    let whereConditions = [eq(schema.blogPosts.id, numericId)];
    if (userId) {
      whereConditions.push(eq(schema.blogPosts.userId, userId));
    }

    const [post] = await db
      .update(schema.blogPosts)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(...whereConditions))
      .returning();
    
    if (!post) {
      throw new Error('Blog post not found or not authorized');
    }
    
    return post;
  }

  async searchBlogPosts(query: string): Promise<BlogPostWithDetails[]> {
    const searchTerm = `%${query.toLowerCase()}%`;
    
    const posts = await db
      .select()
      .from(schema.blogPosts)
      .leftJoin(schema.authors, eq(schema.blogPosts.authorId, schema.authors.id))
      .where(and(
        eq(schema.blogPosts.isPublished, true),
        or(
          like(schema.blogPosts.title, searchTerm),
          like(schema.blogPosts.excerpt, searchTerm),
          like(schema.blogPosts.content, searchTerm)
        )
      ))
      .orderBy(desc(schema.blogPosts.createdAt));

    return posts.map(post => ({
      ...post.blog_posts,
      author: post.authors || {
        id: 0,
        name: 'Unknown Author',
        email: '',
        bio: null,
        avatar: null,
        userId: '',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    }));
  }

  async getRelatedPosts(postId: string | number): Promise<BlogPostWithDetails[]> {
    // Get the current post's tags first
    const currentPost = await this.getBlogPost(postId);
    if (!currentPost || !currentPost.tags) return [];

    // Find posts with similar tags
    const posts = await db
      .select()
      .from(schema.blogPosts)
      .leftJoin(schema.authors, eq(schema.blogPosts.authorId, schema.authors.id))
      .where(and(
        eq(schema.blogPosts.isPublished, true),
        // This is a simplified approach - in a real app you'd want better tag matching
      ))
      .orderBy(desc(schema.blogPosts.createdAt))
      .limit(3);

    return posts
      .filter(post => post.blog_posts.id !== (typeof postId === 'string' ? parseInt(postId) : postId))
      .map(post => ({
        ...post.blog_posts,
        author: post.authors || {
          id: 0,
          name: 'Unknown Author',
          email: '',
          bio: null,
          avatar: null,
          userId: '',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      }));
  }

  async getBlogPostsByTag(tag: string): Promise<BlogPostWithDetails[]> {
    const posts = await db
      .select()
      .from(schema.blogPosts)
      .leftJoin(schema.authors, eq(schema.blogPosts.authorId, schema.authors.id))
      .where(and(
        eq(schema.blogPosts.isPublished, true),
        // PostgreSQL array contains operator would be used here
        // For now, simplified approach
      ))
      .orderBy(desc(schema.blogPosts.createdAt));

    return posts
      .filter(post => post.blog_posts.tags?.includes(tag))
      .map(post => ({
        ...post.blog_posts,
        author: post.authors || {
          id: 0,
          name: 'Unknown Author',
          email: '',
          bio: null,
          avatar: null,
          userId: '',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      }));
  }

  // Comment methods
  async getCommentsByPostId(postId: number): Promise<Comment[]> {
    return await db
      .select()
      .from(schema.comments)
      .where(eq(schema.comments.postId, postId))
      .orderBy(desc(schema.comments.createdAt));
  }

  async createComment(insertComment: InsertComment): Promise<Comment> {
    const [comment] = await db
      .insert(schema.comments)
      .values(insertComment)
      .returning();
    return comment;
  }

  async approveComment(id: number): Promise<Comment> {
    const [comment] = await db
      .update(schema.comments)
      .set({ isApproved: true })
      .where(eq(schema.comments.id, id))
      .returning();
    return comment;
  }

  async deleteComment(id: number): Promise<void> {
    await db
      .delete(schema.comments)
      .where(eq(schema.comments.id, id));
  }
}
