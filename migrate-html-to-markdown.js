import { MongoClient } from 'mongodb';
import TurndownService from 'turndown';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Configure turndown for optimal markdown conversion
const turndownService = new TurndownService({
  headingStyle: 'atx', // Use # for headings
  hr: '---',
  bulletListMarker: '-',
  codeBlockStyle: 'fenced',
  fence: '```',
  emDelimiter: '*',
  strongDelimiter: '**',
  linkStyle: 'inlined',
  linkReferenceStyle: 'full'
});

// Add custom rules for better conversion
turndownService.addRule('lineBreaks', {
  filter: 'br',
  replacement: function () {
    return '\n\n';
  }
});

turndownService.addRule('paragraphs', {
  filter: 'p',
  replacement: function (content) {
    return '\n\n' + content + '\n\n';
  }
});

turndownService.addRule('preserveTargetBlank', {
  filter: function (node) {
    return (
      node.nodeName === 'A' &&
      node.getAttribute('target') === '_blank'
    );
  },
  replacement: function (content, node) {
    const href = node.getAttribute('href');
    const rel = node.getAttribute('rel');
    if (rel && rel.includes('noopener') && rel.includes('noreferrer')) {
      return `[${content}](${href})`;
    }
    return `[${content}](${href})`;
  }
});

/**
 * Convert HTML content to markdown format
 */
