import type { Request, Response } from 'express';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI || "mongodb+srv://blog-admin-new:wrbnidP8UoFl4RCO@cluster0.br3z5.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

interface BlogPost {
  _id: any;
  title: string;
  content: string;
  excerpt?: string;
  tags?: string[];
  date: Date;
  lastModified: Date;
  draft?: boolean;
  featured?: boolean;
  coverImage?: string;
  userId?: string;
}

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
    createdAt: doc.date ? new Date(doc.date) : new Date(),
    updatedAt: doc.lastModified ? new Date(doc.lastModified) : new Date(),
    userId: doc.userId || '',
    tags: Array.isArray(doc.tags) ? doc.tags : (doc.tags ? [doc.tags] : []),
    isFeatured: !!doc.featured,
    isPublished: !doc.draft,
    readTime: Math.ceil((doc.content || '').replace(/<[^>]*>/g, '').split(/\s+/).length / 200),
    authorId: 1,
    author: {
      id: 1,
      name: 'San',
      email: 'san@example.com',
      bio: 'Sustainable Abundance Seeker',
      avatar: null,
      userId: doc.userId || '',
      linkedinUrl: null,
      instagramUrl: null,
      youtubeUrl: null,
      githubUrl: null,
      portfolioUrl: null
    }
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
  
  if (req.method !== 'GET') {
    res.status(405).json({ message: 'Method not allowed' });
    return;
  }
  
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('blog_database');
    const postsCollection = db.collection('posts');
    
    // Parse query parameters
    const { limit = '50', offset = '0', featured } = req.query;
    const limitNum = parseInt(limit as string) || 50;
    const offsetNum = parseInt(offset as string) || 0;
    
    // Build query
    let query: any = { draft: { $ne: true } }; // Only published posts
    
    if (featured === 'true') {
      query.featured = true;
    }
    
    console.log('Query:', query);
    
    // Fetch posts
    const docs = await postsCollection
      .find(query)
      .sort({ date: -1 })
      .skip(offsetNum)
      .limit(limitNum)
      .toArray();
    
    console.log(`Found ${docs.length} posts`);
    
    // Map documents to the expected format
    const posts = docs.map(mapPostDocument).filter(Boolean);
    
    res.status(200).json(posts);
    
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch blog posts',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  } finally {
    await client.close();
  }
} 