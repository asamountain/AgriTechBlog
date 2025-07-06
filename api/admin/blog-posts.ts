import type { VercelRequest, VercelResponse } from '@vercel/node';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error('MONGODB_URI environment variable is not set');
}

function mapPostDocument(doc: any) {
  if (!doc) return null;
  
  // IMPROVED: Generate a truly unique numeric ID from ObjectId
  // Use the full ObjectId string to create a more unique numeric ID
  let numericId: number;
  
  if (doc.id) {
    // If explicit ID field exists, use it
    numericId = doc.id;
  } else if (doc._id) {
    // Generate unique ID from full ObjectId using better method
    const objectIdStr = doc._id.toString();
    
    // Method 1: Use entire ObjectId converted to number (with modulo to keep reasonable size)
    const fullHex = objectIdStr;
    const timestamp = parseInt(fullHex.substring(0, 8), 16);
    const sequence = parseInt(fullHex.substring(16, 24), 16);
    
    // Combine timestamp and sequence for better uniqueness
    numericId = Math.abs(timestamp + sequence);
    
    // If still 0 or too large, use fallback
    if (numericId === 0 || numericId > Number.MAX_SAFE_INTEGER) {
      numericId = Math.abs(objectIdStr.split('').reduce((acc, char) => {
        return acc + char.charCodeAt(0);
      }, 0) * 1000 + Date.now() % 1000);
    }
  } else {
    // Ultimate fallback
    numericId = Date.now() + Math.random() * 1000;
  }
  
  return {
    id: numericId,
    title: doc.title || 'Untitled',
    content: doc.content || '',
    slug: doc.slug || doc.title?.toLowerCase().replace(/[^a-z0-9 -]/g, '').replace(/\s+/g, '-') || 'untitled',
    excerpt: doc.excerpt || (doc.content ? doc.content.substring(0, 150) + '...' : ''),
    featuredImage: doc.coverImage || '',
    createdAt: doc.date ? new Date(doc.date).toISOString() : new Date().toISOString(),
    updatedAt: doc.lastModified ? new Date(doc.lastModified).toISOString() : new Date().toISOString(),
    userId: doc.userId || '',
    tags: Array.isArray(doc.tags) ? doc.tags : (doc.tags ? [doc.tags] : []),
    isFeatured: !!doc.featured,
    isPublished: !doc.draft, // Note: draft = true means unpublished
    readTime: Math.ceil((doc.content || '').replace(/<[^>]*>/g, '').split(/\s+/).length / 200),
  };
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
  
  // Debug logging
  console.log('API called:', req.method, req.url);
  console.log('Query params:', req.query);
  console.log('Environment check:', {
    hasMongoUri: !!process.env.MONGODB_URI,
    mongoDb: process.env.MONGODB_DATABASE
  });
  
  if (!uri) {
    console.error('MONGODB_URI missing');
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
    
    if (id && !Array.isArray(id)) {
      // Handle individual post request by ID
      const postId = id as string;
      console.log('📖 Admin: Fetching individual post with ID:', postId);
      
      if (req.method === 'GET') {
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
            const generatedId = parseInt(post._id.toString().substring(0, 8), 16);
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
          id: existingPost?.id || (existingPost?._id ? parseInt(existingPost._id.toString().substring(0, 8), 16) : numericId),
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
        
        // Find and update the post using the same ID matching logic
        let filter: any = null;
        let existingPost: any = null;
        
        const numericId = parseInt(postId);
        
        // Strategy 1: Try to find by explicit ID field first
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
          
          const allPosts = await postsCollection.find({}).toArray();
          
          for (const post of allPosts) {
            const generatedId = parseInt(post._id.toString().substring(0, 8), 16);
            if (generatedId === numericId) {
              existingPost = post;
              filter = { _id: post._id };
              console.log('✅ Admin PATCH: Found post by generated ID from ObjectId');
              
              // Add explicit ID field
              await postsCollection.updateOne(
                { _id: post._id },
                { $set: { id: generatedId } }
              );
              console.log('🔧 Admin PATCH: Added explicit ID field for future lookups');
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
        return;
        
      } else if (req.method === 'DELETE') {
        // DELETE specific post by ID
        let filter: any = null;
        let existingPost: any = null;
        
        const numericId = parseInt(postId);
        
        // Use same ID matching logic for delete
        if (!isNaN(numericId)) {
          existingPost = await postsCollection.findOne({ id: numericId });
          if (existingPost) {
            filter = { id: numericId };
          }
        }
        
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
        return;
      }
    }
    
    // If no ID provided, handle as list request (existing functionality)
    if (req.method === 'GET') {
      // Parse query parameters
      const { limit = '50', offset = '0' } = req.query;
      const limitNum = parseInt(limit as string) || 50;
      const offsetNum = parseInt(offset as string) || 0;
      
      console.log('Fetching admin posts (including drafts)');
      
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
      
      // CRITICAL: Ensure all IDs are unique by checking for duplicates
      const seenIds = new Set<number>();
      const uniquePosts = posts.filter(post => post !== null).map(post => {
        let uniqueId = post!.id;
        let counter = 1;
        
        // If duplicate ID found, create a new unique one
        while (seenIds.has(uniqueId)) {
          uniqueId = post!.id + counter;
          counter++;
          console.log(`🔧 Fixed duplicate ID: ${post!.id} -> ${uniqueId} for post "${post!.title}"`);
        }
        
        seenIds.add(uniqueId);
        return { ...post!, id: uniqueId };
      });
      
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