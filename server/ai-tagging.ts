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
  suggestedCategory: string;
  confidence: number;
  reasoning: string;
}

export class AITaggingService {
  private readonly apiKey: string;
  private readonly apiUrl = 'https://api.perplexity.ai/chat/completions';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async analyzeContent(post: BlogPostWithDetails): Promise<TaggingResult> {
    try {
      const prompt = this.buildAnalysisPrompt(post);
      
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
              content: 'You are an expert agricultural technology content analyst. Analyze blog posts and provide accurate categorization and tagging for agricultural technology content. Always respond with valid JSON format.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 500,
          temperature: 0.2,
          top_p: 0.9,
          stream: false
        })
      });

      if (!response.ok) {
        throw new Error(`Perplexity API error: ${response.status} ${response.statusText}`);
      }

      const data: PerplexityResponse = await response.json();
      const content = data.choices[0]?.message?.content;

      if (!content) {
        throw new Error('No content received from Perplexity API');
      }

      return this.parseAnalysisResult(content);
    } catch (error) {
      console.error('AI tagging error:', error);
      return this.getFallbackResult(post);
    }
  }

  async generateTags(content: string): Promise<string[]> {
    try {
      const prompt = `Analyze this agricultural technology content and generate 5-8 relevant tags. Focus on specific technologies, farming practices, crops, equipment, and industry terms mentioned.

Content: "${content.substring(0, 1000)}..."

Respond with a JSON object containing an array of tags:
{
  "tags": ["tag1", "tag2", "tag3", ...]
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
              content: 'You are an expert agricultural technology content analyst. Generate relevant tags for agricultural content. Always respond with valid JSON format.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 200,
          temperature: 0.3,
          stream: false
        })
      });

      if (!response.ok) {
        throw new Error(`Perplexity API error: ${response.status}`);
      }

      const data: PerplexityResponse = await response.json();
      const content_result = data.choices[0]?.message?.content;

      if (content_result) {
        const parsed = JSON.parse(content_result);
        return parsed.tags || [];
      }

      return [];
    } catch (error) {
      console.error('Tag generation error:', error);
      return this.extractKeywordsFromContent(content);
    }
  }

  async suggestCategory(title: string, content: string): Promise<string> {
    try {
      const availableCategories = [
        'Agricultural Technology',
        'Sustainable Farming',
        'Crop Management',
        'Farm Equipment',
        'Market Analysis',
        'Weather & Climate',
        'Soil Health',
        'Irrigation Systems',
        'Livestock Technology',
        'Food Safety',
        'Agricultural Research',
        'Farm Automation'
      ];

      const prompt = `Analyze this agricultural content and suggest the most appropriate category from the available options.

Title: "${title}"
Content: "${content.substring(0, 800)}..."

Available categories:
${availableCategories.map(cat => `- ${cat}`).join('\n')}

Respond with a JSON object containing the best category and confidence:
{
  "category": "Selected Category Name",
  "confidence": 0.95,
  "reasoning": "Brief explanation of why this category fits"
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
              content: 'You are an expert agricultural technology content categorization specialist. Always respond with valid JSON format.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 150,
          temperature: 0.2,
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
        return parsed.category || 'Agricultural Technology';
      }

      return 'Agricultural Technology';
    } catch (error) {
      console.error('Category suggestion error:', error);
      return this.getFallbackCategory(title, content);
    }
  }

  private buildAnalysisPrompt(post: BlogPostWithDetails): string {
    return `Analyze this agricultural technology blog post and provide comprehensive tagging and categorization:

Title: "${post.title}"
Content: "${post.content.substring(0, 1500)}..."
Current Category: "${post.category.name}"

Please analyze the content and provide:
1. 5-8 relevant tags focusing on specific agricultural technologies, practices, crops, equipment mentioned
2. Best category from: Agricultural Technology, Sustainable Farming, Crop Management, Farm Equipment, Market Analysis, Weather & Climate, Soil Health, Irrigation Systems, Livestock Technology, Food Safety, Agricultural Research, Farm Automation
3. Confidence score (0-1)
4. Brief reasoning for your choices

Respond with this exact JSON format:
{
  "suggestedTags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "suggestedCategory": "Category Name",
  "confidence": 0.85,
  "reasoning": "Brief explanation of why these tags and category were chosen"
}`;
  }

  private parseAnalysisResult(content: string): TaggingResult {
    try {
      const parsed = JSON.parse(content);
      return {
        suggestedTags: parsed.suggestedTags || [],
        suggestedCategory: parsed.suggestedCategory || 'Agricultural Technology',
        confidence: parsed.confidence || 0.5,
        reasoning: parsed.reasoning || 'AI analysis completed'
      };
    } catch (error) {
      console.error('Failed to parse AI analysis result:', error);
      return {
        suggestedTags: [],
        suggestedCategory: 'Agricultural Technology',
        confidence: 0.3,
        reasoning: 'Fallback analysis due to parsing error'
      };
    }
  }

  private getFallbackResult(post: BlogPostWithDetails): TaggingResult {
    return {
      suggestedTags: this.extractKeywordsFromContent(post.content),
      suggestedCategory: this.getFallbackCategory(post.title, post.content),
      confidence: 0.4,
      reasoning: 'Fallback analysis using keyword extraction'
    };
  }

  private extractKeywordsFromContent(content: string): string[] {
    const keywords = [
      'precision agriculture', 'smart farming', 'IoT sensors', 'GPS technology',
      'crop monitoring', 'yield optimization', 'soil analysis', 'irrigation',
      'sustainability', 'automation', 'robotics', 'drones', 'satellite imagery',
      'data analytics', 'machine learning', 'weather forecasting', 'fertilizer',
      'pesticide management', 'livestock monitoring', 'farm management'
    ];

    const contentLower = content.toLowerCase();
    return keywords.filter(keyword => 
      contentLower.includes(keyword.toLowerCase())
    ).slice(0, 6);
  }

  private getFallbackCategory(title: string, content: string): string {
    const text = (title + ' ' + content).toLowerCase();
    
    if (text.includes('sustainable') || text.includes('organic') || text.includes('eco')) {
      return 'Sustainable Farming';
    }
    if (text.includes('crop') || text.includes('harvest') || text.includes('planting')) {
      return 'Crop Management';
    }
    if (text.includes('equipment') || text.includes('machinery') || text.includes('tractor')) {
      return 'Farm Equipment';
    }
    if (text.includes('market') || text.includes('price') || text.includes('economic')) {
      return 'Market Analysis';
    }
    if (text.includes('weather') || text.includes('climate') || text.includes('temperature')) {
      return 'Weather & Climate';
    }
    if (text.includes('soil') || text.includes('nutrient') || text.includes('fertilizer')) {
      return 'Soil Health';
    }
    if (text.includes('irrigation') || text.includes('water') || text.includes('drought')) {
      return 'Irrigation Systems';
    }
    
    return 'Agricultural Technology';
  }
}

// Export singleton instance
let aiTaggingService: AITaggingService | null = null;

export function getAITaggingService(): AITaggingService {
  if (!aiTaggingService) {
    const apiKey = process.env.PERPLEXITY_API_KEY;
    if (!apiKey) {
      throw new Error('PERPLEXITY_API_KEY environment variable is required');
    }
    aiTaggingService = new AITaggingService(apiKey);
  }
  return aiTaggingService;
}