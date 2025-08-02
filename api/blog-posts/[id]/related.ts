import type { VercelRequest, VercelResponse } from '@vercel/node';
import { MongoClient } from 'mongodb';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { id } = req.query;
  
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ message: 'Invalid post ID' });
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    return res.status(500).json({ message: 'MongoDB URI not configured' });
  }

  try {
    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db('blog_database');
    const postsCollection = db.collection('posts');

    const postId = parseInt(id);
    if (isNaN(postId)) {
      await client.close();
      return res.status(400).json({ message: 'Invalid post ID format' });
    }

    // Get the current post to find its tags
    const currentPost = await postsCollection.findOne({ id: postId });
    if (!currentPost) {
      await client.close();
      return res.status(404).json({ message: 'Post not found' });
    }

    // Find related posts based on tags
    const relatedPosts = await postsCollection
      .find({
        id: { $ne: postId }, // Exclude current post
        draft: { $ne: true }, // Only published posts
        tags: { $in: currentPost.tags || [] } // Match any tags
      })
      .sort({ date: -1 })
      .limit(3)
      .toArray();

    // If no tag matches, get latest posts
    if (relatedPosts.length === 0) {
      const latestPosts = await postsCollection
        .find({
          id: { $ne: postId },
          draft: { $ne: true }
        })
        .sort({ date: -1 })
        .limit(3)
        .toArray();
      
      await client.close();
      return res.status(200).json(latestPosts);
    }

    await client.close();
    res.status(200).json(relatedPosts);

  } catch (error) {
    console.error('Related posts error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
} 