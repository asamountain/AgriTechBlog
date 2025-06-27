import type { Request, Response } from 'express';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI || "mongodb+srv://blog-admin-new:wrbnidP8UoFl4RCO@cluster0.br3z5.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

function mapPostDocument(doc: any) {
  if (!doc) return null;
  
  // Generate a numeric ID from ObjectId for compatibility
  const numericId = doc._id ? parseInt(doc._id.toString().substring(0, 8), 16) : Date.now();
  
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
      
      res.status(200).json(posts);
      
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
        // Create new post
        const result = await postsCollection.insertOne(mongoData);
        const newPost = await postsCollection.findOne({ _id: result.insertedId });
        const formattedPost = mapPostDocument(newPost);
        res.status(201).json(formattedPost);
      }
      
    } else {
      res.status(405).json({ message: 'Method not allowed' });
    }
    
  } catch (error) {
    console.error('Admin API Error:', error);
    res.status(500).json({ 
      message: 'Failed to process request',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  } finally {
    await client.close();
  }
} 