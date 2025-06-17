import { MongoClient, Db, Collection, ObjectId } from "mongodb";
import { 
  type User, type InsertUser,
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
  private authorsCollection: Collection;
  private blogPostsCollection: Collection;
  private commentsCollection: Collection;

  constructor(connectionString: string, databaseName: string) {
    this.client = new MongoClient(connectionString);
    this.db = this.client.db(databaseName);
    this.usersCollection = this.db.collection("users");
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
    
    // Generate a numeric ID from ObjectId for compatibility
    const numericId = doc._id ? parseInt(doc._id.toString().substring(0, 8), 16) : Date.now();
    
    return {
      id: numericId,
      title: doc.title || 'Untitled',
      content: doc.content || '',
      slug: doc.slug || this.generateSlug(doc.title || 'untitled'),
      excerpt: doc.excerpt || this.extractExcerpt(doc.content || ''),
      featuredImage: doc.coverImage || '',
      createdAt: doc.date ? new Date(doc.date) : new Date(),
      updatedAt: doc.lastModified ? new Date(doc.lastModified) : new Date(),
      userId: doc.userId || '',
      tags: Array.isArray(doc.tags) ? doc.tags : (doc.tags ? [doc.tags] : []),
      isFeatured: !!doc.featured,
      isPublished: !doc.draft,
      readTime: this.calculateReadTime(doc.content || ''),
      authorId: 1,
      author: {
        id: 1,
        name: 'San',
        email: 'san@example.com',
        bio: 'Sustainable Abundance Seeker',
        avatar: null,
        userId: doc.userId || '',
        linkedinUrl: null,
        instagramUrl: null,
        youtubeUrl: null,
        githubUrl: null,
        portfolioUrl: null
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
  async getBlogPosts(options: { limit?: number; offset?: number; featured?: boolean; includeDrafts?: boolean; userId?: string } = {}): Promise<BlogPostWithDetails[]> {
    const { limit = 100, offset = 0, featured, includeDrafts = false, userId } = options;
    let query: any = {};
    
    // Only show published posts by default (where draft is not true)
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

  async getRelatedPosts(postId: string | number): Promise<BlogPostWithDetails[]> {
    // Find the post to get its tags
    const post = await this.getBlogPost(postId);
    if (!post || !post.tags || post.tags.length === 0) return [];
    
    // Find other posts with at least one matching tag
    // Since we use numeric IDs, we need to exclude by finding all posts except the current one
    const docs = await this.blogPostsCollection.find({
      draft: { $ne: true },
      tags: { $in: post.tags }
    }).toArray();
    
    // Filter out the current post by comparing the generated numeric IDs
    const relatedPosts = docs
      .map(doc => this.mapPostDocument(doc))
      .filter(relatedPost => relatedPost.id !== post.id)
      .slice(0, 3);
    
    return relatedPosts;
  }

  async getBlogPostsByTag(tag: string): Promise<BlogPostWithDetails[]> {
    const docs = await this.blogPostsCollection.find({
      draft: { $ne: true },
      tags: { $in: [tag] }
    }).toArray();
    return docs.map(doc => this.mapPostDocument(doc));
  }

  // Comment methods
  async getCommentsByPostId(postId: number | string): Promise<Comment[]> {
    const docs = await this.commentsCollection.find({ postId: postId.toString() }).toArray();
    return docs.map(doc => this.convertMongoDoc(doc));
  }

  async createComment(insertComment: InsertComment): Promise<Comment> {
    const result = await this.commentsCollection.insertOne(insertComment);
    return { id: result.insertedId.toString(), ...insertComment };
  }

  async approveComment(commentId: number): Promise<Comment> {
    const result = await this.commentsCollection.findOneAndUpdate(
      { _id: new ObjectId(commentId.toString()) },
      { $set: { approved: true } },
      { returnDocument: 'after' }
    );
    if (!result) throw new Error('Comment not found');
    return this.convertMongoDoc(result);
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
}