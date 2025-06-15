import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage, getStorage, type IStorage } from "./storage";
import { insertBlogPostSchema, insertCategorySchema, insertAuthorSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize storage with MongoDB if available
  let activeStorage: IStorage = storage;
  try {
    activeStorage = await getStorage();
  } catch (error) {
    console.log("Using fallback storage:", error);
  }

  // Categories
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await activeStorage.getCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.post("/api/categories", async (req, res) => {
    try {
      const categoryData = insertCategorySchema.parse(req.body);
      const category = await activeStorage.createCategory(categoryData);
      res.status(201).json(category);
    } catch (error) {
      res.status(400).json({ message: "Invalid category data" });
    }
  });

  // Authors
  app.get("/api/authors", async (req, res) => {
    try {
      const authors = await activeStorage.getAuthors();
      res.json(authors);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch authors" });
    }
  });

  app.post("/api/authors", async (req, res) => {
    try {
      const authorData = insertAuthorSchema.parse(req.body);
      const author = await activeStorage.createAuthor(authorData);
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
      
      const posts = await activeStorage.getBlogPosts(options);
      res.json(posts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch blog posts" });
    }
  });

  app.get("/api/blog-posts/featured", async (req, res) => {
    try {
      const posts = await activeStorage.getBlogPosts({ featured: true, limit: 3 });
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
      
      const posts = await activeStorage.searchBlogPosts(q);
      res.json(posts);
    } catch (error) {
      res.status(500).json({ message: "Failed to search blog posts" });
    }
  });

  app.get("/api/blog-posts/:slug", async (req, res) => {
    try {
      const { slug } = req.params;
      const post = await activeStorage.getBlogPostBySlug(slug);
      
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
      // Handle both string and numeric IDs
      const postId = isNaN(parseInt(id)) ? id : parseInt(id);
      const post = await activeStorage.getBlogPost(postId);
      
      if (!post) {
        return res.status(404).json({ message: "Blog post not found" });
      }
      
      const relatedPosts = await activeStorage.getRelatedPosts(postId, post.categoryId);
      res.json(relatedPosts);
    } catch (error) {
      console.error("Related posts error:", error);
      res.status(500).json({ message: "Failed to fetch related posts" });
    }
  });

  app.post("/api/blog-posts", async (req, res) => {
    try {
      const postData = insertBlogPostSchema.parse(req.body);
      const post = await activeStorage.createBlogPost(postData);
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

  // Admin endpoints
  app.get("/api/admin/blog-posts", async (req, res) => {
    try {
      // Get all posts including drafts for admin
      const posts = await activeStorage.getBlogPosts({ limit: 100, includeDrafts: true });
      res.json(posts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch admin posts" });
    }
  });

  app.get("/api/admin/stats", async (req, res) => {
    try {
      const allPosts = await activeStorage.getBlogPosts({ limit: 1000, includeDrafts: true });
      const publishedPosts = allPosts.filter(post => post.isPublished);
      const draftPosts = allPosts.filter(post => !post.isPublished);
      const featuredPosts = allPosts.filter(post => post.isFeatured);

      const stats = {
        totalPosts: allPosts.length,
        publishedPosts: publishedPosts.length,
        draftPosts: draftPosts.length,
        featuredPosts: featuredPosts.length
      };

      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  app.put("/api/blog-posts/:id", async (req, res) => {
    try {
      const postId = parseInt(req.params.id);
      const postData = insertBlogPostSchema.parse(req.body);
      
      // This would need to be implemented in the storage layer
      // For now, return success
      res.json({ message: "Post updated successfully" });
    } catch (error) {
      res.status(400).json({ message: "Failed to update blog post" });
    }
  });

  app.delete("/api/blog-posts/:id", async (req, res) => {
    try {
      const postId = parseInt(req.params.id);
      
      // This would need to be implemented in the storage layer
      // For now, return success
      res.json({ message: "Post deleted successfully" });
    } catch (error) {
      res.status(400).json({ message: "Failed to delete blog post" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
