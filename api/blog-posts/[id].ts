import type { Request, Response } from 'express';
import { MongoClient, ObjectId } from 'mongodb';

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
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  if (req.method !== 'GET') {
    res.status(405).json({ message: 'Method not allowed' });
    return;
  }
  
  const { id } = req.query;
  
  if (!id || Array.isArray(id)) {
    res.status(400).json({ message: 'Invalid post ID' });
    return;
  }
  
  const postId = id as string;
  
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB for individual post fetch');
    
    const db = client.db('blog_database');
    const postsCollection = db.collection('posts');
    
    // Try multiple lookup strategies to find the post
    let post: any = null;
    
    const numericId = parseInt(postId);
    
    // Strategy 1: Try to find by numeric ID field
    if (!isNaN(numericId)) {
      post = await postsCollection.findOne({ id: numericId });
    }
    
    // Strategy 2: If not found, try by generated ID from ObjectId
    if (!post) {
      const allPosts = await postsCollection.find({}).toArray();
      for (const dbPost of allPosts) {
        const generatedId = dbPost._id ? parseInt(dbPost._id.toString().substring(0, 8), 16) : 0;
        if (generatedId === numericId) {
          post = dbPost;
          break;
        }
      }
    }
    
    // Strategy 3: Try ObjectId if it looks like one
    if (!post && postId.length === 24) {
      try {
        post = await postsCollection.findOne({ _id: new ObjectId(postId) });
      } catch {
        // Ignore ObjectId conversion errors
      }
    }
    
    // Strategy 4: Try by slug
    if (!post) {
      post = await postsCollection.findOne({ slug: postId });
    }
    
    // Strategy 5: Try by title match
    if (!post) {
      post = await postsCollection.findOne({ 
        title: { $regex: new RegExp(postId.replace(/[-_]/g, ' '), 'i') }
      });
    }
    
    if (!post) {
      console.log('Post not found with ID:', postId, 'Tried numeric:', numericId);
      res.status(404).json({ message: 'Post not found' });
      return;
    }
    
    const formattedPost = mapPostDocument(post);
    if (!formattedPost) {
      res.status(404).json({ message: 'Post not found' });
      return;
    }
    console.log('Found post:', formattedPost.title);
    res.status(200).json(formattedPost);
    
  } catch (error) {
    console.error('Error fetching post:', error);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    await client.close();
  }
} 