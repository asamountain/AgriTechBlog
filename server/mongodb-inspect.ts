import { loadEnvironment } from './local-env-loader';
loadEnvironment();
import { MongoClient } from 'mongodb';

async function inspectMongoDB() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DATABASE || 'blog';
  if (!uri) {
    console.error('MONGODB_URI not set in .env');
    process.exit(1);
  }
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db(dbName);
    const collections = await db.listCollections().toArray();
    console.log(`Database: ${dbName}`);
    for (const col of collections) {
      const collection = db.collection(col.name);
      const sample = await collection.findOne();
      console.log(`\nCollection: ${col.name}`);
      if (sample) {
        console.log('Sample document:', JSON.stringify(sample, null, 2));
      } else {
        console.log('No documents in this collection.');
      }
    }
  } catch (err) {
    console.error('Error inspecting MongoDB:', err);
  } finally {
    await client.close();
  }
}

inspectMongoDB(); 