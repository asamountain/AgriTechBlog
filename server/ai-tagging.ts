import type { BlogPostWithDetails } from "@shared/schema";

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
  private apiKey: string | undefined;
  private apiUrl: string = 'https://api.perplexity.ai/chat/completions';

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
    const fallbackExcerpt = generateCleanExcerpt(content, 150);
    
    return {
      excerpt: fallbackExcerpt,
      reasoning: 'Generated using clean text extraction as fallback method'
    };
  }

  private extractExcerpt(title: string, content: string): string {
    return generateCleanExcerpt(content, 150);
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