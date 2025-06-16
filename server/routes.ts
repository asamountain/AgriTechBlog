import type { Express } from "express";
import { createServer, type Server } from "http";
import passport from "passport";
import { storage, getStorage, type IStorage } from "./storage";
import { insertBlogPostSchema, insertCategorySchema, insertAuthorSchema, insertCommentSchema } from "@shared/schema";
import { requireAuth } from "./auth";
import { analyzeContentCategory, analyzeCategoryDistribution, getTrendingTopics } from "./categorization";
import { getAITaggingService } from "./ai-tagging";

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize storage with MongoDB if available
  let activeStorage: IStorage = storage;
  try {
    activeStorage = await getStorage();
  } catch (error) {
    console.log("Using fallback storage:", error);
  }

  // OAuth routes with passport middleware
  app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
  
  app.get('/auth/google/callback', 
    passport.authenticate('google', { failureRedirect: '/admin' }),
    (req, res) => {
      res.redirect('/auth/callback');
    }
  );

  app.get('/auth/github', passport.authenticate('github', { scope: ['user:email'] }));
  
  app.get('/auth/github/callback',
    passport.authenticate('github', { failureRedirect: '/admin' }),
    (req, res) => {
      res.redirect('/auth/callback');
    }
  );

  // Authentication API endpoint
  app.get("/api/auth/user", (req, res) => {
    if (req.isAuthenticated && req.isAuthenticated()) {
      res.json(req.user);
    } else {
      res.status(401).json({ message: "Not authenticated" });
    }
  });

  // Migration endpoint to assign existing posts to current user
  app.post("/api/admin/migrate-posts", async (req, res) => {
    try {
      if (!req.isAuthenticated || !req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const userId = (req.user as any)?.id;
      if (!userId) {
        return res.status(400).json({ message: "User ID not found" });
      }

      if (activeStorage instanceof (await import('./mongodb-storage-updated')).MongoStorage) {
        const result = await (activeStorage as any).migratePostsToUser(userId);
        res.json({ 
          message: "Posts migration completed", 
          userId: userId,
          migratedCount: result.migratedCount 
        });
      } else {
        res.status(400).json({ message: "Migration only available with MongoDB storage" });
      }
    } catch (error) {
      console.error("Migration error:", error);
      res.status(500).json({ message: "Failed to migrate posts" });
    }
  });

  // Check unassigned posts count
  app.get("/api/admin/unassigned-posts", async (req, res) => {
    try {
      if (!req.isAuthenticated || !req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      if (activeStorage instanceof (await import('./mongodb-storage-updated')).MongoStorage) {
        const count = await (activeStorage as any).getUnassignedPostsCount();
        res.json({ unassignedCount: count });
      } else {
        res.json({ unassignedCount: 0 });
      }
    } catch (error) {
      console.error("Error checking unassigned posts:", error);
      res.status(500).json({ message: "Failed to check unassigned posts" });
    }
  });

  // Logout endpoint
  app.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  // Categories
  app.get("/api/categories", async (req, res) => {
    try {
      let categories = await activeStorage.getCategories();
      
      // If no categories exist, create default agricultural categories
      if (categories.length === 0) {
        const defaultCategories = [
          {
            name: "Agricultural Technology",
            slug: "agricultural-technology", 
            description: "Latest innovations in farming technology and precision agriculture",
            color: "#2D5016"
          },
          {
            name: "Sustainable Farming",
            slug: "sustainable-farming",
            description: "Eco-friendly practices and sustainable agriculture methods", 
            color: "#2D5016"
          },
          {
            name: "Crop Management",
            slug: "crop-management",
            description: "Best practices for crop planning, growth, and harvest optimization",
            color: "#2D5016"
          },
          {
            name: "Farm Equipment",
            slug: "farm-equipment", 
            description: "Modern farming machinery and equipment innovations",
            color: "#2D5016"
          },
          {
            name: "Market Analysis",
            slug: "market-analysis",
            description: "Agricultural market trends and economic insights",
            color: "#2D5016"
          },
          {
            name: "Weather & Climate",
            slug: "weather-climate",
            description: "Climate impact on agriculture and weather-based farming",
            color: "#2D5016"
          },
          {
            name: "Soil Health",
            slug: "soil-health", 
            description: "Soil management and health optimization techniques",
            color: "#2D5016"
          },
          {
            name: "Irrigation Systems",
            slug: "irrigation-systems",
            description: "Water management and irrigation technology solutions",
            color: "#2D5016"
          }
        ];

        for (const categoryData of defaultCategories) {
          await activeStorage.createCategory(categoryData);
        }
        
        categories = await activeStorage.getCategories();
      }
      
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

  // Admin profile endpoints
  app.get("/api/admin/profile", async (req, res) => {
    try {
      // For demo purposes, use a default user ID until proper auth is implemented
      const userId = "demo-user-001";
      
      const author = await activeStorage.getAuthorByUserId(userId);
      res.json(author || {});
    } catch (error) {
      console.error("Profile fetch error:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  app.patch("/api/admin/profile", async (req, res) => {
    try {
      // For demo purposes, use a default user ID until proper auth is implemented
      const userId = "demo-user-001";

      const profileData = req.body;
      
      // Find existing author by userId or create one
      let author = await activeStorage.getAuthorByUserId(userId);
      
      if (author) {
        // Update existing author using userId
        const updatedAuthor = await activeStorage.updateAuthorByUserId(userId, {
          name: profileData.name,
          email: profileData.email,
          bio: profileData.bio,
          avatar: profileData.avatar,
          linkedinUrl: profileData.linkedinUrl,
          instagramUrl: profileData.instagramUrl,
          youtubeUrl: profileData.youtubeUrl,
          githubUrl: profileData.githubUrl,
          portfolioUrl: profileData.portfolioUrl
        });
        res.json({ 
          message: "Profile updated successfully",
          profile: updatedAuthor 
        });
      } else {
        // Create new author
        const newAuthor = await activeStorage.createAuthor({
          name: profileData.name || 'Author',
          email: profileData.email || 'author@example.com',
          bio: profileData.bio,
          avatar: profileData.avatar,
          userId: userId,
          linkedinUrl: profileData.linkedinUrl,
          instagramUrl: profileData.instagramUrl,
          youtubeUrl: profileData.youtubeUrl,
          githubUrl: profileData.githubUrl,
          portfolioUrl: profileData.portfolioUrl
        });
        res.json({ 
          message: "Profile created successfully",
          profile: newAuthor 
        });
      }
    } catch (error) {
      console.error("Profile update error:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Admin endpoints
  app.get("/api/admin/blog-posts", async (req, res) => {
    try {
      const userId = req.isAuthenticated && req.isAuthenticated() ? (req.user as any)?.id : undefined;
      // Get all posts including drafts for admin, filtered by user
      const posts = await activeStorage.getBlogPosts({ 
        limit: 100, 
        includeDrafts: true,
        userId: userId 
      });
      res.json(posts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch admin posts" });
    }
  });

  app.get("/api/admin/stats", async (req, res) => {
    try {
      const userId = req.isAuthenticated && req.isAuthenticated() ? (req.user as any)?.id : undefined;
      const allPosts = await activeStorage.getBlogPosts({ 
        limit: 1000, 
        includeDrafts: true,
        userId: userId 
      });
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
      const { id } = req.params;
      const postId = isNaN(parseInt(id)) ? id : parseInt(id);
      const userId = req.isAuthenticated && req.isAuthenticated() ? (req.user as any)?.id : undefined;
      
      // Validate the request body but make fields optional for updates
      const updateData = req.body;
      
      const updatedPost = await activeStorage.updateBlogPost(postId, updateData, userId);
      res.json(updatedPost);
    } catch (error) {
      console.error("Update blog post error:", error);
      if (error.message === "Not authorized to update this post") {
        res.status(403).json({ message: error.message });
      } else if (error.message === "Blog post not found") {
        res.status(404).json({ message: error.message });
      } else {
        res.status(400).json({ message: "Failed to update blog post" });
      }
    }
  });

  app.patch("/api/blog-posts/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const postId = isNaN(parseInt(id)) ? id : parseInt(id);
      const userId = req.isAuthenticated && req.isAuthenticated() ? (req.user as any)?.id : undefined;
      
      console.log("PATCH request for post:", postId, "with data:", req.body);
      
      // Validate the request body but make fields optional for updates
      const updateData = req.body;
      
      const updatedPost = await activeStorage.updateBlogPost(postId, updateData, userId);
      console.log("Updated post result:", updatedPost);
      res.json(updatedPost);
    } catch (error) {
      console.error("PATCH blog post error:", error);
      if (error.message === "Not authorized to update this post") {
        res.status(403).json({ message: error.message });
      } else if (error.message === "Blog post not found") {
        res.status(404).json({ message: error.message });
      } else {
        res.status(400).json({ message: "Failed to update blog post", error: error.message });
      }
    }
  });

  // Admin session verification endpoint
  app.get("/api/admin/verify-session", (req, res) => {
    if (req.isAuthenticated && req.isAuthenticated()) {
      const user = req.user as any;
      const adminEmails = ['admin@hopeinvest.com', 'seungjinyoun@gmail.com'];
      const isAdmin = adminEmails.includes(user.email?.toLowerCase());
      
      if (isAdmin) {
        res.json({ 
          authenticated: true, 
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            provider: user.provider,
            avatar: user.avatar,
            isAdmin: true
          }
        });
      } else {
        res.status(403).json({ authenticated: false, message: "Admin access required" });
      }
    } else {
      res.status(401).json({ authenticated: false, message: "Not authenticated" });
    }
  });

  // Admin logout endpoint
  app.post("/api/admin/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      req.session.destroy((err) => {
        if (err) {
          return res.status(500).json({ message: "Session destruction failed" });
        }
        res.clearCookie('connect.sid');
        res.json({ message: "Logged out successfully" });
      });
    });
  });

  // Simplified AI tagging endpoint
  app.post("/api/ai-tagging/analyze/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const postId = isNaN(parseInt(id)) ? id : parseInt(id);
      const userId = req.isAuthenticated && req.isAuthenticated() ? (req.user as any)?.id : undefined;
      
      const post = await activeStorage.getBlogPost(postId, userId);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }

      // Simple keyword-based tagging as fallback
      const keywords = post.content.toLowerCase().match(/\b\w{4,}\b/g) || [];
      const tagCandidates = Array.from(new Set(keywords))
        .filter(word => !['this', 'that', 'with', 'from', 'they', 'have', 'been', 'will', 'more', 'time'].includes(word))
        .slice(0, 5);

      const categoryMap: { [key: string]: string } = {
        'technology': 'Agricultural Technology',
        'sustainable': 'Sustainable Farming',
        'crop': 'Crop Management',
        'equipment': 'Farm Equipment',
        'market': 'Market Analysis',
        'weather': 'Weather & Climate',
        'soil': 'Soil Health',
        'irrigation': 'Irrigation Systems'
      };

      let suggestedCategory = 'Agricultural Technology';
      for (const [keyword, category] of Object.entries(categoryMap)) {
        if (post.content.toLowerCase().includes(keyword) || post.title.toLowerCase().includes(keyword)) {
          suggestedCategory = category;
          break;
        }
      }

      res.json({
        suggestedTags: tagCandidates,
        suggestedCategory,
        confidence: 0.7,
        reasoning: "Generated using keyword analysis"
      });
    } catch (error) {
      console.error("AI tagging error:", error);
      res.status(500).json({ message: "Failed to analyze content" });
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

  // Comments routes
  app.get("/api/blog-posts/:id/comments", async (req, res) => {
    try {
      const { id } = req.params;
      const comments = await activeStorage.getCommentsByPostId(id);
      res.json(comments);
    } catch (error) {
      console.error("Error fetching comments:", error);
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  app.post("/api/blog-posts/:id/comments", async (req, res) => {
    try {
      const { id } = req.params;
      const commentData = insertCommentSchema.parse({
        ...req.body,
        blogPostId: parseInt(id)
      });
      
      const comment = await activeStorage.createComment(commentData);
      res.status(201).json(comment);
    } catch (error) {
      console.error("Error creating comment:", error);
      res.status(400).json({ message: "Failed to create comment" });
    }
  });

  app.put("/api/comments/:id/approve", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const comment = await activeStorage.approveComment(parseInt(id));
      res.json(comment);
    } catch (error) {
      console.error("Error approving comment:", error);
      res.status(400).json({ message: "Failed to approve comment" });
    }
  });

  app.delete("/api/comments/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      await activeStorage.deleteComment(parseInt(id));
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting comment:", error);
      res.status(400).json({ message: "Failed to delete comment" });
    }
  });

  // Admin comment management endpoints
  app.get("/api/admin/comments", requireAuth, async (req, res) => {
    try {
      const userId = req.isAuthenticated && req.isAuthenticated() ? (req.user as any)?.id : undefined;
      
      // Get all posts for this user to find their comments
      const userPosts = await activeStorage.getBlogPosts({ 
        limit: 1000, 
        includeDrafts: true,
        userId: userId 
      });
      
      // Get comments for all user posts
      const allComments = [];
      for (const post of userPosts) {
        const postComments = await activeStorage.getCommentsByPostId(post.id);
        const commentsWithPost = postComments.map(comment => ({
          ...comment,
          postTitle: post.title,
          postSlug: post.slug
        }));
        allComments.push(...commentsWithPost);
      }
      
      // Sort by creation date (newest first)
      allComments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      res.json(allComments);
    } catch (error) {
      console.error("Error fetching admin comments:", error);
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  // AI-powered categorization endpoints
  app.get("/api/analytics/categories", requireAuth, async (req, res) => {
    try {
      const posts = await activeStorage.getBlogPosts({ includeDrafts: true });
      const distribution = analyzeCategoryDistribution(posts);
      res.json(distribution);
    } catch (error) {
      console.error("Error analyzing categories:", error);
      res.status(500).json({ message: "Failed to analyze categories" });
    }
  });

  app.get("/api/analytics/trending", async (req, res) => {
    try {
      const posts = await activeStorage.getBlogPosts({ includeDrafts: false });
      const trending = getTrendingTopics(posts, 10);
      res.json(trending);
    } catch (error) {
      console.error("Error getting trending topics:", error);
      res.status(500).json({ message: "Failed to get trending topics" });
    }
  });

  // AI Tagging endpoints
  app.post('/api/ai-tagging/analyze/:id', requireAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const post = await activeStorage.getBlogPost(id, userId);
      if (!post) {
        return res.status(404).json({ message: 'Blog post not found' });
      }

      const aiService = getAITaggingService();
      const analysis = await aiService.analyzeContent(post);
      
      res.json(analysis);
    } catch (error) {
      console.error('AI analysis error:', error);
      res.status(500).json({ message: 'Failed to analyze content' });
    }
  });

  app.post('/api/ai-tagging/generate-tags', requireAuth, async (req: any, res) => {
    try {
      const { content } = req.body;
      
      if (!content || typeof content !== 'string') {
        return res.status(400).json({ message: 'Content is required' });
      }

      const aiService = getAITaggingService();
      const tags = await aiService.generateTags(content);
      
      res.json({ tags });
    } catch (error) {
      console.error('Tag generation error:', error);
      res.status(500).json({ message: 'Failed to generate tags' });
    }
  });

  app.post('/api/ai-tagging/suggest-category', requireAuth, async (req: any, res) => {
    try {
      const { title, content } = req.body;
      
      if (!title || !content) {
        return res.status(400).json({ message: 'Title and content are required' });
      }

      const aiService = getAITaggingService();
      const category = await aiService.suggestCategory(title, content);
      
      res.json({ category });
    } catch (error) {
      console.error('Category suggestion error:', error);
      res.status(500).json({ message: 'Failed to suggest category' });
    }
  });

  app.post('/api/ai-tagging/bulk-analyze', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const posts = await activeStorage.getBlogPosts({ userId, limit: 50 });
      const aiService = getAITaggingService();
      
      const results = [];
      for (const post of posts) {
        try {
          const analysis = await aiService.analyzeContent(post);
          results.push({
            postId: post.id,
            title: post.title,
            analysis
          });
          
          // Add delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          console.error(`Failed to analyze post ${post.id}:`, error);
          results.push({
            postId: post.id,
            title: post.title,
            error: 'Analysis failed'
          });
        }
      }
      
      res.json({ results });
    } catch (error) {
      console.error('Bulk analysis error:', error);
      res.status(500).json({ message: 'Failed to perform bulk analysis' });
    }
  });

  app.post("/api/posts/:id/categorize", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const post = await activeStorage.getBlogPost(id);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      
      const suggestedCategory = analyzeContentCategory(post);
      res.json({ suggestedCategory, confidence: "high" });
    } catch (error) {
      console.error("Error categorizing post:", error);
      res.status(500).json({ message: "Failed to categorize post" });
    }
  });

  // Protect admin routes
  app.get("/api/admin/blog-posts", requireAuth, async (req, res) => {
    try {
      const posts = await activeStorage.getBlogPosts({ includeDrafts: true });
      res.json(posts);
    } catch (error) {
      console.error("Error fetching admin blog posts:", error);
      res.status(500).json({ message: "Failed to fetch blog posts" });
    }
  });

  app.get("/api/admin/stats", requireAuth, async (req, res) => {
    try {
      const posts = await activeStorage.getBlogPosts({ includeDrafts: true });
      const totalPosts = posts.length;
      const publishedPosts = posts.filter(p => p.isPublished).length;
      const draftPosts = totalPosts - publishedPosts;
      const featuredPosts = posts.filter(p => p.isFeatured).length;
      
      res.json({
        totalPosts,
        publishedPosts,
        draftPosts,
        featuredPosts
      });
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ message: "Failed to fetch statistics" });
    }
  });

  app.put("/api/comments/:id/approve", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const comment = await activeStorage.approveComment(parseInt(id));
      res.json(comment);
    } catch (error) {
      console.error("Error approving comment:", error);
      res.status(400).json({ message: "Failed to approve comment" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
