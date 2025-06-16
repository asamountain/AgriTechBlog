import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
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
  id: true,
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

export type BlogPostWithDetails = BlogPost & {
  category: Category;
  author: Author;
};
