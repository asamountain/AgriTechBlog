import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();

const uri = process.env.MONGODB_URI || "mongodb+srv://blog-admin-new:dIGhkAFqirrk8Gva@cluster0.br3z5.mongodb.net/blog_database?retryWrites=true&w=majority&appName=Cluster0";
const client = new MongoClient(uri);

async function listDatabases() {
    try {
        await client.connect();
        const databasesList = await client.db().admin().listDatabases();
        console.log("Databases:");
        databasesList.databases.forEach(db => {
            console.log(` - ${db.name} (${Math.round(db.sizeOnDisk / 1024 / 1024 * 100) / 100} MB)`);
        });

        // List collections in each database
        for (const dbInfo of databasesList.databases) {
            if (!['admin', 'local'].includes(dbInfo.name)) {
                const db = client.db(dbInfo.name);
                const collections = await db.listCollections().toArray();
                if (collections.length > 0) {
                    console.log(`\nCollections in ${dbInfo.name}:`);
                    collections.forEach(collection => {
                        console.log(` - ${collection.name}`);
                    });
                }
            }
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await client.close();
    }
}

listDatabases(); 