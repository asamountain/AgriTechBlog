/**
 * API Endpoint: List Notion Pages
 *
 * GET /api/notion-sync/list-pages
 *
 * Fetch all pages from connected Notion database with their status
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { NotionContentExtractor } from '../../server/services/notion-content-extractor';
import { config } from '../../server/config/notion-claude.config';

interface NotionPageListItem {
  id: string;
  title: string;
  status: string;
  lastEdited: string;
  created: string;
  tags?: string[];
  url: string;
  hasImages: boolean;
  contentPreview?: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('[API] Fetching Notion pages...');

    const extractor = new NotionContentExtractor();

    // Query the database for all pages (or filter by status)
    const statusFilter = req.query.status as string | undefined;
    const pages = await extractor.queryDatabase(statusFilter);

    console.log(`[API] Found ${pages.length} pages in Notion database`);

    // Transform pages to simplified format
    const pageList: NotionPageListItem[] = await Promise.all(
      pages.map(async (page) => {
        try {
          // Extract basic info without fetching full content
          const properties = page.properties;

          // Get title
          const titleProperty = properties[config.notion.propertyMappings.title];
          const title =
            titleProperty && titleProperty.type === 'title'
              ? titleProperty.title.map((t) => t.plain_text).join('')
              : 'Untitled';

          // Get status
          const statusProperty = properties[config.notion.propertyMappings.status];
          const status =
            statusProperty && statusProperty.type === 'status'
              ? statusProperty.status?.name || 'Unknown'
              : 'Unknown';

          // Get tags
          const tagsProperty = properties[config.notion.propertyMappings.tags];
          const tags =
            tagsProperty && tagsProperty.type === 'multi_select'
              ? tagsProperty.multi_select.map((t) => t.name)
              : [];

          // Check if page has images (we'll do a light check)
          const hasImages = false; // Could fetch blocks to check, but that's expensive

          return {
            id: page.id,
            title,
            status,
            lastEdited: page.last_edited_time,
            created: page.created_time,
            tags,
            url: page.url,
            hasImages,
          };
        } catch (error) {
          console.error(`[API] Error processing page ${page.id}:`, error);
          return null;
        }
      })
    );

    // Filter out any failed pages
    const validPages = pageList.filter((p) => p !== null);

    return res.status(200).json({
      success: true,
      pages: validPages,
      total: validPages.length,
      databaseId: config.notion.databaseId,
    });
  } catch (error) {
    console.error('[API] Error fetching Notion pages:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch pages',
      hint: 'Check that NOTION_API_KEY and NOTION_DATABASE_ID are configured correctly',
    });
  }
}
