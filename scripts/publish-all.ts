/**
 * Publish All Posts Script
 * 
 * Updates all posts in MongoDB to be published (draft: false, isPublished: true)
 * 
 * Usage: npx tsx scripts/publish-all.ts
 * 
 * Environment Variables Required:
 *   - MONGODB_URI: MongoDB connection string
 *   - MONGODB_DATABASE: MongoDB database name (default: blog_database)
 */

import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// ─────────────────────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────────────────────

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DATABASE = process.env.MONGODB_DATABASE || 'blog_database';

// Validate required environment variables
if (!MONGODB_URI) {
  console.error('❌ Missing required environment variable: MONGODB_URI');
  console.log('\nPlease set this in your .env file:');
  console.log('  MONGODB_URI=mongodb+srv://...');
  process.exit(1);
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Function
// ─────────────────────────────────────────────────────────────────────────────

async function publishAllPosts() {
  console.log('📢 Publishing All Posts');
  console.log('═'.repeat(50));

  let mongoClient: MongoClient | null = null;
  
  try {
    // Connect to MongoDB
    console.log('\n🔌 Connecting to MongoDB...');
    console.log(`   Database: ${MONGODB_DATABASE}`);
    mongoClient = new MongoClient(MONGODB_URI);
    await mongoClient.connect();
    console.log('   ✓ Connected successfully');

    const db = mongoClient.db(MONGODB_DATABASE);
    const postsCollection = db.collection('posts');

    // Count total posts
    const totalPosts = await postsCollection.countDocuments();
    console.log(`\n📊 Total posts in database: ${totalPosts}`);

    if (totalPosts === 0) {
      console.log('\n⚠️  No posts found in the database.');
      return;
    }

    // Count currently published posts
    const publishedCount = await postsCollection.countDocuments({
      $or: [
        { isPublished: true },
        { draft: false }
      ]
    });
    console.log(`   Currently published: ${publishedCount}`);
    console.log(`   Currently hidden: ${totalPosts - publishedCount}`);

    // Count posts that need updating
    const needsUpdateCount = await postsCollection.countDocuments({
      $or: [
        { isPublished: { $ne: true } },
        { draft: { $ne: false } },
        { isPublished: { $exists: false } },
        { draft: { $exists: false } }
      ]
    });

    if (needsUpdateCount === 0) {
      console.log('\n✅ All posts are already published!');
      return;
    }

    console.log(`\n🔄 Updating ${needsUpdateCount} post(s)...`);

    // Update all posts to be published
    const result = await postsCollection.updateMany(
      {}, // Match all documents
      {
        $set: {
          isPublished: true,
          draft: false,
          updatedAt: new Date(),
          lastModified: new Date()
        }
      }
    );

    console.log('\n' + '═'.repeat(50));
    console.log('📊 Update Summary');
    console.log(`   ✓ Total posts: ${totalPosts}`);
    console.log(`   ✓ Modified: ${result.modifiedCount}`);
    console.log(`   ✓ Matched: ${result.matchedCount}`);
    console.log('═'.repeat(50));

    // Verify the update
    const finalPublishedCount = await postsCollection.countDocuments({
      isPublished: true,
      draft: false
    });
    console.log(`\n✅ All ${finalPublishedCount} posts are now published!`);

    // Show sample of updated posts
    console.log('\n📝 Sample of published posts:');
    const samplePosts = await postsCollection
      .find({})
      .project({ title: 1, slug: 1, isPublished: 1, draft: 1 })
      .limit(5)
      .toArray();

    samplePosts.forEach((post, index) => {
      console.log(`   ${index + 1}. "${post.title}"`);
      console.log(`      Slug: ${post.slug}`);
      console.log(`      Published: ${post.isPublished}, Draft: ${post.draft}`);
    });

    if (totalPosts > 5) {
      console.log(`   ... and ${totalPosts - 5} more posts`);
    }

  } catch (error: any) {
    console.error('\n❌ Failed to publish posts:', error.message);
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
// Run the script
// ─────────────────────────────────────────────────────────────────────────────

publishAllPosts()
  .then(() => {
    console.log('\n✅ Script completed successfully!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
