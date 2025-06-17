import { z } from "zod";

// MongoDB-based schema types for highlighting system
export interface User {
  id: string; // OAuth provider user ID
  email: string;
  name: string;
  avatar?: string;
  provider: 'google' | 'github';
  createdAt: Date;
  updatedAt: Date;
}

export interface Highlight {
  id: string;
  blogPostId: number | string;
  userId?: string; // Optional - for authenticated users
  text: string; // Selected text
  startOffset: number; // Selection start position
  endOffset: number; // Selection end position
  elementPath: string; // CSS selector path to element
  createdAt: Date;
}

export interface HighlightComment {
  id: string;
  highlightId: string;
  userId: string;
  parentId?: string; // For threaded replies
  content: string;
  isPrivate: boolean; // Private to author and blog owner
  createdAt: Date;
  updatedAt: Date;
}

// Legacy schema for existing MongoDB collections
export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  color: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Author {
  id: number;
  name: string;
  email: string;
  bio?: string;
  avatar?: string;
  userId?: string; // Links author to authenticated user
  linkedinUrl?: string;
  instagramUrl?: string;
  youtubeUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BlogPost {
  id: number | string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featuredImage: string;
  categoryId: number;
  authorId: number;
  userId: string; // Links posts to authenticated users
  tags?: string[]; // Array of tags for SEO
  readTime: number;
  isFeatured: boolean;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Comment {
  id: number;
  blogPostId: number;
  parentId?: number; // For nested replies
  authorName: string;
  authorEmail: string;
  content: string;
  createdAt: Date;
  isApproved: boolean;
}

// Zod schemas for validation
export const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  avatar: z.string().optional(),
  provider: z.enum(['google', 'github']),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export const highlightSchema = z.object({
  id: z.string().optional(),
  blogPostId: z.union([z.number(), z.string()]),
  userId: z.string().optional(),
  text: z.string(),
  startOffset: z.number(),
  endOffset: z.number(),
  elementPath: z.string(),
  createdAt: z.date().optional(),
});

export const highlightCommentSchema = z.object({
  id: z.string().optional(),
  highlightId: z.string(),
  userId: z.string(),
  parentId: z.string().optional(),
  content: z.string(),
  isPrivate: z.boolean().default(false),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

// Insert types for MongoDB
export type InsertUser = z.infer<typeof userSchema>;
export type InsertHighlight = z.infer<typeof highlightSchema>;
export type InsertHighlightComment = z.infer<typeof highlightCommentSchema>;

// Extended types with relationships
export type BlogPostWithDetails = BlogPost & {
  category: Category;
  author: Author;
};

export type HighlightWithDetails = Highlight & {
  user?: User;
  comments: HighlightCommentWithDetails[];
};

export type HighlightCommentWithDetails = HighlightComment & {
  user: User;
  replies?: HighlightCommentWithDetails[];
};
