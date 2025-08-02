import type { VercelRequest, VercelResponse } from '@vercel/node';
import { MongoClient } from 'mongodb';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { id } = req.query;
  
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ message: 'Invalid post ID' });
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    return res.status(500).json({ message: 'MongoDB URI not configured' });
  }

  try {
    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db('blog_database');
    const postsCollection = db.collection('posts');

    const postId = parseInt(id);
    if (isNaN(postId)) {
      await client.close();
      return res.status(400).json({ message: 'Invalid post ID format' });
    }

    // Get the post content
    const post = await postsCollection.findOne({ id: postId });
    if (!post) {
      await client.close();
      return res.status(404).json({ message: 'Post not found' });
    }

    // Simple AI tag generation based on content analysis
    // This is a basic implementation - you could integrate with actual AI services
    const content = post.content || '';
    const title = post.title || '';
    
    const suggestedTags = generateTagsFromContent(content + ' ' + title);
    
    await client.close();
    
    res.status(200).json({
      postId: postId,
      suggestedTags: suggestedTags,
      confidence: 0.85,
      analysis: {
        wordCount: content.split(' ').length,
        keyTerms: extractKeyTerms(content),
        category: inferCategory(content, title)
      }
    });

  } catch (error) {
    console.error('AI tagging error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

function generateTagsFromContent(text: string): string[] {
  const techKeywords = {
    'javascript': ['JavaScript', 'Development'],
    'react': ['React', 'Frontend', 'Development'],
    'agriculture': ['Agriculture', 'Farming'],
    'technology': ['Technology', 'Innovation'],
    'farming': ['Farming', 'Agriculture'],
    'ai': ['AI', 'Technology', 'Innovation'],
    'machine learning': ['AI', 'Machine Learning', 'Technology'],
    'sustainability': ['Sustainability', 'Environment'],
    'blog': ['Blog', 'Writing'],
    'career': ['Career', 'Professional'],
    'job': ['Career', 'Job', 'Professional']
  };

  const foundTags = new Set<string>();
  const lowerText = text.toLowerCase();

  for (const [keyword, tags] of Object.entries(techKeywords)) {
    if (lowerText.includes(keyword)) {
      tags.forEach(tag => foundTags.add(tag));
    }
  }

  return Array.from(foundTags).slice(0, 5); // Limit to 5 tags
}

function extractKeyTerms(text: string): string[] {
  // Simple keyword extraction
  const words = text.toLowerCase().split(/\W+/);
  const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by']);
  
  const wordCount = new Map<string, number>();
  words.forEach(word => {
    if (word.length > 3 && !stopWords.has(word)) {
      wordCount.set(word, (wordCount.get(word) || 0) + 1);
    }
  });

  return Array.from(wordCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word);
}

function inferCategory(content: string, title: string): string {
  const text = (content + ' ' + title).toLowerCase();
  
  if (text.includes('agriculture') || text.includes('farming') || text.includes('crop')) {
    return 'Agriculture';
  }
  if (text.includes('technology') || text.includes('tech') || text.includes('ai') || text.includes('javascript')) {
    return 'Technology';
  }
  if (text.includes('career') || text.includes('job') || text.includes('work')) {
    return 'Career';
  }
  if (text.includes('personal') || text.includes('life') || text.includes('reflection')) {
    return 'Personal';
  }
  
  return 'General';
} 