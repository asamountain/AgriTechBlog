#!/usr/bin/env node

import { MongoClient } from 'mongodb';
import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { eq, desc } from 'drizzle-orm';
import { users, authors, blogPosts, comments } from './shared/schema.ts';
import ws from 'ws';
import { neonConfig } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

neonConfig.webSocketConstructor = ws;

// Database connections
const mongoUri = process.env.MONGODB_URI;
const postgresUri = process.env.DATABASE_URL;

if (!mongoUri) {
  console.error('MONGODB_URI not found in environment variables');
  process.exit(1);
}

if (!postgresUri) {
  console.error('DATABASE_URL not found in environment variables');
  process.exit(1);
}

const pgPool = new Pool({ connectionString: postgresUri });
const db = drizzle({ client: pgPool });

let mongoClient;
let mongoDb;

async function connectToMongoDB() {
  try {
    console.log('Connecting to MongoDB...');
    mongoClient = new MongoClient(mongoUri);
    await mongoClient.connect();
    mongoDb = mongoClient.db('blog_database');
    console.log('Successfully connected to MongoDB');
    return true;
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error.message);
    return false;
  }
}

async function migrateUsers() {
  try {
    console.log('\n=== Migrating Users ===');
    const mongoUsers = await mongoDb.collection('users').find({}).toArray();
    console.log(`Found ${mongoUsers.length} users in MongoDB`);
    
    if (mongoUsers.length === 0) {
      console.log('No users to migrate');
      return;
    }

    for (const user of mongoUsers) {
      try {
        // Check if user already exists
        const existingUser = await db.select().from(users).where(eq(users.username, user.username));
        
        if (existingUser.length > 0) {
          console.log(`User ${user.username} already exists, skipping...`);
          continue;
        }

        const userData = {
          username: user.username || user.name || `user_${user._id}`,
          password: user.password || 'migrated_password_needs_reset'
        };

        const [newUser] = await db.insert(users).values(userData).returning();
        console.log(`Migrated user: ${newUser.username} (ID: ${newUser.id})`);
      } catch (error) {
        console.error(`Error migrating user ${user._id}:`, error.message);
      }
    }
  } catch (error) {
    console.error('Error during user migration:', error.message);
  }
}

async function migrateAuthors() {
  try {
    console.log('\n=== Migrating Authors ===');
    const mongoAuthors = await mongoDb.collection('authors').find({}).toArray();
    console.log(`Found ${mongoAuthors.length} authors in MongoDB`);
    
    if (mongoAuthors.length === 0) {
      console.log('No authors to migrate');
      return;
    }

    for (const author of mongoAuthors) {
      try {
        // Check if author already exists
        const existingAuthor = await db.select().from(authors).where(eq(authors.email, author.email));
        
        if (existingAuthor.length > 0) {
          console.log(`Author ${author.email} already exists, skipping...`);
          continue;
        }

        const authorData = {
          name: author.name || 'Unknown Author',
          email: author.email || `author_${author._id}@example.com`,
          bio: author.bio || null,
          avatar: author.avatar || null,
          userId: author.userId || null,
          linkedinUrl: author.linkedinUrl || null,
          instagramUrl: author.instagramUrl || null,
          youtubeUrl: author.youtubeUrl || null,
          githubUrl: author.githubUrl || null,
          portfolioUrl: author.portfolioUrl || null
        };

        const [newAuthor] = await db.insert(authors).values(authorData).returning();
        console.log(`Migrated author: ${newAuthor.name} (ID: ${newAuthor.id})`);
      } catch (error) {
        console.error(`Error migrating author ${author._id}:`, error.message);
      }
    }
  } catch (error) {
    console.error('Error during author migration:', error.message);
  }
}

async function migrateBlogPosts() {
  try {
    console.log('\n=== Migrating Blog Posts ===');
    const mongoPosts = await mongoDb.collection('blog_posts').find({}).toArray();
    console.log(`Found ${mongoPosts.length} blog posts in MongoDB`);
    
    if (mongoPosts.length === 0) {
      console.log('No blog posts to migrate');
      return;
    }

    // Get all existing authors for reference
    const pgAuthors = await db.select().from(authors);
    const authorMap = new Map(pgAuthors.map(a => [a.email, a.id]));

    for (const post of mongoPosts) {
      try {
        // Check if post already exists
        const existingPost = await db.select().from(blogPosts).where(eq(blogPosts.slug, post.slug));
        
        if (existingPost.length > 0) {
          console.log(`Post ${post.slug} already exists, skipping...`);
          continue;
        }

        // Find author ID - try to match by email or use first author
        let authorId = 1; // Default to first author
        if (post.author && post.author.email && authorMap.has(post.author.email)) {
          authorId = authorMap.get(post.author.email);
        } else if (pgAuthors.length > 0) {
          authorId = pgAuthors[0].id;
        }

        const postData = {
          title: post.title || 'Untitled Post',
          slug: post.slug || `post-${post._id}`,
          excerpt: post.excerpt || '',
          content: post.content || '',
          featuredImage: post.featuredImage || '',
          authorId: authorId,
          userId: post.userId || 'migrated-user',
          tags: Array.isArray(post.tags) ? post.tags : [],
          readTime: post.readTime || 5,
          isFeatured: post.isFeatured || false,
          isPublished: post.isPublished !== false, // Default to published unless explicitly false
          createdAt: post.createdAt ? new Date(post.createdAt) : new Date(),
          updatedAt: post.updatedAt ? new Date(post.updatedAt) : new Date()
        };

        const [newPost] = await db.insert(blogPosts).values(postData).returning();
        console.log(`Migrated post: ${newPost.title} (ID: ${newPost.id})`);
      } catch (error) {
        console.error(`Error migrating post ${post._id}:`, error.message);
      }
    }
  } catch (error) {
    console.error('Error during blog post migration:', error.message);
  }
}

