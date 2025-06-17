import type { BlogPostWithDetails } from "@shared/schema";

// Content-based categorization keywords and patterns
const categoryPatterns = {
  'Technology & Engineering': [
    'iot', 'engineering', 'prototype', 'data collection', 'technology', 'ai', 'artificial intelligence', 
    'machine learning', 'programming', 'software', 'development', 'technical', 'innovation',
    'automation', 'digital', 'sensor', 'monitoring', 'analytics', 'tech', 'computer science'
  ],
  'Career & Professional': [
    'job', 'career', 'developer', 'engineer', 'professional', 'work', 'employment',
    'hiring', 'interview', 'resume', 'linkedin', 'networking', 'skills', 'experience',
    'promotion', 'salary', 'workplace', 'industry', 'business'
  ],
  'Life & Philosophy': [
    'life', 'philosophy', 'meaning', 'purpose', 'excellence', 'achievement', 'goals',
    'values', 'reflection', 'personal', 'growth', 'mindset', 'wisdom', 'thinking',
    'perspective', 'journey', 'self-improvement', 'motivation', 'inspiration'
  ],
  'Education & Learning': [
    'education', 'learning', 'study', 'university', 'mit', 'caltech', 'postech',
    'student', 'academic', 'research', 'knowledge', 'skill', 'course', 'degree',
    'scholarship', 'curriculum', 'teaching', 'mentor'
  ],
  'Relationships & Personal': [
    'love', 'relationship', 'partnership', 'conflict', 'stability', 'personal',
    'emotion', 'communication', 'family', 'friendship', 'social', 'connection',
    'trust', 'commitment', 'understanding', 'support'
  ],
  'Reviews & Comparisons': [
    'comparison', 'review', 'analysis', 'evaluation', 'assessment', 'testing',
    'versus', 'compare', 'perplexity', 'gemini', 'chatgpt', 'grok', 'service',
    'tool', 'platform', 'feature', 'performance'
  ],
  'Challenges & Problem Solving': [
    'challenge', 'problem', 'solution', 'difficulty', 'obstacle', 'overcome',
    'struggle', 'setback', 'resilience', 'persistence', 'determination',
    'breakthrough', 'issue', 'complexity'
  ],
  'Agricultural Technology': [
    'agriculture', 'farming', 'crop', 'harvest', 'agritech', 'precision agriculture',
    'smart farming', 'sustainable farming', 'agricultural', 'rural', 'farm'
  ]
};

// Calculate category relevance score
function calculateCategoryScore(content: string, keywords: string[]): number {
  const text = content.toLowerCase();
  let score = 0;
  
  keywords.forEach(keyword => {
    const regex = new RegExp(`\\b${keyword.toLowerCase()}\\b`, 'g');
    const matches = text.match(regex);
    if (matches) {
      score += matches.length;
    }
  });
  
  return score;
}

// Analyze content and suggest the best category
export function analyzeContentCategory(post: BlogPostWithDetails): string {
  const fullContent = `${post.title} ${post.excerpt} ${post.content}`;
  const scores: { [key: string]: number } = {};
  
  // Calculate scores for each category
  Object.entries(categoryPatterns).forEach(([category, keywords]) => {
    scores[category] = calculateCategoryScore(fullContent, keywords);
  });
  
  // Find the category with the highest score
  const bestCategory = Object.entries(scores).reduce((a, b) => 
    scores[a[0]] > scores[b[0]] ? a : b
  )[0];
  
  // If no clear category found, default to Agricultural Technology
  return scores[bestCategory] > 0 ? bestCategory : 'Agricultural Technology';
}

// Generate category description based on content analysis
export function generateCategoryDescription(categoryName: string): string {
  const descriptions: { [key: string]: string } = {
    'Technology & Engineering': 'Innovations in technology, engineering solutions, and technical development',
    'Career & Professional': 'Professional development, career guidance, and workplace insights',
    'Life & Philosophy': 'Personal reflections on life, philosophy, and meaningful living',
    'Education & Learning': 'Educational experiences, learning insights, and academic journey',
    'Relationships & Personal': 'Personal relationships, emotional insights, and social connections',
    'Reviews & Comparisons': 'Product reviews, service comparisons, and analytical evaluations',
    'Challenges & Problem Solving': 'Overcoming obstacles, problem-solving strategies, and resilience',
    'Agricultural Technology': 'Advanced technological solutions for modern farming including sensors, drones, AI, and digital farming innovations.'
  };
  
  return descriptions[categoryName] || 'General insights and perspectives';
}

export function getCategoryColor(categoryName: string): string {
  const colors: { [key: string]: string } = {
    'Technology & Engineering': '#2D5016', // Forest green
    'Career & Professional': '#1E40AF', // Blue
    'Life & Philosophy': '#7C2D12', // Brown
    'Education & Learning': '#065F46', // Emerald
    'Relationships & Personal': '#BE185D', // Pink
    'Reviews & Comparisons': '#7C3AED', // Violet
    'Challenges & Problem Solving': '#DC2626', // Red
    'Agricultural Technology': '#059669' // Green
  };
  
  return colors[categoryName] || '#6B7280'; // Gray fallback
}

// Analyze all posts and generate category statistics
export function analyzeCategoryDistribution(posts: BlogPostWithDetails[]): { [key: string]: number } {
  const distribution: { [key: string]: number } = {};
  
  posts.forEach(post => {
    const category = analyzeContentCategory(post);
    distribution[category] = (distribution[category] || 0) + 1;
  });
  
  return distribution;
}

// Get trending topics from recent posts
export function getTrendingTopics(posts: BlogPostWithDetails[], limit: number = 5): string[] {
  const recentPosts = posts
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 20); // Analyze last 20 posts
  
  const topicFrequency: { [key: string]: number } = {};
  
  recentPosts.forEach(post => {
    const content = `${post.title} ${post.excerpt}`.toLowerCase();
    
    // Extract key terms (simplified approach)
    const words = content.match(/\b\w{4,}\b/g) || [];
    words.forEach(word => {
      if (word.length > 4 && !['with', 'that', 'this', 'from', 'have', 'will', 'been', 'they', 'their'].includes(word)) {
        topicFrequency[word] = (topicFrequency[word] || 0) + 1;
      }
    });
  });
  
  return Object.entries(topicFrequency)
    .sort(([,a], [,b]) => b - a)
    .slice(0, limit)
    .map(([topic]) => topic);
}