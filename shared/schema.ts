import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: text("id").primaryKey(), // OAuth provider user ID
  email: text("email").notNull(),
  name: text("name").notNull(),
  avatar: text("avatar"),
  provider: text("provider").notNull(), // 'google', 'github'
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  color: text("color").notNull().default("#52B788"),
});

export const authors = pgTable("authors", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  bio: text("bio"),
  avatar: text("avatar"),
  userId: text("user_id"), // Links author to authenticated user
  linkedinUrl: text("linkedin_url"),
  instagramUrl: text("instagram_url"),
  youtubeUrl: text("youtube_url"),
  githubUrl: text("github_url"),
  portfolioUrl: text("portfolio_url"),
});

export const blogPosts = pgTable("blog_posts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  excerpt: text("excerpt").notNull(),
  content: text("content").notNull(),
  featuredImage: text("featured_image").notNull(),
  categoryId: integer("category_id").references(() => categories.id).notNull(),
  authorId: integer("author_id").references(() => authors.id).notNull(),
  userId: text("user_id").notNull(), // Links posts to authenticated users
  tags: text("tags").array().default([]), // Array of tags for SEO
  readTime: integer("read_time").notNull().default(5),
  isFeatured: boolean("is_featured").notNull().default(false),
  isPublished: boolean("is_published").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Highlights table for text selections
export const highlights = pgTable("highlights", {
  id: serial("id").primaryKey(),
  blogPostId: integer("blog_post_id").references(() => blogPosts.id).notNull(),
  userId: text("user_id"), // Optional - for authenticated users
  text: text("text").notNull(), // Selected text
  startOffset: integer("start_offset").notNull(), // Selection start position
  endOffset: integer("end_offset").notNull(), // Selection end position
  elementPath: text("element_path").notNull(), // CSS selector path to element
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Comments on highlights
export const highlightComments = pgTable("highlight_comments", {
  id: serial("id").primaryKey(),
  highlightId: integer("highlight_id").references(() => highlights.id).notNull(),
  userId: text("user_id").references(() => users.id).notNull(),
  parentId: integer("parent_id"), // For threaded replies
  content: text("content").notNull(),
  isPrivate: boolean("is_private").notNull().default(false), // Private to author and blog owner
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Legacy comments table for backward compatibility
export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  blogPostId: integer("blog_post_id").notNull(),
  parentId: integer("parent_id"), // For nested replies
  authorName: text("author_name").notNull(),
  authorEmail: text("author_email").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  isApproved: boolean("is_approved").notNull().default(false),
});

export const insertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
});

export const insertAuthorSchema = createInsertSchema(authors).omit({
  id: true,
});

export const insertBlogPostSchema = createInsertSchema(blogPosts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCommentSchema = createInsertSchema(comments).omit({
  id: true,
  createdAt: true,
});

export const insertHighlightSchema = createInsertSchema(highlights).omit({
  id: true,
  createdAt: true,
});

export const insertHighlightCommentSchema = createInsertSchema(highlightComments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;

export type InsertAuthor = z.infer<typeof insertAuthorSchema>;
export type Author = typeof authors.$inferSelect;

export type InsertBlogPost = z.infer<typeof insertBlogPostSchema>;
export type BlogPost = typeof blogPosts.$inferSelect;

export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Comment = typeof comments.$inferSelect;

export type InsertHighlight = z.infer<typeof insertHighlightSchema>;
export type Highlight = typeof highlights.$inferSelect;

export type InsertHighlightComment = z.infer<typeof insertHighlightCommentSchema>;
export type HighlightComment = typeof highlightComments.$inferSelect;

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
