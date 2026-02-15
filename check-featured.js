import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();

async function findFeaturedPosts() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DATABASE || 'blog_database';
  if (!uri) {
    console.error('MONGODB_URI not set in .env');
    process.exit(1);
  }
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db(dbName);
    const postsCollection = db.collection('posts');
    
    const filter = { featured: true };
    filter.$or = [
      { isPublished: true },
      { isPublished: { $exists: false }, draft: { $ne: true } }
    ];
    
    console.log('Query:', JSON.stringify(filter, null, 2));
    const featuredPosts = await postsCollection.find(filter).sort({ date: -1 }).limit(3).toArray();
    console.log(`Found ${featuredPosts.length} featured posts.`);
    
    featuredPosts.forEach(post => {
      console.log(`- Title: ${post.title}`);
      console.log(`  _id: ${post._id}, id: ${post.id}`);
      console.log(`  featured: ${post.featured}, isFeatured: ${post.isFeatured}`);
      console.log(`  draft: ${post.draft}, isPublished: ${post.isPublished}`);
      console.log(`  date: ${post.date}, slug: ${post.slug}`);
    });
    
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.close();
  }
}

findFeaturedPosts();
