/**
 * Notion to MongoDB Sync Script
 * 
 * Syncs published blog posts from Notion to MongoDB.
 * 
 * Usage: npx tsx scripts/sync-notion.ts
 * 
 * Environment Variables Required:
 *   - NOTION_TOKEN: Notion integration token
 *   - NOTION_DATABASE_ID: Notion database ID
 *   - MONGODB_URI: MongoDB connection string
 *   - MONGODB_DATABASE: MongoDB database name (default: blog_database)
 */

import { Client } from '@notionhq/client';
import { NotionToMarkdown } from 'notion-to-md';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// ─────────────────────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────────────────────

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID;
const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DATABASE = process.env.MONGODB_DATABASE || 'blog_database';
const DEFAULT_USER_ID = process.env.DEFAULT_USER_ID || 'notion-sync';

// Validate required environment variables
const requiredEnvVars = {
  NOTION_TOKEN,
  NOTION_DATABASE_ID,
  MONGODB_URI,
};

const missingVars = Object.entries(requiredEnvVars)
  .filter(([_, value]) => !value)
  .map(([key]) => key);

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingVars.join(', '));
  console.log('\nPlease set these in your .env file:');
  console.log('  NOTION_TOKEN=secret_xxxxxxx');
  console.log('  NOTION_DATABASE_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx');
  console.log('  MONGODB_URI=mongodb+srv://...');
  console.log('  MONGODB_DATABASE=blog_database (optional)');
  process.exit(1);
}

// ─────────────────────────────────────────────────────────────────────────────
// Initialize Clients
// ─────────────────────────────────────────────────────────────────────────────

const notion = new Client({ auth: NOTION_TOKEN });
const n2m = new NotionToMarkdown({ notionClient: notion });

// ─────────────────────────────────────────────────────────────────────────────
// Type Definitions
// ─────────────────────────────────────────────────────────────────────────────

interface NotionPage {
  id: string;
  properties: any;
  cover?: {
    type: string;
    external?: { url: string };
    file?: { url: string };
  };
  created_time: string;
  last_edited_time: string;
}

interface BlogPostDocument {
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featuredImage: string;
  tags: string[];
  userId: string;
  readTime: number;
  isFeatured: boolean;
  isPublished: boolean;
  draft: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastModified: Date;
  date: Date;
  coverImage: string; // Legacy field
  notionPageId?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Extract title from Notion page properties
 */
function extractTitle(properties: any): string {
  // Try common title property names
  const titleProp = properties.Name || properties.Title || properties.title;
  
  if (!titleProp) {
    console.warn('⚠️  No title property found');
    return 'Untitled';
  }

  if (titleProp.type === 'title' && titleProp.title?.length > 0) {
    return titleProp.title.map((t: any) => t.plain_text).join('');
  }

  return 'Untitled';
}

/**
 * Extract slug from Notion page properties or generate from title
 */
function extractSlug(properties: any, title: string): string {
  const slugProp = properties.Slug || properties.slug;
  
  if (slugProp?.type === 'rich_text' && slugProp.rich_text?.length > 0) {
    return slugProp.rich_text[0].plain_text;
  }

  // Generate slug from title
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

/**
 * Extract tags from Notion page properties
 */
function extractTags(properties: any): string[] {
  const tagsProp = properties.Tags || properties.tags || properties.Categories;
  
  if (!tagsProp) return [];

  if (tagsProp.type === 'multi_select') {
    return tagsProp.multi_select.map((tag: any) => tag.name);
  }

  if (tagsProp.type === 'select' && tagsProp.select) {
    return [tagsProp.select.name];
  }

  return [];
}

/**
 * Extract excerpt/summary from Notion page properties
 */
function extractExcerpt(properties: any, content: string): string {
  // Try to get from Summary/Excerpt property
  const excerptProp = properties.Summary || properties.Excerpt || properties.excerpt;
  
  if (excerptProp?.type === 'rich_text' && excerptProp.rich_text?.length > 0) {
    return excerptProp.rich_text.map((t: any) => t.plain_text).join('');
  }

  // Generate from content
  return generateExcerpt(content, 150);
}

/**
 * Generate excerpt from markdown content
 */
function generateExcerpt(markdown: string, maxLength: number = 150): string {
  // Strip markdown formatting
  let text = markdown
    .replace(/^#{1,6}\s+/gm, '')      // Headers
    .replace(/\*\*([^*]+)\*\*/g, '$1') // Bold
    .replace(/\*([^*]+)\*/g, '$1')     // Italic
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Links
    .replace(/`([^`]+)`/g, '$1')       // Inline code
    .replace(/```[\s\S]*?```/g, '')    // Code blocks
    .replace(/!\[.*?\]\(.*?\)/g, '')   // Images
    .replace(/^[-*+]\s+/gm, '')        // List markers
    .replace(/^\d+\.\s+/gm, '')        // Numbered lists
    .replace(/^>\s+/gm, '')            // Blockquotes
    .replace(/\n+/g, ' ')              // Newlines to spaces
    .replace(/\s+/g, ' ')              // Multiple spaces
    .trim();

  if (text.length <= maxLength) return text;
  
  const truncated = text.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  
  return (lastSpace > maxLength * 0.7 ? truncated.substring(0, lastSpace) : truncated) + '...';
}

/**
 * Extract featured image from Notion page
 */
function extractFeaturedImage(page: NotionPage): string {
  // Check cover image
  if (page.cover) {
    if (page.cover.type === 'external' && page.cover.external) {
      return page.cover.external.url;
    }
    if (page.cover.type === 'file' && page.cover.file) {
      return page.cover.file.url;
    }
  }
  
  // Check for custom FeaturedImage property
  const featuredImageProp = page.properties.FeaturedImage || page.properties['Featured Image'];
  if (featuredImageProp?.type === 'url' && featuredImageProp.url) {
    return featuredImageProp.url;
  }
  if (featuredImageProp?.type === 'files' && featuredImageProp.files?.length > 0) {
    const file = featuredImageProp.files[0];
    return file.type === 'external' ? file.external.url : file.file?.url || '';
  }

  return '';
}

/**
 * Calculate read time from content
 */
function calculateReadTime(content: string): number {
  const wordsPerMinute = 200;
  const words = content.replace(/[#*`\[\]()]/g, '').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / wordsPerMinute));
}

