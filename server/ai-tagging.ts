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
}

// Export singleton instance
let aiTaggingService: AITaggingService | null = null;

export function getAITaggingService(): AITaggingService {
  if (!aiTaggingService) {
    aiTaggingService = new AITaggingService();
  }
  return aiTaggingService;
}