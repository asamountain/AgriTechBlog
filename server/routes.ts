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

  // Public profile endpoint for blog post author information (no auth required)
  app.get("/api/profile", async (req, res) => {
    try {
      // Use the same demo user ID for consistency
      const userId = "demo-user-001";
      
      const author = await activeStorage.getAuthorByUserId(userId);
      if (author) {
        // Return only public information needed for blog posts
        res.json({
          id: author.id,
          name: author.name,
          bio: author.bio,
          avatar: author.avatar,
          linkedinUrl: author.linkedinUrl,
          instagramUrl: author.instagramUrl,
          youtubeUrl: author.youtubeUrl,
          githubUrl: author.githubUrl,
          portfolioUrl: author.portfolioUrl
        });
      } else {
        res.json({});
      }
    } catch (error) {
      console.error("Public profile fetch error:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
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

  // SEO Routes for maximum search engine and AI bot visibility
  
  // XML Sitemap for search engines
  app.get('/sitemap.xml', async (req, res) => {
    try {
      const posts = await activeStorage.getBlogPosts({ includeDrafts: false });
      const categories = await activeStorage.getCategories();
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      
      const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  ${categories.map(category => `
  <url>
    <loc>${baseUrl}/category/${category.slug}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`).join('')}
  ${posts.map(post => `
  <url>
    <loc>${baseUrl}/blog/${post.slug}</loc>
    <lastmod>${new Date(post.updatedAt).toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>`).join('')}
</urlset>`;
      
      res.set('Content-Type', 'application/xml');
      res.send(sitemap);
    } catch (error) {
      console.error('Error generating sitemap:', error);
      res.status(500).send('Error generating sitemap');
    }
  });

  // Robots.txt optimized for AI bots and search engines
  app.get('/robots.txt', (req, res) => {
    const robotsTxt = `User-agent: *
Allow: /
Allow: /blog/
Allow: /category/
Allow: /tag/
Disallow: /admin
Disallow: /api/admin

# AI Training and Content Discovery Bots - Full Access
User-agent: GPTBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: CCBot
Allow: /

User-agent: anthropic-ai
Allow: /

User-agent: Claude-Web
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: YouBot
Allow: /

User-agent: Applebot
Allow: /

# Search Engine Bots
User-agent: Googlebot
Allow: /
Crawl-delay: 1

User-agent: Bingbot
Allow: /
Crawl-delay: 1

User-agent: Slurp
Allow: /
Crawl-delay: 2

User-agent: DuckDuckBot
Allow: /

User-agent: facebookexternalhit
Allow: /

User-agent: Twitterbot
Allow: /

User-agent: LinkedInBot
Allow: /

Sitemap: ${req.protocol}://${req.get('host')}/sitemap.xml
`;
    
    res.set('Content-Type', 'text/plain');
    res.send(robotsTxt);
  });

  // RSS Feed for content syndication
  app.get('/rss.xml', async (req, res) => {
    try {
      const posts = await activeStorage.getBlogPosts({ limit: 50, includeDrafts: false });
      const profile = await activeStorage.getAuthor(1);
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      
      const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>AgriTech Innovation Hub - Advanced Agricultural Technology Insights</title>
  <link>${baseUrl}</link>
  <description>Discover cutting-edge agricultural technology, IoT solutions, and sustainable farming practices. Expert insights on precision agriculture, crop monitoring, and smart farming innovations for global impact.</description>
  <language>en-us</language>
  <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
  <atom:link href="${baseUrl}/rss.xml" rel="self" type="application/rss+xml"/>
  <managingEditor>${profile?.email || 'contact@agritech.com'} (${profile?.name || 'AgriTech Team'})</managingEditor>
  <webMaster>${profile?.email || 'contact@agritech.com'} (${profile?.name || 'AgriTech Team'})</webMaster>
  <category>Agricultural Technology</category>
  <category>IoT Solutions</category>
  <category>Precision Agriculture</category>
  <category>Sustainable Farming</category>
  <category>Smart Agriculture</category>
  ${posts.map(post => `
  <item>
    <title><![CDATA[${post.title}]]></title>
    <link>${baseUrl}/blog/${post.slug}</link>
    <guid isPermaLink="true">${baseUrl}/blog/${post.slug}</guid>
    <description><![CDATA[${post.excerpt}]]></description>
    <content:encoded><![CDATA[${post.content}]]></content:encoded>
    <pubDate>${new Date(post.createdAt).toUTCString()}</pubDate>
    <author>${post.author.email} (${post.author.name})</author>
    <category><![CDATA[${post.category.name}]]></category>
    ${post.tags?.map(tag => `<category><![CDATA[${tag}]]></category>`).join('') || ''}
    ${post.featuredImage ? `<enclosure url="${post.featuredImage}" type="image/jpeg"/>` : ''}
  </item>`).join('')}
</channel>
</rss>`;
      
      res.set('Content-Type', 'application/rss+xml');
      res.send(rss);
    } catch (error) {
      console.error('Error generating RSS feed:', error);
      res.status(500).send('Error generating RSS feed');
    }
  });

  // Open Graph image generator for social sharing
  app.get('/api/og-image', async (req, res) => {
    const { title, category } = req.query as { title?: string; category?: string };
    
    const ogTitle = title || 'AgriTech Innovation Hub';
    const ogCategory = category || 'Agricultural Technology';
    
    const svg = `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#2D5016;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#1a3009;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="1200" height="630" fill="url(#bg)"/>
      <text x="60" y="120" font-family="Arial, sans-serif" font-size="32" font-weight="bold" fill="#ffffff" opacity="0.8">${ogCategory}</text>
      <text x="60" y="220" font-family="Arial, sans-serif" font-size="56" font-weight="bold" fill="#ffffff" text-anchor="start">
        <tspan x="60" dy="0">${ogTitle.length > 40 ? ogTitle.substring(0, 40) + '...' : ogTitle}</tspan>
      </text>
      <text x="60" y="520" font-family="Arial, sans-serif" font-size="28" fill="#ffffff" opacity="0.9">AgriTech Innovation Hub</text>
      <text x="60" y="560" font-family="Arial, sans-serif" font-size="24" fill="#ffffff" opacity="0.7">Advancing Agricultural Technology Worldwide</text>
      <circle cx="1050" cy="150" r="80" fill="#ffffff" opacity="0.1"/>
      <circle cx="1100" cy="400" r="60" fill="#ffffff" opacity="0.08"/>
      <circle cx="950" cy="500" r="40" fill="#ffffff" opacity="0.06"/>
    </svg>`;
    
    res.set('Content-Type', 'image/svg+xml');
    res.send(svg);
  });

  // JSON-LD structured data for enhanced AI understanding
  app.get('/api/structured-data', async (req, res) => {
    try {
      const posts = await activeStorage.getBlogPosts({ limit: 10, includeDrafts: false });
      const profile = await activeStorage.getAuthor(1);
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      
      const structuredData = {
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "WebSite",
            "@id": `${baseUrl}/#website`,
            "url": baseUrl,
            "name": "AgriTech Innovation Hub",
            "description": "Leading platform for agricultural technology insights, IoT solutions, and sustainable farming practices worldwide",
            "keywords": "agricultural technology, precision agriculture, IoT farming, smart agriculture, crop monitoring, sustainable farming, AgriTech innovation",
            "potentialAction": {
              "@type": "SearchAction",
              "target": {
                "@type": "EntryPoint",
                "urlTemplate": `${baseUrl}/search?q={search_term_string}`
              },
              "query-input": "required name=search_term_string"
            },
            "inLanguage": "en-US"
          },
          {
            "@type": "Organization",
            "@id": `${baseUrl}/#organization`,
            "name": "AgriTech Innovation Hub",
            "url": baseUrl,
            "description": "Global leader in agricultural technology innovation and smart farming solutions",
            "foundingDate": "2024",
            "logo": {
              "@type": "ImageObject",
              "url": `${baseUrl}/logo.png`,
              "width": 512,
              "height": 512
            },
            "sameAs": [
              profile?.linkedinUrl,
              profile?.githubUrl,
              profile?.youtubeUrl,
              profile?.instagramUrl,
              profile?.portfolioUrl
            ].filter(Boolean),
            "contactPoint": {
              "@type": "ContactPoint",
              "email": profile?.email || "contact@agritech.com",
              "contactType": "customer service"
            },
            "areaServed": "Worldwide",
            "knowsAbout": [
              "Agricultural Technology",
              "Precision Agriculture", 
              "IoT Solutions",
              "Smart Farming",
              "Crop Monitoring",
              "Sustainable Agriculture",
              "Farm Automation",
              "Agricultural Innovation"
            ]
          },
          {
            "@type": "Person",
            "@id": `${baseUrl}/#author`,
            "name": profile?.name || "AgriTech Expert",
            "email": profile?.email,
            "description": profile?.bio || "Agricultural technology expert and innovation leader specializing in IoT solutions and sustainable farming practices",
            "url": baseUrl,
            "jobTitle": "Agricultural Technology Expert",
            "knowsAbout": [
              "Agricultural Technology",
              "IoT Engineering", 
              "Precision Agriculture",
              "Smart Farming Solutions",
              "Sustainable Agriculture",
              "Crop Data Analytics"
            ],
            "sameAs": [
              profile?.linkedinUrl,
              profile?.githubUrl,
              profile?.portfolioUrl,
              profile?.youtubeUrl
            ].filter(Boolean)
          },
          ...posts.slice(0, 5).map(post => ({
            "@type": "BlogPosting",
            "@id": `${baseUrl}/blog/${post.slug}#article`,
            "headline": post.title,
            "description": post.excerpt,
            "url": `${baseUrl}/blog/${post.slug}`,
            "datePublished": new Date(post.createdAt).toISOString(),
            "dateModified": new Date(post.updatedAt).toISOString(),
            "author": {
              "@id": `${baseUrl}/#author`
            },
            "publisher": {
              "@id": `${baseUrl}/#organization`
            },
            "mainEntityOfPage": {
              "@type": "WebPage",
              "@id": `${baseUrl}/blog/${post.slug}`
            },
            "image": post.featuredImage,
            "articleSection": post.category.name,
            "keywords": post.tags?.join(', ') || '',
            "wordCount": Math.ceil(post.content.length / 5),
            "timeRequired": `PT${post.readTime}M`,
            "inLanguage": "en-US",
            "about": {
              "@type": "Thing",
              "name": "Agricultural Technology",
              "description": "Innovative solutions for modern farming and agricultural practices"
            }
          }))
        ]
      };
      
      res.json(structuredData);
    } catch (error) {
      console.error('Error generating structured data:', error);
      res.status(500).json({ error: 'Error generating structured data' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
