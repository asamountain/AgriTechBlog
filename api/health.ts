import type { VercelRequest, VercelResponse } from '@vercel/node';
import { MongoClient } from 'mongodb';
import { getMongoConfig } from './_shared/post-helpers.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { uri, dbName } = getMongoConfig();
  
  const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 5000,
  });

  try {
    const startTime = Date.now();
    await client.connect();
    const db = client.db(dbName);
    
    // Ping database
    await db.command({ ping: 1 });
    
    const collections = await db.listCollections().toArray();
    const postsCount = await db.collection('posts').countDocuments();
    
    const duration = Date.now() - startTime;

    res.status(200).json({
      status: 'connected',
      database: dbName,
      duration: `${duration}ms`,
      collections: collections.map(c => c.name),
      postsCount,
      environment: process.env.NODE_ENV,
      vercel: !!process.env.VERCEL
    });
  } catch (error) {
    const err = error as any;
    res.status(500).json({
      status: 'error',
      message: err.message,
      code: err.code,
      name: err.name,
      stack: err.stack,
      dbName,
      uri: uri.replace(/:\/\/([^:]+):([^@]+)@/, '://[USER]:[PASS]@')
    });
  } finally {
    await client.close();
  }
}
