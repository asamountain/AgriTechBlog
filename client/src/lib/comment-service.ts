import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc,
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';
import type { Comment, CommentFormData } from '@/types/comments';
import { userProfileService } from './user-profile-service';

export class CommentService {
  private get commentsCollection() {
    if (!db) throw new Error('Firebase is not configured');
    return collection(db, 'comments');
  }

  // Add a new comment (requires authentication)
  async addComment(postId: string, commentData: CommentFormData, userId: string): Promise<Comment> {
    try {
      if (!userId) {
        throw new Error('User must be authenticated to comment');
      }

      // Get user profile to ensure we have the latest data
      const userProfile = await userProfileService.getUserProfile(userId);
      if (!userProfile) {
        throw new Error('User profile not found');
      }

      const docRef = await addDoc(this.commentsCollection, {
        postId,
        content: commentData.content,
        authorName: userProfile.displayName,
        authorEmail: userProfile.email,
        authorId: userId,
        authorAvatar: userProfile.photoURL,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        likes: 0,
        replies: [],
        parentId: null,
        isApproved: true
      });

      // Increment user's comment count
      await userProfileService.incrementCommentCount(userId);

      const newComment: Comment = {
        id: docRef.id,
        postId,
        content: commentData.content,
        authorName: userProfile.displayName,
        authorEmail: userProfile.email,
        authorId: userId,
        authorAvatar: userProfile.photoURL,
        createdAt: new Date(),
        updatedAt: new Date(),
        likes: 0,
        replies: [],
        parentId: undefined,
        isApproved: true
      };

      return newComment;
    } catch (error) {
      console.error('Error adding comment:', error);
      throw new Error('Failed to add comment');
    }
  }

  // Add a reply to a comment (requires authentication)
  async addReply(postId: string, parentId: string, commentData: CommentFormData, userId: string): Promise<Comment> {
    try {
      if (!userId) {
        throw new Error('User must be authenticated to reply');
      }

      // Get user profile to ensure we have the latest data
      const userProfile = await userProfileService.getUserProfile(userId);
      if (!userProfile) {
        throw new Error('User profile not found');
      }

      const docRef = await addDoc(this.commentsCollection, {
        postId,
        content: commentData.content,
        authorName: userProfile.displayName,
        authorEmail: userProfile.email,
        authorId: userId,
        authorAvatar: userProfile.photoURL,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        likes: 0,
        replies: [],
        parentId,
        isApproved: true
      });

      // Increment user's comment count
      await userProfileService.incrementCommentCount(userId);

      const newReply: Comment = {
        id: docRef.id,
        postId,
        content: commentData.content,
        authorName: userProfile.displayName,
        authorEmail: userProfile.email,
        authorId: userId,
        authorAvatar: userProfile.photoURL,
        createdAt: new Date(),
        updatedAt: new Date(),
        likes: 0,
        replies: [],
        parentId,
        isApproved: true
      };

      return newReply;
    } catch (error) {
      console.error('Error adding reply:', error);
      throw new Error('Failed to add reply');
    }
  }

  // Get comments for a specific post with user profiles
  async getComments(postId: string): Promise<Comment[]> {
    if (!isFirebaseConfigured) return [];
    try {

      console.log('Fetching comments for postId:', postId);
      console.log('Using collection:', this.commentsCollection);

      // Simplified query to avoid index requirements
      const q = query(
        this.commentsCollection,
        where('postId', '==', postId),
        where('parentId', '==', null), // Only top-level comments
        where('isApproved', '==', true)
        // Temporarily removed orderBy to avoid index requirement
        // orderBy('createdAt', 'desc')
      );

      console.log('Query created:', q);

      const querySnapshot = await getDocs(q);
      console.log('Query snapshot received:', querySnapshot);

      const comments: Comment[] = [];

      for (const doc of querySnapshot.docs) {
        const data = doc.data();
        console.log('Processing comment doc:', doc.id, data);

        const comment: Comment = {
          id: doc.id,
          postId: data.postId,
          content: data.content,
          authorName: data.authorName,
          authorEmail: data.authorEmail,
          authorId: data.authorId,
          authorAvatar: data.authorAvatar,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate(),
          likes: data.likes || 0,
          replies: [],
          parentId: data.parentId,
          isApproved: data.isApproved
        };

        // Get replies for this comment (also simplified)
        const repliesQuery = query(
          this.commentsCollection,
          where('postId', '==', postId),
          where('parentId', '==', doc.id),
          where('isApproved', '==', true)
          // Temporarily removed orderBy to avoid index requirement
          // orderBy('createdAt', 'asc')
        );

        const repliesSnapshot = await getDocs(repliesQuery);
        comment.replies = repliesSnapshot.docs.map(replyDoc => {
          const replyData = replyDoc.data();
          return {
            id: replyDoc.id,
            postId: replyData.postId,
            content: replyData.content,
            authorName: replyData.authorName,
            authorEmail: replyData.authorEmail,
            authorId: replyData.authorId,
            authorAvatar: replyData.authorAvatar,
            createdAt: replyData.createdAt?.toDate() || new Date(),
            updatedAt: replyData.updatedAt?.toDate(),
            likes: replyData.likes || 0,
            replies: [],
            parentId: replyData.parentId,
            isApproved: replyData.isApproved
          };
        });

        comments.push(comment);
      }

      // Sort comments by creation date (newest first) in memory
      comments.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      
      // Sort replies by creation date (oldest first) in memory
      comments.forEach(comment => {
        comment.replies.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      });

      console.log('Returning sorted comments:', comments);
      return comments;
    } catch (error) {
      console.error('Error getting comments:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : String(error),
        code: (error as any)?.code,
        stack: error instanceof Error ? error.stack : undefined
      });
      throw new Error(`Failed to get comments: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Like a comment
  async likeComment(commentId: string): Promise<void> {
    try {
      const commentRef = doc(db, 'comments', commentId);
      await updateDoc(commentRef, {
        likes: (await this.getCommentLikes(commentId)) + 1
      });
    } catch (error) {
      console.error('Error liking comment:', error);
      throw new Error('Failed to like comment');
    }
  }

  // Get comment likes count
  private async getCommentLikes(commentId: string): Promise<number> {
    try {
      const commentRef = doc(db, 'comments', commentId);
      const commentDoc = await getDocs(query(collection(db, 'comments'), where('__name__', '==', commentId)));
      if (!commentDoc.empty) {
        return commentDoc.docs[0].data().likes || 0;
      }
      return 0;
    } catch (error) {
      console.error('Error getting comment likes:', error);
      return 0;
    }
  }

  // Delete a comment (only by author or admin)
  async deleteComment(commentId: string, userId: string): Promise<void> {
    try {
      if (!userId) {
        throw new Error('User must be authenticated to delete comments');
      }

      // TODO: Add authorization check to ensure user owns the comment
      await deleteDoc(doc(db, 'comments', commentId));
    } catch (error) {
      console.error('Error deleting comment:', error);
      throw new Error('Failed to delete comment');
    }
  }
}

export const commentService = new CommentService();
