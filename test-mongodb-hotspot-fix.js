import { MongoClient } from 'mongodb';

const MONGODB_URI_MOBILE = "mongodb://blog-admin-new:dIGhkAFqirrk8Gva@cluster0-shard-00-00.br3z5.mongodb.net:27017,cluster0-shard-00-01.br3z5.mongodb.net:27017,cluster0-shard-00-02.br3z5.mongodb.net:27017/blog_database?ssl=true&replicaSet=atlas-br3z5-shard-0&authSource=admin&retryWrites=true&w=majority";
const databaseName = "blog_database";

async function testMobileConnection() {
  console.log("🔗 Testing MongoDB Mobile Hotspot Connection (Direct Shards)...");
  
  const client = new MongoClient(MONGODB_URI_MOBILE, {
    serverSelectionTimeoutMS: 10000,
  });

  try {
    console.log("Attempting to connect...");
    await client.connect();
    console.log("✅ Successfully connected to MongoDB using direct shard connection!");
    
    const db = client.db(databaseName);
    await db.admin().ping();
    console.log("✅ Database ping successful");
    
    const collections = await db.listCollections().toArray();
    console.log(`✅ Found ${collections.length} collections`);
    
  } catch (error) {
    console.error(`❌ Connection failed: ${error.message}`);
  } finally {
    await client.close();
    console.log("Connection closed");
  }
}

testMobileConnection();
