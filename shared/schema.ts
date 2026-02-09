import { z } from "zod";

// MongoDB-compatible schema definitions using pure TypeScript interfaces and Zod validation

// User interfaces
export interface User {
  id: number | string;
  username: string;
  password: string;
}

export interface InsertUser {
  username: string;
  password: string;
}

// Author interfaces
export interface Author {
  id: number | string;
  name: string;
  email: string;
  bio?: string | null;
  avatar?: string | null;
  userId?: string | null;
  linkedinUrl?: string | null;
  instagramUrl?: string | null;
  youtubeUrl?: string | null;
  githubUrl?: string | null;
  portfolioUrl?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface InsertAuthor {
  name: string;
  email: string;
  bio?: string | null;
  avatar?: string | null;
  userId?: string | null;
  linkedinUrl?: string | null;
  instagramUrl?: string | null;
  youtubeUrl?: string | null;
  githubUrl?: string | null;
  portfolioUrl?: string | null;
}

// Blog Post interfaces
export interface BlogPost {
  id: number | string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featuredImage: string;
  userId: string;
  tags: string[];
  readTime: number;
  isFeatured: boolean;
  isPublished: boolean;
  summary?: string;
  createdAt: Date;
  updatedAt: Date;
  // AI Generation fields
  sourceNotionId?: string;
  generatedByAI?: boolean;
  aiGenerationMetadata?: {
    model: string;
    promptVersion: string;
    generatedAt: Date;
    imagesAnalyzed: number;
  };
  processingStatus?: 'pending' | 'processing' | 'completed' | 'failed';
}

export interface InsertBlogPost {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featuredImage: string;
  userId: string;
  tags?: string[];
  readTime?: number;
  isFeatured?: boolean;
  isPublished?: boolean;
  summary?: string;
  // AI Generation fields
  sourceNotionId?: string;
  generatedByAI?: boolean;
  aiGenerationMetadata?: {
    model: string;
    promptVersion: string;
    generatedAt: Date;
    imagesAnalyzed: number;
  };
  processingStatus?: 'pending' | 'processing' | 'completed' | 'failed';
}

// Processing Queue interfaces (for Notion-to-Blog automation)
export interface ProcessingQueue {
  id: number | string;
  notionPageId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  attempts: number;
  lastAttemptAt?: Date;
  error?: string;
  createdAt: Date;
  completedAt?: Date;
  resultBlogPostId?: string;
}

export interface InsertProcessingQueue {
  notionPageId: string;
  status?: 'queued' | 'processing' | 'completed' | 'failed';
  attempts?: number;
  lastAttemptAt?: Date;
  error?: string;
  resultBlogPostId?: string;
}

// Comment interfaces
export interface Comment {
  id: number | string;
  postId: number | string;
  parentId?: number | string | null;
  authorName: string;
  authorEmail: string;
  content: string;
  createdAt: Date;
  isApproved: boolean;
}

export interface InsertComment {
  postId: number | string;
  parentId?: number | string | null;
  authorName: string;
  authorEmail: string;
  content: string;
  isApproved?: boolean;
}

// Inline comment interfaces (Medium-style text selection comments)
export interface InlineComment {
  id: number | string;
  postId: number | string;
  authorName: string;
  authorEmail: string;
  content: string;
  selectedText: string;
  paragraphId: string;
  startOffset: number;
  endOffset: number;
  createdAt: Date;
  isApproved: boolean;
}

export interface InsertInlineComment {
  postId: number | string;
  authorName: string;
  authorEmail: string;
  content: string;
  selectedText: string;
  paragraphId: string;
  startOffset: number;
  endOffset: number;
  isApproved?: boolean;
}

// Extended interfaces
export interface BlogPostWithDetails extends BlogPost {
  // Author information removed - posts are now anonymous
}

// Zod validation schemas for MongoDB
export const insertUserSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const insertAuthorSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  bio: z.string().optional().nullable(),
  avatar: z.string().optional().nullable(),
  userId: z.string().optional().nullable(),
  linkedinUrl: z.string().url().optional().nullable().or(z.literal("")),
  instagramUrl: z.string().url().optional().nullable().or(z.literal("")),
  youtubeUrl: z.string().url().optional().nullable().or(z.literal("")),
  githubUrl: z.string().url().optional().nullable().or(z.literal("")),
  portfolioUrl: z.string().url().optional().nullable().or(z.literal("")),
});

export const insertBlogPostSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1, "Slug is required"),
  excerpt: z.string().min(1, "Excerpt is required"),
  content: z.string().min(1, "Content is required"),
  featuredImage: z.string().url("Valid image URL is required").or(z.literal("")),
  userId: z.string().min(1, "User ID is required"),
  tags: z.array(z.string()).default([]),
  readTime: z.number().positive().default(5),
  isFeatured: z.boolean().default(false),
  isPublished: z.boolean().default(true),
  summary: z.string().optional(),
  // AI Generation fields
  sourceNotionId: z.string().optional(),
  generatedByAI: z.boolean().default(false),
  aiGenerationMetadata: z.object({
    model: z.string(),
    promptVersion: z.string(),
    generatedAt: z.date(),
    imagesAnalyzed: z.number(),
  }).optional(),
  processingStatus: z.enum(['pending', 'processing', 'completed', 'failed']).optional(),
});

export const insertCommentSchema = z.object({
  postId: z.union([z.number(), z.string()]),
  parentId: z.union([z.number(), z.string()]).optional().nullable(),
  authorName: z.string().min(1, "Author name is required"),
  authorEmail: z.string().email("Valid email is required"),
  content: z.string().min(1, "Content is required"),
  isApproved: z.boolean().default(false),
});

export const insertProcessingQueueSchema = z.object({
  notionPageId: z.string().min(1, "Notion page ID is required"),
  status: z.enum(['queued', 'processing', 'completed', 'failed']).default('queued'),
  attempts: z.number().default(0),
  lastAttemptAt: z.date().optional(),
  error: z.string().optional(),
  resultBlogPostId: z.string().optional(),
});

// Type exports for validation
export type InsertUserSchema = z.infer<typeof insertUserSchema>;
export type InsertAuthorSchema = z.infer<typeof insertAuthorSchema>;
export type InsertBlogPostSchema = z.infer<typeof insertBlogPostSchema>;
export type InsertCommentSchema = z.infer<typeof insertCommentSchema>;
export type InsertProcessingQueueSchema = z.infer<typeof insertProcessingQueueSchema>;
