import type { VercelRequest, VercelResponse } from '@vercel/node';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI!;
const dbName = process.env.MONGODB_DATABASE || 'blog_database';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (!uri) return res.status(500).json({ message: 'MONGODB_URI not set' });

  const client = new MongoClient(uri);

  try {
    await client.connect();
    const collection = client.db(dbName).collection('timeline-images');

    if (req.method === 'GET') {
      const docs = await collection.find({}).toArray();
      const map: Record<string, { images: string[] }> = {};
      for (const doc of docs) {
        // support both old single-image format and new array format
        const images: string[] = Array.isArray(doc.images)
          ? doc.images
          : doc.imageUrl ? [doc.imageUrl] : [];
        map[doc.entryId] = { images };
      }
      return res.status(200).json(map);
    }

    if (req.method === 'POST') {
      const { entryId, images } = req.body || {};
      if (!entryId || !Array.isArray(images)) {
        return res.status(400).json({ message: 'entryId and images[] are required' });
      }
      const filtered = images.filter(Boolean).slice(0, 3);
      await collection.updateOne(
        { entryId },
        { $set: { entryId, images: filtered, updatedAt: new Date() } },
        { upsert: true }
      );
      return res.status(200).json({ ok: true });
    }

    if (req.method === 'DELETE') {
      const entryId = Array.isArray(req.query.entryId) ? req.query.entryId[0] : req.query.entryId;
      if (!entryId) return res.status(400).json({ message: 'entryId query param is required' });
      await collection.deleteOne({ entryId });
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (err) {
    console.error('timeline-images error:', err);
    return res.status(500).json({ message: err instanceof Error ? err.message : 'Internal server error' });
  } finally {
    await client.close();
  }
}
