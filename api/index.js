var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/mongodb-storage-updated.ts
var mongodb_storage_updated_exports = {};
__export(mongodb_storage_updated_exports, {
  MongoStorage: () => MongoStorage
});
import { MongoClient, ObjectId } from "mongodb";
var MongoStorage;
var init_mongodb_storage_updated = __esm({
  "server/mongodb-storage-updated.ts"() {
    "use strict";
    MongoStorage = class {
      client;
      db;
      usersCollection;
      authorsCollection;
      blogPostsCollection;
      commentsCollection;
      constructor(connectionString, databaseName) {
        this.client = new MongoClient(connectionString);
        this.db = this.client.db(databaseName);
        this.usersCollection = this.db.collection("users");
        this.authorsCollection = this.db.collection("authors");
        this.blogPostsCollection = this.db.collection("posts");
        this.commentsCollection = this.db.collection("comments");
      }
      async connect() {
        await this.client.connect();
        console.log("Connected to MongoDB");
      }
      async disconnect() {
        await this.client.close();
      }
      convertMongoDoc(doc) {
        if (!doc) return void 0;
        const { _id, ...rest } = doc;
        return {
          id: _id.toString(),
          ...rest,
          // Ensure social media fields are included
          linkedinUrl: doc.linkedinUrl || null,
          instagramUrl: doc.instagramUrl || null,
          youtubeUrl: doc.youtubeUrl || null,
          githubUrl: doc.githubUrl || null,
          portfolioUrl: doc.portfolioUrl || null
        };
      }
      extractExcerpt(content) {
        const plainText = content.replace(/<[^>]*>/g, "");
        return plainText.length > 150 ? plainText.substring(0, 150) + "..." : plainText;
      }
      generateSlug(title) {
        return title.toLowerCase().replace(/[^a-z0-9 -]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").trim();
      }
      calculateReadTime(content) {
        const wordsPerMinute = 200;
        const words = content.replace(/<[^>]*>/g, "").split(/\s+/).length;
        return Math.ceil(words / wordsPerMinute);
      }
      mapPostDocument(doc) {
        if (!doc) throw new Error("Document is null or undefined");
        const numericId = doc._id ? parseInt(doc._id.toString().substring(0, 8), 16) : Date.now();
        return {
          id: numericId,
          title: doc.title || "Untitled",
          content: doc.content || "",
          slug: doc.slug || this.generateSlug(doc.title || "untitled"),
          excerpt: doc.excerpt || this.extractExcerpt(doc.content || ""),
          featuredImage: doc.coverImage || "",
          createdAt: doc.date ? new Date(doc.date) : /* @__PURE__ */ new Date(),
          updatedAt: doc.lastModified ? new Date(doc.lastModified) : /* @__PURE__ */ new Date(),
          userId: doc.userId || "",
          tags: Array.isArray(doc.tags) ? doc.tags : doc.tags ? [doc.tags] : [],
          isFeatured: !!doc.featured,
          isPublished: !doc.draft,
          readTime: this.calculateReadTime(doc.content || ""),
          authorId: 1,
          author: {
            id: 1,
            name: "San",
            email: "san@example.com",
            bio: "Sustainable Abundance Seeker",
            avatar: null,
            userId: doc.userId || "",
            linkedinUrl: null,
            instagramUrl: null,
            youtubeUrl: null,
            githubUrl: null,
            portfolioUrl: null
          }
        };
      }
      // User methods
      async getUser(id) {
        const doc = await this.usersCollection.findOne({ _id: new ObjectId(id.toString()) });
        return this.convertMongoDoc(doc);
      }
      async getUserByUsername(username) {
        const doc = await this.usersCollection.findOne({ username });
        return this.convertMongoDoc(doc);
      }
      async createUser(insertUser) {
        const result = await this.usersCollection.insertOne(insertUser);
        return {
          id: parseInt(result.insertedId.toString().substring(0, 8), 16),
          ...insertUser
        };
      }
      // Author methods
      async getAuthors() {
        const docs = await this.authorsCollection.find({}).toArray();
        return docs.map((doc) => this.convertMongoDoc(doc));
      }
      async getAuthor(id) {
        const doc = await this.authorsCollection.findOne({ _id: new ObjectId(id.toString()) });
        return this.convertMongoDoc(doc);
      }
      async getAuthorByUserId(userId) {
        const doc = await this.authorsCollection.findOne({ userId });
        return this.convertMongoDoc(doc);
      }
      async createAuthor(insertAuthor) {
        const authorData = {
          ...insertAuthor,
          createdAt: /* @__PURE__ */ new Date(),
          updatedAt: /* @__PURE__ */ new Date()
        };
        const result = await this.authorsCollection.insertOne(authorData);
        return {
          id: parseInt(result.insertedId.toString().substring(0, 8), 16),
          ...authorData
        };
      }
      async updateAuthor(id, updateData) {
        const result = await this.authorsCollection.findOneAndUpdate(
          { _id: new ObjectId(id.toString()) },
          { $set: { ...updateData, updatedAt: /* @__PURE__ */ new Date() } },
          { returnDocument: "after" }
        );
        if (!result) {
          throw new Error("Author not found");
        }
        return this.convertMongoDoc(result);
      }
      async updateAuthorByUserId(userId, updateData) {
        const result = await this.authorsCollection.findOneAndUpdate(
          { userId },
          { $set: { ...updateData, updatedAt: /* @__PURE__ */ new Date() } },
          { returnDocument: "after" }
        );
        if (!result) {
          throw new Error("Author not found for userId: " + userId);
        }
        return this.convertMongoDoc(result);
      }
      // Blog Post methods
      async getBlogPosts(options = {}) {
        const { limit = 100, offset = 0, featured, includeDrafts = false, userId } = options;
        let query = {};
        if (!includeDrafts) {
          query.draft = { $ne: true };
        }
        if (featured !== void 0) {
          query.featured = featured;
        }
        if (userId) {
          query.$or = [
            { userId },
            { userId: { $exists: false } }
          ];
        }
        const docs = await this.blogPostsCollection.find(query).sort({ date: -1 }).skip(offset).limit(limit).toArray();
        return docs.map((doc) => this.mapPostDocument(doc));
      }
      async getBlogPostBySlug(slug, userId) {
        let query = { slug };
        if (userId) {
          query.$or = [
            { userId },
            { userId: { $exists: false } }
          ];
        }
        const doc = await this.blogPostsCollection.findOne(query);
        return doc ? this.mapPostDocument(doc) : void 0;
      }
      async getBlogPost(id, userId) {
        let doc;
        const allDocs = await this.blogPostsCollection.find({}).toArray();
        doc = allDocs.find((d) => d.id && d.id.toString() === id.toString());
        if (!doc) {
          const numericId = typeof id === "string" ? parseInt(id) : id;
          const hexPrefix = numericId.toString(16).padStart(8, "0");
          doc = allDocs.find((d) => {
            const objectIdStr = d._id.toString();
            return objectIdStr.startsWith(hexPrefix);
          });
        }
        if (!doc) return void 0;
        if (userId && doc.userId && doc.userId !== userId) {
          return void 0;
        }
        return this.mapPostDocument(doc);
      }
      async createBlogPost(insertPost) {
        const now = /* @__PURE__ */ new Date();
        const postData = {
          title: insertPost.title,
          content: insertPost.content,
          excerpt: insertPost.excerpt,
          slug: insertPost.slug,
          coverImage: insertPost.featuredImage,
          date: now,
          lastModified: now,
          draft: false,
          featured: insertPost.isFeatured || false,
          userId: insertPost.userId
        };
        const result = await this.blogPostsCollection.insertOne(postData);
        return {
          id: parseInt(result.insertedId.toString().substring(0, 8), 16),
          ...insertPost,
          createdAt: now,
          updatedAt: now
        };
      }
      async updateBlogPost(id, updateData, userId) {
        try {
          let targetDoc;
          const allDocs = await this.blogPostsCollection.find({}).toArray();
          targetDoc = allDocs.find((doc) => doc.id && doc.id.toString() === id.toString());
          if (!targetDoc) {
            const numericId = typeof id === "string" ? parseInt(id) : id;
            const hexPrefix = numericId.toString(16).padStart(8, "0");
            targetDoc = allDocs.find((doc) => {
              const objectIdStr = doc._id.toString();
              return objectIdStr.startsWith(hexPrefix);
            });
          }
          if (!targetDoc) {
            console.log(`Blog post not found for ID: ${id}`);
            throw new Error("Blog post not found");
          }
          if (userId && targetDoc.userId && targetDoc.userId !== userId) {
            throw new Error("Not authorized to update this post");
          }
          const query = { _id: targetDoc._id };
          const updateDoc = {
            ...updateData,
            lastModified: /* @__PURE__ */ new Date()
          };
          if (updateData.isFeatured !== void 0) {
            updateDoc.featured = updateData.isFeatured;
            delete updateDoc.isFeatured;
          }
          if (updateData.isPublished !== void 0) {
            updateDoc.draft = !updateData.isPublished;
            delete updateDoc.isPublished;
          }
          if (updateData.featuredImage !== void 0) {
            updateDoc.coverImage = updateData.featuredImage;
            delete updateDoc.featuredImage;
          }
          const result = await this.blogPostsCollection.updateOne(
            query,
            { $set: updateDoc }
          );
          if (result.matchedCount === 0) {
            throw new Error("Blog post not found for update");
          }
          const updatedDoc = await this.blogPostsCollection.findOne(query);
          return this.mapPostDocument(updatedDoc);
        } catch (error) {
          console.error("Update blog post error:", error);
          throw error;
        }
      }
      async searchBlogPosts(query, userId) {
        const searchTerm = { $regex: query, $options: "i" };
        const searchQuery = {
          draft: { $ne: true },
          $or: [
            { title: searchTerm },
            { content: searchTerm }
          ]
        };
        if (userId) {
          searchQuery.$and = [
            searchQuery,
            {
              $or: [
                { userId },
                { userId: { $exists: false } }
              ]
            }
          ];
        }
        const docs = await this.blogPostsCollection.find(searchQuery).toArray();
        return docs.map((doc) => this.mapPostDocument(doc));
      }
      async getRelatedPosts(postId) {
        const post = await this.getBlogPost(postId);
        if (!post || !post.tags || post.tags.length === 0) return [];
        const docs = await this.blogPostsCollection.find({
          draft: { $ne: true },
          tags: { $in: post.tags }
        }).toArray();
        const relatedPosts = docs.map((doc) => this.mapPostDocument(doc)).filter((relatedPost) => relatedPost.id !== post.id).slice(0, 3);
        return relatedPosts;
      }
      async getBlogPostsByTag(tag) {
        const docs = await this.blogPostsCollection.find({
          draft: { $ne: true },
          tags: { $in: [tag] }
        }).toArray();
        return docs.map((doc) => this.mapPostDocument(doc));
      }
      // Comment methods
      async getCommentsByPostId(postId) {
        const docs = await this.commentsCollection.find({ postId: postId.toString() }).toArray();
        return docs.map((doc) => this.convertMongoDoc(doc));
      }
      async createComment(insertComment) {
        const result = await this.commentsCollection.insertOne(insertComment);
        return { id: result.insertedId.toString(), ...insertComment };
      }
      async approveComment(commentId) {
        const result = await this.commentsCollection.findOneAndUpdate(
          { _id: new ObjectId(commentId.toString()) },
          { $set: { approved: true } },
          { returnDocument: "after" }
        );
        if (!result) throw new Error("Comment not found");
        return this.convertMongoDoc(result);
      }
      async deleteComment(commentId) {
        const hexPrefix = commentId.toString(16).padStart(8, "0");
        const allComments = await this.commentsCollection.find({}).toArray();
        const targetComment = allComments.find((comment) => {
          const objectIdStr = comment._id.toString();
          return objectIdStr.startsWith(hexPrefix);
        });
        if (targetComment) {
          await this.commentsCollection.deleteOne({ _id: targetComment._id });
        }
      }
      // Migration methods
      async migratePostsToUser(userId) {
        try {
          const result = await this.blogPostsCollection.updateMany(
            { userId: { $exists: false } },
            { $set: { userId } }
          );
          return { migratedCount: result.modifiedCount };
        } catch (error) {
          console.error("Migration error:", error);
          throw error;
        }
      }
      async getUnassignedPostsCount() {
        try {
          const count = await this.blogPostsCollection.countDocuments({
            userId: { $exists: false }
          });
          return count;
        } catch (error) {
          console.error("Count error:", error);
          return 0;
        }
      }
    };
  }
});

// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";
import passport2 from "passport";

// server/storage.ts
init_mongodb_storage_updated();
import dotenv from "dotenv";
dotenv.config();
var MemStorage = class {
  users;
  authors;
  blogPosts;
  comments;
  currentUserId;
  currentAuthorId;
  currentBlogPostId;
  currentCommentId;
  constructor() {
    this.users = /* @__PURE__ */ new Map();
    this.authors = /* @__PURE__ */ new Map();
    this.blogPosts = /* @__PURE__ */ new Map();
    this.comments = /* @__PURE__ */ new Map();
    this.currentUserId = 1;
    this.currentAuthorId = 1;
    this.currentBlogPostId = 1;
    this.currentCommentId = 1;
    this.seedData();
  }
  seedData() {
    const sampleAuthors = [
      { name: "Dr. Sarah Chen", email: "sarah@agrotech.com", bio: "Agricultural technology researcher", avatar: "" },
      { name: "Mark Johnson", email: "mark@agrotech.com", bio: "Precision farming specialist", avatar: "" },
      { name: "Emma Rodriguez", email: "emma@agrotech.com", bio: "Sustainability expert", avatar: "" },
      { name: "Alex Thompson", email: "alex@agrotech.com", bio: "Smart irrigation engineer", avatar: "" },
      { name: "Lisa Park", email: "lisa@agrotech.com", bio: "Vertical farming researcher", avatar: "" },
      { name: "Dr. James Wilson", email: "james@agrotech.com", bio: "Agricultural geneticist", avatar: "" },
      { name: "Rachel Kim", email: "rachel@agrotech.com", bio: "Robotics engineer", avatar: "" }
    ];
    sampleAuthors.forEach((author) => {
      this.createAuthor(author);
    });
    const samplePosts = [
      {
        title: "Revolutionary Hydroponic Systems",
        slug: "revolutionary-hydroponic-systems",
        excerpt: "Exploring how soilless farming techniques are transforming agricultural productivity and resource efficiency in modern farming operations.",
        content: "Hydroponic systems represent a paradigm shift in agricultural production...",
        featuredImage: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=600",
        authorId: 1,
        userId: "demo-user-001",
        readTime: 5,
        isFeatured: true,
        isPublished: true,
        tags: ["hydroponics", "farming", "technology"]
      },
      {
        title: "AI-Powered Crop Monitoring",
        slug: "ai-powered-crop-monitoring",
        excerpt: "How artificial intelligence and drone technology are revolutionizing crop health monitoring and yield prediction systems.",
        content: "Artificial intelligence is transforming agriculture through advanced monitoring systems...",
        featuredImage: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=600",
        authorId: 2,
        userId: "demo-user-001",
        readTime: 8,
        isFeatured: true,
        isPublished: true,
        tags: ["ai", "monitoring", "precision-farming"]
      },
      {
        title: "Agrivoltaics: Farming Under Solar",
        slug: "agrivoltaics-farming-under-solar",
        excerpt: "Combining solar energy production with agricultural practices to maximize land use efficiency and create sustainable farming solutions.",
        content: "Agrivoltaics represents an innovative approach to sustainable agriculture...",
        featuredImage: "https://images.unsplash.com/photo-1466611653911-95081537e5b7?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=600",
        authorId: 3,
        userId: "demo-user-001",
        readTime: 6,
        isFeatured: true,
        isPublished: true,
        tags: ["sustainability", "solar", "energy"]
      },
      {
        title: "Water-Smart Solutions for Modern Agriculture",
        slug: "water-smart-solutions-modern-agriculture",
        excerpt: "Implementing IoT-based irrigation systems that optimize water usage while maximizing crop yield through real-time monitoring.",
        content: "Smart irrigation systems are becoming essential for sustainable agriculture...",
        featuredImage: "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=400",
        authorId: 4,
        userId: "demo-user-001",
        readTime: 7,
        isFeatured: false,
        isPublished: true,
        tags: ["irrigation", "iot", "water-management"]
      },
      {
        title: "The Rise of Vertical Farming Technologies",
        slug: "rise-vertical-farming-technologies",
        excerpt: "How controlled environment agriculture is revolutionizing food production in urban areas with minimal space requirements.",
        content: "Vertical farming is transforming urban agriculture with innovative technologies...",
        featuredImage: "https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=400",
        authorId: 5,
        userId: "demo-user-001",
        readTime: 9,
        isFeatured: false,
        isPublished: true,
        tags: ["vertical-farming", "urban-agriculture", "controlled-environment"]
      },
      {
        title: "Autonomous Farming: The Future is Here",
        slug: "autonomous-farming-future-is-here",
        excerpt: "Exploring how robotic systems are transforming agricultural labor and enabling 24/7 farm monitoring and maintenance.",
        content: "Autonomous farming technologies are revolutionizing agricultural operations...",
        featuredImage: "https://images.unsplash.com/photo-1500595046743-cd271d694d30?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=400",
        authorId: 7,
        userId: "demo-user-001",
        readTime: 6,
        isFeatured: false,
        isPublished: true,
        tags: ["automation", "robotics", "farming"]
      }
    ];
    samplePosts.forEach((post) => {
      this.createBlogPost(post);
    });
  }
  // User methods
  async getUserByUsername(username) {
    return Array.from(this.users.values()).find((user) => user.username === username);
  }
  async createUser(insertUser) {
    const id = this.currentUserId++;
    const user = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  // Author methods
  async getAuthors() {
    return Array.from(this.authors.values());
  }
  async createAuthor(insertAuthor) {
    const id = this.currentAuthorId++;
    const author = {
      ...insertAuthor,
      id,
      bio: insertAuthor.bio || null,
      avatar: insertAuthor.avatar || null,
      userId: insertAuthor.userId || null,
      linkedinUrl: insertAuthor.linkedinUrl || null,
      instagramUrl: insertAuthor.instagramUrl || null,
      youtubeUrl: insertAuthor.youtubeUrl || null,
      githubUrl: insertAuthor.githubUrl || null,
      portfolioUrl: insertAuthor.portfolioUrl || null
    };
    this.authors.set(id, author);
    return author;
  }
  async getAuthorByUserId(userId) {
    return Array.from(this.authors.values()).find((author) => author.userId === userId);
  }
  async updateAuthor(id, updates) {
    const existingAuthor = this.authors.get(id);
    if (!existingAuthor) {
      throw new Error("Author not found");
    }
    const updatedAuthor = { ...existingAuthor, ...updates };
    this.authors.set(id, updatedAuthor);
    return updatedAuthor;
  }
  async updateAuthorByUserId(userId, updates) {
    const existingAuthor = Array.from(this.authors.values()).find((a) => a.userId === userId);
    if (!existingAuthor) {
      throw new Error("Author not found");
    }
    const updatedAuthor = { ...existingAuthor, ...updates };
    this.authors.set(existingAuthor.id, updatedAuthor);
    return updatedAuthor;
  }
  // Blog post methods
  async getBlogPosts(options = {}) {
    const { limit, offset = 0, featured, includeDrafts = false, userId } = options;
    let posts = Array.from(this.blogPosts.values()).filter((post) => {
      if (!includeDrafts && !post.isPublished) return false;
      if (featured !== void 0 && post.isFeatured !== featured) return false;
      if (userId && post.userId !== userId) return false;
      return true;
    });
    posts.sort((a, b) => b.id - a.id);
    if (limit) {
      posts = posts.slice(offset, offset + limit);
    }
    return Promise.all(posts.map(async (post) => {
      const author = this.authors.get(post.authorId);
      return { ...post, author };
    }));
  }
  async getBlogPost(id) {
    const numericId = typeof id === "string" ? parseInt(id) : id;
    const post = this.blogPosts.get(numericId);
    if (!post) return void 0;
    const author = this.authors.get(post.authorId);
    return { ...post, author };
  }
  async getBlogPostBySlug(slug, userId) {
    const post = Array.from(this.blogPosts.values()).find((p) => p.slug === slug);
    if (!post) return void 0;
    if (userId && post.userId !== userId) return void 0;
    const author = this.authors.get(post.authorId);
    return { ...post, author };
  }
  async createBlogPost(insertPost) {
    const id = this.currentBlogPostId++;
    const post = {
      ...insertPost,
      id,
      tags: insertPost.tags || [],
      readTime: insertPost.readTime || 5,
      isFeatured: insertPost.isFeatured || false,
      isPublished: insertPost.isPublished !== false,
      // default to true
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.blogPosts.set(id, post);
    return post;
  }
  async updateBlogPost(id, updateData, userId) {
    const numericId = typeof id === "string" ? parseInt(id) : id;
    const existingPost = this.blogPosts.get(numericId);
    if (!existingPost) {
      throw new Error("Blog post not found");
    }
    if (userId && existingPost.userId !== userId) {
      throw new Error("Not authorized to update this post");
    }
    const updatedPost = {
      ...existingPost,
      ...updateData,
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.blogPosts.set(numericId, updatedPost);
    return updatedPost;
  }
  async searchBlogPosts(query) {
    const searchTerm = query.toLowerCase();
    const posts = Array.from(this.blogPosts.values()).filter(
      (post) => post.isPublished && (post.title.toLowerCase().includes(searchTerm) || post.excerpt.toLowerCase().includes(searchTerm) || post.content.toLowerCase().includes(searchTerm) || post.tags.some((tag) => tag.toLowerCase().includes(searchTerm)))
    );
    return Promise.all(posts.map(async (post) => {
      const author = this.authors.get(post.authorId);
      return { ...post, author };
    }));
  }
  async getRelatedPosts(postId) {
    const numericId = typeof postId === "string" ? parseInt(postId) : postId;
    const post = this.blogPosts.get(numericId);
    if (!post || !post.isPublished) return [];
    const relatedPosts = Array.from(this.blogPosts.values()).filter(
      (p) => p.id !== numericId && p.isPublished && p.tags && post.tags && p.tags.some((tag) => post.tags.includes(tag))
    ).slice(0, 3);
    return Promise.all(relatedPosts.map(async (p) => {
      const author = this.authors.get(p.authorId);
      return { ...p, author };
    }));
  }
  async getBlogPostsByTag(tag) {
    const posts = Array.from(this.blogPosts.values()).filter(
      (post) => post.isPublished && post.tags && post.tags.includes(tag)
    );
    return Promise.all(posts.map(async (post) => {
      const author = this.authors.get(post.authorId);
      return { ...post, author };
    }));
  }
  // Comment methods
  async getCommentsByPostId(postId) {
    return Array.from(this.comments.values()).filter((comment) => comment.blogPostId === postId);
  }
  async createComment(insertComment) {
    const id = this.currentCommentId++;
    const comment = {
      ...insertComment,
      id,
      parentId: insertComment.parentId || null,
      createdAt: /* @__PURE__ */ new Date(),
      isApproved: false
    };
    this.comments.set(id, comment);
    return comment;
  }
  async approveComment(id) {
    const comment = this.comments.get(id);
    if (!comment) {
      throw new Error("Comment not found");
    }
    const approvedComment = { ...comment, isApproved: true };
    this.comments.set(id, approvedComment);
    return approvedComment;
  }
};
var storage = new MemStorage();

// shared/schema.ts
import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
var users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull()
});
var authors = pgTable("authors", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  bio: text("bio"),
  avatar: text("avatar"),
  userId: text("user_id"),
  // Links author to authenticated user
  linkedinUrl: text("linkedin_url"),
  instagramUrl: text("instagram_url"),
  youtubeUrl: text("youtube_url"),
  githubUrl: text("github_url"),
  portfolioUrl: text("portfolio_url")
});
var blogPosts = pgTable("blog_posts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  excerpt: text("excerpt").notNull(),
  content: text("content").notNull(),
  featuredImage: text("featured_image").notNull(),
  authorId: integer("author_id").references(() => authors.id).notNull(),
  userId: text("user_id").notNull(),
  // Links posts to authenticated users
  tags: text("tags").array().default([]),
  // Array of tags for SEO
  readTime: integer("read_time").notNull().default(5),
  isFeatured: boolean("is_featured").notNull().default(false),
  isPublished: boolean("is_published").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});
var comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  blogPostId: integer("blog_post_id").notNull(),
  parentId: integer("parent_id"),
  // For nested replies
  authorName: text("author_name").notNull(),
  authorEmail: text("author_email").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  isApproved: boolean("is_approved").notNull().default(false)
});
var insertUserSchema = createInsertSchema(users).omit({
  id: true
});
var insertAuthorSchema = createInsertSchema(authors).omit({
  id: true
});
var insertBlogPostSchema = createInsertSchema(blogPosts).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertCommentSchema = createInsertSchema(comments).omit({
  id: true,
  createdAt: true
});

// server/auth.ts
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as GitHubStrategy } from "passport-github2";
import session from "express-session";
function setupSession(app2) {
  app2.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    // Reset expiration on activity
    cookie: {
      secure: false,
      // Set to true in production with HTTPS
      maxAge: 30 * 24 * 60 * 60 * 1e3,
      // 30 days for persistent login
      httpOnly: true,
      // Prevent XSS attacks
      sameSite: "lax"
      // CSRF protection
    }
  }));
}
function setupAuth(app2) {
  app2.use(passport.initialize());
  app2.use(passport.session());
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    const baseUrl = process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`;
    console.log("OAuth Configuration:");
    console.log("Base URL:", baseUrl);
    console.log("Callback URL:", `${baseUrl}/auth/google/callback`);
    passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${baseUrl}/auth/google/callback`
    }, async (accessToken, refreshToken, profile, done) => {
      const user = {
        id: profile.id,
        email: profile.emails?.[0]?.value || "",
        name: profile.displayName || "",
        provider: "google",
        avatar: profile.photos?.[0]?.value
      };
      return done(null, user);
    }));
  }
  if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
    const baseUrl = process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`;
    passport.use(new GitHubStrategy({
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: `${baseUrl}/auth/github/callback`
    }, async (accessToken, refreshToken, profile, done) => {
      const user = {
        id: profile.id,
        email: profile.emails?.[0]?.value || "",
        name: profile.displayName || profile.username || "",
        provider: "github",
        avatar: profile.photos?.[0]?.value
      };
      return done(null, user);
    }));
  }
  passport.serializeUser((user, done) => {
    done(null, user);
  });
  passport.deserializeUser((user, done) => {
    done(null, user);
  });
  app2.get(
    "/auth/google",
    passport.authenticate("google", { scope: ["profile", "email"] })
  );
  app2.get(
    "/auth/google/callback",
    passport.authenticate("google", { failureRedirect: "/admin" }),
    (req, res) => {
      res.redirect("/admin");
    }
  );
  app2.get(
    "/auth/github",
    passport.authenticate("github", { scope: ["user:email"] })
  );
  app2.get(
    "/auth/github/callback",
    passport.authenticate("github", { failureRedirect: "/admin" }),
    (req, res) => {
      res.redirect("/admin");
    }
  );
  app2.get("/auth/logout", (req, res) => {
    req.logout(() => {
      res.redirect("/");
    });
  });
  app2.get("/api/auth/user", (req, res) => {
    if (req.isAuthenticated()) {
      res.json(req.user);
    } else {
      res.status(401).json({ message: "Not authenticated" });
    }
  });
}
function requireAuth(req, res, next) {
  if (req.isAuthenticated()) {
    next();
  } else {
    res.status(401).json({ message: "Authentication required" });
  }
}

// server/ai-tagging.ts
var AITaggingService = class {
  apiKey;
  apiUrl;
  constructor() {
    this.apiKey = process.env.PERPLEXITY_API_KEY || "";
    this.apiUrl = "https://api.perplexity.ai/chat/completions";
    if (!this.apiKey) {
      console.warn("Perplexity API key not configured. AI tagging will use fallback methods.");
    }
  }
  async analyzeContent(post) {
    try {
      if (!this.apiKey) {
        return this.getFallbackAnalysis(post.title, post.content);
      }
      const prompt = `Analyze this agricultural technology blog post and suggest relevant tags.

