import { MongoClient, Db, Collection, ObjectId } from "mongodb";
import { 
  type User, type InsertUser,
  type Author, type InsertAuthor,
  type BlogPost, type InsertBlogPost,
  type BlogPostWithDetails
} from "@shared/schema";
import { IStorage } from "./storage";

export class MongoStorage implements IStorage {
  private client: MongoClient;
  private db: Db;
  private usersCollection: Collection;
  private authorsCollection: Collection;
  private blogPostsCollection: Collection;

  constructor(connectionString: string, databaseName: string) {
    this.client = new MongoClient(connectionString);
    this.db = this.client.db(databaseName);
    this.usersCollection = this.db.collection("users");
    this.authorsCollection = this.db.collection("authors");
    this.blogPostsCollection = this.db.collection("posts"); // Your actual collection name
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
    return { id: result.insertedId.toString(), ...insertUser };
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

  async createAuthor(insertAuthor: InsertAuthor): Promise<Author> {
    const result = await this.authorsCollection.insertOne(insertAuthor);
    return { id: result.insertedId.toString(), ...insertAuthor };
  }

  // Blog post methods
  async getBlogPosts(options: { categorySlug?: string; limit?: number; offset?: number; featured?: boolean } = {}): Promise<BlogPostWithDetails[]> {
    const query: any = { isPublished: true };
    
    if (options.featured !== undefined) {
      query.isFeatured = options.featured;
    }
    
    if (options.categorySlug) {
      const category = await this.getCategoryBySlug(options.categorySlug);
      if (category) {
        query.categoryId = category.id;
      }
    }
    
    let cursor = this.blogPostsCollection.find(query).sort({ createdAt: -1 });
    
    if (options.offset) {
      cursor = cursor.skip(options.offset);
    }
    
    if (options.limit) {
      cursor = cursor.limit(options.limit);
    }
    
    const docs = await cursor.toArray();
    
    // Populate with category and author data
    const postsWithDetails: BlogPostWithDetails[] = [];
    for (const doc of docs) {
      const post = this.convertMongoDoc(doc);
      const category = await this.getCategory(post.categoryId);
      const author = await this.getAuthor(post.authorId);
      
      if (category && author) {
        postsWithDetails.push({ ...post, category, author });
      }
    }
    
    return postsWithDetails;
  }

  private async getCategory(id: string): Promise<Category | undefined> {
    const doc = await this.categoriesCollection.findOne({ _id: new ObjectId(id) });
    return this.convertMongoDoc(doc);
  }

  async getBlogPostBySlug(slug: string): Promise<BlogPostWithDetails | undefined> {
    const doc = await this.blogPostsCollection.findOne({ slug, isPublished: true });
    if (!doc) return undefined;
    
    const post = this.convertMongoDoc(doc);
    const category = await this.getCategory(post.categoryId);
    const author = await this.getAuthor(post.authorId);
    
    if (!category || !author) return undefined;
    
    return { ...post, category, author };
  }

  async getBlogPost(id: number): Promise<BlogPostWithDetails | undefined> {
    const doc = await this.blogPostsCollection.findOne({ 
      _id: new ObjectId(id.toString()), 
      isPublished: true 
    });
    if (!doc) return undefined;
    
    const post = this.convertMongoDoc(doc);
    const category = await this.getCategory(post.categoryId);
    const author = await this.getAuthor(post.authorId);
    
    if (!category || !author) return undefined;
    
    return { ...post, category, author };
  }

  async createBlogPost(insertPost: InsertBlogPost): Promise<BlogPost> {
    const now = new Date();
    const postWithTimestamps = {
      ...insertPost,
      createdAt: now,
      updatedAt: now
    };
    
    const result = await this.blogPostsCollection.insertOne(postWithTimestamps);
    return { 
      id: result.insertedId.toString(), 
      ...postWithTimestamps
    };
  }

  async searchBlogPosts(query: string): Promise<BlogPostWithDetails[]> {
    const searchTerm = { $regex: query, $options: 'i' };
    const docs = await this.blogPostsCollection.find({
      isPublished: true,
      $or: [
        { title: searchTerm },
        { excerpt: searchTerm },
        { content: searchTerm }
      ]
    }).toArray();
    
    const postsWithDetails: BlogPostWithDetails[] = [];
    for (const doc of docs) {
      const post = this.convertMongoDoc(doc);
      const category = await this.getCategory(post.categoryId);
      const author = await this.getAuthor(post.authorId);
      
      if (category && author) {
        postsWithDetails.push({ ...post, category, author });
      }
    }
    
    return postsWithDetails;
  }

  async getRelatedPosts(postId: number, categoryId: number, limit: number = 3): Promise<BlogPostWithDetails[]> {
    const docs = await this.blogPostsCollection.find({
      _id: { $ne: new ObjectId(postId.toString()) },
      categoryId: categoryId.toString(),
      isPublished: true
    }).limit(limit).toArray();
    
    const postsWithDetails: BlogPostWithDetails[] = [];
    for (const doc of docs) {
      const post = this.convertMongoDoc(doc);
      const category = await this.getCategory(post.categoryId);
      const author = await this.getAuthor(post.authorId);
      
      if (category && author) {
        postsWithDetails.push({ ...post, category, author });
      }
    }
    
    return postsWithDetails;
  }
}