/**
 * API Endpoint: Process Notion Page
 *
 * POST /api/notion-sync/process-page
 *
 * Manually trigger processing of a Notion page to create a blog post draft.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { BlogAutomationPipeline } from '../../server/services/blog-automation-pipeline';
import { getStorage } from '../../server/storage';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { pageId } = req.body;

    if (!pageId || typeof pageId !== 'string') {
      return res.status(400).json({
        error: 'Missing or invalid pageId parameter',
        usage: 'POST /api/notion-sync/process-page with body: { "pageId": "notion-page-id" }',
      });
    }

    console.log(`[API] Processing Notion page: ${pageId}`);

    // Initialize pipeline
    const pipeline = new BlogAutomationPipeline();
    const storage = await getStorage();

    // Process the page
    const result = await pipeline.processNotionPage(pageId, async (draft) => {
      // Save to database
      const post = await storage.createBlogPost(draft);
      return { id: post.id.toString() };
    });

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: 'Blog post draft created successfully',
        data: {
          draftId: result.draftId,
          notionPageId: result.notionPageId,
          processingTimeMs: result.metadata?.processingTimeMs,
          imagesAnalyzed: result.metadata?.imagesAnalyzed,
        },
      });
    } else {
      return res.status(500).json({
        success: false,
        error: result.error || 'Processing failed',
        notionPageId: result.notionPageId,
      });
    }
  } catch (error) {
    console.error('[API] Error processing page:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
}
