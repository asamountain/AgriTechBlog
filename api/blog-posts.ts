import type { VercelRequest, VercelResponse } from '@vercel/node';
import { MongoClient } from 'mongodb';

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
    console.log('📄 PUBLIC: Connected to MongoDB for blog posts');
    
    const db = client.db('blog_database');
    const postsCollection = db.collection('posts');
    
    // Parse query parameters
    const { 
      category, 
      limit = '50', 
      offset = '0', 
      featured 
    } = req.query;
    
    const limitNum = parseInt(limit as string) || 50;
    const offsetNum = parseInt(offset as string) || 0;
    
    console.log('📄 PUBLIC: Fetching blog posts with params:', {
      category,
      limit: limitNum,
      offset: offsetNum,
      featured
    });
    
    // Build filter - only published posts for public API
    const filter: any = { draft: { $ne: true } }; // Only published posts
    
    if (category) {
      filter.tags = category;
    }
    
    if (featured === 'true') {
      filter.featured = true;
    }
    
    // Fetch posts
    const docs = await postsCollection
      .find(filter)
      .sort({ date: -1 })
      .skip(offsetNum)
      .limit(limitNum)
      .toArray();
    
    console.log(`📄 PUBLIC: Found ${docs.length} published posts`);
    
    // Map documents to the expected format
    const posts = docs.map(mapPostDocument).filter(Boolean);
    
    // Ensure unique IDs
    const seenIds = new Set<number>();
    const uniquePosts = posts.filter(post => post !== null).map(post => {
      let uniqueId = post!.id;
      let counter = 1;
      
      while (seenIds.has(uniqueId)) {
        uniqueId = post!.id + counter;
        counter++;
      }
      
      seenIds.add(uniqueId);
      return { ...post!, id: uniqueId };
    });
    
    console.log(`📄 PUBLIC: Returning ${uniquePosts.length} posts`);
    res.status(200).json(uniquePosts);
    
  } catch (error) {
    console.error('📄 PUBLIC: Error fetching blog posts:', error);
    res.status(500).json({ 
      message: 'Failed to fetch blog posts',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  } finally {
    await client.close();
  }
} 