Title: "${post.title}"
Content: "${post.content.substring(0, 1e3)}..."

Generate 5-8 relevant tags that would be helpful for categorizing and finding this content. Focus on:
- Agricultural technology themes
- Specific techniques or tools mentioned
- Industry sectors
- Scientific concepts
- Practical applications

Respond with a JSON object containing an array of suggested tags:
{
  "suggestedTags": ["tag1", "tag2", "tag3", ...],
  "reasoning": "Brief explanation of tag selection"
}`;
      const response = await fetch(this.apiUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama-3.1-sonar-small-128k-online",
          messages: [
            {
              role: "system",
              content: "You are an expert agricultural technology content analyst. Always respond with valid JSON format."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          max_tokens: 300,
          temperature: 0.3,
          stream: false
        })
      });
      if (!response.ok) {
        throw new Error(`Perplexity API error: ${response.status}`);
      }
      const data = await response.json();
      const result = data.choices[0]?.message?.content;
      if (result) {
        const parsed = JSON.parse(result);
        return {
          suggestedTags: parsed.suggestedTags || [],
          reasoning: parsed.reasoning || "AI analysis completed"
        };
      }
      return this.getFallbackAnalysis(post.title, post.content);
    } catch (error) {
      console.error("AI tagging error:", error);
      return this.getFallbackAnalysis(post.title, post.content);
    }
  }
  getFallbackAnalysis(title, content) {
    const fallbackTags = this.extractKeywords(title, content);
    return {
      suggestedTags: fallbackTags.slice(0, 6),
      reasoning: "Generated using keyword extraction as fallback method"
    };
  }
  extractKeywords(title, content) {
    const text2 = `${title} ${content}`.toLowerCase();
    const agriculturalTerms = [
      "precision farming",
      "hydroponics",
      "iot",
      "sensors",
      "agriculture",
      "farming",
      "technology",
      "automation",
      "sustainability",
      "crop",
      "irrigation",
      "monitoring",
      "data",
      "analytics",
      "smart farming",
      "vertical farming",
      "greenhouse",
      "robotics",
      "ai",
      "machine learning",
      "soil",
      "water management",
      "yield",
      "efficiency",
      "innovation"
    ];
    const foundTerms = agriculturalTerms.filter(
      (term) => text2.includes(term.toLowerCase())
    );
    return foundTerms.length > 0 ? foundTerms : ["agriculture", "technology", "farming"];
  }
};
var aiTaggingService = null;
function getAITaggingService() {
  if (!aiTaggingService) {
    aiTaggingService = new AITaggingService();
  }
  return aiTaggingService;
}

// server/routes.ts
var dynamicMongoConfig = null;
var activeStorage = storage;
async function setDynamicMongoConnection(uri, dbName) {
  const { MongoStorage: MongoStorage2 } = await Promise.resolve().then(() => (init_mongodb_storage_updated(), mongodb_storage_updated_exports));
  const storage2 = new MongoStorage2(uri, dbName);
  await storage2.connect();
  activeStorage = storage2;
  dynamicMongoConfig = { uri, dbName };
}
async function registerRoutes(app2) {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.DATABASE_URL;
    const databaseName = "test";
    if (mongoUri) {
      console.log("Connecting to MongoDB...");
      const { MongoStorage: MongoStorage2 } = await Promise.resolve().then(() => (init_mongodb_storage_updated(), mongodb_storage_updated_exports));
      const mongoStorage = new MongoStorage2(mongoUri, databaseName);
      await mongoStorage.connect();
      activeStorage = mongoStorage;
      console.log("Successfully connected to MongoDB");
      const existingPosts = await mongoStorage.getBlogPosts({ limit: 5 });
      console.log(`Found ${existingPosts.length} existing posts in database`);
    } else {
      console.log("No MongoDB URI found, using in-memory storage");
    }
  } catch (error) {
    console.log("MongoDB connection failed, using fallback storage:", error);
  }
  app2.get("/auth/google", passport2.authenticate("google", { scope: ["profile", "email"] }));
  app2.get(
    "/auth/google/callback",
    passport2.authenticate("google", { failureRedirect: "/admin" }),
    (req, res) => {
      res.redirect("/auth/callback");
    }
  );
  app2.get("/auth/github", passport2.authenticate("github", { scope: ["user:email"] }));
  app2.get(
    "/auth/github/callback",
    passport2.authenticate("github", { failureRedirect: "/admin" }),
    (req, res) => {
      res.redirect("/auth/callback");
    }
  );
  app2.get("/api/auth/user", (req, res) => {
    if (req.isAuthenticated && req.isAuthenticated()) {
      res.json(req.user);
    } else {
      res.status(401).json({ message: "Not authenticated" });
    }
  });
  app2.post("/api/admin/migrate-posts", async (req, res) => {
    try {
      if (!req.isAuthenticated || !req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const userId = req.user?.id;
      if (!userId) {
        return res.status(400).json({ message: "User ID not found" });
      }
      if (activeStorage instanceof (await Promise.resolve().then(() => (init_mongodb_storage_updated(), mongodb_storage_updated_exports))).MongoStorage) {
        const result = await activeStorage.migratePostsToUser(userId);
        res.json({
          message: "Posts migration completed",
          userId,
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
  app2.get("/api/admin/unassigned-posts", async (req, res) => {
    try {
      if (!req.isAuthenticated || !req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      if (activeStorage instanceof (await Promise.resolve().then(() => (init_mongodb_storage_updated(), mongodb_storage_updated_exports))).MongoStorage) {
        const count = await activeStorage.getUnassignedPostsCount();
        res.json({ unassignedCount: count });
      } else {
        res.json({ unassignedCount: 0 });
      }
    } catch (error) {
      console.error("Error checking unassigned posts:", error);
      res.status(500).json({ message: "Failed to check unassigned posts" });
    }
  });
  app2.get("/api/profile", async (req, res) => {
    try {
      const userId = "demo-user-001";
      const author = await activeStorage.getAuthorByUserId(userId);
      if (author) {
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
  app2.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });
  app2.get("/api/authors", async (req, res) => {
    try {
      const authors2 = await activeStorage.getAuthors();
      res.json(authors2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch authors" });
    }
  });
  app2.post("/api/authors", async (req, res) => {
    try {
      const authorData = insertAuthorSchema.parse(req.body);
      const author = await activeStorage.createAuthor(authorData);
      res.status(201).json(author);
    } catch (error) {
      res.status(400).json({ message: "Invalid author data" });
    }
  });
  app2.get("/api/blog-posts", async (req, res) => {
    try {
      const { category, limit, offset, featured } = req.query;
      const options = {
        categorySlug: category,
        limit: limit ? parseInt(limit) : void 0,
        offset: offset ? parseInt(offset) : void 0,
        featured: featured ? featured === "true" : void 0
      };
      const posts = await activeStorage.getBlogPosts(options);
      res.json(posts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch blog posts" });
    }
  });
  app2.get("/api/blog-posts/featured", async (req, res) => {
    try {
      const posts = await activeStorage.getBlogPosts({ featured: true, limit: 3 });
      res.json(posts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch featured posts" });
    }
  });
  app2.get("/api/blog-posts/search", async (req, res) => {
    try {
      const { q } = req.query;
      if (!q || typeof q !== "string") {
        return res.status(400).json({ message: "Search query is required" });
      }
      const posts = await activeStorage.searchBlogPosts(q);
      res.json(posts);
    } catch (error) {
      res.status(500).json({ message: "Failed to search blog posts" });
    }
  });
  app2.get("/api/blog-posts/:identifier", async (req, res) => {
    try {
      const { identifier } = req.params;
      console.log(`Fetching blog post with identifier: ${identifier}`);
      let post;
      if (/^\d+$/.test(identifier)) {
        const postId = isNaN(parseInt(identifier)) ? identifier : parseInt(identifier);
        post = await activeStorage.getBlogPost(postId);
      } else {
        post = await activeStorage.getBlogPostBySlug(identifier);
      }
      if (!post) {
        console.log(`Blog post not found for identifier: ${identifier}`);
        return res.status(404).json({ message: "Blog post not found" });
      }
      res.json(post);
    } catch (error) {
      console.error(`Error fetching blog post with identifier ${req.params.identifier}:`, error);
      res.status(500).json({ message: "Failed to fetch blog post", error: error.message });
    }
  });
  app2.get("/api/blog-posts/:id/related", async (req, res) => {
    try {
      const { id } = req.params;
      const postId = isNaN(parseInt(id)) ? id : parseInt(id);
      const post = await activeStorage.getBlogPost(postId);
      if (!post) {
        return res.status(404).json({ message: "Blog post not found" });
      }
      const relatedPosts = await activeStorage.getRelatedPosts(postId);
      res.json(relatedPosts);
    } catch (error) {
      console.error("Related posts error:", error);
      res.status(500).json({ message: "Failed to fetch related posts" });
    }
  });
  app2.post("/api/blog-posts", async (req, res) => {
    try {
      const postData = insertBlogPostSchema.parse(req.body);
      const post = await activeStorage.createBlogPost(postData);
      res.status(201).json(post);
    } catch (error) {
      res.status(400).json({ message: "Invalid blog post data" });
    }
  });
  app2.get("/sitemap.xml", async (req, res) => {
    try {
      const baseUrl = req.get("host")?.includes("localhost") ? "http://localhost:5000" : `https://${req.get("host")}`;
      const allPosts = await activeStorage.getBlogPosts({ includeDrafts: true });
      const publishedPosts = allPosts.filter((post) => post.isPublished);
      console.log(`Sitemap: Total posts: ${allPosts.length}, Published: ${publishedPosts.length}`);
      const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}</loc>
    <lastmod>${(/* @__PURE__ */ new Date()).toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/posts</loc>
    <lastmod>${(/* @__PURE__ */ new Date()).toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
${publishedPosts.map((post) => `  <url>
    <loc>${baseUrl}/blog/${post.slug}</loc>
    <lastmod>${new Date(post.updatedAt).toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`).join("\n")}
</urlset>`;
      res.setHeader("Content-Type", "application/xml");
      res.send(sitemap);
    } catch (error) {
      console.error("Error generating sitemap:", error);
      res.status(500).send("Error generating sitemap");
    }
  });
  app2.post("/api/newsletter/subscribe", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email || typeof email !== "string") {
        return res.status(400).json({ message: "Valid email is required" });
      }
      res.json({ message: "Successfully subscribed to newsletter" });
    } catch (error) {
      res.status(500).json({ message: "Failed to subscribe to newsletter" });
    }
  });
  app2.get("/api/admin/profile", async (req, res) => {
    try {
      const userId = "demo-user-001";
      const author = await activeStorage.getAuthorByUserId(userId);
      res.json(author || {});
    } catch (error) {
      console.error("Profile fetch error:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });
  app2.patch("/api/admin/profile", async (req, res) => {
    try {
      const userId = "demo-user-001";
      const profileData = req.body;
      let author = await activeStorage.getAuthorByUserId(userId);
      if (author) {
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
        const newAuthor = await activeStorage.createAuthor({
          name: profileData.name || "Author",
          email: profileData.email || "author@example.com",
          bio: profileData.bio,
          avatar: profileData.avatar,
          userId,
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
  app2.get("/api/admin/blog-posts", async (req, res) => {
    try {
      const posts = await activeStorage.getBlogPosts({ includeDrafts: true });
      res.json(posts);
    } catch (error) {
      console.error("Error fetching admin blog posts:", error);
      res.status(500).json({ message: "Failed to fetch blog posts" });
    }
  });
  app2.get("/api/admin/stats", requireAuth, async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "User ID not found" });
      }
      const posts = await activeStorage.getBlogPosts({
        includeDrafts: true,
        userId
      });
      const totalPosts = posts.length;
      const publishedPosts = posts.filter((p) => p.isPublished).length;
      const draftPosts = totalPosts - publishedPosts;
      const featuredPosts = posts.filter((p) => p.isFeatured).length;
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
  app2.put("/api/blog-posts/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const postId = isNaN(parseInt(id)) ? id : parseInt(id);
      const userId = req.isAuthenticated && req.isAuthenticated() ? req.user?.id : void 0;
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
  app2.patch("/api/blog-posts/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const postId = isNaN(parseInt(id)) ? id : parseInt(id);
      const userId = req.isAuthenticated && req.isAuthenticated() ? req.user?.id : void 0;
      console.log("PATCH request for post:", postId, "with data:", req.body);
      const updateData = req.body;
      const updatedPost = await activeStorage.updateBlogPost(postId, updateData, userId);
      console.log("Updated post result:", updatedPost);
      res.json(updatedPost);
    } catch (error) {
      console.error("PATCH blog post error:", error);
      const err = error;
      if (err.message === "Not authorized to update this post") {
        res.status(403).json({ message: err.message });
      } else if (err.message === "Blog post not found") {
        res.status(404).json({ message: err.message });
      } else {
        res.status(400).json({ message: "Failed to update blog post", error: err.message });
      }
    }
  });
  app2.get("/api/admin/verify-session", (req, res) => {
    if (req.isAuthenticated && req.isAuthenticated()) {
      const user = req.user;
      const adminEmails = ["admin@hopeinvest.com", "seungjinyoun@gmail.com"];
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
  app2.post("/api/admin/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      req.session.destroy((err2) => {
        if (err2) {
          return res.status(500).json({ message: "Session destruction failed" });
        }
        res.clearCookie("connect.sid");
        res.json({ message: "Logged out successfully" });
      });
    });
  });
  app2.post("/api/ai-tagging/analyze/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const postId = isNaN(parseInt(id)) ? id : parseInt(id);
      const userId = req.isAuthenticated && req.isAuthenticated() ? req.user?.id : void 0;
      const post = await activeStorage.getBlogPost(postId, userId);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      const keywords = post.content.toLowerCase().match(/\b\w{4,}\b/g) || [];
      const tagCandidates = Array.from(new Set(keywords)).filter((word) => !["this", "that", "with", "from", "they", "have", "been", "will", "more", "time"].includes(word)).slice(0, 5);
      res.json({
        suggestedTags: tagCandidates,
        confidence: 0.7,
        reasoning: "Generated using keyword analysis"
      });
    } catch (error) {
      console.error("AI tagging error:", error);
      res.status(500).json({ message: "Failed to analyze content" });
    }
  });
  app2.delete("/api/blog-posts/:id", async (req, res) => {
    try {
      const postId = parseInt(req.params.id);
      res.json({ message: "Post deleted successfully" });
    } catch (error) {
      res.status(400).json({ message: "Failed to delete blog post" });
    }
  });
  app2.get("/api/blog-posts/:id/comments", async (req, res) => {
    try {
      const { id } = req.params;
      const comments2 = await activeStorage.getCommentsByPostId(id);
      res.json(comments2);
    } catch (error) {
      console.error("Error fetching comments:", error);
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });
  app2.post("/api/blog-posts/:id/comments", async (req, res) => {
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
  app2.put("/api/comments/:id/approve", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const comment = await activeStorage.approveComment(parseInt(id));
      res.json(comment);
    } catch (error) {
      console.error("Error approving comment:", error);
      res.status(400).json({ message: "Failed to approve comment" });
    }
  });
  app2.delete("/api/comments/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      await activeStorage.deleteComment(parseInt(id));
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting comment:", error);
      res.status(400).json({ message: "Failed to delete comment" });
    }
  });
  app2.get("/api/admin/comments", requireAuth, async (req, res) => {
    try {
      const userId = req.isAuthenticated && req.isAuthenticated() ? req.user?.id : void 0;
      const userPosts = await activeStorage.getBlogPosts({
        limit: 1e3,
        includeDrafts: true,
        userId
      });
      const allComments = [];
      for (const post of userPosts) {
        const postComments = await activeStorage.getCommentsByPostId(post.id);
        const commentsWithPost = postComments.map((comment) => ({
          ...comment,
          postTitle: post.title,
          postSlug: post.slug
        }));
        allComments.push(...commentsWithPost);
      }
      allComments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      res.json(allComments);
    } catch (error) {
      console.error("Error fetching admin comments:", error);
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });
  app2.get("/api/analytics/categories", requireAuth, async (req, res) => {
    try {
      const posts = await activeStorage.getBlogPosts({ includeDrafts: true });
      const distribution = analyzeCategoryDistribution(posts);
      res.json(distribution);
    } catch (error) {
      console.error("Error analyzing categories:", error);
      res.status(500).json({ message: "Failed to analyze categories" });
    }
  });
  app2.get("/api/analytics/trending", async (req, res) => {
    try {
      const posts = await activeStorage.getBlogPosts({ includeDrafts: false });
      const trending = getTrendingTopics(posts, 10);
      res.json(trending);
    } catch (error) {
      console.error("Error getting trending topics:", error);
      res.status(500).json({ message: "Failed to get trending topics" });
    }
  });
  app2.post("/api/ai-tagging/analyze/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const post = await activeStorage.getBlogPost(id, userId);
      if (!post) {
        return res.status(404).json({ message: "Blog post not found" });
      }
      const aiService = getAITaggingService();
      const analysis = await aiService.analyzeContent(post);
      res.json(analysis);
    } catch (error) {
      console.error("AI analysis error:", error);
      res.status(500).json({ message: "Failed to analyze content" });
    }
  });
  app2.post("/api/ai-tagging/generate-tags", requireAuth, async (req, res) => {
    try {
      const { content } = req.body;
      if (!content || typeof content !== "string") {
        return res.status(400).json({ message: "Content is required" });
      }
      const aiService = getAITaggingService();
      const tags = await aiService.generateTags(content);
      res.json({ tags });
    } catch (error) {
      console.error("Tag generation error:", error);
      res.status(500).json({ message: "Failed to generate tags" });
    }
  });
  app2.post("/api/ai-tagging/bulk-analyze", requireAuth, async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
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
          await new Promise((resolve) => setTimeout(resolve, 1e3));
        } catch (error) {
          console.error(`Failed to analyze post ${post.id}:`, error);
          results.push({
            postId: post.id,
            title: post.title,
            error: "Analysis failed"
          });
        }
      }
      res.json({ results });
    } catch (error) {
      console.error("Bulk analysis error:", error);
      res.status(500).json({ message: "Failed to perform bulk analysis" });
    }
  });
  app2.get("/api/admin/blog-posts", async (req, res) => {
    try {
      const posts = await activeStorage.getBlogPosts({ includeDrafts: true });
      res.json(posts);
    } catch (error) {
      console.error("Error fetching admin blog posts:", error);
      res.status(500).json({ message: "Failed to fetch blog posts" });
    }
  });
  app2.post("/api/admin/blog-posts", async (req, res) => {
    try {
      console.log("Creating/updating admin blog post with data:", req.body);
      const postData = req.body;
      if (!postData.userId) {
        postData.userId = "demo-user-001";
      }
      if (postData.id) {
        const updatedPost = await activeStorage.updateBlogPost(postData.id, postData, postData.userId);
        res.json(updatedPost);
      } else {
        const newPost = await activeStorage.createBlogPost(postData);
        res.status(201).json(newPost);
      }
    } catch (error) {
      console.error("Error creating/updating admin blog post:", error);
      res.status(500).json({ message: "Failed to save blog post", error: error.message });
    }
  });
  app2.patch("/api/admin/blog-posts/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const postId = isNaN(parseInt(id)) ? id : parseInt(id);
      console.log("PATCH admin request for post:", postId, "with data:", req.body);
      const updateData = req.body;
      const updatedPost = await activeStorage.updateBlogPost(postId, updateData, void 0);
      console.log("Admin updated post result:", updatedPost);
      res.json(updatedPost);
    } catch (error) {
      console.error("PATCH admin blog post error:", error);
      res.status(500).json({ message: "Failed to update blog post", error: error.message });
    }
  });
  app2.get("/api/admin/stats", requireAuth, async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "User ID not found" });
      }
      const posts = await activeStorage.getBlogPosts({
        includeDrafts: true,
        userId
      });
      const totalPosts = posts.length;
      const publishedPosts = posts.filter((p) => p.isPublished).length;
      const draftPosts = totalPosts - publishedPosts;
      const featuredPosts = posts.filter((p) => p.isFeatured).length;
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
  app2.put("/api/comments/:id/approve", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const comment = await activeStorage.approveComment(parseInt(id));
      res.json(comment);
    } catch (error) {
      console.error("Error approving comment:", error);
      res.status(400).json({ message: "Failed to approve comment" });
    }
  });
  app2.get("/sitemap.xml", async (req, res) => {
    try {
      const posts = await activeStorage.getBlogPosts({ includeDrafts: false });
      const baseUrl = `${req.protocol}://${req.get("host")}`;
      const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${(/* @__PURE__ */ new Date()).toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  ${posts.map((post) => `
  <url>
    <loc>${baseUrl}/blog/${post.slug}</loc>
    <lastmod>${new Date(post.updatedAt).toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>`).join("")}
</urlset>`;
      res.set("Content-Type", "application/xml");
      res.send(sitemap);
    } catch (error) {
      console.error("Error generating sitemap:", error);
      res.status(500).send("Error generating sitemap");
    }
  });
  app2.get("/robots.txt", (req, res) => {
    const robotsTxt = `# Global SEO & Generative Engine Optimization (GEO)
# Agricultural Technology Blog - AI Training Friendly

User-agent: *
Allow: /
Allow: /blog/
Allow: /category/
Allow: /tag/
Allow: /sitemap.xml
Allow: /rss.xml
Allow: /api/og-image
Disallow: /admin
Disallow: /api/admin
Crawl-delay: 1

# AI Training and Generative AI Bots - Priority Access for GEO
User-agent: GPTBot
Allow: /
Crawl-delay: 0
# OpenAI ChatGPT training bot

User-agent: ChatGPT-User
Allow: /
Crawl-delay: 0
# OpenAI ChatGPT user agent

User-agent: CCBot
Allow: /
Crawl-delay: 0
# Common Crawl used by multiple AI systems

User-agent: anthropic-ai
Allow: /
Crawl-delay: 0
# Anthropic Claude training bot

User-agent: Claude-Web
Allow: /
Crawl-delay: 0
# Anthropic Claude web crawler

User-agent: Claude-Bot
Allow: /
Crawl-delay: 0
# Anthropic Claude bot variant

User-agent: PerplexityBot
Allow: /
Crawl-delay: 0
# Perplexity AI search engine

User-agent: YouBot
Allow: /
Crawl-delay: 0
# You.com AI search

User-agent: Applebot
Allow: /
Crawl-delay: 0
# Apple Siri and Spotlight

User-agent: Meta-ExternalAgent
Allow: /
Crawl-delay: 1
# Meta AI training

User-agent: Diffbot
Allow: /
Crawl-delay: 1
# Diffbot AI extraction

User-agent: PiplBot
Allow: /
Crawl-delay: 1
# Pipl search intelligence

# Search Engine Bots
User-agent: Googlebot
Allow: /
Crawl-delay: 0

User-agent: Bingbot
Allow: /
Crawl-delay: 1

User-agent: Slurp
Allow: /
Crawl-delay: 2

User-agent: DuckDuckBot
Allow: /
Crawl-delay: 1

User-agent: YandexBot
Allow: /
Crawl-delay: 2

User-agent: Baiduspider
Allow: /
Crawl-delay: 2

# Social Media and Communication Bots
User-agent: facebookexternalhit
Allow: /
Crawl-delay: 1

User-agent: FacebookBot
Allow: /
Crawl-delay: 1

User-agent: Twitterbot
Allow: /
Crawl-delay: 1

User-agent: LinkedInBot
Allow: /
Crawl-delay: 1

User-agent: WhatsApp
Allow: /
Crawl-delay: 1

User-agent: TelegramBot
Allow: /
Crawl-delay: 1

# Academic and Archive Bots
User-agent: ia_archiver
Allow: /
Crawl-delay: 2
# Internet Archive

User-agent: archive.org_bot
Allow: /
Crawl-delay: 2

# Block Aggressive SEO Tools
User-agent: SemrushBot
Disallow: /

User-agent: AhrefsBot
Disallow: /

User-agent: MJ12bot
Disallow: /

User-agent: DotBot
Disallow: /

Sitemap: ${req.protocol}://${req.get("host")}/sitemap.xml
Sitemap: ${req.protocol}://${req.get("host")}/rss.xml

# GEO Content Context for AI Systems:
# This blog specializes in agricultural technology including:
# IoT solutions, precision agriculture, smart farming,
# sustainable practices, crop monitoring, and environmental optimization
`;
    res.set("Content-Type", "text/plain");
    res.send(robotsTxt);
  });
  app2.get("/rss.xml", async (req, res) => {
    try {
      const posts = await activeStorage.getBlogPosts({ limit: 50, includeDrafts: false });
      const baseUrl = `${req.protocol}://${req.get("host")}`;
      const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>AgriTech Innovation Hub - Advanced Agricultural Technology Insights</title>
  <link>${baseUrl}</link>
  <description>Discover cutting-edge agricultural technology, IoT solutions, and sustainable farming practices. Expert insights on precision agriculture, crop monitoring, and smart farming innovations for global impact.</description>
  <language>en-us</language>
  <lastBuildDate>${(/* @__PURE__ */ new Date()).toUTCString()}</lastBuildDate>
  <atom:link href="${baseUrl}/rss.xml" rel="self" type="application/rss+xml"/>
  <managingEditor>contact@agritech.com (AgriTech Innovation Hub)</managingEditor>
  <webMaster>contact@agritech.com (AgriTech Innovation Hub)</webMaster>
  <category>Agricultural Technology</category>
  <category>IoT Solutions</category>
  <category>Precision Agriculture</category>
  <category>Sustainable Farming</category>
  <category>Smart Agriculture</category>
  ${posts.map((post) => `
  <item>
    <title><![CDATA[${post.title}]]></title>
    <link>${baseUrl}/blog/${post.slug}</link>
    <guid isPermaLink="true">${baseUrl}/blog/${post.slug}</guid>
    <description><![CDATA[${post.excerpt}]]></description>
    <content:encoded><![CDATA[${post.content}]]></content:encoded>
    <pubDate>${new Date(post.createdAt).toUTCString()}</pubDate>
    <author>${post.author.email} (${post.author.name})</author>
    <category><![CDATA[${post.category.name}]]></category>
    ${post.tags?.map((tag) => `<category><![CDATA[${tag}]]></category>`).join("") || ""}
    ${post.featuredImage ? `<enclosure url="${post.featuredImage}" type="image/jpeg"/>` : ""}
  </item>`).join("")}
</channel>
</rss>`;
      res.set("Content-Type", "application/rss+xml");
      res.send(rss);
    } catch (error) {
      console.error("Error generating RSS feed:", error);
      res.status(500).send("Error generating RSS feed");
    }
  });
  app2.get("/api/og-image", async (req, res) => {
    const { title, category } = req.query;
    const ogTitle = title || "San's Blog";
    const ogCategory = category || "Blog Post";
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
        <tspan x="60" dy="0">${ogTitle.length > 40 ? ogTitle.substring(0, 40) + "..." : ogTitle}</tspan>
      </text>
      <text x="60" y="520" font-family="Arial, sans-serif" font-size="28" fill="#ffffff" opacity="0.9">San's Blog</text>
      <text x="60" y="560" font-family="Arial, sans-serif" font-size="24" fill="#ffffff" opacity="0.7">Insights on Technology and Innovation</text>
      <circle cx="1050" cy="150" r="80" fill="#ffffff" opacity="0.1"/>
      <circle cx="1100" cy="400" r="60" fill="#ffffff" opacity="0.08"/>
      <circle cx="950" cy="500" r="40" fill="#ffffff" opacity="0.06"/>
    </svg>`;
    res.set("Content-Type", "image/svg+xml");
    res.send(svg);
  });
  app2.get("/api/structured-data", async (req, res) => {
    try {
      const posts = await activeStorage.getBlogPosts({ limit: 10, includeDrafts: false });
      const baseUrl = `${req.protocol}://${req.get("host")}`;
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
            "contactPoint": {
              "@type": "ContactPoint",
              "email": "contact@agritech.com",
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
            "name": "AgriTech Expert",
            "email": "contact@agritech.com",
            "description": "Agricultural technology expert and innovation leader specializing in IoT solutions and sustainable farming practices",
            "url": baseUrl,
            "jobTitle": "Agricultural Technology Expert",
            "knowsAbout": [
              "Agricultural Technology",
              "IoT Engineering",
              "Precision Agriculture",
              "Smart Farming Solutions",
              "Sustainable Agriculture",
              "Crop Data Analytics"
            ]
          },
          ...posts.slice(0, 5).map((post) => ({
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
            "keywords": post.tags?.join(", ") || "",
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
      console.error("Error generating structured data:", error);
      res.status(500).json({ error: "Error generating structured data" });
    }
  });
  app2.post("/api/admin/connect-mongodb", requireAuth, async (req, res) => {
    const { uri, dbName } = req.body;
    const userId = req.user?.id;
    if (!uri) {
      return res.status(400).json({ success: false, error: "Missing MongoDB URI" });
    }
    if (!userId) {
      return res.status(401).json({ success: false, error: "User not authenticated" });
    }
    try {
      await setDynamicMongoConnection(uri, dbName || "blog");
      console.log(`User ${userId} connected to MongoDB: ${dbName || "blog"}`);
      res.json({ success: true, message: "Connected to MongoDB successfully" });
    } catch (err) {
      console.error(`MongoDB connection failed for user ${userId}:`, err);
      res.status(500).json({ success: false, error: err.message });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json({ limit: "50mb" }));
app.use(express2.urlencoded({ extended: false, limit: "50mb" }));
setupSession(app);
setupAuth(app);
app.get("/googlec3cfbe8ec5429358.html", (req, res) => {
  res.setHeader("Content-Type", "text/html");
  res.send("google-site-verification: googlec3cfbe8ec5429358.html");
});
app.get("/robots.txt", (req, res) => {
  const baseUrl = req.get("host")?.includes("localhost") ? "http://localhost:5000" : `https://${req.get("host")}`;
  const robots = `User-agent: *
Allow: /

Sitemap: ${baseUrl}/sitemap.xml`;
  res.setHeader("Content-Type", "text/plain");
  res.send(robots);
});
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = 5e3;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
