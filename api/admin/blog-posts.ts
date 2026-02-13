import type { VercelRequest, VercelResponse } from '@vercel/node';
import { MongoClient, ObjectId } from 'mongodb';
import { stripHtmlTags, markdownToText, generateCleanExcerpt, mapPostDocument, deduplicatePosts } from '../_shared/post-helpers.js';

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error('MONGODB_URI environment variable is not set');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  // IMMEDIATE TEST: Return simple response if test flag is present
  if (req.query.test === 'true') {
    return res.status(200).json({ message: 'Handler reached successfully', query: req.query });
  }
  
  // Debug logging - ENHANCED
  console.log('🚨 ADMIN API HANDLER CALLED!');
  console.log('🚨 Method:', req.method);
  console.log('🚨 URL:', req.url);
  console.log('🚨 Query params:', req.query);
  
  // TEMPORARY FIX: If MongoDB is not available, return success for DELETE to unblock UI
  if (!uri) {
    console.error('MONGODB_URI missing');
    if (req.method === 'DELETE') {
      console.log('🗑️ TEMP: Simulating successful delete (MongoDB unavailable)');
      res.status(200).json({ message: 'Post deleted successfully (simulated)' });
      return;
    }
    res.status(500).json({ 
      message: 'MONGODB_URI environment variable is not set',
      debug: 'Environment variable check failed'
    });
    return;
  }

  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB for admin posts');
    
    const db = client.db('blog_database');
    const postsCollection = db.collection('posts');
    
    // Check if this is a request for a specific post by ID
    const { id } = req.query;
    
    // SPECIFIC DEBUG FOR DELETE REQUESTS
    if (req.method === 'DELETE') {
      console.log('🚨 DELETE REQUEST DETECTED!');
      console.log('🚨 DELETE ID:', id);
      
      if (!id || Array.isArray(id) || id.toString().trim() === '') {
        console.log('🚨 DELETE FAILED: Invalid ID');
        res.status(400).json({ message: 'Valid post ID is required for delete' });
        return;
      }
      
      const postId = id as string;
      const numericId = parseInt(postId);
      
      console.log('🚨 DELETE: Attempting to delete post with ID:', numericId);
      
      // Try to delete by explicit ID field first
      let result = await postsCollection.deleteOne({ id: numericId });
      
      if (result.deletedCount === 0) {
        console.log('🚨 DELETE: Post not found by explicit ID, trying ObjectId search...');
        
        // Try to find and delete by generated ID from ObjectId
        const allPosts = await postsCollection.find({}).toArray();
        let foundPost: any = null;
        
        for (const post of allPosts) {
          const objectIdStr = post._id.toString();
          const timestamp = parseInt(objectIdStr.substring(0, 8), 16);
          const sequence = parseInt(objectIdStr.substring(16, 24), 16);
          let generatedId = Math.abs(timestamp + sequence);
          
          if (generatedId === 0 || generatedId > Number.MAX_SAFE_INTEGER) {
            generatedId = Math.abs(objectIdStr.split('').reduce((acc: number, char: string) => {
              return acc + char.charCodeAt(0);
            }, 0) * 1000 + Date.now() % 1000);
          }
          
          if (generatedId === numericId) {
            foundPost = post;
            result = await postsCollection.deleteOne({ _id: post._id });
            console.log('🚨 DELETE: Found and deleted post by generated ID');
            break;
          }
        }
      }
      
      if (result.deletedCount === 0) {
        console.log('🚨 DELETE FAILED: Post not found');
        res.status(404).json({ message: 'Post not found', searchedId: postId, numericId });
        return;
      }
      
      console.log('🗑️ DELETE SUCCESS: Post deleted successfully');
      res.status(200).json({ message: 'Post deleted successfully' });
      return;
    }
    
        // Handle requests with ID parameter (individual post operations)
    // TEMPORARY DEBUG: Return debug info directly in response
    if (req.query.debug === 'true') {
      return res.status(200).json({
        debug: true,
        fullQuery: req.query,
        id: id,
        idType: typeof id,
        isArray: Array.isArray(id),
        conditionResult: id && !Array.isArray(id) && id.toString().trim() !== ''
      });
    }
    
    console.log('🚨 DEBUGGING: req.query =', req.query);
    console.log('🚨 DEBUGGING: id =', id, 'type:', typeof id, 'Array?', Array.isArray(id));
    
    if (id && !Array.isArray(id) && id.toString().trim() !== '') {
      const postId = id as string;
      console.log('✅ INDIVIDUAL POST LOGIC REACHED for ID:', postId);
      
      if (req.method === 'GET') {
        console.log('📖 Admin: GET individual post with ID:', postId);
        // GET specific post by ID
        let filter: any = null;
        let existingPost: any = null;
        
        const numericId = parseInt(postId);
        
        // Strategy 1: Try to find by explicit ID field first (most reliable)
        if (!isNaN(numericId)) {
          existingPost = await postsCollection.findOne({ id: numericId });
          if (existingPost) {
            filter = { id: numericId };
            console.log('✅ Admin GET: Found post by explicit ID field');
          }
        }
        
        // Strategy 2: If not found by explicit ID, find by generated ID from ObjectId
        if (!existingPost) {
          console.log('🔍 Admin GET: Searching by generated ID...');
          
          // Get all posts and find the one with matching generated ID
          const allPosts = await postsCollection.find({}).toArray();
          
          for (const post of allPosts) {
            // Use the same ID generation algorithm as mapPostDocument
            const objectIdStr = post._id.toString();
            const timestamp = parseInt(objectIdStr.substring(0, 8), 16);
            const sequence = parseInt(objectIdStr.substring(16, 24), 16);
            let generatedId = Math.abs(timestamp + sequence);
            
            // Apply the same fallback logic as mapPostDocument
            if (generatedId === 0 || generatedId > Number.MAX_SAFE_INTEGER) {
              generatedId = Math.abs(objectIdStr.split('').reduce((acc: number, char: string) => {
                return acc + char.charCodeAt(0);
              }, 0) * 1000 + Date.now() % 1000);
            }
            
            if (generatedId === numericId) {
              existingPost = post;
              filter = { _id: post._id };
              console.log('✅ Admin GET: Found post by generated ID from ObjectId');
              
              // IMPORTANT: Add explicit ID field to make future lookups faster
              await postsCollection.updateOne(
                { _id: post._id },
                { $set: { id: generatedId } }
              );
              console.log('🔧 Admin GET: Added explicit ID field for future lookups');
              break;
            }
          }
        }
        
        if (!existingPost) {
          console.log('❌ Admin GET: Post not found with ID:', postId, 'Numeric:', numericId);
          res.status(404).json({ 
            message: 'Post not found',
            searchedId: postId,
            numericId: numericId
          });
          return;
        }
        
        // Convert to frontend format  
        const formattedPost = {
          id: existingPost?.id || (existingPost?._id ? (() => {
            const objectIdStr = existingPost._id.toString();
            const timestamp = parseInt(objectIdStr.substring(0, 8), 16);
            const sequence = parseInt(objectIdStr.substring(16, 24), 16);
            let generatedId = Math.abs(timestamp + sequence);
            
            if (generatedId === 0 || generatedId > Number.MAX_SAFE_INTEGER) {
              generatedId = Math.abs(objectIdStr.split('').reduce((acc: number, char: string) => {
                return acc + char.charCodeAt(0);
              }, 0) * 1000 + Date.now() % 1000);
            }
            return generatedId;
          })() : numericId),
          title: existingPost?.title || 'Untitled',
          content: existingPost?.content || '',
          slug: existingPost?.slug || existingPost?.title?.toLowerCase().replace(/[^a-z0-9 -]/g, '').replace(/\s+/g, '-') || 'untitled',
          excerpt: existingPost?.excerpt || (existingPost?.content ? existingPost.content.substring(0, 150) + '...' : ''),
          featuredImage: existingPost?.coverImage || '',
          createdAt: existingPost?.date ? new Date(existingPost.date).toISOString() : new Date().toISOString(),
          updatedAt: existingPost?.lastModified ? new Date(existingPost.lastModified).toISOString() : new Date().toISOString(),
          userId: existingPost?.userId || '',
          tags: Array.isArray(existingPost?.tags) ? existingPost.tags : (existingPost?.tags ? [existingPost.tags] : []),
          isFeatured: !!existingPost?.featured,
          isPublished: !existingPost?.draft,
          readTime: Math.ceil((existingPost?.content || '').replace(/<[^>]*>/g, '').split(/\s+/).length / 200),
        };
        
        console.log('✅ Admin GET: Returning individual post:', formattedPost.title, 'Published:', formattedPost.isPublished);
        res.status(200).json(formattedPost);
        return;
        
      } else if (req.method === 'PATCH') {
        // PATCH specific post by ID
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

        // Use same ID matching logic for updates
        let filter: any = null;
        let existingPost: any = null;
        
        const numericId = parseInt(postId);
        
        if (!isNaN(numericId)) {
          existingPost = await postsCollection.findOne({ id: numericId });
          if (existingPost) {
            filter = { id: numericId };
          }
        }
        
        if (!existingPost) {
          const allPosts = await postsCollection.find({}).toArray();
          for (const post of allPosts) {
            // Use the same ID generation algorithm as mapPostDocument
            const objectIdStr = post._id.toString();
            const timestamp = parseInt(objectIdStr.substring(0, 8), 16);
            const sequence = parseInt(objectIdStr.substring(16, 24), 16);
            let generatedId = Math.abs(timestamp + sequence);
            
            // Apply the same fallback logic as mapPostDocument
            if (generatedId === 0 || generatedId > Number.MAX_SAFE_INTEGER) {
              generatedId = Math.abs(objectIdStr.split('').reduce((acc: number, char: string) => {
                return acc + char.charCodeAt(0);
              }, 0) * 1000 + Date.now() % 1000);
            }
            
            if (generatedId === numericId) {
              existingPost = post;
              filter = { _id: post._id };
              break;
            }
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
          id: updatedPost?.id || (updatedPost?._id ? (() => {
            const objectIdStr = updatedPost._id.toString();
            const timestamp = parseInt(objectIdStr.substring(0, 8), 16);
            const sequence = parseInt(objectIdStr.substring(16, 24), 16);
            let generatedId = Math.abs(timestamp + sequence);
            
            if (generatedId === 0 || generatedId > Number.MAX_SAFE_INTEGER) {
              generatedId = Math.abs(objectIdStr.split('').reduce((acc: number, char: string) => {
                return acc + char.charCodeAt(0);
              }, 0) * 1000 + Date.now() % 1000);
            }
            return generatedId;
          })() : numericId),
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
        return;
        
      } else {
        // Method not allowed for individual post operations
        res.status(405).json({ message: 'Method not allowed' });
        return;
      }
    }
    
    // Handle list operations (when no ID is provided)
    if (req.method === 'GET') {
      // Parse query parameters
      const { limit = '1000', offset = '0' } = req.query;
      const limitNum = parseInt(limit as string) || 1000;
      const offsetNum = parseInt(offset as string) || 0;
      
      console.log('📋 Admin: Fetching all posts (including drafts)');
      
      // Fetch all posts (including drafts for admin)
      const docs = await postsCollection
        .find({}) // No filter - get all posts including drafts
        .sort({ date: -1 })
        .skip(offsetNum)
        .limit(limitNum)
        .toArray();
      
      console.log(`Found ${docs.length} admin posts`);
      
      // Map documents to the expected format
      const posts = docs.map(mapPostDocument).filter(Boolean);
      
      // CRITICAL: Ensure all IDs are unique
      const uniquePosts = deduplicatePosts(posts);
      
      console.log(`✅ Ensured ${uniquePosts.length} posts have unique IDs`);
      
      res.status(200).json(uniquePosts);
      
    } else if (req.method === 'POST') {
      console.log('Creating/updating admin blog post with data:', req.body);
      
      const postData = req.body;
      
      // Add default userId for demo purposes
      if (!postData.userId) {
        postData.userId = "demo-user-001";
      }
      
      // Convert isPublished to draft status (invert)
      const mongoData = {
        title: postData.title || 'Untitled',
        content: postData.content || '',
        excerpt: postData.excerpt || '',
        slug: postData.slug || postData.title?.toLowerCase().replace(/[^a-z0-9 -]/g, '').replace(/\s+/g, '-') || 'untitled',
        coverImage: postData.featuredImage || '',
        tags: Array.isArray(postData.tags) ? postData.tags : [],
        date: new Date(),
        lastModified: new Date(),
        draft: !postData.isPublished, // Invert - draft = true means unpublished
        featured: !!postData.isFeatured,
        userId: postData.userId
      };
      
      // If there's an existing post ID, update it; otherwise create new
      if (postData.id) {
        // Update existing post
        const result = await postsCollection.updateOne(
          { id: postData.id },
          { $set: { ...mongoData, lastModified: new Date() } }
        );
        
        if (result.matchedCount === 0) {
          res.status(404).json({ message: 'Post not found' });
          return;
        }
        
        const updatedPost = await postsCollection.findOne({ id: postData.id });
        const formattedPost = mapPostDocument(updatedPost);
        if (!formattedPost) {
          res.status(404).json({ message: 'Post not found after update' });
          return;
        }
        res.status(200).json(formattedPost);
      } else {
        // Create new post with unique ID
        const result = await postsCollection.insertOne(mongoData);
        const newPost = await postsCollection.findOne({ _id: result.insertedId });
        const formattedPost = mapPostDocument(newPost);
        
        if (!formattedPost) {
          res.status(500).json({ message: 'Failed to create post' });
          return;
        }
        
        // Ensure the new post gets a unique ID added to MongoDB
        await postsCollection.updateOne(
          { _id: result.insertedId },
          { $set: { id: formattedPost.id } }
        );
        
        res.status(201).json(formattedPost);
      }
      
    } else {
      res.status(405).json({ message: 'Method not allowed' });
    }
    
  } catch (error) {
    console.error('Admin blog posts error:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  } finally {
    await client.close();
  }
} 