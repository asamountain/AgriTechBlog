import type { Request, Response } from 'express';
import { MongoClient, ObjectId } from 'mongodb';

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error('MONGODB_URI environment variable is not set');
}

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
  
  const client = new MongoClient(uri!);
  
  try {
    await client.connect();
    console.log('🔍 Admin PATCH: Connected to MongoDB for post ID:', postId);
    
    const db = client.db('blog_database');
    const postsCollection = db.collection('posts');
    
    if (req.method === 'PATCH') {
      const updateData = req.body;
      console.log('📝 Admin PATCH: Updating post with ID:', postId, 'Data:', updateData);
      
      // Convert isPublished to draft status (invert)
      if (updateData.hasOwnProperty('isPublished')) {
        updateData.draft = !updateData.isPublished;
        delete updateData.isPublished;
      }
      
      // Convert isFeatured to featured status
      if (updateData.hasOwnProperty('isFeatured')) {
        updateData.featured = updateData.isFeatured;
        delete updateData.isFeatured;
      }
      
      // Convert featuredImage to coverImage for MongoDB storage
      if (updateData.hasOwnProperty('featuredImage')) {
        updateData.coverImage = updateData.featuredImage;
        delete updateData.featuredImage;
      }
      
      // Set lastModified
      updateData.lastModified = new Date();
      
      // ===== IMPROVED ID MATCHING LOGIC =====
      let filter: any = null;
      let existingPost: any = null;
      
      const numericId = parseInt(postId);
      
      // Strategy 1: Try to find by explicit ID field first (most reliable)
      if (!isNaN(numericId)) {
        existingPost = await postsCollection.findOne({ id: numericId });
        if (existingPost) {
          filter = { id: numericId };
          console.log('✅ Admin PATCH: Found post by explicit ID field');
        }
      }
      
      // Strategy 2: If not found by explicit ID, find by generated ID from ObjectId
      if (!existingPost) {
        console.log('🔍 Admin PATCH: Searching by generated ID...');
        
        // Get all posts and find the one with matching generated ID
        const allPosts = await postsCollection.find({}).toArray();
        
        for (const post of allPosts) {
          const generatedId = parseInt(post._id.toString().substring(0, 8), 16);
            if (generatedId === numericId) {
              existingPost = post;
              filter = { _id: post._id };
            console.log('✅ Admin PATCH: Found post by generated ID from ObjectId');
            
            // IMPORTANT: Add explicit ID field to make future lookups faster
            await postsCollection.updateOne(
              { _id: post._id },
              { $set: { id: generatedId } }
            );
            console.log('🔧 Admin PATCH: Added explicit ID field for future lookups');
              break;
          }
        }
      }
      
      // Strategy 3: Try ObjectId if it looks like one (24 characters)
      if (!existingPost && postId.length === 24) {
        try {
          filter = { _id: new ObjectId(postId) };
          existingPost = await postsCollection.findOne(filter);
          if (existingPost) {
            console.log('✅ Admin PATCH: Found post by ObjectId');
            
            // Add explicit ID field
            const generatedId = parseInt(existingPost._id.toString().substring(0, 8), 16);
            await postsCollection.updateOne(
              { _id: existingPost._id },
              { $set: { id: generatedId } }
            );
          }
        } catch (error) {
          console.log('⚠️  Admin PATCH: Invalid ObjectId format');
        }
      }
      
      if (!existingPost) {
        console.log('❌ Admin PATCH: Post not found with ID:', postId, 'Numeric:', numericId);
        res.status(404).json({ 
          message: 'Post not found',
          searchedId: postId,
          numericId: numericId
        });
        return;
      }
      
      console.log('📝 Admin PATCH: Updating post with filter:', JSON.stringify(filter));
      
      // Perform the update
      const result = await postsCollection.updateOne(filter, { $set: updateData });
      
      if (result.matchedCount === 0) {
        console.log('❌ Admin PATCH: Update failed - no matches');
        res.status(404).json({ message: 'Post not found during update' });
        return;
      }
      
      if (result.modifiedCount === 0) {
        console.log('⚠️  Admin PATCH: Update matched but no changes made');
      } else {
        console.log('✅ Admin PATCH: Update successful');
      }
      
      // Get the updated post
      const updatedPost = await postsCollection.findOne(filter);
      
      // Convert back to frontend format
      const formattedPost = {
        id: updatedPost?.id || (updatedPost?._id ? parseInt(updatedPost._id.toString().substring(0, 8), 16) : numericId),
        title: updatedPost?.title || 'Untitled',
        content: updatedPost?.content || '',
        slug: updatedPost?.slug || updatedPost?.title?.toLowerCase().replace(/[^a-z0-9 -]/g, '').replace(/\s+/g, '-') || 'untitled',
        excerpt: updatedPost?.excerpt || (updatedPost?.content ? updatedPost.content.substring(0, 150) + '...' : ''),
        featuredImage: updatedPost?.coverImage || '',
        createdAt: updatedPost?.date ? new Date(updatedPost.date).toISOString() : new Date().toISOString(),
        updatedAt: updatedPost?.lastModified ? new Date(updatedPost.lastModified).toISOString() : new Date().toISOString(),
        userId: updatedPost?.userId || '',
        tags: Array.isArray(updatedPost?.tags) ? updatedPost.tags : (updatedPost?.tags ? [updatedPost.tags] : []),
        isFeatured: !!updatedPost?.featured,
        isPublished: !updatedPost?.draft,
        readTime: Math.ceil((updatedPost?.content || '').replace(/<[^>]*>/g, '').split(/\s+/).length / 200),
      };
      
      console.log('✅ Admin PATCH: Returning updated post:', formattedPost.title, 'Published:', formattedPost.isPublished);
      res.status(200).json(formattedPost);
      
    } else if (req.method === 'DELETE') {
      // Handle delete - reuse the same improved lookup logic
      let filter: any = null;
      let existingPost: any = null;
      
      const numericId = parseInt(postId);
      
      // Strategy 1: Try to find by explicit ID field
      if (!isNaN(numericId)) {
        existingPost = await postsCollection.findOne({ id: numericId });
        if (existingPost) {
          filter = { id: numericId };
        }
      }
      
      // Strategy 2: Find by generated ID
      if (!existingPost) {
        const allPosts = await postsCollection.find({}).toArray();
        for (const post of allPosts) {
          const generatedId = parseInt(post._id.toString().substring(0, 8), 16);
          if (generatedId === numericId) {
            existingPost = post;
            filter = { _id: post._id };
            break;
          }
        }
      }
      
      // Strategy 3: Try ObjectId
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
      
      const result = await postsCollection.deleteOne(filter);
      
      if (result.deletedCount === 0) {
        res.status(404).json({ message: 'Post not found' });
        return;
      }
      
      console.log('🗑️  Admin DELETE: Successfully deleted post');
      res.status(200).json({ message: 'Post deleted successfully' });
      
    } else {
      res.status(405).json({ message: 'Method not allowed' });
    }
    
  } catch (error) {
    console.error('❌ Admin API Error:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  } finally {
    await client.close();
  }
} 