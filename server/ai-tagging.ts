import type { BlogPostWithDetails } from "@shared/schema";

interface PerplexityResponse {
  id: string;
  model: string;
  object: string;
  created: number;
  choices: Array<{
    index: number;
    finish_reason: string;
    message: {
      role: string;
      content: string;
    };
    delta: {
      role: string;
      content: string;
    };
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface TaggingResult {
  suggestedTags: string[];
  reasoning: string;
}

interface ExcerptResult {
  excerpt: string;
  reasoning: string;
  alternatives?: string[];
}

export class AITaggingService {
  private apiKey: string;
  private apiUrl: string;

  constructor() {
    this.apiKey = process.env.PERPLEXITY_API_KEY || '';
    this.apiUrl = 'https://api.perplexity.ai/chat/completions';
    
    if (!this.apiKey) {
      console.warn('Perplexity API key not configured. AI tagging will use fallback methods.');
    }
  }

  async analyzeContent(post: BlogPostWithDetails): Promise<TaggingResult> {
    try {
      if (!this.apiKey) {
        return this.getFallbackAnalysis(post.title, post.content);
      }

      const prompt = `Analyze this agricultural technology blog post and suggest relevant tags.

Title: "${post.title}"
Content: "${post.content.substring(0, 1000)}..."

Generate 5-8 relevant tags that would be helpful for categorizing and finding this content. Focus on:
- Agricultural technology themes
- Specific techniques or tools mentioned
- Industry sectors
- Scientific concepts
- Practical applications

Respond with a JSON object containing an array of suggested tags:
{
  "suggestedTags": ["tag1", "tag2", "tag3", ...],
  "reasoning": "Brief explanation of tag selection"
}`;

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-sonar-small-128k-online',
          messages: [
            {
              role: 'system',
              content: 'You are an expert agricultural technology content analyst. Always respond with valid JSON format.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 300,
          temperature: 0.3,
          stream: false
        })
      });

      if (!response.ok) {
        throw new Error(`Perplexity API error: ${response.status}`);
      }

      const data: PerplexityResponse = await response.json();
      const result = data.choices[0]?.message?.content;

      if (result) {
        const parsed = JSON.parse(result);
        return {
          suggestedTags: parsed.suggestedTags || [],
          reasoning: parsed.reasoning || 'AI analysis completed'
        };
      }

      return this.getFallbackAnalysis(post.title, post.content);
    } catch (error) {
      console.error('AI tagging error:', error);
      return this.getFallbackAnalysis(post.title, post.content);
    }
  }

  async generateExcerpt(post: BlogPostWithDetails): Promise<ExcerptResult> {
    try {
      if (!this.apiKey) {
        return this.getFallbackExcerpt(post.title, post.content);
      }

      const prompt = `Create an engaging, attractive excerpt for this agricultural technology blog post that will capture readers' attention and encourage them to read the full article.

Title: "${post.title}"
Content: "${post.content.substring(0, 1200)}..."

Requirements for the excerpt:
- 120-180 characters maximum (perfect for social media and search previews)
- Hook readers immediately with compelling language
- Include specific benefits or intriguing insights
- Use action words and emotional triggers
- Highlight unique value proposition
- Make it scannable and punchy
- Focus on what readers will learn or gain
- End with intrigue that makes them want to read more

Tone: Professional yet accessible, innovative, forward-thinking, inspiring

Respond with a JSON object:
{
  "excerpt": "Your compelling excerpt here",
  "reasoning": "Brief explanation of approach used",
  "alternatives": ["alternative excerpt 1", "alternative excerpt 2"]
}`;

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-sonar-small-128k-online',
          messages: [
            {
              role: 'system',
              content: 'You are an expert content marketing specialist focused on agricultural technology. You excel at creating compelling, click-worthy excerpts that drive engagement. Always respond with valid JSON format.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 400,
          temperature: 0.7, // Higher creativity for engaging content
          stream: false
        })
      });

      if (!response.ok) {
        throw new Error(`Perplexity API error: ${response.status}`);
      }

      const data: PerplexityResponse = await response.json();
      const result = data.choices[0]?.message?.content;

      if (result) {
        const parsed = JSON.parse(result);
        return {
          excerpt: parsed.excerpt || '',
          reasoning: parsed.reasoning || 'AI excerpt generated',
          alternatives: parsed.alternatives || []
        };
      }

      return this.getFallbackExcerpt(post.title, post.content);
    } catch (error) {
      console.error('AI excerpt generation error:', error);
      return this.getFallbackExcerpt(post.title, post.content);
    }
  }

  private getFallbackAnalysis(title: string, content: string): TaggingResult {
    const fallbackTags = this.extractKeywords(title, content);
    
    return {
      suggestedTags: fallbackTags.slice(0, 6),
      reasoning: 'Generated using keyword extraction as fallback method'
    };
  }

  private extractKeywords(title: string, content: string): string[] {
    const text = `${title} ${content}`.toLowerCase();
    
    const agriculturalTerms = [
      'precision farming', 'hydroponics', 'iot', 'sensors', 'agriculture',
      'farming', 'technology', 'automation', 'sustainability', 'crop',
      'irrigation', 'monitoring', 'data', 'analytics', 'smart farming',
      'vertical farming', 'greenhouse', 'robotics', 'ai', 'machine learning',
      'soil', 'water management', 'yield', 'efficiency', 'innovation'
    ];

    const foundTerms = agriculturalTerms.filter(term => 
      text.includes(term.toLowerCase())
    );

    return foundTerms.length > 0 ? foundTerms : ['agriculture', 'technology', 'farming'];
  }

  private getFallbackExcerpt(title: string, content: string): ExcerptResult {
    const fallbackExcerpt = this.extractExcerpt(title, content);
    
    return {
      excerpt: fallbackExcerpt,
      reasoning: 'Generated using excerpt extraction as fallback method'
    };
  }

  private extractExcerpt(title: string, content: string): string {
    // Remove HTML tags and clean up the content
    const cleanContent = content.replace(/<[^>]*>/g, ' ')
                               .replace(/\s+/g, ' ')
                               .trim();
    
    // Look for the first paragraph or meaningful sentence
    const sentences = cleanContent.split(/[.!?]+/).filter(s => s.trim().length > 20);
    
    if (sentences.length > 0) {
      const firstSentence = sentences[0].trim();
      
      // Create engaging excerpts with action words
      const actionWords = ['discover', 'explore', 'learn', 'revolutionize', 'transform', 'boost', 'enhance', 'optimize', 'maximize'];
      const hasActionWord = actionWords.some(word => firstSentence.toLowerCase().includes(word));
      
      if (hasActionWord && firstSentence.length <= 150) {
        return firstSentence + '.';
      }
      
      if (firstSentence.length <= 120) {
        return firstSentence + '.';
      }
      
      // Truncate smartly at word boundary
      const truncated = firstSentence.substring(0, 120);
      const lastSpace = truncated.lastIndexOf(' ');
      return lastSpace > 80 ? truncated.substring(0, lastSpace) + '...' : truncated + '...';
    }
    
    // Fallback to first 120 characters
    return cleanContent.length > 120 ? 
      cleanContent.substring(0, 120).trim() + '...' : 
      cleanContent;
  }
}

// Export singleton instance
let aiTaggingService: AITaggingService | null = null;

export function getAITaggingService(): AITaggingService {
  if (!aiTaggingService) {
    aiTaggingService = new AITaggingService();
  }
  return aiTaggingService;
}