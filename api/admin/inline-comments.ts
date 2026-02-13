import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ObjectId } from 'mongodb';
import { getMongoConfig } from '../_shared/post-helpers.js';
import type { Annotation, InsertAnnotation } from '../../shared/schema';

interface MongoAnnotation {
  _id?: ObjectId;
  postId: number;
  type: 'highlight' | 'response' | 'note';
  selectedText: string;
  paragraphId: string;
  startOffset: number;
  endOffset: number;
  authorName: string;
  authorEmail: string;
  authorImage?: string;
  firebaseUserId?: string;
  anonymousUserId: string;
  content: string;
  parentAnnotationId?: string;
  isPrivate: boolean;
  isApproved: boolean;
  createdAt: Date;
  likes?: number;
  likedByUserIds?: string[];
}

function formatAnnotation(doc: MongoAnnotation): Annotation {
  return {
    id: doc._id!.toString(),
    postId: doc.postId,
    type: doc.type || 'response',
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
    likes: doc.likes || 0,
    likedByUserIds: doc.likedByUserIds || [],
  };
}

// Admin email whitelist
const ADMIN_EMAILS = [
  'seungjinyoun@gmail.com',
  'admin@agritech.com',
  'sjisyours@gmail.com'
];

/**
 * Check if the given email belongs to an admin user
 */
