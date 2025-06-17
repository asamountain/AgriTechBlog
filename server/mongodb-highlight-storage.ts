import { MongoClient, Db, Collection, ObjectId } from "mongodb";
import type { 
  User, 
  Highlight, 
  HighlightComment, 
  HighlightWithDetails, 
  HighlightCommentWithDetails,
  InsertHighlight,
  InsertHighlightComment,
  InsertUser
} from "@shared/schema";

export class MongoHighlightStorage {
  private client: MongoClient;
  private db: Db;
  private usersCollection: Collection;
  private highlightsCollection: Collection;
  private highlightCommentsCollection: Collection;

  constructor(connectionString: string, databaseName: string) {
    this.client = new MongoClient(connectionString);
    this.db = this.client.db(databaseName);
    this.usersCollection = this.db.collection("users");
    this.highlightsCollection = this.db.collection("highlights");
    this.highlightCommentsCollection = this.db.collection("highlight_comments");
  }

  async connect(): Promise<void> {
    await this.client.connect();
  }

  async disconnect(): Promise<void> {
    await this.client.close();
  }

  private convertMongoDoc(doc: any): any {
    if (!doc) return null;
    const { _id, ...rest } = doc;
    return { id: _id.toString(), ...rest };
  }

  // User operations
  async getUser(id: string): Promise<User | null> {
    const user = await this.usersCollection.findOne({ id });
    return user ? this.convertMongoDoc(user) : null;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const userWithDates = {
      ...userData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const result = await this.usersCollection.insertOne(userWithDates);
    const user = await this.usersCollection.findOne({ _id: result.insertedId });
    return this.convertMongoDoc(user);
  }

  async upsertUser(userData: InsertUser): Promise<User> {
    const updateData = {
      ...userData,
      updatedAt: new Date(),
    };

    const result = await this.usersCollection.findOneAndUpdate(
      { id: userData.id },
      { 
        $set: updateData,
        $setOnInsert: { createdAt: new Date() }
      },
      { 
        upsert: true, 
        returnDocument: 'after' 
      }
    );

    return this.convertMongoDoc(result.value);
  }

  // Highlight operations
  async getHighlightsByPostId(postId: number | string): Promise<HighlightWithDetails[]> {
    const highlights = await this.highlightsCollection
      .find({ blogPostId: postId })
      .sort({ createdAt: -1 })
      .toArray();

    const highlightDetails: HighlightWithDetails[] = [];

    for (const highlight of highlights) {
      const highlightObj = this.convertMongoDoc(highlight);
      
      // Get user if highlight has userId
      let user = null;
      if (highlight.userId) {
        user = await this.getUser(highlight.userId);
      }

      // Get comments for this highlight
      const comments = await this.getCommentsByHighlightId(highlightObj.id);

      highlightDetails.push({
        ...highlightObj,
        user,
        comments,
      });
    }

    return highlightDetails;
  }

  async createHighlight(highlightData: InsertHighlight): Promise<string> {
    const highlightWithDate = {
      ...highlightData,
      id: new ObjectId().toString(),
      createdAt: new Date(),
    };

    const result = await this.highlightsCollection.insertOne(highlightWithDate);
    return highlightWithDate.id;
  }

  // Comment operations
  async getCommentsByHighlightId(highlightId: string): Promise<HighlightCommentWithDetails[]> {
    const comments = await this.highlightCommentsCollection
      .find({ highlightId, parentId: null })
      .sort({ createdAt: 1 })
      .toArray();

    const commentDetails: HighlightCommentWithDetails[] = [];

    for (const comment of comments) {
      const commentObj = this.convertMongoDoc(comment);
      
      // Get user for comment
      const user = await this.getUser(comment.userId);
      if (!user) continue;

      // Get replies
      const replies = await this.getRepliesByCommentId(commentObj.id);

      commentDetails.push({
        ...commentObj,
        user,
        replies,
      });
    }

    return commentDetails;
  }

  async getRepliesByCommentId(parentId: string): Promise<HighlightCommentWithDetails[]> {
    const replies = await this.highlightCommentsCollection
      .find({ parentId })
      .sort({ createdAt: 1 })
      .toArray();

    const replyDetails: HighlightCommentWithDetails[] = [];

    for (const reply of replies) {
      const replyObj = this.convertMongoDoc(reply);
      
      // Get user for reply
      const user = await this.getUser(reply.userId);
      if (!user) continue;

      replyDetails.push({
        ...replyObj,
        user,
      });
    }

    return replyDetails;
  }

  async addComment(commentData: InsertHighlightComment): Promise<string> {
    const commentWithDates = {
      ...commentData,
      id: new ObjectId().toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await this.highlightCommentsCollection.insertOne(commentWithDates);
    return commentWithDates.id;
  }

  async updateComment(commentId: string, content: string, userId: string): Promise<boolean> {
    const result = await this.highlightCommentsCollection.updateOne(
      { id: commentId, userId },
      { 
        $set: { 
          content, 
          updatedAt: new Date() 
        } 
      }
    );

    return result.matchedCount > 0;
  }

  async deleteComment(commentId: string, userId: string): Promise<boolean> {
    // Delete the comment and all its replies
    await this.highlightCommentsCollection.deleteMany({ parentId: commentId });
    
    const result = await this.highlightCommentsCollection.deleteOne({
      id: commentId,
      userId
    });

    return result.deletedCount > 0;
  }

  async getCommentWithUser(commentId: string): Promise<HighlightCommentWithDetails | null> {
    const comment = await this.highlightCommentsCollection.findOne({ id: commentId });
    if (!comment) return null;

    const user = await this.getUser(comment.userId);
    if (!user) return null;

    return {
      ...this.convertMongoDoc(comment),
      user,
    };
  }

  async canViewComment(commentId: string, userId: string, isOwner: boolean): Promise<boolean> {
    const comment = await this.highlightCommentsCollection.findOne({ id: commentId });
    if (!comment) return false;

    // Public comments can be viewed by anyone
    if (!comment.isPrivate) return true;

    // Private comments can only be viewed by the author or blog owner
    return comment.userId === userId || isOwner;
  }
}

// Export singleton instance
if (!process.env.MONGODB_URI) {
  throw new Error("MONGODB_URI environment variable is required");
}

export const mongoHighlightStorage = new MongoHighlightStorage(
  process.env.MONGODB_URI,
  "blog_database"
);