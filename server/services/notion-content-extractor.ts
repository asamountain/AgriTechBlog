/**
 * Notion Content Extractor Service
 *
 * Extracts content from Notion pages including text, images, and videos.
 * Converts Notion blocks to structured format for blog post generation.
 */

import { Client } from '@notionhq/client';
import { config } from '../config/notion-claude.config';
import type {
  PageObjectResponse,
  BlockObjectResponse,
  RichTextItemResponse,
} from '@notionhq/client/build/src/api-endpoints';

export interface MediaFile {
  url: string;
  type: 'image' | 'video';
  caption?: string;
  buffer?: Buffer;
}

export interface NotionPageData {
  title: string;
  textContent: string;
  images: MediaFile[];
  videos: MediaFile[];
  metadata: {
    created: Date;
    lastEdited: Date;
    tags?: string[];
  };
}

export interface ParsedContent {
  markdown: string;
  plainText: string;
}

export class NotionContentExtractor {
  private notion: Client;

  constructor(apiKey?: string) {
    const authKey = apiKey || config.notion.apiKey;
    console.log('[NotionExtractor] Init with key:', authKey ? 'present' : 'MISSING');
    this.notion = new Client({
      auth: authKey,
    });
    console.log('[NotionExtractor] Client type:', typeof this.notion);
    console.log('[NotionExtractor] Has databases:', !!this.notion.databases);
    console.log('[NotionExtractor] Databases type:', typeof this.notion.databases);
    if (this.notion.databases) {
      console.log('[NotionExtractor] Databases methods:', Object.keys(this.notion.databases).join(', '));
      console.log('[NotionExtractor] Has query method:', typeof (this.notion.databases as any).query);
    }
  }

