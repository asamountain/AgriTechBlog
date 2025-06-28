import type { Request, Response } from 'express';
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

export default async function handler(req: Request, res: Response) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  if (!uri) {
    res.status(500).json({ message: 'MONGODB_URI environment variable is not set' });
    return;
  }
  
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB for admin posts');
    
    const db = client.db('blog_database');
    const postsCollection = db.collection('posts');
    
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
        res.status(200).json(formattedPost);
      } else {
        // Create new post with unique ID
        const result = await postsCollection.insertOne(mongoData);
        const newPost = await postsCollection.findOne({ _id: result.insertedId });
        const formattedPost = mapPostDocument(newPost);
        
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