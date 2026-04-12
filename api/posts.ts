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
    
    const { slug, id, category, limit = '1000', offset = '0', featured, includeDrafts, postType, relatedTo } = req.query;
    const shouldIncludeDrafts = includeDrafts === 'true';
    
    // --- Related posts by ID ---
    if (relatedTo) {
      const targetId = parseInt(relatedTo as string);
      console.log('🔗 POSTS: Fetching related posts for ID:', targetId);
      
      const targetPost = await postsCollection.findOne({ id: targetId });
      if (!targetPost) {
        res.status(200).json([]);
        return;
      }
      
      const tags = targetPost.tags || [];
      if (tags.length === 0) {
        res.status(200).json([]);
        return;
      }

      const filter: any = {
        id: { $ne: targetId },
        tags: { $in: tags },
        draft: { $ne: true }
      };

      const docs = await postsCollection
        .find(filter)
        .limit(3)
        .toArray();

      const posts = docs.map(mapPostDocument).filter(Boolean);
      res.status(200).json(posts);
      return;
    }

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
      
      const andConditions: any[] = [
        {
          $or: [
            { isFeatured: true },
            { featured: true }
          ]
        }
      ];

      if (!shouldIncludeDrafts) {
        andConditions.push({
          $or: [
            { isPublished: true },
            { isPublished: { $exists: false }, draft: { $ne: true } }
          ]
        });
      }

      if (postType === 'blog') {
        andConditions.push({
          $or: [
            { postType: 'blog' },
            { postType: { $exists: false } }
          ]
        });
      } else if (postType) {
        andConditions.push({ postType });
      }
      
      const filter = { $and: andConditions };
      
      let docs = await postsCollection
        .find(filter)
        .sort({ date: -1 })
        .limit(limitNum)
        .toArray();
      
      // Strip heavy 'content' field for list views to optimize payload size
      const posts = docs.map(doc => {
        const mapped = mapPostDocument(doc);
        if (mapped) {
          const { content, ...rest } = mapped;
          return rest;
        }
        return null;
      }).filter(Boolean);
      
      const uniquePosts = deduplicatePosts(posts as any);
      
      res.status(200).json(uniquePosts);
      return;
    }
    
    // --- List all published posts ---
    const limitNum = parseInt(limit as string) || 50;
    const offsetNum = parseInt(offset as string) || 0;
    
    console.log('📄 POSTS: Fetching posts with params:', {
      category, limit: limitNum, offset: offsetNum, includeDrafts: shouldIncludeDrafts, postType
    });
    
    const andConditions: any[] = [];

    if (!shouldIncludeDrafts) {
      andConditions.push({
        $or: [
          { isPublished: true },
          { isPublished: { $exists: false }, draft: { $ne: true } }
        ]
      });
    }

    if (postType === 'blog') {
      andConditions.push({
        $or: [
          { postType: 'blog' },
          { postType: { $exists: false } }
        ]
      });
    } else if (postType) {
      andConditions.push({ postType });
    }
    
    if (category) {
      andConditions.push({ tags: category });
    }
    
    const filter = andConditions.length > 0 ? { $and: andConditions } : {};
    
    const docs = await postsCollection
      .find(filter)
      .sort({ date: -1 })
      .skip(offsetNum)
      .limit(limitNum)
      .toArray();
    
    console.log(`📄 POSTS: Found ${docs.length} published posts`);
    
    // Strip heavy 'content' field for list views to optimize payload size
    const posts = docs.map(doc => {
      const mapped = mapPostDocument(doc);
      if (mapped) {
        const { content, ...rest } = mapped;
        return rest;
      }
      return null;
    }).filter(Boolean);
    
    const uniquePosts = deduplicatePosts(posts as any);
    
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
