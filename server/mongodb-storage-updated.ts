import { MongoClient, Db, Collection, ObjectId } from "mongodb";
import { z } from 'zod';
import { IStorage } from "./storage";
import { 
  type User, type InsertUser,
  type Author, type InsertAuthor,
  type BlogPost, type InsertBlogPost,
  type Comment, type InsertComment,
  type BlogPostWithDetails,
  type Annotation, type InsertAnnotation,
  type PortfolioProject, type InsertPortfolioProject
} from "@shared/schema";

// Comprehensive HTML tag removal with entity decoding
function stripHtmlTags(content: string): string {
  if (!content || typeof content !== 'string') {
    return '';
  }

  let text = content;
  
  // Remove script and style elements completely
  text = text.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  
  // Remove all HTML tags but preserve spacing
  text = text.replace(/<[^>]*>/g, ' ');
  
  // Decode HTML entities
  text = text.replace(/&nbsp;/g, ' ');
  text = text.replace(/&amp;/g, '&');
  text = text.replace(/&lt;/g, '<');
  text = text.replace(/&gt;/g, '>');
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&#39;/g, "'");
  text = text.replace(/&apos;/g, "'");
  
  // Remove other HTML entities
  text = text.replace(/&[#\w]+;/g, '');
  
  return text;
}

// Enhanced markdown to text conversion with HTML handling
function markdownToText(markdownContent: string): string {
  if (!markdownContent || typeof markdownContent !== 'string') {
    return '';
  }

  let text = markdownContent;
  
  // First, strip any HTML tags that might be mixed in
  text = stripHtmlTags(text);
  
  // Remove markdown headers (# ## ### etc.)
  text = text.replace(/^#{1,6}\s+/gm, '');
  
  // Remove bold and italic formatting
  text = text.replace(/\*\*\*([^*]+)\*\*\*/g, '$1'); // bold italic
  text = text.replace(/\*\*([^*]+)\*\*/g, '$1'); // bold
  text = text.replace(/\*([^*]+)\*/g, '$1'); // italic
  text = text.replace(/___([^_]+)___/g, '$1'); // bold italic underscore
  text = text.replace(/__([^_]+)__/g, '$1'); // bold underscore
  text = text.replace(/_([^_]+)_/g, '$1'); // italic underscore
  
  // Remove strikethrough
  text = text.replace(/~~([^~]+)~~/g, '$1');
  
  // Remove links but keep text [text](url) -> text
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  
  // Remove inline code
  text = text.replace(/`([^`]+)`/g, '$1');
  
  // Remove code blocks
  text = text.replace(/```[\s\S]*?```/g, '');
  text = text.replace(/~~~[\s\S]*?~~~/g, '');
  
  // Remove blockquotes
  text = text.replace(/^>\s+/gm, '');
  
  // Remove horizontal rules
  text = text.replace(/^[-*_]{3,}\s*$/gm, '');
  
  // Remove list markers
  text = text.replace(/^[-*+]\s+/gm, '');
  text = text.replace(/^\d+\.\s+/gm, '');
  
  // Remove table formatting
  text = text.replace(/\|/g, ' ');
  text = text.replace(/^[-:|\s]+$/gm, '');
  
  // Remove excessive whitespace and normalize line breaks
  text = text.replace(/\n\s*\n/g, '\n\n');
  text = text.replace(/\n{3,}/g, '\n\n');
  text = text.replace(/[ \t]+/g, ' ');
  
  // Clean up and trim
  return text.trim();
}

function generateCleanExcerpt(content: string, maxLength: number = 150): string {
  if (!content || typeof content !== 'string') {
    return '';
  }
  
  // Convert to plain text (handles both HTML and markdown)
  let plainText = markdownToText(content);
  
  // Additional cleanup for any remaining artifacts
  plainText = plainText
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s.,!?;:()\-'"]/g, '')
    .trim();
  
  // Truncate to desired length
  if (plainText.length <= maxLength) {
    return plainText;
  }
  
  // Find the last space before the limit to avoid cutting words
  const truncated = plainText.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  
  if (lastSpace > maxLength * 0.8) { // Only use last space if it's not too far back
    return truncated.substring(0, lastSpace) + '...';
  }
  
  return truncated + '...';
}

export class MongoStorage implements IStorage {
  private client: MongoClient;
  private db: Db;
  private usersCollection: Collection;
  private authorsCollection: Collection;
  private blogPostsCollection: Collection;
  private commentsCollection: Collection;
  private annotationsCollection: Collection;
  private projectsCollection: Collection;

  constructor(connectionString: string, databaseName: string) {
    console.log(`Initializing MongoDB connection to database: ${databaseName}`);
    this.client = new MongoClient(connectionString);
    this.db = this.client.db(databaseName);
    this.usersCollection = this.db.collection("users");
    this.authorsCollection = this.db.collection("authors");
    this.blogPostsCollection = this.db.collection("posts");
    this.commentsCollection = this.db.collection("comments");
    this.annotationsCollection = this.db.collection("inline-comments");
    this.projectsCollection = this.db.collection("projects");
  }

  async connect(): Promise<void> {
    try {
      await this.client.connect();
      console.log("Successfully connected to MongoDB");
      
      // Test the connection by listing collections
      const collections = await this.db.listCollections().toArray();
      console.log("Available collections:", collections.map(c => c.name));
      
      // Test posts collection
      const postsCount = await this.blogPostsCollection.countDocuments();
      console.log(`Found ${postsCount} posts in the database`);
    } catch (error) {
      console.error("Failed to connect to MongoDB:", error);
      throw error;
    }
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
    return generateCleanExcerpt(content, 150);
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
    if (!doc) {
      throw new Error("Document is null or undefined");
    }
    
    // FIXED: Always use the persistent ID field from the database
    let numericId: number;
    
    if (doc.id !== undefined && doc.id !== null) {
      // Use the persistent ID field (after migration, all posts have this)
      numericId = typeof doc.id === 'number' ? doc.id : parseInt(doc.id);
    } else {
      // Fallback: Generate from ObjectId (for any new posts not yet migrated)
      const objectIdStr = doc._id.toString();
      const timestamp = parseInt(objectIdStr.substring(0, 8), 16);
      const sequence = parseInt(objectIdStr.substring(16, 24), 16);
      numericId = Math.abs(timestamp + sequence);
      
      // Save the generated ID back to the database for consistency
      this.blogPostsCollection.updateOne(
        { _id: doc._id },
        { $set: { id: numericId } }
      ).catch(err => console.warn('Failed to save generated ID:', err));
    }
    
    return {
      id: numericId,
      title: doc.title || '',
      content: doc.content || '',
      slug: doc.slug || this.generateSlug(doc.title || 'untitled'),
      excerpt: doc.excerpt || this.extractExcerpt(doc.content || ''),
      featuredImage: doc.featuredImage || doc.coverImage || '',
      createdAt: doc.createdAt ? new Date(doc.createdAt) : (doc.date ? new Date(doc.date) : new Date()),
      updatedAt: doc.updatedAt ? new Date(doc.updatedAt) : (doc.lastModified ? new Date(doc.lastModified) : new Date()),
      userId: doc.userId || '',
      tags: Array.isArray(doc.tags) ? doc.tags : (doc.tags ? [doc.tags] : []),
      isFeatured: doc.isFeatured !== undefined ? !!doc.isFeatured : !!doc.featured,
      isPublished: doc.isPublished !== undefined ? !!doc.isPublished : !doc.draft,
      postType: doc.postType || 'blog',
      client: doc.client,
      impact: doc.impact,
      readTime: this.calculateReadTime(doc.content || ''),
      // Author information removed
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
      id: parseInt(result.insertedId.toString().substring(0, 8), 16), 
      ...insertUser
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
      bio: insertAuthor.bio || null,
      avatar: insertAuthor.avatar || null,
      userId: insertAuthor.userId || null,
      linkedinUrl: insertAuthor.linkedinUrl || null,
      instagramUrl: insertAuthor.instagramUrl || null,
      youtubeUrl: insertAuthor.youtubeUrl || null,
      githubUrl: insertAuthor.githubUrl || null,
      portfolioUrl: insertAuthor.portfolioUrl || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    const result = await this.authorsCollection.insertOne(authorData);
    return { 
      id: parseInt(result.insertedId.toString().substring(0, 8), 16), 
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
  async getBlogPosts(options: { limit?: number; offset?: number; featured?: boolean; includeDrafts?: boolean; userId?: string; categorySlug?: string; postType?: string } = {}): Promise<BlogPostWithDetails[]> {
    const { limit = 1000, offset = 0, featured, includeDrafts = false, userId, categorySlug, postType } = options;
    let query: any = {};
    let andConditions: any[] = [];
    
    // Filter by postType
    if (postType) {
      if (postType === 'blog') {
        // For blog posts, include both explicit 'blog' type and legacy posts without a type
        andConditions.push({ 
          $or: [
            { postType: 'blog' }, 
            { postType: { $exists: false } }
          ] 
        });
      } else {
        andConditions.push({ postType });
      }
    }
    
    // Use correct schema field: isPublished instead of draft
    if (!includeDrafts) {
      andConditions.push({
        $or: [
          { isPublished: true },
          { draft: false },
          { isPublished: { $exists: false }, draft: { $exists: false } } // Default to published if neither exists
        ]
      });
    }
    
    if (featured !== undefined) {
      if (featured === true) {
        // If searching for featured posts, include if EITHER isFeatured is true OR legacy featured is true
        andConditions.push({
          $or: [
            { isFeatured: true },
            { featured: true }
          ]
        });
      } else {
        // If searching for non-featured posts, BOTH must be false (or not true)
        andConditions.push({
          $and: [
            { isFeatured: { $ne: true } },
            { featured: { $ne: true } }
          ]
        });
      }
    }

    if (categorySlug) {
      // Assuming category is stored in tags for now based on previous code
      andConditions.push({ tags: { $in: [categorySlug] } });
    }
    
    if (userId) {
      andConditions.push({
        $or: [
          { userId: userId },
          { userId: { $exists: false } }
        ]
      });
    }

    if (andConditions.length > 0) {
      query.$and = andConditions;
    }
    
    const docs = await this.blogPostsCollection
      .find(query)
      .sort({ createdAt: -1, date: -1 }) // Prefer schema field, fallback to legacy
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
    // Use correct schema field names for storage
    const postData = {
      title: insertPost.title,
      content: insertPost.content,
      excerpt: insertPost.excerpt,
      slug: insertPost.slug,
      featuredImage: insertPost.featuredImage, // Use schema field name
      createdAt: now,                         // Use schema field name
      updatedAt: now,                         // Use schema field name
      isPublished: insertPost.isPublished !== false, // Use schema field name
      isFeatured: insertPost.isFeatured || false,     // Use schema field name
      postType: insertPost.postType || 'blog',
      client: insertPost.client,
      impact: insertPost.impact,
      userId: insertPost.userId,
      tags: insertPost.tags || [],
      readTime: insertPost.readTime || this.calculateReadTime(insertPost.content),
      
      // Keep legacy fields for backward compatibility
      coverImage: insertPost.featuredImage,
      date: now,
      lastModified: now,
      draft: !(insertPost.isPublished !== false),
      featured: insertPost.isFeatured || false
    };
    
    const result = await this.blogPostsCollection.insertOne(postData);
    
    // Generate consistent ID
    const generatedId = parseInt(result.insertedId.toString().substring(0, 8), 16);
    
    // Update document with the generated ID for consistency
    await this.blogPostsCollection.updateOne(
      { _id: result.insertedId },
      { $set: { id: generatedId } }
    );
    
    return { 
      id: generatedId,
      userId: insertPost.userId,
      title: insertPost.title,
      slug: insertPost.slug,
      excerpt: insertPost.excerpt,
      content: insertPost.content,
      featuredImage: insertPost.featuredImage,
      tags: insertPost.tags || [],
      readTime: insertPost.readTime || this.calculateReadTime(insertPost.content),
      isFeatured: insertPost.isFeatured || false,
      isPublished: insertPost.isPublished !== false,
      postType: insertPost.postType || 'blog',
      client: insertPost.client,
      impact: insertPost.impact,
      createdAt: now,
      updatedAt: now
    };
  }

  async updateBlogPost(id: number | string, updateData: Partial<InsertBlogPost>, userId?: string): Promise<BlogPost> {
    try {
      let query: any;
      
      // Try to match by the custom 'id' field first
      const numericId = typeof id === 'string' ? parseInt(id) : id;
      
      // Check if it's a valid ObjectId string (24 hex chars)
      const isObjectId = typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id);
      
      if (isObjectId) {
        query = { _id: new ObjectId(id as string) };
      } else if (!isNaN(numericId)) {
        // Search by numeric id field
        query = { id: numericId };
      } else {
        // Fallback for string identifiers that aren't ObjectIds
        query = { slug: id };
      }

      const targetDoc = await this.blogPostsCollection.findOne(query);
      
      if (!targetDoc) {
        // Fallback: search all docs if numeric ID wasn't found directly (might be stored as string)
        if (!isNaN(numericId)) {
          const altQuery = { id: numericId.toString() };
          const altDoc = await this.blogPostsCollection.findOne(altQuery);
          if (altDoc) {
            query = { _id: altDoc._id };
          } else {
            // Last resort: prefix matching
            const hexPrefix = numericId.toString(16).padStart(8, '0');
            const allDocs = await this.blogPostsCollection.find({}).toArray();
            const prefixDoc = allDocs.find(doc => doc._id.toString().startsWith(hexPrefix));
            if (prefixDoc) {
              query = { _id: prefixDoc._id };
            } else {
              throw new Error("Blog post not found");
            }
          }
        } else {
          throw new Error("Blog post not found");
        }
      } else {
        // Use the actual _id for the subsequent update
        query = { _id: targetDoc._id };
      }

      // Check user permission if userId provided
      const finalDoc = await this.blogPostsCollection.findOne(query);
      if (userId && finalDoc && finalDoc.userId && finalDoc.userId !== userId) {
        throw new Error("Not authorized to update this post");
      }

      if (!finalDoc) {
        throw new Error("Blog post not found after identification");
      }

      // Prepare update data
      const updateDoc: any = {
        ...updateData,
        updatedAt: new Date(),
        lastModified: new Date()
      };

      // Handle legacy fields
      if (updateData.isFeatured !== undefined) updateDoc.featured = updateData.isFeatured;
      if (updateData.isPublished !== undefined) updateDoc.draft = !updateData.isPublished;
      if (updateData.featuredImage !== undefined) updateDoc.coverImage = updateData.featuredImage;
      
      // Ensure these are explicitly set if they exist in updateData
      if (updateData.postType) updateDoc.postType = updateData.postType;
      if (updateData.client) updateDoc.client = updateData.client;
      if (updateData.impact) updateDoc.impact = updateData.impact;

      const result = await this.blogPostsCollection.findOneAndUpdate(
        query,
        { $set: updateDoc },
        { returnDocument: 'after' }
      );

      if (!result) {
        throw new Error("Blog post not found for update");
      }

      return this.mapPostDocument(result);
      
    } catch (error) {
      console.error("Update blog post error:", error);
      throw error;
    }
  }

  async searchBlogPosts(query: string, userId?: string): Promise<BlogPostWithDetails[]> {
    const searchTerm = { $regex: query, $options: 'i' };
    const searchQuery: any = {
      // Use correct schema field with backward compatibility
      $or: [
        { isPublished: true },
        { isPublished: { $exists: false }, draft: { $ne: true } }
      ],
      $and: [
        {
          $or: [
            { title: searchTerm },
            { content: searchTerm },
            { excerpt: searchTerm }
          ]
        }
      ]
    };

    // Add user filtering if provided
    if (userId) {
      searchQuery.$and.push({
        $or: [
          { userId: userId },
          { userId: { $exists: false } }
        ]
      });
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
    const commentData = {
      content: insertComment.content,
      postId: insertComment.postId,
      authorName: insertComment.authorName,
      authorEmail: insertComment.authorEmail,
      parentId: insertComment.parentId || null,
      createdAt: new Date(),
      isApproved: false
    };
    const result = await this.commentsCollection.insertOne(commentData);
    return { 
      id: parseInt(result.insertedId.toString().substring(0, 8), 16), 
      content: insertComment.content,
      postId: insertComment.postId,
      authorName: insertComment.authorName,
      authorEmail: insertComment.authorEmail,
      parentId: insertComment.parentId || null,
      createdAt: new Date(),
      isApproved: false
    };
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

  // Annotation methods
  async getAnnotations(postId: number, options: { type?: string; parentId?: string; userId?: string } = {}): Promise<Annotation[]> {
    const { type, parentId, userId } = options;
    const filter: any = { postId, isApproved: true };

    if (type) filter.type = type;
    if (parentId) filter.parentAnnotationId = parentId;

    if (userId) {
      filter.$or = [
        { isPrivate: { $ne: true } },
        { isPrivate: true, anonymousUserId: userId },
      ];
    } else {
      filter.isPrivate = { $ne: true };
    }

    const docs = await this.annotationsCollection.find(filter).sort({ createdAt: -1 }).toArray();
    return docs.map(doc => ({
      id: doc._id.toString(),
      postId: doc.postId,
      type: doc.type,
      selectedText: doc.selectedText,
      paragraphId: doc.paragraphId,
      startOffset: doc.startOffset,
      endOffset: doc.endOffset,
      authorName: doc.authorName || '',
      authorEmail: doc.authorEmail || '',
      authorImage: doc.authorImage,
      firebaseUserId: doc.firebaseUserId,
      anonymousUserId: doc.anonymousUserId || '',
      content: doc.content || '',
      parentAnnotationId: doc.parentAnnotationId,
      isPrivate: doc.isPrivate || false,
      isApproved: doc.isApproved,
      createdAt: doc.createdAt,
      likes: (doc as any).likes || 0,
      likedByUserIds: (doc as any).likedByUserIds || [],
    }));
  }

  async createAnnotation(insertAnnotation: InsertAnnotation): Promise<Annotation> {
    const doc = {
      ...insertAnnotation,
      createdAt: new Date(),
      isApproved: true,
      isPrivate: insertAnnotation.type === 'note' || insertAnnotation.isPrivate === true
    };
    const result = await this.annotationsCollection.insertOne(doc);
    return {
      id: result.insertedId.toString(),
      ...doc
    } as Annotation;
  }

  async deleteAnnotation(id: string, userId: string, isAdmin: boolean = false, adminEmail?: string): Promise<void> {
    const annotation = await this.annotationsCollection.findOne({
      _id: new ObjectId(id)
    });

    if (!annotation) {
      throw new Error("Annotation not found");
    }

    const isOwner = annotation.anonymousUserId === userId;
    if (!isOwner && !isAdmin) {
      throw new Error("Forbidden: You can only delete your own annotations");
    }

    // Log admin deletions to audit trail
    if (isAdmin && !isOwner) {
      const logsCollection = this.db.collection('deletion_logs');
      await logsCollection.insertOne({
        deletedAt: new Date(),
        deletedBy: adminEmail,
        annotationType: 'inline-comment',
        annotationId: id,
        postId: annotation.postId,
        originalAuthor: annotation.authorName || annotation.authorEmail,
        originalContent: annotation.content,
        selectedText: annotation.selectedText,
        reason: 'admin_override',
      });
    }

    const result = await this.annotationsCollection.deleteOne({
      _id: new ObjectId(id)
    });
    if (result.deletedCount === 0) {
      throw new Error("Delete operation failed");
    }
  }

  async toggleAnnotationLike(annotationId: string, userId: string): Promise<{ likes: number; hasLiked: boolean }> {
    const annotation = await this.annotationsCollection.findOne({
      _id: new ObjectId(annotationId)
    });

    if (!annotation) {
      throw new Error("Annotation not found");
    }

    const likedByUserIds: string[] = (annotation as any).likedByUserIds || [];
    const hasLiked = likedByUserIds.includes(userId);

    if (hasLiked) {
      // @ts-ignore - MongoDB driver type definition issue with $pull and array of strings
      await this.annotationsCollection.updateOne(
        { _id: new ObjectId(annotationId) },
        { $pull: { likedByUserIds: userId } as any, $inc: { likes: -1 } }
      );
    } else {
      await this.annotationsCollection.updateOne(
        { _id: new ObjectId(annotationId) },
        { $addToSet: { likedByUserIds: userId }, $inc: { likes: 1 } }
      );
    }

    const updated = await this.annotationsCollection.findOne({ _id: new ObjectId(annotationId) });
    return {
      likes: (updated as any)?.likes || 0,
      hasLiked: !hasLiked,
    };
  }

  // Portfolio Project methods
  private mapProjectDocument(doc: any): PortfolioProject {
    if (!doc) throw new Error("Document is null");
    
    let numericId: number;
    if (doc.id !== undefined && doc.id !== null) {
      numericId = typeof doc.id === 'number' ? doc.id : parseInt(doc.id);
    } else {
      const objectIdStr = doc._id.toString();
      const timestamp = parseInt(objectIdStr.substring(0, 8), 16);
      const sequence = parseInt(objectIdStr.substring(16, 24), 16);
      numericId = Math.abs(timestamp + sequence);
    }

    return {
      id: numericId,
      title: doc.title || '',
      slug: doc.slug || '',
      description: doc.description || '',
      content: doc.content || '',
      featuredImage: doc.featuredImage || '',
      client: doc.client,
      impact: doc.impact,
      technologies: Array.isArray(doc.technologies) ? doc.technologies : [],
      category: doc.category || 'General',
      isPublished: doc.isPublished !== false,
      createdAt: doc.createdAt ? new Date(doc.createdAt) : new Date(),
      updatedAt: doc.updatedAt ? new Date(doc.updatedAt) : new Date(),
    };
  }

  async getPortfolioProjects(options: { limit?: number; includeDrafts?: boolean } = {}): Promise<PortfolioProject[]> {
    const { limit = 100, includeDrafts = false } = options;
    let query: any = {};
    if (!includeDrafts) {
      query.isPublished = true;
    }
    
    const docs = await this.projectsCollection.find(query).sort({ createdAt: -1 }).limit(limit).toArray();
    return docs.map(doc => this.mapProjectDocument(doc));
  }

  async createPortfolioProject(insertProject: InsertPortfolioProject): Promise<PortfolioProject> {
    const now = new Date();
    const projectData = {
      ...insertProject,
      createdAt: now,
      updatedAt: now,
      isPublished: insertProject.isPublished !== false
    };
    
    const result = await this.projectsCollection.insertOne(projectData);
    const generatedId = parseInt(result.insertedId.toString().substring(0, 8), 16);
    
    await this.projectsCollection.updateOne(
      { _id: result.insertedId },
      { $set: { id: generatedId } }
    );
    
    return this.mapProjectDocument({ ...projectData, _id: result.insertedId, id: generatedId });
  }

  async updatePortfolioProject(id: number | string, updateData: Partial<InsertPortfolioProject>): Promise<PortfolioProject> {
    const numericId = typeof id === 'string' ? parseInt(id) : id;
    const result = await this.projectsCollection.findOneAndUpdate(
      { id: numericId },
      { $set: { ...updateData, updatedAt: new Date() } },
      { returnDocument: 'after' }
    );
    
    if (!result) throw new Error("Project not found");
    return this.mapProjectDocument(result);
  }
}