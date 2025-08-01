import type { VercelRequest, VercelResponse } from '@vercel/node';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!uri) {
    console.error('MONGODB_URI environment variable is not set');
    res.status(500).json({ error: 'Database configuration error' });
    return;
  }

  try {
    const client = new MongoClient(uri);
    await client.connect();
    
    const db = client.db('blog_database');
    const postsCollection = db.collection('posts');
    
    // Test different queries
    const allPosts = await postsCollection.find({}).limit(5).toArray();
    const publishedPosts = await postsCollection.find({ isPublished: true }).limit(5).toArray();
    const draftPosts = await postsCollection.find({ draft: { $ne: true } }).limit(5).toArray();
    
    await client.close();
    
    res.status(200).json({
      totalPosts: allPosts.length,
      publishedPosts: publishedPosts.length,
      draftPosts: draftPosts.length,
      samplePublished: publishedPosts.map(p => ({ title: p.title, isPublished: p.isPublished, draft: p.draft })),
      sampleAll: allPosts.map(p => ({ title: p.title, isPublished: p.isPublished, draft: p.draft }))
    });

  } catch (error) {
    console.error('Error debugging posts:', error);
    res.status(500).json({ error: 'Error debugging posts' });
  }
} 