  /**
   * Extract complete page data from Notion
   */
  async extractPage(pageId: string): Promise<NotionPageData> {
    try {
      // Fetch page metadata
      const page = await this.notion.pages.retrieve({ page_id: pageId }) as PageObjectResponse;

      // Fetch page blocks (content)
      const blocks = await this.getAllBlocks(pageId);

      // Parse title
      const title = this.extractTitle(page);

      // Parse blocks to markdown and extract media
      const { markdown, images, videos } = await this.parseBlocks(blocks);

      // Extract metadata
      const metadata = this.extractMetadata(page);

      return {
        title,
        textContent: markdown,
        images,
        videos,
        metadata,
      };
    } catch (error) {
      console.error('Error extracting Notion page:', error);
      throw new Error(`Failed to extract Notion page ${pageId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get all blocks from a page (handles pagination)
   */
  private async getAllBlocks(blockId: string): Promise<BlockObjectResponse[]> {
    const blocks: BlockObjectResponse[] = [];
    let hasMore = true;
    let startCursor: string | undefined;

    while (hasMore) {
      const response = await this.notion.blocks.children.list({
        block_id: blockId,
        start_cursor: startCursor,
        page_size: 100,
      });

      blocks.push(...(response.results as BlockObjectResponse[]));
      hasMore = response.has_more;
      startCursor = response.next_cursor || undefined;
    }

    return blocks;
  }

  /**
   * Extract title from page properties
   * Auto-detects the title property regardless of name
   */
  private extractTitle(page: PageObjectResponse): string {
    const properties = page.properties;

    // First, try the configured property mapping
    const configuredTitle = properties[config.notion.propertyMappings.title];
    if (configuredTitle && configuredTitle.type === 'title') {
      const titleText = configuredTitle.title.map(t => t.plain_text).join('');
      if (titleText) return titleText;
    }

    // If that fails, search for any property with type 'title'
    for (const [key, prop] of Object.entries(properties)) {
      if (prop.type === 'title') {
        const titleText = prop.title.map((t: any) => t.plain_text).join('');
        if (titleText) return titleText;
      }
    }

    return 'Untitled';
  }

  /**
   * Extract metadata from page properties
   */
  private extractMetadata(page: PageObjectResponse): NotionPageData['metadata'] {
    const properties = page.properties;

    // Extract tags if available
    let tags: string[] | undefined;
    const tagsProperty = properties[config.notion.propertyMappings.tags];
    if (tagsProperty && tagsProperty.type === 'multi_select') {
      tags = tagsProperty.multi_select.map(t => t.name);
    }

    return {
      created: new Date(page.created_time),
      lastEdited: new Date(page.last_edited_time),
      tags,
    };
  }

  /**
   * Parse Notion blocks to markdown and extract media
   */
  async parseBlocks(blocks: BlockObjectResponse[]): Promise<{
    markdown: string;
    images: MediaFile[];
    videos: MediaFile[];
  }> {
    const images: MediaFile[] = [];
    const videos: MediaFile[] = [];
    const markdownLines: string[] = [];

    for (const block of blocks) {
      try {
        const result = await this.parseBlock(block);

        if (result.markdown) {
          markdownLines.push(result.markdown);
        }

        if (result.media) {
          if (result.media.type === 'image') {
            images.push(result.media);
          } else if (result.media.type === 'video') {
            videos.push(result.media);
          }
        }

        // Handle child blocks (for nested content)
        if (block.has_children) {
          const childBlocks = await this.getAllBlocks(block.id);
          const childResult = await this.parseBlocks(childBlocks);

          if (childResult.markdown) {
            markdownLines.push(childResult.markdown);
          }

          images.push(...childResult.images);
          videos.push(...childResult.videos);
        }
      } catch (error) {
        console.error(`Error parsing block ${block.id}:`, error);
      }
    }

    return {
      markdown: markdownLines.join('\n\n'),
      images,
      videos,
    };
  }

  /**
   * Parse individual Notion block
   */
  private async parseBlock(block: BlockObjectResponse): Promise<{
    markdown?: string;
    media?: MediaFile;
  }> {
    const { type } = block;

    switch (type) {
      case 'paragraph':
        return { markdown: this.richTextToMarkdown(block.paragraph.rich_text) };

      case 'heading_1':
        return { markdown: `# ${this.richTextToMarkdown(block.heading_1.rich_text)}` };

      case 'heading_2':
        return { markdown: `## ${this.richTextToMarkdown(block.heading_2.rich_text)}` };

      case 'heading_3':
        return { markdown: `### ${this.richTextToMarkdown(block.heading_3.rich_text)}` };

      case 'bulleted_list_item':
        return { markdown: `- ${this.richTextToMarkdown(block.bulleted_list_item.rich_text)}` };

      case 'numbered_list_item':
        return { markdown: `1. ${this.richTextToMarkdown(block.numbered_list_item.rich_text)}` };

      case 'code':
        const language = block.code.language || '';
        const code = this.richTextToMarkdown(block.code.rich_text);
        return { markdown: `\`\`\`${language}\n${code}\n\`\`\`` };

      case 'quote':
        return { markdown: `> ${this.richTextToMarkdown(block.quote.rich_text)}` };

      case 'callout':
        return { markdown: `> 💡 ${this.richTextToMarkdown(block.callout.rich_text)}` };

      case 'divider':
        return { markdown: '---' };

      case 'image':
        const imageUrl = block.image.type === 'external'
          ? block.image.external.url
          : block.image.file.url;
        const imageCaption = block.image.caption
          ? this.richTextToMarkdown(block.image.caption)
          : undefined;

        return {
          markdown: `![${imageCaption || 'Image'}](${imageUrl})`,
          media: { url: imageUrl, type: 'image', caption: imageCaption },
        };

      case 'video':
        const videoUrl = block.video.type === 'external'
          ? block.video.external.url
          : block.video.file.url;
        const videoCaption = block.video.caption
          ? this.richTextToMarkdown(block.video.caption)
          : undefined;

        return {
          markdown: `[Video: ${videoCaption || 'Watch video'}](${videoUrl})`,
          media: { url: videoUrl, type: 'video', caption: videoCaption },
        };

      case 'bookmark':
        const bookmarkUrl = block.bookmark.url;
        const bookmarkCaption = block.bookmark.caption
          ? this.richTextToMarkdown(block.bookmark.caption)
          : 'Link';
        return { markdown: `[${bookmarkCaption}](${bookmarkUrl})` };

      case 'link_preview':
        return { markdown: `[Link](${block.link_preview.url})` };

      case 'table_of_contents':
        return { markdown: '' }; // Skip TOC

      default:
        console.log(`Unsupported block type: ${type}`);
        return {};
    }
  }

  /**
   * Convert Notion rich text to markdown
   */
  private richTextToMarkdown(richText: RichTextItemResponse[]): string {
    return richText.map(text => {
      let content = text.plain_text;

      // Apply formatting
      if (text.annotations.bold) {
        content = `**${content}**`;
      }
      if (text.annotations.italic) {
        content = `*${content}*`;
      }
      if (text.annotations.code) {
        content = `\`${content}\``;
      }
      if (text.annotations.strikethrough) {
        content = `~~${content}~~`;
      }

      // Handle links
      if (text.href) {
        content = `[${content}](${text.href})`;
      }

      return content;
    }).join('');
  }

  /**
   * Download media file from URL
   */
  async downloadMedia(url: string): Promise<Buffer> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to download media: ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      console.error('Error downloading media:', error);
      throw error;
    }
  }

  /**
   * Get database schema and auto-detect property names
   */
  async getDatabaseSchema(): Promise<{
    titleProperty: string;
    properties: Record<string, any>;
  }> {
    try {
      const database = await this.notion.databases.retrieve({
        database_id: config.notion.databaseId,
      });

      // Find the title property
      let titleProperty = 'Name'; // default
      const db = database as any;
      if (db.properties) {
        for (const [key, prop] of Object.entries(db.properties)) {
          if ((prop as any).type === 'title') {
            titleProperty = key;
            break;
          }
        }
      }

      return {
        titleProperty,
        properties: db.properties || {},
      };
    } catch (error) {
      console.error('Error fetching database schema:', error);
      throw error;
    }
  }

  /**
   * Query database for pages with specific status
   * Now with pagination support to fetch ALL pages
   */
  async queryDatabase(statusFilter?: string): Promise<PageObjectResponse[]> {
    try {
      const filter = statusFilter
        ? {
            property: config.notion.propertyMappings.status,
            status: {
              equals: statusFilter,
            },
          }
        : undefined;

      const allPages: PageObjectResponse[] = [];
      let hasMore = true;
      let startCursor: string | undefined;

      // Fetch all pages with pagination
      while (hasMore) {
        const response = await fetch(
          `https://api.notion.com/v1/databases/${config.notion.databaseId}/query`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${config.notion.apiKey}`,
              'Notion-Version': '2022-06-28',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              filter,
              start_cursor: startCursor,
              page_size: 100,
            }),
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Notion API error: ${response.statusText} - ${errorText}`);
        }

        const data = await response.json();
        allPages.push(...(data.results as PageObjectResponse[]));
        hasMore = data.has_more;
        startCursor = data.next_cursor || undefined;

        console.log(`[NotionExtractor] Fetched ${data.results.length} pages, total: ${allPages.length}, hasMore: ${hasMore}`);
      }

      console.log(`[NotionExtractor] Total pages fetched: ${allPages.length}`);
      return allPages;
    } catch (error) {
      console.error('Error querying Notion database:', error);
      throw error;
    }
  }

  /**
   * Update page status
   */
  async updatePageStatus(pageId: string, status: string): Promise<void> {
    try {
      await this.notion.pages.update({
        page_id: pageId,
        properties: {
          [config.notion.propertyMappings.status]: {
            status: {
              name: status,
            },
          },
        },
      });
    } catch (error) {
      console.error('Error updating page status:', error);
      throw error;
    }
  }
}
