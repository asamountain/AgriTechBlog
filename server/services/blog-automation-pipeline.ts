/**
 * Blog Automation Pipeline
 *
 * Main orchestration service that coordinates the entire flow:
 * Notion → Content Extraction → Claude Analysis → Blog Post Draft
 */

import { NotionContentExtractor } from './notion-content-extractor';
import { ClaudeContentProcessor, type ImageAnalysis } from './claude-processor';
import type { StyleProfile } from '../prompts/blog-generation';
import { createPolisher } from './grok-polisher';
import { config } from '../config/notion-claude.config';
import type { InsertBlogPost } from '../../shared/schema';

export interface ProcessingResult {
  success: boolean;
  draftId?: string;
  notionPageId: string;
  error?: string;
  metadata?: {
    processingTimeMs: number;
    imagesAnalyzed: number;
    contentLength: number;
  };
}

export class BlogAutomationPipeline {
  private notionExtractor: NotionContentExtractor;
  private claudeProcessor: ClaudeContentProcessor;
  private styleProfileCache: StyleProfile | null = null;
  private styleProfileCacheTime: number = 0;

  constructor() {
    this.notionExtractor = new NotionContentExtractor();
    this.claudeProcessor = new ClaudeContentProcessor();
  }

  /**
   * Main processing function: Convert Notion page to blog draft
   */
  async processNotionPage(
    pageId: string,
    createDraftFn: (draft: InsertBlogPost) => Promise<{ id: string }>
  ): Promise<ProcessingResult> {
    const startTime = Date.now();

    try {
      console.log(`[Pipeline] Starting processing for Notion page: ${pageId}`);

      // Step 1: Extract content from Notion
      console.log('[Pipeline] Step 1: Extracting content from Notion...');
      const notionData = await this.notionExtractor.extractPage(pageId);

      // Validate minimum content length
      if (notionData.textContent.length < config.generation.minContentLength) {
        throw new Error(`Content too short (${notionData.textContent.length} chars). Minimum: ${config.generation.minContentLength}`);
      }

      console.log(`[Pipeline] Extracted: ${notionData.title}`);
      console.log(`[Pipeline] Content length: ${notionData.textContent.length} chars`);
      console.log(`[Pipeline] Images: ${notionData.images.length}, Videos: ${notionData.videos.length}`);

      // Step 2: Download media files
      console.log('[Pipeline] Step 2: Downloading media files...');
      const imageBuffers: Buffer[] = [];

      for (const image of notionData.images.slice(0, config.claude.rateLimit.maxImagesPerRequest)) {
        try {
          const buffer = await this.notionExtractor.downloadMedia(image.url);
          imageBuffers.push(buffer);
          console.log(`[Pipeline] Downloaded image: ${image.url}`);
        } catch (error) {
          console.error(`[Pipeline] Failed to download image: ${image.url}`, error);
        }
      }

      // Step 3: Analyze images with Claude Vision
      console.log('[Pipeline] Step 3: Analyzing images with Claude...');
      let imageAnalyses: ImageAnalysis[] = [];

      if (imageBuffers.length > 0) {
        imageAnalyses = await this.claudeProcessor.analyzeImages(
          imageBuffers,
          `Blog post about: ${notionData.title}`
        );
        console.log(`[Pipeline] Analyzed ${imageAnalyses.length} images`);
      }

      // Step 4: Get or create writing style profile
      console.log('[Pipeline] Step 4: Getting writing style profile...');
      const styleProfile = await this.getOrCreateStyleProfile();

      // Step 5: Generate blog post with Claude
      console.log('[Pipeline] Step 5: Generating blog post...');
      const generatedPost = await this.claudeProcessor.generateBlogPost({
        notionText: notionData.textContent,
        imageAnalyses,
        styleProfile,
        metadata: {
          suggestedTitle: notionData.title,
          tags: notionData.metadata.tags,
        },
      });

      console.log(`[Pipeline] Generated post: "${generatedPost.title}"`);
      console.log(`[Pipeline] Content length: ${generatedPost.content.length} chars`);
      console.log(`[Pipeline] Suggested tags: ${generatedPost.suggestedTags.join(', ')}`);

      // Step 5.5: Polish content with Grok/Llama3 (optional)
      let finalContent = generatedPost.content;
      let polishingNotes: string[] = [];

      const polisher = createPolisher();
      if (polisher) {
        console.log('[Pipeline] Step 5.5: Polishing with secondary AI...');
        try {
          const polishResult = await polisher.polishContent(
            generatedPost.content,
            generatedPost.title,
            generatedPost.excerpt
          );

          finalContent = polishResult.polishedContent;
          polishingNotes = polishResult.improvements;

          console.log(`[Pipeline] Content polished. Improvements: ${polishingNotes.length}`);
          console.log(`[Pipeline] Polish notes: ${polishingNotes.join(', ')}`);
        } catch (error) {
          console.error('[Pipeline] Polishing failed, using original content:', error);
        }
      } else {
        console.log('[Pipeline] Polisher not configured, skipping polish step');
      }

      // Step 6: Prepare blog post draft
      console.log('[Pipeline] Step 6: Creating draft blog post...');
      const slug = this.generateSlug(generatedPost.title);

      const draftPost: InsertBlogPost = {
        title: generatedPost.title,
        slug,
        excerpt: generatedPost.excerpt,
        content: finalContent, // Use polished content if available
        featuredImage: notionData.images[0]?.url || '',
        userId: config.pipeline.defaultAuthorId,
        tags: generatedPost.suggestedTags,
        readTime: generatedPost.readTimeMinutes,
        isFeatured: false,
        isPublished: false, // Always create as draft
        summary: generatedPost.excerpt,
        // AI metadata
        sourceNotionId: pageId,
        generatedByAI: true,
        aiGenerationMetadata: {
          model: config.claude.model,
          promptVersion: '1.0',
          generatedAt: new Date(),
          imagesAnalyzed: imageBuffers.length,
        },
        processingStatus: 'completed',
      };

      // Step 7: Save to database
      const draft = await createDraftFn(draftPost);
      console.log(`[Pipeline] Draft created with ID: ${draft.id}`);

      // Step 8: Update Notion page status (optional)
      try {
        await this.notionExtractor.updatePageStatus(
          pageId,
          config.notion.statusValues.completed
        );
        console.log(`[Pipeline] Updated Notion page status to: ${config.notion.statusValues.completed}`);
      } catch (error) {
        console.error('[Pipeline] Failed to update Notion status:', error);
        // Non-critical error, continue
      }

      const processingTime = Date.now() - startTime;
      console.log(`[Pipeline] ✅ Processing completed in ${processingTime}ms`);

      return {
        success: true,
        draftId: draft.id,
        notionPageId: pageId,
        metadata: {
          processingTimeMs: processingTime,
          imagesAnalyzed: imageBuffers.length,
          contentLength: generatedPost.content.length,
        },
      };
    } catch (error) {
      console.error('[Pipeline] ❌ Processing failed:', error);

      return {
        success: false,
        notionPageId: pageId,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get or create cached style profile
   */
  private async getOrCreateStyleProfile(): Promise<StyleProfile> {
    const now = Date.now();
    const cacheValid = this.styleProfileCache &&
      (now - this.styleProfileCacheTime) < config.generation.styleCacheDuration * 1000;

    if (cacheValid) {
      console.log('[Pipeline] Using cached style profile');
      return this.styleProfileCache!;
    }

    console.log('[Pipeline] Generating new style profile...');

    try {
      // This would fetch published posts from the database
      // For now, we'll use the default style profile
      // In production, pass a function to fetch posts

      const styleProfile = await this.claudeProcessor.analyzeWritingStyle([]);

      this.styleProfileCache = styleProfile;
      this.styleProfileCacheTime = now;

      return styleProfile;
    } catch (error) {
      console.error('[Pipeline] Failed to generate style profile, using default');
      throw error;
    }
  }

  /**
   * Refresh style profile cache
   */
  async refreshStyleProfile(existingPostsFn: () => Promise<any[]>): Promise<StyleProfile> {
    console.log('[Pipeline] Refreshing style profile...');

    const posts = await existingPostsFn();
    const styleProfile = await this.claudeProcessor.analyzeWritingStyle(posts);

    this.styleProfileCache = styleProfile;
    this.styleProfileCacheTime = Date.now();

    console.log('[Pipeline] Style profile refreshed');
    return styleProfile;
  }

  /**
   * Generate URL-friendly slug from title
   */
  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 100);
  }

  /**
   * Process multiple Notion pages in batch
   */
  async processBatch(
    pageIds: string[],
    createDraftFn: (draft: InsertBlogPost) => Promise<{ id: string }>
  ): Promise<ProcessingResult[]> {
    console.log(`[Pipeline] Processing batch of ${pageIds.length} pages`);

    const results: ProcessingResult[] = [];

    for (const pageId of pageIds) {
      const result = await this.processNotionPage(pageId, createDraftFn);
      results.push(result);

      // Delay between pages to respect rate limits
      if (results.length < pageIds.length) {
        await this.delay(2000); // 2 second delay
      }
    }

    const successCount = results.filter(r => r.success).length;
    console.log(`[Pipeline] Batch complete: ${successCount}/${pageIds.length} successful`);

    return results;
  }

  /**
   * Poll Notion database for new pages ready to process
   */
  async pollForNewPages(): Promise<string[]> {
    console.log('[Pipeline] Polling Notion for new pages...');

    try {
      const pages = await this.notionExtractor.queryDatabase(
        config.notion.statusValues.ready
      );

      const pageIds = pages.map(p => p.id);
      console.log(`[Pipeline] Found ${pageIds.length} pages ready to process`);

      return pageIds;
    } catch (error) {
      console.error('[Pipeline] Failed to poll Notion:', error);
      return [];
    }
  }

  /**
   * Test the entire pipeline with validation
   */
  async testPipeline(): Promise<{
    notionConnected: boolean;
    claudeConnected: boolean;
    configValid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    // Test Notion connection
    let notionConnected = false;
    try {
      const testPages = await this.notionExtractor.queryDatabase();
      notionConnected = true;
      console.log(`[Pipeline Test] Notion connected. Found ${testPages.length} pages.`);
    } catch (error) {
      errors.push(`Notion connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Test Claude connection
    let claudeConnected = false;
    try {
      claudeConnected = await this.claudeProcessor.testConnection();
      console.log(`[Pipeline Test] Claude API: ${claudeConnected ? 'Connected' : 'Failed'}`);

      if (!claudeConnected) {
        errors.push('Claude API connection failed');
      }
    } catch (error) {
      errors.push(`Claude API test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Validate config
    const configValidation = this.validateConfig();
    if (!configValidation.valid) {
      errors.push(...configValidation.errors);
    }

    return {
      notionConnected,
      claudeConnected,
      configValid: configValidation.valid,
      errors,
    };
  }

  /**
   * Validate configuration
   */
  private validateConfig(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!config.notion.apiKey) {
      errors.push('NOTION_API_KEY not configured');
    }

    if (!config.notion.databaseId) {
      errors.push('NOTION_DATABASE_ID not configured');
    }

    if (!config.claude.apiKey) {
      errors.push('ANTHROPIC_API_KEY not configured');
    }

    if (!config.pipeline.defaultAuthorId) {
      errors.push('DEFAULT_AUTHOR_ID not configured');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
