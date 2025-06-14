import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertBlogPostSchema, insertCategorySchema, insertAuthorSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Categories
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.post("/api/categories", async (req, res) => {
    try {
      const categoryData = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(categoryData);
      res.status(201).json(category);
    } catch (error) {
      res.status(400).json({ message: "Invalid category data" });
    }
  });

  // Authors
  app.get("/api/authors", async (req, res) => {
    try {
      const authors = await storage.getAuthors();
      res.json(authors);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch authors" });
    }
  });

  app.post("/api/authors", async (req, res) => {
    try {
      const authorData = insertAuthorSchema.parse(req.body);
      const author = await storage.createAuthor(authorData);
      res.status(201).json(author);
    } catch (error) {
      res.status(400).json({ message: "Invalid author data" });
    }
  });

  // Blog Posts
  app.get("/api/blog-posts", async (req, res) => {
    try {
      const { category, limit, offset, featured } = req.query;
      const options = {
        categorySlug: category as string,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
        featured: featured ? featured === 'true' : undefined,
      };
      
      const posts = await storage.getBlogPosts(options);
      res.json(posts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch blog posts" });
    }
  });

  app.get("/api/blog-posts/featured", async (req, res) => {
    try {
      const posts = await storage.getBlogPosts({ featured: true, limit: 3 });
      res.json(posts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch featured posts" });
    }
  });

  app.get("/api/blog-posts/search", async (req, res) => {
    try {
      const { q } = req.query;
      if (!q || typeof q !== 'string') {
        return res.status(400).json({ message: "Search query is required" });
      }
      
      const posts = await storage.searchBlogPosts(q);
      res.json(posts);
    } catch (error) {
      res.status(500).json({ message: "Failed to search blog posts" });
    }
  });

  app.get("/api/blog-posts/:slug", async (req, res) => {
    try {
      const { slug } = req.params;
      const post = await storage.getBlogPostBySlug(slug);
      
      if (!post) {
        return res.status(404).json({ message: "Blog post not found" });
      }
      
      res.json(post);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch blog post" });
    }
  });

  app.get("/api/blog-posts/:id/related", async (req, res) => {
    try {
      const { id } = req.params;
      const postId = parseInt(id);
      const post = await storage.getBlogPost(postId);
      
      if (!post) {
        return res.status(404).json({ message: "Blog post not found" });
      }
      
      const relatedPosts = await storage.getRelatedPosts(postId, post.categoryId);
      res.json(relatedPosts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch related posts" });
    }
  });

  app.post("/api/blog-posts", async (req, res) => {
    try {
      const postData = insertBlogPostSchema.parse(req.body);
      const post = await storage.createBlogPost(postData);
      res.status(201).json(post);
    } catch (error) {
      res.status(400).json({ message: "Invalid blog post data" });
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

  const httpServer = createServer(app);
  return httpServer;
}
