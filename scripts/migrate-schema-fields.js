import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();

async function migrateFields() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DATABASE || 'blog_database';
  
  if (!uri) {
    console.error('MONGODB_URI not set in .env');
    process.exit(1);
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Connected to MongoDB');
    const db = client.db(dbName);
    const postsCollection = db.collection('posts');

    const posts = await postsCollection.find({}).toArray();
    console.log(`Found ${posts.length} posts to check.`);

    let updatedCount = 0;

    for (const post of posts) {
      const updateDoc = {};
      
      // Align isFeatured
      if (post.isFeatured === undefined) {
        updateDoc.isFeatured = !!post.featured;
      } else if (post.featured !== undefined && post.isFeatured !== post.featured) {
        // Sync them if they differ
        updateDoc.isFeatured = post.featured;
      }

      // Align isPublished (inverted from draft)
      if (post.isPublished === undefined) {
        updateDoc.isPublished = post.draft !== undefined ? !post.draft : true;
      }

      // Align featuredImage
      if (post.featuredImage === undefined && post.coverImage !== undefined) {
        updateDoc.featuredImage = post.coverImage;
      }

      // Align Timestamps
      if (post.createdAt === undefined && post.date !== undefined) {
        updateDoc.createdAt = post.date;
      }
      if (post.updatedAt === undefined && post.lastModified !== undefined) {
        updateDoc.updatedAt = post.lastModified;
      }

      if (Object.keys(updateDoc).length > 0) {
        await postsCollection.updateOne(
          { _id: post._id },
          { $set: updateDoc }
        );
        updatedCount++;
      }
    }

    console.log(`Migration complete. Updated ${updatedCount} posts.`);
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await client.close();
  }
}

migrateFields();
