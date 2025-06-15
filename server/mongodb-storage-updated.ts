import { MongoClient, Db, Collection, ObjectId } from "mongodb";
import { 
  type User, type InsertUser,
  type Category, type InsertCategory,
  type Author, type InsertAuthor,
  type BlogPost, type InsertBlogPost,
  type BlogPostWithDetails
} from "@shared/schema";
import { IStorage } from "./storage";

export class MongoStorage implements IStorage {
  private client: MongoClient;
  private db: Db;
  private usersCollection: Collection;
  private categoriesCollection: Collection;
  private authorsCollection: Collection;
  private blogPostsCollection: Collection;

  constructor(connectionString: string, databaseName: string) {
    this.client = new MongoClient(connectionString);
    this.db = this.client.db(databaseName);
    this.usersCollection = this.db.collection("users");
    this.categoriesCollection = this.db.collection("categories");
    this.authorsCollection = this.db.collection("authors");
    this.blogPostsCollection = this.db.collection("posts");
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
    return { id: _id.toString(), ...rest };
  }

  private extractExcerpt(content: string): string {
    const plainText = content.replace(/<[^>]*>/g, '');
    return plainText.length > 150 ? plainText.substring(0, 150) + '...' : plainText;
  }

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  }

  private calculateReadTime(content: string): number {
    const wordsPerMinute = 200;
    const plainText = content.replace(/<[^>]*>/g, '');
    const wordCount = plainText.split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerMinute);
  }

  private mapPostDocument(doc: any): BlogPostWithDetails {
    const post = this.convertMongoDoc(doc);
    
    // Handle date conversion properly
    let createdAt = new Date();
    let updatedAt = new Date();
    
    if (post.date) {
      if (post.date.$date) {
        createdAt = new Date(post.date.$date);
      } else {
        createdAt = new Date(post.date);
      }
    }
    
    if (post.lastModified) {
      if (post.lastModified.$date) {
        updatedAt = new Date(post.lastModified.$date);
      } else {
        updatedAt = new Date(post.lastModified);
      }
    } else {
      updatedAt = createdAt;
    }
    
    return {
      id: parseInt(post.id.substring(0, 8), 16), // Convert ObjectId to number for compatibility
      title: post.title || 'Untitled',
      content: post.content || '',
      excerpt: this.extractExcerpt(post.content || ''),
      slug: post.slug || this.generateSlug(post.title || 'untitled'),
      featuredImage: post.coverImage || '/api/placeholder/800/400',
      createdAt: createdAt,
      updatedAt: updatedAt,
      isFeatured: post.featured || false,
      isPublished: !post.draft,
      readTime: this.calculateReadTime(post.content || ''),
      categoryId: 1,
      authorId: 1,
      category: {
        id: 1,
        name: 'AgroTech',
        slug: 'agrotech',
        description: 'Agricultural Technology',
        color: '#10B981'
      },
      author: {
        id: 1,
        name: 'Admin',
        email: 'admin@agrotech.com',
        bio: 'Blog Administrator',
        avatar: '/api/placeholder/100/100'
      }
    };
  }

  // User methods (placeholder implementations)
  async getUser(id: number): Promise<User | undefined> {
    return undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    throw new Error("User creation not implemented");
  }

  // Category methods (using default categories)
  async getCategories(): Promise<Category[]> {
    return [
      { id: 1, name: 'AgroTech', slug: 'agrotech', description: 'Agricultural Technology', color: '#10B981' },
      { id: 2, name: 'Sustainability', slug: 'sustainability', description: 'Sustainable Farming', color: '#059669' },
      { id: 3, name: 'Innovation', slug: 'innovation', description: 'Agricultural Innovation', color: '#0D9488' }
    ];
  }

  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    const categories = await this.getCategories();
    return categories.find(cat => cat.slug === slug);
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    throw new Error("Category creation not implemented");
  }

  // Author methods (using default author)
  async getAuthors(): Promise<Author[]> {
    return [
      { id: 1, name: 'Admin', email: 'admin@agrotech.com', bio: 'Blog Administrator', avatar: '/api/placeholder/100/100' }
    ];
  }

  async getAuthor(id: number): Promise<Author | undefined> {
    const authors = await this.getAuthors();
    return authors.find(author => author.id === id);
  }

  async createAuthor(insertAuthor: InsertAuthor): Promise<Author> {
    throw new Error("Author creation not implemented");
  }

  // Blog post methods (working with your actual data)
  async getBlogPosts(options: { categorySlug?: string; limit?: number; offset?: number; featured?: boolean; includeDrafts?: boolean } = {}): Promise<BlogPostWithDetails[]> {
    try {
      const query: any = {};
      
      // Only show published posts (non-draft) unless includeDrafts is true
      if (!options.includeDrafts) {
        query.draft = { $ne: true };
      }
      
      // Filter by featured status if specified
      if (options.featured !== undefined) {
        query.featured = options.featured;
      }
      
      let cursor = this.blogPostsCollection.find(query).sort({ date: -1 });
      
      if (options.offset) {
        cursor = cursor.skip(options.offset);
      }
      
      if (options.limit) {
        cursor = cursor.limit(options.limit);
      }
      
      const docs = await cursor.toArray();
      return docs.map(doc => this.mapPostDocument(doc));
    } catch (error) {
      console.error('Error fetching blog posts:', error);
      return [];
    }
  }

  async getBlogPostBySlug(slug: string): Promise<BlogPostWithDetails | undefined> {
    const doc = await this.blogPostsCollection.findOne({ 
      slug: slug,
      draft: { $ne: true }
    });
    
    if (!doc) {
      // Try finding by generated slug if not found by original slug
      const allDocs = await this.blogPostsCollection.find({ draft: { $ne: true } }).toArray();
      const matchingDoc = allDocs.find(d => this.generateSlug(d.title) === slug);
      if (matchingDoc) {
        return this.mapPostDocument(matchingDoc);
      }
      return undefined;
    }
    
    return this.mapPostDocument(doc);
  }

  async getBlogPost(id: number | string): Promise<BlogPostWithDetails | undefined> {
    const doc = await this.blogPostsCollection.findOne({ 
      _id: new ObjectId(id.toString()),
      draft: { $ne: true }
    });
    
    if (!doc) return undefined;
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
      featured: insertPost.isFeatured || false
    };
    
    const result = await this.blogPostsCollection.insertOne(postData);
    return { 
      id: result.insertedId.toString(), 
      ...insertPost,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    };
  }

  async updateBlogPost(id: number | string, updateData: Partial<InsertBlogPost>): Promise<BlogPost> {
    // Find all documents and search for the one with matching converted ID
    const allDocs = await this.blogPostsCollection.find({}).toArray();
    const targetDoc = allDocs.find(doc => {
      const convertedDoc = this.convertMongoDoc(doc);
      return convertedDoc.id == id.toString() || convertedDoc.id == id;
    });
    
    if (!targetDoc) {
      console.log('Available document IDs:', allDocs.slice(0, 5).map(doc => this.convertMongoDoc(doc).id));
      throw new Error("Blog post not found");
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
      throw new Error("Blog post not found");
    }

    // Return the updated post
    const updatedDoc = await this.blogPostsCollection.findOne(query);
    if (!updatedDoc) {
      throw new Error("Failed to retrieve updated post");
    }

    return this.convertMongoDoc(updatedDoc);
  }

  async searchBlogPosts(query: string): Promise<BlogPostWithDetails[]> {
    const searchTerm = { $regex: query, $options: 'i' };
    const docs = await this.blogPostsCollection.find({
      draft: { $ne: true },
      $or: [
        { title: searchTerm },
        { content: searchTerm }
      ]
    }).toArray();
    
    return docs.map(doc => this.mapPostDocument(doc));
  }

  async getRelatedPosts(postId: number | string, categoryId: number, limit: number = 3): Promise<BlogPostWithDetails[]> {
    const docs = await this.blogPostsCollection
      .find({ 
        _id: { $ne: new ObjectId(postId.toString()) },
        draft: { $ne: true }
      })
      .limit(limit)
      .toArray();
    
    return docs.map(doc => this.mapPostDocument(doc));
  }
}