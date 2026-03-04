/**
 * Unified Notion Sync Pages Handler
 * 
 * Consolidates 2 serverless functions into 1:
 *   - GET /api/notion-sync/pages           → List all Notion pages
 *   - GET /api/notion-sync/pages?test=true  → Test Notion-Claude configuration
 * 
 * Old routes are remapped via vercel.json rewrites:
 *   /api/notion-sync/list-pages → /api/notion-sync/pages
 *   /api/notion-sync/test       → /api/notion-sync/pages?test=true
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { NotionContentExtractor } from '../../server/services/notion-content-extractor';
import { BlogAutomationPipeline } from '../../server/services/blog-automation-pipeline';
import { config, validateConfig, getConfigSummary } from '../../server/config/notion-claude.config';

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

async function handleTest(res: VercelResponse) {
  console.log('[API] Testing Notion-Claude configuration...');

  // Validate configuration
  const configValidation = validateConfig();

  if (!configValidation.valid) {
    return res.status(500).json({
      success: false,
      error: 'Configuration validation failed',
      details: configValidation.errors,
      configSummary: getConfigSummary(),
    });
  }

  // Test pipeline connections
  const pipeline = new BlogAutomationPipeline();
  const testResults = await pipeline.testPipeline();

  const allPassed = testResults.notionConnected &&
                   testResults.claudeConnected &&
                   testResults.configValid;

  return res.status(allPassed ? 200 : 500).json({
    success: allPassed,
    message: allPassed
      ? 'All systems operational'
      : 'Some systems failed - see details',
    tests: {
      notionConnection: {
        passed: testResults.notionConnected,
        message: testResults.notionConnected ? 'Connected' : 'Failed to connect',
      },
      claudeConnection: {
        passed: testResults.claudeConnected,
        message: testResults.claudeConnected ? 'Connected' : 'Failed to connect',
      },
      configuration: {
        passed: testResults.configValid,
        message: testResults.configValid ? 'Valid' : 'Invalid configuration',
      },
    },
    errors: testResults.errors,
    config: getConfigSummary(),
  });
}

async function handleListPages(req: VercelRequest, res: VercelResponse) {
  console.log('[API] Fetching Notion pages...');

  const extractor = new NotionContentExtractor();

  // Query the database for all pages (or filter by status)
  const statusFilter = req.query.status as string | undefined;
  const pages = await extractor.queryDatabase(statusFilter);

  console.log(`[API] Found ${pages.length} pages in Notion database`);

  // Transform pages to simplified format
  const pageList: (NotionPageListItem | null)[] = await Promise.all(
    pages.map(async (page) => {
      try {
        const properties = page.properties;

        // Get title
        const titleProperty = properties[config.notion.propertyMappings.title];
        const title =
          titleProperty && titleProperty.type === 'title'
            ? titleProperty.title.map((t: any) => t.plain_text).join('')
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
            ? tagsProperty.multi_select.map((t: any) => t.name)
            : [];

        return {
          id: page.id,
          title,
          status,
          lastEdited: page.last_edited_time,
          created: page.created_time,
          tags,
          url: page.url,
          hasImages: false,
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
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Route: test mode
    if (req.query.test === 'true') {
      return await handleTest(res);
    }

    // Route: list pages (default)
    return await handleListPages(req, res);
  } catch (error) {
    console.error('[API] Error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      hint: 'Check that NOTION_API_KEY and NOTION_DATABASE_ID are configured correctly',
    });
  }
}
