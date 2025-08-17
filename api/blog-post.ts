import type { VercelRequest, VercelResponse } from '@vercel/node';
import { MongoClient, ObjectId } from 'mongodb';

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error('MONGODB_URI environment variable is not set');
}

// Comprehensive HTML tag removal with entity decoding
function stripHtmlTags(content: string): string {
  if (!content || typeof content !== 'string') {
    return '';
  }

  let text = content;
  
  // Remove script and style elements completely
  text = text.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  
  // Remove all HTML tags but preserve spacing
  text = text.replace(/<[^>]*>/g, ' ');
  
  // Decode HTML entities
  text = text.replace(/&nbsp;/g, ' ');
  text = text.replace(/&amp;/g, '&');
  text = text.replace(/&lt;/g, '<');
  text = text.replace(/&gt;/g, '>');
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&#39;/g, "'");
  text = text.replace(/&apos;/g, "'");
  
  // Remove other HTML entities
  text = text.replace(/&[#\w]+;/g, '');
  
  return text;
}

// Enhanced markdown to text conversion with HTML handling
function markdownToText(markdownContent: string): string {
  if (!markdownContent || typeof markdownContent !== 'string') {
    return '';
  }

  let text = markdownContent;
  
  // First, strip any HTML tags that might be mixed in
  text = stripHtmlTags(text);
  
  // Remove markdown headers (# ## ### etc.)
  text = text.replace(/^#{1,6}\s+/gm, '');
  
  // Remove bold and italic formatting
  text = text.replace(/\*\*\*([^*]+)\*\*\*/g, '$1'); // bold italic
  text = text.replace(/\*\*([^*]+)\*\*/g, '$1'); // bold
  text = text.replace(/\*([^*]+)\*/g, '$1'); // italic
  text = text.replace(/___([^_]+)___/g, '$1'); // bold italic underscore
  text = text.replace(/__([^_]+)__/g, '$1'); // bold underscore
  text = text.replace(/_([^_]+)_/g, '$1'); // italic underscore
  
  // Remove strikethrough
  text = text.replace(/~~([^~]+)~~/g, '$1');
  
  // Remove links but keep text [text](url) -> text
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  
  // Remove inline code
  text = text.replace(/`([^`]+)`/g, '$1');
  
  // Remove code blocks
  text = text.replace(/```[\s\S]*?```/g, '');
  text = text.replace(/~~~[\s\S]*?~~~/g, '');
  
  // Remove blockquotes
  text = text.replace(/^>\s+/gm, '');
  
  // Remove horizontal rules
  text = text.replace(/^[-*_]{3,}\s*$/gm, '');
  
  // Remove list markers
  text = text.replace(/^[-*+]\s+/gm, '');
  text = text.replace(/^\d+\.\s+/gm, '');
  
  // Remove table formatting
  text = text.replace(/\|/g, ' ');
  text = text.replace(/^[-:|\s]+$/gm, '');
  
  // Remove excessive whitespace and normalize line breaks
  text = text.replace(/\n\s*\n/g, '\n\n');
  text = text.replace(/\n{3,}/g, '\n\n');
  text = text.replace(/[ \t]+/g, ' ');
  
  // Clean up and trim
  return text.trim();
}

function generateCleanExcerpt(content: string, maxLength: number = 150): string {
  if (!content || typeof content !== 'string') {
    return '';
  }
  
  // Convert to plain text (handles both HTML and markdown)
  let plainText = markdownToText(content);
  
  // Additional cleanup for any remaining artifacts
  plainText = plainText
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s.,!?;:()\-'"]/g, '')
    .trim();
  
  // Truncate to desired length
  if (plainText.length <= maxLength) {
    return plainText;
  }
  
  // Find the last space before the limit to avoid cutting words
  const truncated = plainText.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  
  if (lastSpace > maxLength * 0.8) { // Only use last space if it's not too far back
    return truncated.substring(0, lastSpace) + '...';
  }
  
  return truncated + '...';
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
      numericId = Math.abs(objectIdStr.split('').reduce((acc: number, char: string) => {
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
    excerpt: doc.excerpt || generateCleanExcerpt(doc.content || '', 150),
    featuredImage: doc.coverImage || '',
    createdAt: doc.date ? new Date(doc.date).toISOString() : new Date().toISOString(),
    updatedAt: doc.lastModified ? new Date(doc.lastModified).toISOString() : new Date().toISOString(),
    userId: doc.userId || '',
    tags: Array.isArray(doc.tags) ? doc.tags : (doc.tags ? [doc.tags] : []),
    isFeatured: !!doc.featured,
    isPublished: !doc.draft, // Note: draft = true means unpublished
    readTime: Math.ceil((doc.content || '').replace(/<[^>]*>/g, '').split(/\s+/).length / 200),
    // Author information removed
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
  
  const { slug, id } = req.query;
  
  if (!slug && !id) {
    res.status(400).json({ message: 'Either slug or id parameter is required' });
    return;
  }
  
  if (Array.isArray(slug) || Array.isArray(id)) {
    res.status(400).json({ message: 'Invalid parameters' });
    return;
  }
  
  const identifier = (slug || id) as string;
  
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
    console.log(`📖 SINGLE POST: Connected to MongoDB for post: ${identifier}`);
    
    const db = client.db('blog_database');
    const postsCollection = db.collection('posts');
    
    let post: any = null;
    
    // Check if identifier is numeric (ID) or string (slug)
    if (/^\d+$/.test(identifier)) {
      // It's a numeric ID
      const postId = parseInt(identifier);
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
      console.log(`📖 SINGLE POST: Looking for post with slug: ${identifier}`);
      post = await postsCollection.findOne({ 
        slug: identifier,
        draft: { $ne: true } // Only published posts
      });
    }
    
    if (!post) {
      console.log(`📖 SINGLE POST: Post not found for identifier: ${identifier}`);
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
    console.error(`📖 SINGLE POST: Error fetching post ${identifier}:`, error);
    res.status(500).json({ 
      message: 'Failed to fetch blog post',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  } finally {
    await client.close();
  }
} 