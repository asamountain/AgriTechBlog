/**
 * Claude Content Processor Service
 *
 * Handles all interactions with Claude API for:
 * - Image analysis
 * - Blog post generation
 * - Writing style analysis
 */

import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config/notion-claude.config';
import {
  getBlogGenerationPrompt,
  getImageAnalysisPrompt,
  STYLE_ANALYSIS_PROMPT,
  type StyleProfile,
} from '../prompts/blog-generation';
import type { BlogPost } from '../../shared/schema';

export interface ImageAnalysis {
  mainSubject: string;
  technicalDetails: string;
  agriculturalContext: string;
  keyObservations: string[];
  suggestedCaption: string;
}

export interface VideoAnalysis {
  summary: string;
  keyTakeaways: string[];
  suggestedIntegration: string;
}

export interface ContentInput {
  notionText: string;
  imageAnalyses: ImageAnalysis[];
  videoAnalysis?: VideoAnalysis;
  styleProfile: StyleProfile;
  metadata: {
    suggestedTitle?: string;
    tags?: string[];
  };
}

export interface GeneratedPost {
  title: string;
  content: string;
  excerpt: string;
  suggestedTags: string[];
  readTimeMinutes: number;
  featuredImageCaption?: string;
}

export class ClaudeContentProcessor {
  private anthropic: Anthropic;
  private model: string;

  constructor(apiKey?: string) {
    this.anthropic = new Anthropic({
      apiKey: apiKey || config.claude.apiKey,
    });
    this.model = config.claude.model;
  }