/**
 * Check if page status is "Published"
 */
function isPublished(properties: any): boolean {
  const statusProp = properties.Status || properties.status;
  
  if (!statusProp) return false;

  if (statusProp.type === 'status') {
    return statusProp.status?.name === 'Published';
  }

  if (statusProp.type === 'select') {
    return statusProp.select?.name === 'Published';
  }

  if (statusProp.type === 'checkbox') {
    return statusProp.checkbox === true;
  }

  return false;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Sync Functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch published pages from Notion database
 */
async function fetchPublishedPages(): Promise<NotionPage[]> {
  console.log('\n📥 Fetching pages from Notion...');
  
  try {
    // First, get database schema to check if Status property exists
    const database = await notion.databases.retrieve({
      database_id: NOTION_DATABASE_ID!
    });

    const statusProp = database.properties.Status || database.properties.status;
    
    let response;
    
    if (statusProp) {
      // Build filter based on property type
      let filter: any;
      
      if (statusProp.type === 'status') {
        filter = {
          property: 'Status',
          status: { equals: 'Published' }
        };
      } else if (statusProp.type === 'select') {
        filter = {
          property: 'Status',
          select: { equals: 'Published' }
        };
      } else if (statusProp.type === 'checkbox') {
        filter = {
          property: 'Status',
          checkbox: { equals: true }
        };
      }

      console.log('   Filtering by Status = "Published"');
      response = await notion.databases.query({
        database_id: NOTION_DATABASE_ID!,
        filter
      });
    } else {
      console.log('   ⚠️  No Status property found, fetching all pages');
      response = await notion.databases.query({
        database_id: NOTION_DATABASE_ID!
      });
    }

    console.log(`   Found ${response.results.length} page(s)`);
    return response.results as NotionPage[];
  } catch (error: any) {
    console.error('   ✗ Error fetching pages:', error.message);
    throw error;
  }
}

/**
 * Convert a Notion page to Markdown
 */
async function convertPageToMarkdown(pageId: string): Promise<string> {
  try {
    const mdBlocks = await n2m.pageToMarkdown(pageId);
    const mdString = n2m.toMarkdownString(mdBlocks);
    
    // notion-to-md returns an object with 'parent' property containing the markdown
    return typeof mdString === 'string' ? mdString : mdString.parent || '';
  } catch (error: any) {
    console.warn(`   ⚠️  Could not convert page to markdown: ${error.message}`);
    return ''; // Return empty string if conversion fails
  }
}

/**
 * Transform a Notion page into a MongoDB blog post document
 */
async function transformNotionPage(page: NotionPage): Promise<BlogPostDocument> {
  const title = extractTitle(page.properties);
  const slug = extractSlug(page.properties, title);
  const content = await convertPageToMarkdown(page.id);
  const tags = extractTags(page.properties);
  const featuredImage = extractFeaturedImage(page);
  const excerpt = extractExcerpt(page.properties, content);
  const readTime = calculateReadTime(content);
  const now = new Date();

  return {
    title,
    slug,
    content,
    excerpt,
    featuredImage,
    tags,
    userId: DEFAULT_USER_ID,
    readTime,
    isFeatured: false,
    isPublished: true,
    draft: false, // Important: set draft to false for published posts
    createdAt: new Date(page.created_time),
    updatedAt: now,
    lastModified: now,
    date: new Date(page.created_time),
    coverImage: featuredImage, // Legacy field for backward compatibility
    notionPageId: page.id,
  };
}

/**
 * Main sync function
 */
async function syncNotionToMongoDB() {
  console.log('🔄 Starting Notion → MongoDB Sync');
  console.log('═'.repeat(50));

  let mongoClient: MongoClient | null = null;
  
  try {
    // Connect to MongoDB
    console.log('\n🔌 Connecting to MongoDB...');
    mongoClient = new MongoClient(MONGODB_URI!);
    await mongoClient.connect();
    console.log('   ✓ Connected successfully');

    const db = mongoClient.db(MONGODB_DATABASE);
    const postsCollection = db.collection('posts');

    // Fetch published pages from Notion
    const pages = await fetchPublishedPages();

    if (pages.length === 0) {
      console.log('\n✨ No pages to sync. All caught up!');
      return;
    }

    // Process each page
    let syncedCount = 0;
    let updatedCount = 0;
    let insertedCount = 0;
    let errorCount = 0;

    for (const page of pages) {
      const title = extractTitle(page.properties);
      console.log(`\n📝 Processing: "${title}"`);

      try {
        // Transform Notion page to blog post document
        const blogPost = await transformNotionPage(page);
        console.log(`   Slug: ${blogPost.slug}`);
        console.log(`   Tags: ${blogPost.tags.join(', ') || 'none'}`);
        console.log(`   Read time: ${blogPost.readTime} min`);

        // Upsert into MongoDB (match by slug)
        const result = await postsCollection.updateOne(
          { slug: blogPost.slug },
          { 
            $set: {
              ...blogPost,
              updatedAt: new Date(),
              lastModified: new Date(),
            },
            $setOnInsert: { 
              createdAt: blogPost.createdAt,
              date: blogPost.createdAt,
            }
          },
          { upsert: true }
        );

        if (result.upsertedCount > 0) {
          console.log('   ✓ Inserted new post');
          insertedCount++;
        } else if (result.modifiedCount > 0) {
          console.log('   ✓ Updated existing post');
          updatedCount++;
        } else {
          console.log('   ✓ No changes needed');
        }

        syncedCount++;
      } catch (error: any) {
        console.error(`   ✗ Error: ${error.message}`);
        errorCount++;
      }
    }

    // Summary
    console.log('\n' + '═'.repeat(50));
    console.log('📊 Sync Summary');
    console.log(`   ✓ Total processed: ${syncedCount} post(s)`);
    console.log(`   ✓ Inserted: ${insertedCount} post(s)`);
    console.log(`   ✓ Updated: ${updatedCount} post(s)`);
    if (errorCount > 0) {
      console.log(`   ✗ Errors: ${errorCount} post(s)`);
    }
    console.log('═'.repeat(50));

  } catch (error: any) {
    console.error('\n❌ Sync failed:', error.message);
    throw error;
  } finally {
    // Close MongoDB connection
    if (mongoClient) {
      await mongoClient.close();
      console.log('\n🔌 MongoDB connection closed');
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Run the sync
// ─────────────────────────────────────────────────────────────────────────────

syncNotionToMongoDB()
  .then(() => {
    console.log('\n✅ Sync completed successfully!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Sync failed:', error);
    process.exit(1);
  });