function htmlToMarkdown(htmlContent) {
  if (!htmlContent || typeof htmlContent !== 'string') {
    return '';
  }

  // If content doesn't contain HTML tags, return as is
  if (!htmlContent.includes('<') || !htmlContent.includes('>')) {
    return htmlContent;
  }

  try {
    // Convert HTML to markdown
    let markdown = turndownService.turndown(htmlContent);
    
    // Clean up common issues
    markdown = markdown
      // Remove excessive line breaks (more than 2)
      .replace(/\n{3,}/g, '\n\n')
      // Fix heading spacing
      .replace(/^(#{1,6})\s*/gm, '$1 ')
      // Clean up list formatting
      .replace(/^\s*[-*+]\s+/gm, '- ')
      // Remove trailing whitespace
      .replace(/[ \t]+$/gm, '')
      // Ensure proper spacing around headings
      .replace(/\n(#{1,6}\s)/g, '\n\n$1')
      .replace(/(#{1,6}\s.*)\n/g, '$1\n\n')
      // Clean up blockquotes
      .replace(/^\s*>\s*/gm, '> ')
      // Fix code block formatting
      .replace(/```(\w+)?\n\n/g, '```$1\n')
      .replace(/\n\n```/g, '\n```')
      // Remove any remaining HTML entities
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");

    // Trim and ensure content ends with single newline
    markdown = markdown.trim();
    
    return markdown;
  } catch (error) {
    console.error('Error converting HTML to markdown:', error);
    // Fallback: strip HTML tags manually
    return htmlContent.replace(/<[^>]*>/g, '').trim();
  }
}

/**
 * Check if content contains HTML tags
 */
function containsHtml(content) {
  if (!content || typeof content !== 'string') {
    return false;
  }
  
  // Check for common HTML patterns
  const htmlPattern = /<\/?[a-z][\s\S]*>/i;
  return htmlPattern.test(content);
}

/**
 * Main migration function
 */
async function migrateHtmlToMarkdown() {
  const uri = process.env.MONGODB_URI;
  
  if (!uri) {
    console.error('❌ MONGODB_URI environment variable is not set');
    process.exit(1);
  }

  const client = new MongoClient(uri);
  
  try {
    console.log('🚀 Starting HTML to Markdown migration...');
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db('blog_database');
    const collection = db.collection('posts');
    
    // Find all posts
    const posts = await collection.find({}).toArray();
    console.log(`📄 Found ${posts.length} posts to process`);
    
    let convertedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    for (const post of posts) {
      try {
        const postId = post._id;
        const title = post.title || 'Untitled';
        const content = post.content || '';
        const excerpt = post.excerpt || '';
        
        console.log(`\n📝 Processing: "${title}"`);
        
        let hasChanges = false;
        const updates = {};
        
        // Check and convert content
        if (containsHtml(content)) {
          const markdownContent = htmlToMarkdown(content);
          updates.content = markdownContent;
          hasChanges = true;
          console.log(`   ✨ Converted content (${content.length} → ${markdownContent.length} chars)`);
        } else {
          console.log(`   ⏭️  Content already in markdown format`);
        }
        
        // Check and convert excerpt
        if (containsHtml(excerpt)) {
          const markdownExcerpt = htmlToMarkdown(excerpt);
          updates.excerpt = markdownExcerpt;
          hasChanges = true;
          console.log(`   ✨ Converted excerpt (${excerpt.length} → ${markdownExcerpt.length} chars)`);
        }
        
        // Update the post if there are changes
        if (hasChanges) {
          updates.lastModified = new Date();
          updates.htmlConverted = true; // Flag to track conversion
          
          await collection.updateOne(
            { _id: postId },
            { $set: updates }
          );
          
          convertedCount++;
          console.log(`   ✅ Updated post in database`);
        } else {
          skippedCount++;
          console.log(`   ⏭️  No conversion needed`);
        }
        
      } catch (error) {
        errorCount++;
        console.error(`   ❌ Error processing post "${post.title}":`, error.message);
      }
    }
    
    console.log('\n📊 Migration Summary:');
    console.log(`   ✅ Converted: ${convertedCount} posts`);
    console.log(`   ⏭️  Skipped: ${skippedCount} posts`);
    console.log(`   ❌ Errors: ${errorCount} posts`);
    console.log(`   📄 Total: ${posts.length} posts`);
    
    if (convertedCount > 0) {
      console.log('\n🎉 HTML to Markdown migration completed successfully!');
      console.log('\n💡 Next steps:');
      console.log('   1. Verify converted content in your blog');
      console.log('   2. Test the edit functionality');
      console.log('   3. Check that markdown rendering looks correct');
    } else {
      console.log('\n✨ No HTML content found - all posts already in markdown format!');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Add dry-run option
const isDryRun = process.argv.includes('--dry-run');

if (isDryRun) {
  console.log('🔍 DRY RUN MODE - No changes will be made to the database');
  
  // Modify the migration function for dry run
  const originalMigration = migrateHtmlToMarkdown;
  migrateHtmlToMarkdown = async function() {
    const uri = process.env.MONGODB_URI;
    
    if (!uri) {
      console.error('❌ MONGODB_URI environment variable is not set');
      process.exit(1);
    }

    const client = new MongoClient(uri);
    
    try {
      console.log('🚀 Starting HTML to Markdown migration analysis...');
      await client.connect();
      console.log('✅ Connected to MongoDB');
      
      const db = client.db('blog_database');
      const collection = db.collection('posts');
      
      const posts = await collection.find({}).toArray();
      console.log(`📄 Found ${posts.length} posts to analyze`);
      
      let wouldConvertCount = 0;
      let wouldSkipCount = 0;
      
      for (const post of posts) {
        const title = post.title || 'Untitled';
        const content = post.content || '';
        const excerpt = post.excerpt || '';
        
        console.log(`\n📝 Analyzing: "${title}"`);
        
        let wouldConvert = false;
        
        if (containsHtml(content)) {
          console.log(`   🔄 Content contains HTML - would convert`);
          wouldConvert = true;
        }
        
        if (containsHtml(excerpt)) {
          console.log(`   🔄 Excerpt contains HTML - would convert`);
          wouldConvert = true;
        }
        
        if (wouldConvert) {
          wouldConvertCount++;
          console.log(`   ✨ Would update this post`);
        } else {
          wouldSkipCount++;
          console.log(`   ⏭️  Would skip this post`);
        }
      }
      
      console.log('\n📊 Dry Run Summary:');
      console.log(`   ✨ Would convert: ${wouldConvertCount} posts`);
      console.log(`   ⏭️  Would skip: ${wouldSkipCount} posts`);
      console.log(`   📄 Total: ${posts.length} posts`);
      
      if (wouldConvertCount > 0) {
        console.log('\n🚀 To run the actual migration, use:');
        console.log('   node migrate-html-to-markdown.js');
      }
      
    } catch (error) {
      console.error('❌ Analysis failed:', error);
      process.exit(1);
    } finally {
      await client.close();
      console.log('\n🔌 Disconnected from MongoDB');
    }
  };
}

// Run the migration
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateHtmlToMarkdown().catch(console.error);
} 