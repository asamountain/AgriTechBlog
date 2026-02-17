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
  postType: 'blog' | 'portfolio';
  client?: string;
  impact?: string;
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
  postType?: 'blog' | 'portfolio';
  client?: string;
  impact?: string;
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

// Portfolio Project interfaces
export interface PortfolioProject {
  id: number | string;
  title: string;
  slug: string;
  description: string;
  content: string;
  featuredImage: string;
  client?: string;
  impact?: string;
  technologies: string[];
  category: string;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface InsertPortfolioProject {
  title: string;
  slug: string;
  description: string;
  content: string;
  featuredImage: string;
  client?: string;
  impact?: string;
  technologies?: string[];
  category: string;
  isPublished?: boolean;
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

// Annotation interfaces (Medium-style highlights, responses, and private notes)
export interface Annotation {
  id: string;
  postId: number | string;
  type: 'highlight' | 'response' | 'note';
  selectedText: string;
  paragraphId: string;
  startOffset: number;
  endOffset: number;
  authorName: string;
  authorEmail: string;
  authorImage?: string;
  firebaseUserId?: string;
  anonymousUserId: string;
  content: string;
  parentAnnotationId?: string;
  isPrivate: boolean;
  isApproved: boolean;
  createdAt: Date;
  likes: number;
  likedByUserIds: string[];
}

export interface InsertAnnotation {
  postId: number | string;
  type: 'highlight' | 'response' | 'note';
  selectedText: string;
  paragraphId: string;
  startOffset: number;
  endOffset: number;
  authorName?: string;
  authorEmail?: string;
  authorImage?: string;
  firebaseUserId?: string;
  anonymousUserId: string;
  content?: string;
  parentAnnotationId?: string;
  isPrivate?: boolean;
  isApproved?: boolean;
  likes?: number;
  likedByUserIds?: string[];
}

// Deletion audit log for admin actions
export interface DeletionLog {
  id?: string;
  deletedAt: Date;
  deletedBy: string;              // Admin email who performed deletion
  annotationType: string;          // 'inline-comment', 'comment', etc.
  annotationId: string;            // ID of deleted annotation
  postId: number;                  // Post where annotation existed
  originalAuthor: string;          // Author name/email of deleted annotation
  originalContent: string;         // Content that was deleted
  selectedText: string;            // Highlighted text (for inline comments)
  reason: 'admin_override' | 'spam' | 'inappropriate';
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
  postType: z.enum(['blog', 'portfolio']).default('blog'),
  client: z.string().optional(),
  impact: z.string().optional(),
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

export const insertPortfolioProjectSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().min(1, "Description is required"),
  content: z.string().min(1, "Content is required"),
  featuredImage: z.string().url("Valid image URL is required").or(z.literal("")),
  client: z.string().optional(),
  impact: z.string().optional(),
  technologies: z.array(z.string()).default([]),
  category: z.string().min(1, "Category is required"),
  isPublished: z.boolean().default(true),
});

export const insertCommentSchema = z.object({
  postId: z.union([z.number(), z.string()]),
  parentId: z.union([z.number(), z.string()]).optional().nullable(),
  authorName: z.string().min(1, "Author name is required"),
  authorEmail: z.string().email("Valid email is required"),
  content: z.string().min(1, "Content is required"),
  isApproved: z.boolean().default(false),
});

export const insertAnnotationSchema = z.object({
  postId: z.union([z.number(), z.string()]),
  type: z.enum(['highlight', 'response', 'note']),
  selectedText: z.string().min(1, "Selected text is required"),
  paragraphId: z.string().min(1, "Paragraph ID is required"),
  startOffset: z.number().default(0),
  endOffset: z.number().default(0),
  authorName: z.string().optional(),
  authorEmail: z.string().email("Valid email is required").optional().or(z.literal("")),
  authorImage: z.string().optional(),
  firebaseUserId: z.string().optional(),
  anonymousUserId: z.string().min(1, "User ID is required"),
  content: z.string().optional(),
  parentAnnotationId: z.string().optional(),
  isPrivate: z.boolean().default(false),
  isApproved: z.boolean().default(true),
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
