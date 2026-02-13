/**
 * Unified Blog Posts API Handler
 * 
 * Consolidates 3 serverless functions into 1:
 *   - GET /api/posts                    → List all published posts
 *   - GET /api/posts?featured=true      → Featured posts
 *   - GET /api/posts?slug=xxx           → Single post by slug
 *   - GET /api/posts?id=123             → Single post by ID
 * 
 * Old routes are remapped via vercel.json rewrites:
 *   /api/blog-posts         → /api/posts
 *   /api/blog-posts/featured → /api/posts?featured=true
 *   /api/blog-post?slug=xxx → /api/posts?slug=xxx
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { MongoClient } from 'mongodb';
import { mapPostDocument, deduplicatePosts, getMongoConfig } from './_shared/post-helpers.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  if (req.method !== 'GET') {
    res.status(405).json({ message: 'Method not allowed' });
    return;
  }
  
  const { uri, dbName } = getMongoConfig();
  const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 5000,
  });
  
  try {
    console.log('[API] Connecting to MongoDB...');
    await client.connect();
    console.log('[API] Connected successfully');
    const db = client.db(dbName);
    const postsCollection = db.collection('posts');
    
    const { slug, id, category, limit = '1000', offset = '0', featured, includeDrafts } = req.query;
    const shouldIncludeDrafts = includeDrafts === 'true';
    
    // --- Single post by slug or ID ---
    if (slug || id) {
      const identifier = (slug || id) as string;
      
      if (Array.isArray(slug) || Array.isArray(id)) {
        res.status(400).json({ message: 'Invalid parameters' });
        return;
      }
      
      let post: any = null;
      
      const singlePostFilter: any = { slug: identifier };
      if (!shouldIncludeDrafts) {
        singlePostFilter.draft = { $ne: true };
      }

      if (id || /^\d+$/.test(identifier)) {
        // Numeric ID lookup
        const postId = parseInt(identifier);
        console.log(`📖 POSTS: Looking for post with ID: ${postId} (IncludeDrafts: ${shouldIncludeDrafts})`);
        
        const idFilter: any = { id: postId };
        if (!shouldIncludeDrafts) {
          idFilter.draft = { $ne: true };
        }

        // Strategy 1: Explicit ID field
        post = await postsCollection.findOne(idFilter);
        
        // Strategy 2: Generated ID from ObjectId
        if (!post) {
          const searchFilter = shouldIncludeDrafts ? {} : { draft: { $ne: true } };
          const allPosts = await postsCollection.find(searchFilter).toArray();
          
          for (const doc of allPosts) {
            const objectIdStr = doc._id.toString();
            const timestamp = parseInt(objectIdStr.substring(0, 8), 16);
            const sequence = parseInt(objectIdStr.substring(16, 24), 16);
            const generatedId = Math.abs(timestamp + sequence);
            
            if (generatedId === postId) {
              post = doc;
              break;
            }
          }
        }
      } else {
        // Slug lookup
        console.log(`📖 POSTS: Looking for post with slug: ${identifier} (IncludeDrafts: ${shouldIncludeDrafts})`);
        post = await postsCollection.findOne(singlePostFilter);
      }
      
      if (!post) {
        res.status(404).json({ message: 'Blog post not found' });
        return;
      }
      
      const formattedPost = mapPostDocument(post);
      if (!formattedPost) {
        res.status(500).json({ message: 'Failed to format post' });
        return;
      }
      
      res.status(200).json(formattedPost);
      return;
    }
    
    // --- Featured posts ---
    if (featured === 'true') {
      const limitNum = parseInt(limit as string) || 3;
      console.log('⭐ POSTS: Fetching featured posts with limit:', limitNum, '(IncludeDrafts:', shouldIncludeDrafts, ')');
      
      const filter: any = { featured: true };
      if (!shouldIncludeDrafts) {
        filter.$or = [
          { isPublished: true },
          { isPublished: { $exists: false }, draft: { $ne: true } }
        ];
      }
      
      let docs = await postsCollection
        .find(filter)
        .sort({ date: -1 })
        .limit(limitNum)
        .toArray();
      
      // Fallback to latest posts if no featured posts found
      if (docs.length === 0) {
        console.log('⭐ POSTS: No featured posts, falling back to latest');
        const fallbackFilter = shouldIncludeDrafts ? {} : { draft: { $ne: true } };
        docs = await postsCollection
          .find(fallbackFilter)
          .sort({ date: -1 })
          .limit(limitNum)
          .toArray();
      }
      
      const posts = docs.map(mapPostDocument).filter(Boolean);
      const uniquePosts = deduplicatePosts(posts);
      
      res.status(200).json(uniquePosts);
      return;
    }
    
    // --- List all published posts ---
    const limitNum = parseInt(limit as string) || 50;
    const offsetNum = parseInt(offset as string) || 0;
    
    console.log('📄 POSTS: Fetching posts with params:', {
      category, limit: limitNum, offset: offsetNum, includeDrafts: shouldIncludeDrafts
    });
    
    const filter: any = {};
    if (!shouldIncludeDrafts) {
      filter.$or = [
        { isPublished: true },
        { isPublished: { $exists: false }, draft: { $ne: true } }
      ];
    }
    
    if (category) {
      filter.tags = category;
    }
    
    const docs = await postsCollection
      .find(filter)
      .sort({ date: -1 })
      .skip(offsetNum)
      .limit(limitNum)
      .toArray();
    
    console.log(`📄 POSTS: Found ${docs.length} published posts`);
    
    const posts = docs.map(mapPostDocument).filter(Boolean);
    const uniquePosts = deduplicatePosts(posts);
    
    res.status(200).json(uniquePosts);
    
  } catch (error) {
    console.error('📄 POSTS: Error fetching posts:', error);
    const err = error as any;
    
    res.status(500).json({ 
      message: 'Failed to fetch blog posts',
      error: err.message || 'Unknown error',
      code: err.code,
      name: err.name,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  } finally {
    await client.close();
  }
}
