import type { VercelRequest, VercelResponse } from '@vercel/node';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error('MONGODB_URI environment variable is not set');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  if (req.method !== 'POST') {
    res.status(405).json({ message: 'Method not allowed - use POST' });
    return;
  }
  
  if (!uri) {
    console.error('MONGODB_URI missing');
    res.status(500).json({ 
      message: 'MONGODB_URI environment variable is not set'
    });
    return;
  }
  
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('📤 PUBLISH ALL: Connected to MongoDB');
    
    const db = client.db('blog_database');
    const postsCollection = db.collection('posts');
    
    // Find all draft posts (isPublished: false)
    const draftPosts = await postsCollection.find({ isPublished: false }).toArray();
    console.log(`📤 PUBLISH ALL: Found ${draftPosts.length} draft posts`);
    
    if (draftPosts.length === 0) {
      res.status(200).json({ 
        message: 'No draft posts found to publish',
        publishedCount: 0,
        totalPosts: await postsCollection.countDocuments({})
      });
      return;
    }
    
    // Update all draft posts to published
    const result = await postsCollection.updateMany(
      { isPublished: false },
      { 
        $set: { 
          isPublished: true,  // Set to published
          updatedAt: new Date()
        } 
      }
    );
    
    console.log(`📤 PUBLISH ALL: Updated ${result.modifiedCount} posts to published status`);
    
    // Get total post count for verification
    const totalPosts = await postsCollection.countDocuments({});
    const publishedPosts = await postsCollection.countDocuments({ isPublished: true });
    
    res.status(200).json({
      message: `Successfully published ${result.modifiedCount} posts`,
      publishedCount: result.modifiedCount,
      totalPosts: totalPosts,
      publishedPostsTotal: publishedPosts,
      draftPostsRemaining: totalPosts - publishedPosts
    });
    
  } catch (error) {
    console.error('📤 PUBLISH ALL: Error publishing posts:', error);
    res.status(500).json({ 
      message: 'Failed to publish posts',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  } finally {
    await client.close();
  }
} 