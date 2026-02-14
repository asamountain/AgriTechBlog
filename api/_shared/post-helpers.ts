/**
 * Shared helper functions for Vercel API routes
 * Eliminates code duplication across serverless functions
 */

// Comprehensive HTML tag removal with entity decoding
export function stripHtmlTags(content: string): string {
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
export function markdownToText(markdownContent: string): string {
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

export function generateCleanExcerpt(content: string, maxLength: number = 150): string {
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
  
  if (lastSpace > maxLength * 0.8) {
    return truncated.substring(0, lastSpace) + '...';
  }
  
  return truncated + '...';
}

export function mapPostDocument(doc: any) {
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
    featuredImage: doc.featuredImage || doc.coverImage || '',
    createdAt: (doc.createdAt || doc.date) ? new Date(doc.createdAt || doc.date).toISOString() : new Date().toISOString(),
    updatedAt: (doc.updatedAt || doc.lastModified) ? new Date(doc.updatedAt || doc.lastModified).toISOString() : new Date().toISOString(),
    userId: doc.userId || '',
    tags: Array.isArray(doc.tags) ? doc.tags : (doc.tags ? [doc.tags] : []),
    isFeatured: doc.isFeatured !== undefined ? !!doc.isFeatured : !!doc.featured,
    isPublished: doc.isPublished !== undefined ? !!doc.isPublished : !doc.draft,
    readTime: Math.ceil((doc.content || '').replace(/<[^>]*>/g, '').split(/\s+/).length / 200),
  };
}

/** Deduplicates posts by ID, appending counter to resolve collisions */
export function deduplicatePosts(posts: ReturnType<typeof mapPostDocument>[]) {
  const seenIds = new Set<number>();
  return posts.filter(post => post !== null).map(post => {
    let uniqueId = post!.id;
    let counter = 1;
    
    while (seenIds.has(uniqueId)) {
      uniqueId = post!.id + counter;
      counter++;
    }
    
    seenIds.add(uniqueId);
    return { ...post!, id: uniqueId };
  });
}

/** Get MongoDB connection config */
export function getMongoConfig() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DATABASE || 'blog_database';
  
  console.log('[CONFIG] MongoDB Database:', dbName);
  if (!uri) {
    console.error('[CONFIG] MONGODB_URI is missing!');
    throw new Error('MONGODB_URI environment variable is not set');
  }
  
  // Log a masked version of the URI for debugging
  const maskedUri = uri.replace(/:\/\/([^:]+):([^@]+)@/, '://[USER]:[PASS]@');
  console.log('[CONFIG] MongoDB URI:', maskedUri);
  
  return { uri, dbName };
}
