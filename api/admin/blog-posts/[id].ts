import type { Request, Response } from 'express';
import { MongoClient, ObjectId } from 'mongodb';

const uri = process.env.MONGODB_URI || "mongodb+srv://blog-admin-new:wrbnidP8UoFl4RCO@cluster0.br3z5.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

export default async function handler(req: Request, res: Response) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  const { id } = req.query;
  
  if (!id || Array.isArray(id)) {
    res.status(400).json({ message: 'Invalid post ID' });
    return;
  }
  
  const postId = id as string;
  
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('blog_database');
    const postsCollection = db.collection('posts');
    
    if (req.method === 'PATCH') {
      const updateData = req.body;
      console.log('Updating post with ID:', id, 'Data:', updateData);
      
      // Convert isPublished to draft status (invert)
      if (updateData.hasOwnProperty('isPublished')) {
        updateData.draft = !updateData.isPublished;
        delete updateData.isPublished;
      }
      
      // Set lastModified
      updateData.lastModified = new Date();
      
      // Try multiple lookup strategies to find the post
      let filter: any = null;
      let existingPost: any = null;
      
      const numericId = parseInt(postId);
      
      // Strategy 1: Try to find by numeric ID field
      if (!isNaN(numericId)) {
        existingPost = await postsCollection.findOne({ id: numericId });
        if (existingPost) {
          filter = { id: numericId };
        }
      }
      
      // Strategy 2: If not found, try by title match (in case the frontend ID is actually a title hash)
      if (!existingPost) {
        const postsByTitle = await postsCollection.find({}).limit(1).toArray();
        if (postsByTitle.length > 0) {
          // Try to find by generated ID based on title
          for (const post of await postsCollection.find({}).toArray()) {
            const generatedId = post._id ? parseInt(post._id.toString().substring(0, 8), 16) : 0;
            if (generatedId === numericId) {
              existingPost = post;
              filter = { _id: post._id };
              break;
            }
          }
        }
      }
      
      // Strategy 3: Try ObjectId if it looks like one
      if (!existingPost && postId.length === 24) {
        try {
          filter = { _id: new ObjectId(postId) };
          existingPost = await postsCollection.findOne(filter);
        } catch {
          // Ignore ObjectId conversion errors
        }
      }
      
      if (!existingPost) {
        console.log('Post not found with ID:', postId, 'Tried numeric:', numericId);
        res.status(404).json({ message: 'Post not found' });
        return;
      }
      
      const result = await postsCollection.updateOne(filter!, { $set: updateData });
      
      if (result.matchedCount === 0) {
        res.status(404).json({ message: 'Post not found' });
        return;
      }
      
      const updatedPost = await postsCollection.findOne(filter!);
      
      // Convert back to frontend format
      const formattedPost = {
        id: updatedPost?.id || (updatedPost?._id ? parseInt(updatedPost._id.toString().substring(0, 8), 16) : numericId),
        title: updatedPost?.title || 'Untitled',
        content: updatedPost?.content || '',
        slug: updatedPost?.slug || updatedPost?.title?.toLowerCase().replace(/[^a-z0-9 -]/g, '').replace(/\s+/g, '-') || 'untitled',
        excerpt: updatedPost?.excerpt || (updatedPost?.content ? updatedPost.content.substring(0, 150) + '...' : ''),
        featuredImage: updatedPost?.coverImage || '',
        createdAt: updatedPost?.date ? new Date(updatedPost.date) : new Date(),
        updatedAt: updatedPost?.lastModified ? new Date(updatedPost.lastModified) : new Date(),
        userId: updatedPost?.userId || '',
        tags: Array.isArray(updatedPost?.tags) ? updatedPost.tags : (updatedPost?.tags ? [updatedPost.tags] : []),
        isFeatured: !!updatedPost?.featured,
        isPublished: !updatedPost?.draft,
        readTime: Math.ceil((updatedPost?.content || '').replace(/<[^>]*>/g, '').split(/\s+/).length / 200),
      };
      
      console.log('Updated post:', formattedPost);
      res.status(200).json(formattedPost);
      
    } else if (req.method === 'DELETE') {
      // Handle delete - reuse the same lookup logic
      let filter: any = null;
      let existingPost: any = null;
      
      const numericId = parseInt(postId);
      
      // Strategy 1: Try to find by numeric ID field
      if (!isNaN(numericId)) {
        existingPost = await postsCollection.findOne({ id: numericId });
        if (existingPost) {
          filter = { id: numericId };
        }
      }
      
      // Strategy 2: If not found, try by generated ID
      if (!existingPost) {
        for (const post of await postsCollection.find({}).toArray()) {
          const generatedId = post._id ? parseInt(post._id.toString().substring(0, 8), 16) : 0;
          if (generatedId === numericId) {
            existingPost = post;
            filter = { _id: post._id };
            break;
          }
        }
      }
      
      // Strategy 3: Try ObjectId if it looks like one
      if (!existingPost && postId.length === 24) {
        try {
          filter = { _id: new ObjectId(postId) };
          existingPost = await postsCollection.findOne(filter);
        } catch {
          // Ignore ObjectId conversion errors
        }
      }
      
      if (!existingPost) {
        res.status(404).json({ message: 'Post not found' });
        return;
      }
      
      const result = await postsCollection.deleteOne(filter!);
      
      if (result.deletedCount === 0) {
        res.status(404).json({ message: 'Post not found' });
        return;
      }
      
      res.status(200).json({ message: 'Post deleted successfully' });
      
    } else {
      res.status(405).json({ message: 'Method not allowed' });
    }
    
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  } finally {
    await client.close();
  }
} 