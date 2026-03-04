import type { VercelRequest, VercelResponse } from '@vercel/node';
import { MongoClient } from 'mongodb';
import { getMongoConfig } from './_shared/post-helpers.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const start = Date.now();
  const status: any = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    services: {
      mongodb: { status: 'unknown' }
    }
  };

  try {
    const { uri } = getMongoConfig();
    const client = new MongoClient(uri, { serverSelectionTimeoutMS: 2000 });
    
    await client.connect();
    await client.db().admin().ping();
    await client.close();
    
    status.services.mongodb = {
      status: 'healthy',
      latency: `${Date.now() - start}ms`
    };
  } catch (error) {
    status.status = 'error';
    status.services.mongodb = {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }

  const statusCode = status.status === 'ok' ? 200 : 503;
  res.status(statusCode).json(status);
}
