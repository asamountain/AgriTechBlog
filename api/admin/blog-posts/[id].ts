import type { VercelRequest, VercelResponse } from '@vercel/node';
import { MongoClient } from 'mongodb';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { id } = req.query;
  
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

    if (req.method === 'GET') {
      // Fetch single post
      const post = await postsCollection.findOne({ id: postId });
      
      await client.close();
      
      if (!post) {
        return res.status(404).json({ message: 'Post not found' });
      }
      
      return res.status(200).json(post);
    }

    if (req.method === 'PATCH') {
      // Update post
      const updateData = req.body;
      const result = await postsCollection.updateOne(
        { id: postId },
        { $set: { ...updateData, updatedAt: new Date().toISOString() } }
      );

      await client.close();

      if (result.matchedCount === 0) {
        return res.status(404).json({ message: 'Post not found' });
      }

      return res.status(200).json({ message: 'Post updated successfully' });
    }

    if (req.method === 'DELETE') {
      // Delete post
      const result = await postsCollection.deleteOne({ id: postId });

      await client.close();

      if (result.deletedCount === 0) {
        return res.status(404).json({ message: 'Post not found' });
      }

      return res.status(200).json({ message: 'Post deleted successfully' });
    }

    await client.close();
    return res.status(405).json({ message: 'Method not allowed' });

  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
} 