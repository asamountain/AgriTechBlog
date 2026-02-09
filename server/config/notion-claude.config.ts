/**
 * Configuration for Notion-Claude Blog Automation
 *
 * This file contains all configuration settings for the automated
 * blog post generation system.
 */

export const config = {
  // Notion Configuration
  notion: {
    apiKey: process.env.NOTION_API_KEY || '',
    databaseId: process.env.NOTION_DATABASE_ID || '',

    // Notion database property mappings
    propertyMappings: {
      title: 'Name', // Default Notion title property
      status: 'Status', // For tracking processed/unprocessed pages
      tags: 'Tags',
      createdTime: 'Created time',
      lastEdited: 'Last edited time',
    },

    // Status values to filter pages
    statusValues: {
      ready: 'Ready to Publish', // Pages with this status will be processed
      processing: 'Processing',
      completed: 'Published',
      failed: 'Failed',
    },
  },

  // Claude API Configuration
  claude: {
    apiKey: process.env.ANTHROPIC_API_KEY || '',
    model: process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20240620',
    maxTokens: 4096,
    temperature: 0.7, // Slightly creative but consistent

    // Rate limiting
    rateLimit: {
      maxRequestsPerMinute: 50,
      maxImagesPerRequest: 5,
    },
  },

  // Content Generation Settings
  generation: {
    // Minimum content length from Notion to process
    minContentLength: 100,

    // Target blog post length
    targetWordCount: {
      min: 800,
      max: 2500,
    },

    // Number of existing posts to analyze for style
    styleAnalysisSampleSize: 10,

    // Cache duration for style profile (in seconds)
    styleCacheDuration: 7 * 24 * 60 * 60, // 1 week

    // Auto-generate featured image from first image
    autoFeaturedImage: true,

    // Minimum number of suggested tags
    minTags: 3,
    maxTags: 7,
  },

  // Processing Pipeline Settings
  pipeline: {
    // Enable/disable automation
    enabled: process.env.AUTO_DRAFT_ENABLED === 'true',

    // Processing timeout (milliseconds)
    timeout: 60000, // 60 seconds

    // Retry settings
    maxRetries: 3,
    retryDelayMs: 5000,

    // Default author ID for generated posts
    defaultAuthorId: process.env.DEFAULT_AUTHOR_ID || '',
  },

  // Media Handling
  media: {
    // Temporary storage for downloaded media
    tempDir: '/tmp/notion-media',

    // Maximum image size to process (bytes)
    maxImageSize: 10 * 1024 * 1024, // 10MB

    // Supported image formats
    supportedImageFormats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],

    // Video handling (extract frames for analysis)
    videoFrameCount: 3, // Number of frames to extract from video
  },

  // Polling Settings (if not using webhooks)
  polling: {
    enabled: process.env.NOTION_POLLING_ENABLED === 'true',
    intervalMinutes: 15,
  },

  // Logging
  logging: {
    enabled: true,
    logLevel: process.env.LOG_LEVEL || 'info',
    logProcessingSteps: true,
  },
};

/**
 * Validate configuration on startup
 */
export function validateConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!config.notion.apiKey && config.pipeline.enabled) {
    errors.push('NOTION_API_KEY is required when automation is enabled');
  }

  if (!config.notion.databaseId && config.pipeline.enabled) {
    errors.push('NOTION_DATABASE_ID is required when automation is enabled');
  }

  if (!config.claude.apiKey && config.pipeline.enabled) {
    errors.push('ANTHROPIC_API_KEY is required when automation is enabled');
  }

  if (!config.pipeline.defaultAuthorId && config.pipeline.enabled) {
    errors.push('DEFAULT_AUTHOR_ID is required when automation is enabled');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get configuration summary for debugging
 */
export function getConfigSummary() {
  return {
    notionConfigured: !!config.notion.apiKey,
    claudeConfigured: !!config.claude.apiKey,
    automationEnabled: config.pipeline.enabled,
    pollingEnabled: config.polling.enabled,
    model: config.claude.model,
  };
}
