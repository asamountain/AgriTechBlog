import { MongoClient, Db, Collection, ObjectId } from "mongodb";
import { 
  type User, type InsertUser,
  type Category, type InsertCategory,
  type Author, type InsertAuthor,
  type BlogPost, type InsertBlogPost,
  type BlogPostWithDetails,
  type Comment, type InsertComment
} from "@shared/schema";
import { IStorage } from "./storage";

export class MongoStorage implements IStorage {
  private client: MongoClient;
  private db: Db;
  private usersCollection: Collection;
  private categoriesCollection: Collection;
  private authorsCollection: Collection;
  private blogPostsCollection: Collection;
  private commentsCollection: Collection;

  constructor(connectionString: string, databaseName: string) {
    this.client = new MongoClient(connectionString);
    this.db = this.client.db(databaseName);
    this.usersCollection = this.db.collection("users");
    this.categoriesCollection = this.db.collection("categories");
    this.authorsCollection = this.db.collection("authors");
    this.blogPostsCollection = this.db.collection("posts");
    this.commentsCollection = this.db.collection("comments");
  }

  async connect(): Promise<void> {
    await this.client.connect();
    console.log("Connected to MongoDB");
  }

  async disconnect(): Promise<void> {
    await this.client.close();
  }

  private convertMongoDoc(doc: any): any {
    if (!doc) return undefined;
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

  private extractExcerpt(content: string): string {
    const plainText = content.replace(/<[^>]*>/g, '');
    return plainText.length > 150 ? plainText.substring(0, 150) + '...' : plainText;
  }

  private generateSlug(title: string): string {
    return title.toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  private calculateReadTime(content: string): number {
    const wordsPerMinute = 200;
    const words = content.replace(/<[^>]*>/g, '').split(/\s+/).length;
    return Math.ceil(words / wordsPerMinute);
  }

  private mapPostDocument(doc: any): BlogPostWithDetails {
    if (!doc) throw new Error("Document is null or undefined");

    // Convert ObjectId prefix to numeric ID for consistency
    const objectIdStr = doc._id.toString();
    const numericId = parseInt(objectIdStr.substring(0, 8), 16);

    return {
      id: doc.id || numericId,
      slug: doc.slug || this.generateSlug(doc.title || 'untitled'),
      title: doc.title || 'Untitled',
      excerpt: doc.excerpt || this.extractExcerpt(doc.content || ''),
      content: doc.content || '',
      featuredImage: doc.coverImage || doc.featuredImage || '',
      categoryId: doc.categoryId || 1,
      authorId: doc.authorId || 1,
      userId: doc.userId || '',
      readTime: doc.readTime || this.calculateReadTime(doc.content || ''),
      isFeatured: doc.featured || doc.isFeatured || false,
      isPublished: !doc.draft,
      tags: doc.tags || [],
      createdAt: doc.date || doc.createdAt || new Date(),
      updatedAt: doc.lastModified || doc.updatedAt || new Date(),
      category: {
        id: doc.categoryId || 1,
        name: doc.categoryName || 'Agricultural Technology',
        slug: doc.categorySlug || 'agricultural-technology',
        description: doc.categoryDescription || 'Latest in agricultural technology and innovation',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      author: {
        id: doc.authorId || 1,
        name: doc.authorName || 'Hope Invest',
        email: doc.authorEmail || 'admin@hopeinvest.com',
        bio: doc.authorBio || 'Agricultural technology enthusiast',
        avatar: doc.authorAvatar || '',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    };
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const doc = await this.usersCollection.findOne({ _id: new ObjectId(id.toString()) });
    return this.convertMongoDoc(doc);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const doc = await this.usersCollection.findOne({ username });
    return this.convertMongoDoc(doc);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await this.usersCollection.insertOne(insertUser);
    return { 
      id: result.insertedId.toString(), 
      ...insertUser,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  // Category methods
  async getCategories(): Promise<Category[]> {
    const docs = await this.categoriesCollection.find({}).toArray();
    return docs.map(doc => this.convertMongoDoc(doc));
  }

  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    const doc = await this.categoriesCollection.findOne({ slug });
    return this.convertMongoDoc(doc);
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const result = await this.categoriesCollection.insertOne(insertCategory);
    return { 
      id: result.insertedId.toString(), 
      ...insertCategory,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  // Author methods
  async getAuthors(): Promise<Author[]> {
    const docs = await this.authorsCollection.find({}).toArray();
    return docs.map(doc => this.convertMongoDoc(doc));
  }

  async getAuthor(id: number): Promise<Author | undefined> {
    const doc = await this.authorsCollection.findOne({ _id: new ObjectId(id.toString()) });
    return this.convertMongoDoc(doc);
  }

  async getAuthorByUserId(userId: string): Promise<Author | undefined> {
    const doc = await this.authorsCollection.findOne({ userId: userId });
    return this.convertMongoDoc(doc);
  }

  async createAuthor(insertAuthor: InsertAuthor): Promise<Author> {
    const authorData = {
      ...insertAuthor,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    const result = await this.authorsCollection.insertOne(authorData);
    return { 
      id: result.insertedId.toString(), 
      ...authorData
    };
  }

  async updateAuthor(id: number, updateData: Partial<InsertAuthor>): Promise<Author> {
    const result = await this.authorsCollection.findOneAndUpdate(
      { _id: new ObjectId(id.toString()) },
      { $set: { ...updateData, updatedAt: new Date() } },
      { returnDocument: 'after' }
    );
    
    if (!result) {
      throw new Error('Author not found');
    }
    
    return this.convertMongoDoc(result);
  }

  async updateAuthorByUserId(userId: string, updateData: Partial<InsertAuthor>): Promise<Author> {
    const result = await this.authorsCollection.findOneAndUpdate(
      { userId: userId },
      { $set: { ...updateData, updatedAt: new Date() } },
      { returnDocument: 'after' }
    );
    
    if (!result) {
      throw new Error('Author not found for userId: ' + userId);
    }
    
    return this.convertMongoDoc(result);
  }

  // Blog Post methods
  async getBlogPosts(options: { categorySlug?: string; limit?: number; offset?: number; featured?: boolean; includeDrafts?: boolean; userId?: string } = {}): Promise<BlogPostWithDetails[]> {
    const { categorySlug, limit = 10, offset = 0, featured, includeDrafts = false, userId } = options;
    
    let query: any = {};
    
    if (!includeDrafts) {
      query.draft = { $ne: true };
    }
    
    if (featured !== undefined) {
      query.featured = featured;
    }

    if (userId) {
      query.$or = [
        { userId: userId },
        { userId: { $exists: false } }
      ];
    }

    const docs = await this.blogPostsCollection
      .find(query)
      .sort({ date: -1 })
      .skip(offset)
      .limit(limit)
      .toArray();

    return docs.map(doc => this.mapPostDocument(doc));
  }

  async getBlogPostBySlug(slug: string, userId?: string): Promise<BlogPostWithDetails | undefined> {
    let query: any = { slug };
    
    if (userId) {
      query.$or = [
        { userId: userId },
        { userId: { $exists: false } }
      ];
    }

    const doc = await this.blogPostsCollection.findOne(query);
    return doc ? this.mapPostDocument(doc) : undefined;
  }

  async getBlogPost(id: number | string, userId?: string): Promise<BlogPostWithDetails | undefined> {
    let doc;
    
    // Try to find by the generated ID field first (for migrated posts)
    const allDocs = await this.blogPostsCollection.find({}).toArray();
    doc = allDocs.find(d => d.id && d.id.toString() === id.toString());
    
    // If not found by ID field, try the ObjectId prefix method
    if (!doc) {
      const numericId = typeof id === 'string' ? parseInt(id) : id;
      const hexPrefix = numericId.toString(16).padStart(8, '0');
      doc = allDocs.find(d => {
        const objectIdStr = d._id.toString();
        return objectIdStr.startsWith(hexPrefix);
      });
    }
    
    if (!doc) return undefined;

    // Apply user filtering if provided
    if (userId && doc.userId && doc.userId !== userId) {
      return undefined;
    }

    return this.mapPostDocument(doc);
  }

  async createBlogPost(insertPost: InsertBlogPost): Promise<BlogPost> {
    const now = new Date();
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

  async updateBlogPost(id: number | string, updateData: Partial<InsertBlogPost>, userId?: string): Promise<BlogPost> {
    try {
      let targetDoc;
      
      // Try to find by the generated ID field first (for migrated posts)
      const allDocs = await this.blogPostsCollection.find({}).toArray();
      targetDoc = allDocs.find(doc => doc.id && doc.id.toString() === id.toString());
      
      // If not found by ID field, try the ObjectId prefix method
      if (!targetDoc) {
        const numericId = typeof id === 'string' ? parseInt(id) : id;
        const hexPrefix = numericId.toString(16).padStart(8, '0');
        targetDoc = allDocs.find(doc => {
          const objectIdStr = doc._id.toString();
          return objectIdStr.startsWith(hexPrefix);
        });
      }
      
      if (!targetDoc) {
        console.log(`Blog post not found for ID: ${id}`);
        throw new Error("Blog post not found");
      }

      // Check user permission if userId provided
      if (userId && targetDoc.userId && targetDoc.userId !== userId) {
        throw new Error("Not authorized to update this post");
      }

      // Use the actual _id from the found document for the update
      const query = { _id: targetDoc._id };
      
      // Prepare update data
      const updateDoc: any = {
        ...updateData,
        lastModified: new Date()
      };

      // Convert boolean fields properly
      if (updateData.isFeatured !== undefined) {
        updateDoc.featured = updateData.isFeatured;
        delete updateDoc.isFeatured;
      }
      if (updateData.isPublished !== undefined) {
        updateDoc.draft = !updateData.isPublished;
        delete updateDoc.isPublished;
      }
      if (updateData.featuredImage !== undefined) {
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

      // Return the updated document with properly mapped fields
      const updatedDoc = await this.blogPostsCollection.findOne(query);
      return this.mapPostDocument(updatedDoc);
      
    } catch (error) {
      console.error("Update blog post error:", error);
      throw error;
    }
  }

  async searchBlogPosts(query: string, userId?: string): Promise<BlogPostWithDetails[]> {
    const searchTerm = { $regex: query, $options: 'i' };
    const searchQuery: any = {
      draft: { $ne: true },
      $or: [
        { title: searchTerm },
        { content: searchTerm }
      ]
    };

    // Add user filtering if provided
    if (userId) {
      searchQuery.$and = [
        searchQuery,
        {
          $or: [
            { userId: userId },
            { userId: { $exists: false } }
          ]
        }
      ];
    }

    const docs = await this.blogPostsCollection.find(searchQuery).toArray();
    return docs.map(doc => this.mapPostDocument(doc));
  }

  async getRelatedPosts(postId: number | string, categoryId: number, limit: number = 3, userId?: string): Promise<BlogPostWithDetails[]> {
    let excludeQuery: any;
    
    // Check if postId is a valid MongoDB ObjectId format
    if (ObjectId.isValid(postId.toString()) && postId.toString().length === 24) {
      excludeQuery = { _id: { $ne: new ObjectId(postId.toString()) } };
    } else {
      // For numeric IDs, exclude by the hex prefix method
      const numericId = typeof postId === 'string' ? parseInt(postId) : postId;
      const hexPrefix = numericId.toString(16).padStart(8, '0');
      excludeQuery = { _id: { $not: { $regex: `^${hexPrefix}` } } };
    }

    let query: any = {
      ...excludeQuery,
      draft: { $ne: true }
    };

    if (userId) {
      query.$or = [
        { userId: userId },
        { userId: { $exists: false } }
      ];
    }

    const docs = await this.blogPostsCollection
      .find(query)
      .limit(limit)
      .toArray();

    return docs.map(doc => this.mapPostDocument(doc));
  }

  // Comment methods
  async getCommentsByPostId(postId: number | string): Promise<Comment[]> {
    const numericId = typeof postId === 'string' ? parseInt(postId) : postId;
    
    const comments = await this.commentsCollection.find({
      blogPostId: numericId
    }).sort({ createdAt: -1 }).toArray();
    
    return comments.map(comment => ({
      id: parseInt(comment._id.toString().substring(0, 8), 16),
      content: comment.content,
      createdAt: comment.createdAt,
      blogPostId: numericId,
      parentId: comment.parentId || null,
      authorName: comment.authorName,
      authorEmail: comment.authorEmail,
      isApproved: comment.isApproved || false
    }));
  }

  async createComment(insertComment: InsertComment): Promise<Comment> {
    const commentDoc = {
      ...insertComment,
      createdAt: new Date(),
      isApproved: false
    };
    
    const result = await this.commentsCollection.insertOne(commentDoc);
    
    return {
      id: parseInt(result.insertedId.toString().substring(0, 8), 16),
      ...commentDoc
    };
  }

  async approveComment(commentId: number): Promise<Comment> {
    const hexPrefix = commentId.toString(16).padStart(8, '0');
    const allComments = await this.commentsCollection.find({}).toArray();
    const targetComment = allComments.find(comment => {
      const objectIdStr = comment._id.toString();
      return objectIdStr.startsWith(hexPrefix);
    });
    
    if (!targetComment) {
      throw new Error("Comment not found");
    }
    
    const result = await this.commentsCollection.updateOne(
      { _id: targetComment._id },
      { $set: { isApproved: true } }
    );
    
    if (result.matchedCount === 0) {
      throw new Error("Comment not found");
    }
    
    return {
      id: commentId,
      blogPostId: targetComment.blogPostId,
      parentId: targetComment.parentId,
      authorName: targetComment.authorName,
      authorEmail: targetComment.authorEmail,
      content: targetComment.content,
      createdAt: new Date(targetComment.createdAt),
      isApproved: targetComment.isApproved
    };
  }

  async deleteComment(commentId: number): Promise<void> {
    const hexPrefix = commentId.toString(16).padStart(8, '0');
    const allComments = await this.commentsCollection.find({}).toArray();
    const targetComment = allComments.find(comment => {
      const objectIdStr = comment._id.toString();
      return objectIdStr.startsWith(hexPrefix);
    });
    
    if (targetComment) {
      await this.commentsCollection.deleteOne({ _id: targetComment._id });
    }
  }

  // Migration methods
  async migratePostsToUser(userId: string): Promise<{ migratedCount: number }> {
    try {
      const result = await this.blogPostsCollection.updateMany(
        { userId: { $exists: false } },
        { $set: { userId: userId } }
      );
      
      return { migratedCount: result.modifiedCount };
    } catch (error) {
      console.error("Migration error:", error);
      throw error;
    }
  }

  async getUnassignedPostsCount(): Promise<number> {
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

  // Highlighting system methods
  async getHighlightsByPostId(postId: number | string): Promise<any[]> {
    const highlights = await this.db.collection("highlights")
      .find({ blogPostId: postId })
      .sort({ createdAt: -1 })
      .toArray();

    const highlightDetails = [];
    for (const highlight of highlights) {
      const { _id, ...rest } = highlight;
      const highlightObj = { id: _id.toString(), ...rest };
      
      // Get comments for this highlight
      const comments = await this.db.collection("highlight_comments")
        .find({ highlightId: highlightObj.id })
        .sort({ createdAt: 1 })
        .toArray();

      highlightDetails.push({
        ...highlightObj,
        comments: comments.map(comment => {
          const { _id, ...rest } = comment;
          return { id: _id.toString(), ...rest };
        })
      });
    }

    return highlightDetails;
  }

  async createHighlight(highlightData: any): Promise<string> {
    const highlightWithDate = {
      ...highlightData,
      createdAt: new Date(),
    };

    const result = await this.db.collection("highlights").insertOne(highlightWithDate);
    return result.insertedId.toString();
  }

  async addHighlightComment(commentData: any): Promise<string> {
    const commentWithDates = {
      ...commentData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await this.db.collection("highlight_comments").insertOne(commentWithDates);
    return result.insertedId.toString();
  }

  async updateHighlightComment(commentId: string, content: string): Promise<boolean> {
    const result = await this.db.collection("highlight_comments").updateOne(
      { _id: new ObjectId(commentId) },
      { 
        $set: { 
          content, 
          updatedAt: new Date() 
        } 
      }
    );

    return result.matchedCount > 0;
  }

  async deleteHighlightComment(commentId: string): Promise<boolean> {
    // Delete the comment and all its replies
    await this.db.collection("highlight_comments").deleteMany({ parentId: commentId });
    
    const result = await this.db.collection("highlight_comments").deleteOne({
      _id: new ObjectId(commentId)
    });

    return result.deletedCount > 0;
  }
}