function isAdminEmail(email: string | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!['GET', 'POST', 'DELETE', 'PUT'].includes(req.method || '')) {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { postId: postIdParam, userId, type, parentId, annotationId } = req.query;

    if (!postIdParam || Array.isArray(postIdParam)) {
      return res.status(400).json({ message: 'Post ID is required' });
    }

    const postId = parseInt(postIdParam as string, 10);
    if (isNaN(postId)) {
      return res.status(400).json({ message: 'Invalid post ID' });
    }

    const config = getMongoConfig();
    const { MongoClient } = await import('mongodb');
    const client = new MongoClient(config.uri);

    try {
      await client.connect();
      const db = client.db(config.dbName);
      const collection = db.collection<MongoAnnotation>('inline-comments');

      // GET — fetch annotations
      if (req.method === 'GET') {
        const filter: any = { postId, isApproved: true };

        // Filter by type
        if (type && !Array.isArray(type)) {
          filter.type = type;
        }

        // Filter by parent annotation
        if (parentId && !Array.isArray(parentId)) {
          filter.parentAnnotationId = parentId;
        }

        // Privacy: return public + user's own private notes
        const userIdStr = Array.isArray(userId) ? userId[0] : userId;
        if (userIdStr) {
          filter.$or = [
            { isPrivate: { $ne: true } },
            { isPrivate: true, anonymousUserId: userIdStr },
          ];
        } else {
          filter.isPrivate = { $ne: true };
        }

        const docs = await collection.find(filter).sort({ createdAt: -1 }).toArray();
        return res.status(200).json(docs.map(formatAnnotation));
      }

      // POST — create annotation
      if (req.method === 'POST') {
        const body = req.body as InsertAnnotation;
        const annotationType = body.type || 'response';

        // Validate required fields
        if (!body.selectedText?.trim() || !body.paragraphId?.trim()) {
          return res.status(400).json({ message: 'selectedText and paragraphId are required' });
        }

        if (body.selectedText.length < 2 || body.selectedText.length > 1000) {
          return res.status(400).json({ message: 'Selected text must be 2-1000 characters' });
        }

        // For responses, require content + author info
        if (annotationType === 'response') {
          if (!body.content?.trim()) {
            return res.status(400).json({ message: 'Content is required for responses' });
          }
          if (!body.authorName?.trim() && !body.firebaseUserId) {
            return res.status(400).json({ message: 'Author name is required for responses' });
          }
          if (body.content.length > 2000) {
            return res.status(400).json({ message: 'Content is too long (max 2000)' });
          }
        }

        // For notes, require anonymousUserId
        if (annotationType === 'note' && !body.anonymousUserId) {
          return res.status(400).json({ message: 'anonymousUserId is required for notes' });
        }

        const doc: MongoAnnotation = {
          postId,
          type: annotationType,
          selectedText: body.selectedText.trim(),
          paragraphId: body.paragraphId.trim(),
          startOffset: typeof body.startOffset === 'number' ? body.startOffset : 0,
          endOffset: typeof body.endOffset === 'number' ? body.endOffset : 0,
          authorName: (body.authorName || '').trim(),
          authorEmail: (body.authorEmail || '').trim().toLowerCase(),
          authorImage: body.authorImage,
          firebaseUserId: body.firebaseUserId,
          anonymousUserId: body.anonymousUserId || '',
          content: (body.content || '').trim(),
          parentAnnotationId: body.parentAnnotationId,
          isPrivate: annotationType === 'note',
          isApproved: true,
          createdAt: new Date(),
          likes: 0,
          likedByUserIds: [],
        };

        const result = await collection.insertOne(doc);
        return res.status(201).json(formatAnnotation({ ...doc, _id: result.insertedId }));
      }

      // DELETE — remove own annotation or admin delete any
      if (req.method === 'DELETE') {
        const idStr = Array.isArray(annotationId) ? annotationId[0] : annotationId;
        const userIdStr = Array.isArray(userId) ? userId[0] : userId;
        const userEmail = Array.isArray(req.query.userEmail)
          ? req.query.userEmail[0]
          : req.query.userEmail;

        if (!idStr || !userIdStr) {
          return res.status(400).json({ message: 'annotationId and userId are required' });
        }

        // Check if user is admin
        const isAdmin = isAdminEmail(userEmail);

        // Find the annotation first
        const annotation = await collection.findOne({
          _id: new ObjectId(idStr)
        });

        if (!annotation) {
          return res.status(404).json({ message: 'Annotation not found' });
        }

        // Check authorization: owner OR admin
        const isOwner = annotation.anonymousUserId === userIdStr;
        const canDelete = isOwner || isAdmin;

        if (!canDelete) {
          return res.status(403).json({
            message: 'Forbidden: You can only delete your own annotations'
          });
        }

        // Log admin deletions to audit trail
        if (isAdmin && !isOwner) {
          const logsCollection = db.collection('deletion_logs');
          await logsCollection.insertOne({
            deletedAt: new Date(),
            deletedBy: userEmail,
            annotationType: 'inline-comment',
            annotationId: idStr,
            postId: postId,
            originalAuthor: annotation.authorName || annotation.authorEmail,
            originalContent: annotation.content,
            selectedText: annotation.selectedText,
            reason: 'admin_override',
          });
        }

        // Perform deletion
        const result = await collection.deleteOne({
          _id: new ObjectId(idStr)
        });

        if (result.deletedCount === 0) {
          return res.status(500).json({ message: 'Delete operation failed' });
        }

        return res.status(200).json({
          message: 'Deleted',
          deletedBy: isAdmin && !isOwner ? 'admin' : 'owner'
        });
      }

      // PUT — toggle like on an annotation
      if (req.method === 'PUT') {
        const action = Array.isArray(req.query.action) ? req.query.action[0] : req.query.action;

        if (action === 'like') {
          const idStr = Array.isArray(annotationId) ? annotationId[0] : annotationId;
          const userIdStr = Array.isArray(userId) ? userId[0] : userId;

          if (!idStr || !userIdStr) {
            return res.status(400).json({ error: 'annotationId and userId are required' });
          }

          // Find the annotation
          const annotation = await collection.findOne({
            _id: new ObjectId(idStr),
            postId: postId,
          });

          if (!annotation) {
            return res.status(404).json({ error: 'Annotation not found' });
          }

          const likedByUserIds = annotation.likedByUserIds || [];
          const hasLiked = likedByUserIds.includes(userIdStr);

          let update;
          if (hasLiked) {
            // Unlike: remove user from array, decrement count
            update = {
              $pull: { likedByUserIds: userIdStr },
              $inc: { likes: -1 },
            };
          } else {
            // Like: add user to array, increment count
            update = {
              $addToSet: { likedByUserIds: userIdStr },
              $inc: { likes: 1 },
            };
          }

          await collection.updateOne({ _id: new ObjectId(idStr) }, update);

          // Return updated count
          const updated = await collection.findOne({ _id: new ObjectId(idStr) });
          return res.status(200).json({
            likes: updated?.likes || 0,
            hasLiked: !hasLiked,
          });
        }
      }
    } finally {
      await client.close();
    }
  } catch (error) {
    console.error('Inline comments API error:', error);
    return res.status(500).json({
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
