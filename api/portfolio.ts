import type { VercelRequest, VercelResponse } from '@vercel/node';
import { MongoClient } from 'mongodb';
import { getMongoConfig } from './_shared/post-helpers.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { uri, dbName } = getMongoConfig();
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db(dbName);
    const projectsCollection = db.collection('projects');

    if (req.method === 'GET') {
      const docs = await projectsCollection
        .find({ isPublished: true })
        .sort({ createdAt: -1 })
        .toArray();
      
      const projects = docs.map(doc => {
        const { _id, ...rest } = doc;
        return { id: doc.id || _id.toString(), ...rest };
      });

      return res.status(200).json(projects);
    } 
    
    if (req.method === 'POST') {
      const projectData = req.body;
      const now = new Date();
      
      const newProject = {
        title: projectData.title || 'Untitled Project',
        description: projectData.description || '',
        content: projectData.content || projectData.description || '',
        category: projectData.category || 'AgriTech',
        impact: projectData.impact || '',
        featuredImage: projectData.featuredImage || '',
        technologies: Array.isArray(projectData.technologies) ? projectData.technologies : [],
        slug: projectData.slug || (projectData.title || 'project').toLowerCase().replace(/[^a-z0-9]/g, '-'),
        createdAt: now,
        updatedAt: now,
        isPublished: projectData.isPublished !== false
      };

      const result = await projectsCollection.insertOne(newProject);
      const generatedId = parseInt(result.insertedId.toString().substring(0, 8), 16);
      
      await projectsCollection.updateOne(
        { _id: result.insertedId },
        { $set: { id: generatedId } }
      );

      return res.status(201).json({ id: generatedId, ...newProject });
    }

    res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('Portfolio API error:', error);
    res.status(500).json({ message: 'Internal server error', error: error instanceof Error ? error.message : 'Unknown' });
  } finally {
    await client.close();
  }
}