  /**
   * Analyze a single image
   */
  async analyzeImage(imageBuffer: Buffer, context: string): Promise<ImageAnalysis> {
    try {
      const base64Image = imageBuffer.toString('base64');
      const mediaType = this.detectImageMediaType(imageBuffer);

      const response = await this.anthropic.messages.create({
        model: this.model,
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: mediaType,
                  data: base64Image,
                },
              },
              {
                type: 'text',
                text: getImageAnalysisPrompt(context),
              },
            ],
          },
        ],
      });

      const textContent = response.content[0];
      if (textContent.type !== 'text') {
        throw new Error('Unexpected response type from Claude');
      }

      // Parse JSON response
      const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Could not parse JSON from Claude response');
      }

      const analysis: ImageAnalysis = JSON.parse(jsonMatch[0]);
      return analysis;
    } catch (error) {
      console.error('Error analyzing image with Claude:', error);
      throw new Error(`Image analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Analyze multiple images
   */
  async analyzeImages(imageBuffers: Buffer[], context: string): Promise<ImageAnalysis[]> {
    const analyses: ImageAnalysis[] = [];

    // Process images in batches to respect rate limits
    const batchSize = config.claude.rateLimit.maxImagesPerRequest;

    for (let i = 0; i < imageBuffers.length; i += batchSize) {
      const batch = imageBuffers.slice(i, i + batchSize);

      const batchPromises = batch.map((buffer, idx) =>
        this.analyzeImage(buffer, `${context} (Image ${i + idx + 1})`)
      );

      const batchResults = await Promise.all(batchPromises);
      analyses.push(...batchResults);

      // Rate limiting delay between batches
      if (i + batchSize < imageBuffers.length) {
        await this.delay(1000); // 1 second delay
      }
    }

    return analyses;
  }

  /**
   * Generate blog post from content and style profile
   */
  async generateBlogPost(input: ContentInput): Promise<GeneratedPost> {
    try {
      const prompt = getBlogGenerationPrompt({
        styleProfile: input.styleProfile,
        notionText: input.notionText,
        imageAnalyses: input.imageAnalyses.map(analysis => ({
          description: `${analysis.mainSubject}. ${analysis.agriculturalContext}. ${analysis.technicalDetails}`,
          caption: analysis.suggestedCaption,
        })),
        metadata: input.metadata,
      });

      const response = await this.anthropic.messages.create({
        model: this.model,
        max_tokens: config.claude.maxTokens,
        temperature: config.claude.temperature,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const textContent = response.content[0];
      if (textContent.type !== 'text') {
        throw new Error('Unexpected response type from Claude');
      }

      // Extract JSON from markdown code block if present
      const jsonMatch = textContent.text.match(/```json\s*([\s\S]*?)```/) ||
                       textContent.text.match(/\{[\s\S]*\}/);

      if (!jsonMatch) {
        throw new Error('Could not parse JSON from Claude response');
      }

      const jsonText = jsonMatch[1] || jsonMatch[0];
      const generatedPost: GeneratedPost = JSON.parse(jsonText);

      // Validate generated post
      if (!generatedPost.title || !generatedPost.content || !generatedPost.excerpt) {
        throw new Error('Generated post is missing required fields');
      }

      return generatedPost;
    } catch (error) {
      console.error('Error generating blog post with Claude:', error);
      throw new Error(`Blog post generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Analyze writing style from existing blog posts
   */
  async analyzeWritingStyle(existingPosts: BlogPost[]): Promise<StyleProfile> {
    try {
      // Prepare posts for analysis
      const postsText = existingPosts
        .slice(0, config.generation.styleAnalysisSampleSize)
        .map((post, idx) => {
          return `
=== Post ${idx + 1}: ${post.title} ===
Word count: ${post.content.split(/\s+/).length}

${post.content.substring(0, 2000)}...
`;
        })
        .join('\n\n');

      const response = await this.anthropic.messages.create({
        model: this.model,
        max_tokens: 2048,
        messages: [
          {
            role: 'user',
            content: `${STYLE_ANALYSIS_PROMPT}\n\n**Blog Posts to Analyze**:\n${postsText}`,
          },
        ],
      });

      const textContent = response.content[0];
      if (textContent.type !== 'text') {
        throw new Error('Unexpected response type from Claude');
      }

      // Extract JSON
      const jsonMatch = textContent.text.match(/```json\s*([\s\S]*?)```/) ||
                       textContent.text.match(/\{[\s\S]*\}/);

      if (!jsonMatch) {
        throw new Error('Could not parse JSON from Claude response');
      }

      const jsonText = jsonMatch[1] || jsonMatch[0];
      const styleProfile: StyleProfile = JSON.parse(jsonText);

      return styleProfile;
    } catch (error) {
      console.error('Error analyzing writing style:', error);

      // Return default style profile if analysis fails
      return this.getDefaultStyleProfile();
    }
  }

  /**
   * Get default style profile (fallback)
   */
  private getDefaultStyleProfile(): StyleProfile {
    return {
      tone: 'technical and educational, with enthusiasm for AgriTech innovation',
      averagePostLength: 1500,
      vocabularyLevel: 'mixed',
      structurePreferences: {
        usesHeadings: true,
        usesLists: true,
        usesCodeBlocks: true,
        introStyle: 'Start with context or a compelling hook about the technology',
        conclusionStyle: 'Summarize key takeaways and look toward future applications',
      },
      commonPatterns: [
        'Explains technical concepts clearly for a mixed audience',
        'Uses real-world examples from agriculture',
        'Emphasizes practical applications and benefits',
        'Includes specific technical details and data points',
      ],
      exampleExcerpts: [
        'Modern agriculture is increasingly driven by data and technology. IoT sensors enable farmers to monitor conditions in real-time, making informed decisions that optimize yield and reduce resource waste.',
      ],
    };
  }

  /**
   * Detect image media type from buffer
   */
  private detectImageMediaType(buffer: Buffer): 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' {
    // Check magic numbers
    if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
      return 'image/jpeg';
    }
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
      return 'image/png';
    }
    if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) {
      return 'image/gif';
    }
    if (buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50) {
      return 'image/webp';
    }

    // Default to JPEG
    return 'image/jpeg';
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Test API connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.anthropic.messages.create({
        model: this.model,
        max_tokens: 50,
        messages: [
          {
            role: 'user',
            content: 'Hello! Please respond with "OK" if you can see this message.',
          },
        ],
      });

      return response.content[0].type === 'text';
    } catch (error) {
      console.error('Claude API test failed:', error);
      return false;
    }
  }
}
