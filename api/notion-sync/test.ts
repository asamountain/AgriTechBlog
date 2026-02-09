/**
 * API Endpoint: Test Notion-Claude Configuration
 *
 * GET /api/notion-sync/test
 *
 * Test the configuration and connectivity for Notion and Claude APIs.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { BlogAutomationPipeline } from '../../server/services/blog-automation-pipeline';
import { config, validateConfig, getConfigSummary } from '../../server/config/notion-claude.config';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
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
  } catch (error) {
    console.error('[API] Test failed:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
}
