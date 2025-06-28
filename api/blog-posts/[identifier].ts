import type { Request, Response } from 'express';
import { MongoClient, ObjectId } from 'mongodb';

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error('MONGODB_URI environment variable is not set');
}

function mapPostDocument(doc: any) {
  if (!doc) return null;
  
  // Generate a unique numeric ID from ObjectId
  let numericId: number;
  
  if (doc.id) {
    numericId = doc.id;
  } else if (doc._id) {
    const objectIdStr = doc._id.toString();
    const timestamp = parseInt(objectIdStr.substring(0, 8), 16);
    const sequence = parseInt(objectIdStr.substring(16, 24), 16);
    numericId = Math.abs(timestamp + sequence);
    
    if (numericId === 0 || numericId > Number.MAX_SAFE_INTEGER) {
      numericId = Math.abs(objectIdStr.split('').reduce((acc, char) => {
        return acc + char.charCodeAt(0);
      }, 0) * 1000 + Date.now() % 1000);
    }
  } else {
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
    author: {
      id: doc.userId || 'demo-user-001',
      name: 'Admin Author', // TODO: Get from user profile
      avatar: '/placeholder-avatar.jpg'
    }
  };
}

export default async function handler(req: Request, res: Response) {
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
  
  const { identifier } = req.query;
  
  if (!identifier || Array.isArray(identifier)) {
    res.status(400).json({ message: 'Invalid post identifier' });
    return;
  }
  
  const identifierStr = identifier as string;
  
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
    console.log(`📖 SINGLE POST: Connected to MongoDB for post: ${identifierStr}`);
    
    const db = client.db('blog_database');
    const postsCollection = db.collection('posts');
    
    let post: any = null;
    
    // Check if identifier is numeric (ID) or string (slug)
    if (/^\d+$/.test(identifierStr)) {
      // It's a numeric ID
      const postId = parseInt(identifierStr);
      console.log(`📖 SINGLE POST: Looking for post with ID: ${postId}`);
      
      // Try multiple strategies to find by ID
      // Strategy 1: Try explicit ID field
      post = await postsCollection.findOne({ 
        id: postId,
        draft: { $ne: true } // Only published posts
      });
      
      // Strategy 2: Try generated ID from ObjectId
      if (!post) {
        const allPosts = await postsCollection.find({ 
          draft: { $ne: true } 
        }).toArray();
        
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
      // It's a slug
      console.log(`📖 SINGLE POST: Looking for post with slug: ${identifierStr}`);
      post = await postsCollection.findOne({ 
        slug: identifierStr,
        draft: { $ne: true } // Only published posts
      });
    }
    
    if (!post) {
      console.log(`📖 SINGLE POST: Post not found for identifier: ${identifierStr}`);
      res.status(404).json({ message: 'Blog post not found' });
      return;
    }
    
    console.log(`📖 SINGLE POST: Found post: ${post.title}`);
    
    const formattedPost = mapPostDocument(post);
    
    if (!formattedPost) {
      res.status(500).json({ message: 'Failed to format post' });
      return;
    }
    
    res.status(200).json(formattedPost);
    
  } catch (error) {
    console.error(`📖 SINGLE POST: Error fetching post ${identifierStr}:`, error);
    res.status(500).json({ 
      message: 'Failed to fetch blog post',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  } finally {
    await client.close();
  }
} 