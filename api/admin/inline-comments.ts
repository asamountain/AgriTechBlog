import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ObjectId } from 'mongodb';
import { getMongoConfig } from '../_shared/post-helpers';
import type { InlineComment, InsertInlineComment } from '../../shared/schema';

interface MongoInlineComment {
  _id?: ObjectId;
  postId: number;
  authorName: string;
  authorEmail: string;
  content: string;
  selectedText: string;
  paragraphId: string;
  startOffset: number;
  endOffset: number;
  createdAt: Date;
  isApproved: boolean;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow GET and POST
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { postId: postIdParam } = req.query;
    
    if (!postIdParam || Array.isArray(postIdParam)) {
      return res.status(400).json({ message: 'Post ID is required' });
    }

    const postId = parseInt(postIdParam, 10);
    if (isNaN(postId)) {
      return res.status(400).json({ message: 'Invalid post ID' });
    }

    const config = getMongoConfig();
    const { MongoClient } = await import('mongodb');
    const client = new MongoClient(config.mongoUri);

    try {
      await client.connect();
      const db = client.db(config.dbName);
      const collection = db.collection<MongoInlineComment>('inline-comments');

      if (req.method === 'GET') {
        // Get all approved inline comments for this post
        const comments = await collection
          .find({ postId, isApproved: true })
          .sort({ createdAt: -1 })
          .toArray();

        const formattedComments: InlineComment[] = comments.map(comment => ({
          id: comment._id!.toString(),
          postId: comment.postId,
          authorName: comment.authorName,
          authorEmail: comment.authorEmail,
          content: comment.content,
          selectedText: comment.selectedText,
          paragraphId: comment.paragraphId,
          startOffset: comment.startOffset,
          endOffset: comment.endOffset,
          createdAt: comment.createdAt,
          isApproved: comment.isApproved,
        }));

        return res.status(200).json(formattedComments);
      }

      if (req.method === 'POST') {
        // Create new inline comment
        const { 
          authorName, 
          authorEmail, 
          content, 
          selectedText,
          paragraphId,
          startOffset,
          endOffset 
        } = req.body as InsertInlineComment;

        // Validation
        if (!authorName?.trim() || !authorEmail?.trim() || !content?.trim() || !selectedText?.trim() || !paragraphId?.trim()) {
          return res.status(400).json({ message: 'All fields are required' });
        }

        if (!authorEmail.includes('@')) {
          return res.status(400).json({ message: 'Invalid email address' });
        }

        if (selectedText.length < 5 || selectedText.length > 500) {
          return res.status(400).json({ message: 'Selected text must be between 5 and 500 characters' });
        }

        if (content.length > 1000) {
          return res.status(400).json({ message: 'Comment is too long' });
        }

        const newComment: MongoInlineComment = {
          postId,
          authorName: authorName.trim(),
          authorEmail: authorEmail.trim().toLowerCase(),
          content: content.trim(),
          selectedText: selectedText.trim(),
          paragraphId: paragraphId.trim(),
          startOffset: typeof startOffset === 'number' ? startOffset : 0,
          endOffset: typeof endOffset === 'number' ? endOffset : 0,
          createdAt: new Date(),
          isApproved: true, // Auto-approve for now (can add moderation later)
        };

        const result = await collection.insertOne(newComment);

        const savedComment: InlineComment = {
          id: result.insertedId.toString(),
          postId: newComment.postId,
          authorName: newComment.authorName,
          authorEmail: newComment.authorEmail,
          content: newComment.content,
          selectedText: newComment.selectedText,
          paragraphId: newComment.paragraphId,
          startOffset: newComment.startOffset,
          endOffset: newComment.endOffset,
          createdAt: newComment.createdAt,
          isApproved: newComment.isApproved,
        };

        return res.status(201).json(savedComment);
      }
    } finally {
      await client.close();
    }
  } catch (error) {
    console.error('Inline comments API error:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