async function migrateComments() {
  try {
    console.log('\n=== Migrating Comments ===');
    const mongoComments = await mongoDb.collection('comments').find({}).toArray();
    console.log(`Found ${mongoComments.length} comments in MongoDB`);
    
    if (mongoComments.length === 0) {
      console.log('No comments to migrate');
      return;
    }

    // Get all existing posts for reference
    const pgPosts = await db.select().from(blogPosts);
    const postMap = new Map(pgPosts.map(p => [p.slug, p.id]));

    for (const comment of mongoComments) {
      try {
        // Find the corresponding blog post
        let blogPostId = null;
        if (comment.postSlug && postMap.has(comment.postSlug)) {
          blogPostId = postMap.get(comment.postSlug);
        } else if (comment.blogPostId) {
          blogPostId = comment.blogPostId;
        }

        if (!blogPostId) {
          console.log(`Skipping comment ${comment._id} - no matching blog post found`);
          continue;
        }

        const commentData = {
          blogPostId: blogPostId,
          parentId: comment.parentId || null,
          authorName: comment.authorName || 'Anonymous',
          authorEmail: comment.authorEmail || 'anonymous@example.com',
          content: comment.content || '',
          createdAt: comment.createdAt ? new Date(comment.createdAt) : new Date(),
          isApproved: comment.isApproved || false
        };

        const [newComment] = await db.insert(comments).values(commentData).returning();
        console.log(`Migrated comment from ${newComment.authorName} (ID: ${newComment.id})`);
      } catch (error) {
        console.error(`Error migrating comment ${comment._id}:`, error.message);
      }
    }
  } catch (error) {
    console.error('Error during comment migration:', error.message);
  }
}

async function generateMigrationReport() {
  try {
    console.log('\n=== Migration Report ===');
    
    const userCount = await db.select().from(users);
    const authorCount = await db.select().from(authors);
    const postCount = await db.select().from(blogPosts);
    const commentCount = await db.select().from(comments);
    
    console.log(`PostgreSQL Database Summary:`);
    console.log(`- Users: ${userCount.length}`);
    console.log(`- Authors: ${authorCount.length}`);
    console.log(`- Blog Posts: ${postCount.length}`);
    console.log(`- Comments: ${commentCount.length}`);
    
    console.log(`\nRecent Blog Posts:`);
    const recentPosts = await db.select().from(blogPosts).orderBy(desc(blogPosts.createdAt)).limit(5);
    recentPosts.forEach(post => {
      console.log(`- ${post.title} (${post.isPublished ? 'Published' : 'Draft'})`);
    });
    
  } catch (error) {
    console.error('Error generating migration report:', error.message);
  }
}

async function main() {
  try {
    console.log('Starting MongoDB to PostgreSQL migration...');
    
    const mongoConnected = await connectToMongoDB();
    
    if (!mongoConnected) {
      console.log('\nMongoDB connection failed. Creating sample data in PostgreSQL instead...');
      
      // If MongoDB is not accessible, ensure we have some basic data in PostgreSQL
      console.log('Checking PostgreSQL for existing data...');
      const existingPosts = await db.select().from(blogPosts);
      console.log(`Found ${existingPosts.length} existing posts in PostgreSQL`);
      
      if (existingPosts.length === 0) {
        console.log('No existing data found. The sample data should already be initialized.');
      }
      
      await generateMigrationReport();
      return;
    }

    // Perform migrations in order (due to foreign key dependencies)
    await migrateUsers();
    await migrateAuthors();
    await migrateBlogPosts();
    await migrateComments();
    
    await generateMigrationReport();
    
    console.log('\n✅ Migration completed successfully!');
    
  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  } finally {
    if (mongoClient) {
      await mongoClient.close();
      console.log('MongoDB connection closed');
    }
    if (pgPool) {
      await pgPool.end();
      console.log('PostgreSQL connection closed');
    }
  }
}

// Run the migration
main().catch(console.error);