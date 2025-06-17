import { db } from './db';
import { highlights, highlightComments, users } from '@shared/schema';
import { eq, and, desc, isNull } from 'drizzle-orm';
import type { 
  HighlightWithDetails, 
  HighlightCommentWithDetails, 
  InsertHighlight, 
  InsertHighlightComment 
} from '@shared/schema';

export class HighlightStorage {
  // Get all highlights for a blog post with comments
  async getHighlightsByPostId(postId: number): Promise<HighlightWithDetails[]> {
    // Get highlights
    const postHighlights = await db
      .select()
      .from(highlights)
      .leftJoin(users, eq(highlights.userId, users.id))
      .where(eq(highlights.blogPostId, postId))
      .orderBy(desc(highlights.createdAt));

    // Get all comments for these highlights
    const highlightIds = postHighlights.map(h => h.highlights.id);
    
    if (highlightIds.length === 0) return [];

    const comments = await db
      .select()
      .from(highlightComments)
      .leftJoin(users, eq(highlightComments.userId, users.id))
      .where(and(
        eq(highlightComments.highlightId, highlightIds[0]), // This needs to be fixed for multiple highlights
        isNull(highlightComments.parentId)
      ))
      .orderBy(desc(highlightComments.createdAt));

    // Get replies for comments
    const commentIds = comments.map(c => c.highlight_comments.id);
    const replies = commentIds.length > 0 ? await db
      .select()
      .from(highlightComments)
      .leftJoin(users, eq(highlightComments.userId, users.id))
      .where(eq(highlightComments.parentId, commentIds[0])) // This also needs to be fixed
      .orderBy(desc(highlightComments.createdAt)) : [];

    // Build the result structure
    return postHighlights.map(({ highlights: highlight, users: user }) => ({
      ...highlight,
      user: user || undefined,
      comments: comments
        .filter(c => c.highlight_comments.highlightId === highlight.id)
        .map(({ highlight_comments: comment, users: commentUser }) => ({
          ...comment,
          user: commentUser!,
          replies: replies
            .filter(r => r.highlight_comments.parentId === comment.id)
            .map(({ highlight_comments: reply, users: replyUser }) => ({
              ...reply,
              user: replyUser!,
            }))
        }))
    }));
  }

  // Create a new highlight
  async createHighlight(highlightData: InsertHighlight): Promise<number> {
    const [result] = await db
      .insert(highlights)
      .values(highlightData)
      .returning({ id: highlights.id });
    
    return result.id;
  }

  // Add comment to highlight
  async addComment(commentData: InsertHighlightComment): Promise<number> {
    const [result] = await db
      .insert(highlightComments)
      .values(commentData)
      .returning({ id: highlightComments.id });
    
    return result.id;
  }

  // Update comment
  async updateComment(commentId: number, content: string, userId: string): Promise<boolean> {
    const result = await db
      .update(highlightComments)
      .set({ content, updatedAt: new Date() })
      .where(and(
        eq(highlightComments.id, commentId),
        eq(highlightComments.userId, userId)
      ));

    return result.rowCount > 0;
  }

  // Delete comment
  async deleteComment(commentId: number, userId: string): Promise<boolean> {
    const result = await db
      .delete(highlightComments)
      .where(and(
        eq(highlightComments.id, commentId),
        eq(highlightComments.userId, userId)
      ));

    return result.rowCount > 0;
  }

  // Get comment with user details
  async getCommentWithUser(commentId: number): Promise<HighlightCommentWithDetails | null> {
    const [result] = await db
      .select()
      .from(highlightComments)
      .leftJoin(users, eq(highlightComments.userId, users.id))
      .where(eq(highlightComments.id, commentId));

    if (!result) return null;

    return {
      ...result.highlight_comments,
      user: result.users!,
    };
  }

  // Check if user can view private comment
  async canViewComment(commentId: number, userId: string, isOwner: boolean): Promise<boolean> {
    const [comment] = await db
      .select()
      .from(highlightComments)
      .where(eq(highlightComments.id, commentId));

    if (!comment) return false;
    if (!comment.isPrivate) return true;
    if (isOwner) return true;
    if (comment.userId === userId) return true;

    return false;
  }
}

export const highlightStorage = new HighlightStorage();