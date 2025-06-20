import { MongoClient } from 'mongodb';

const uri = "mongodb+srv://blog-admin-new:wrbnidP8UoFl4RCO@cluster0.br3z5.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const client = new MongoClient(uri);

async function migrateCollections() {
    try {
        await client.connect();
        const sourceDb = client.db('test');
        const targetDb = client.db('blog_database');
        
        // Collections to migrate
        const collections = ['posts', 'authors', 'comments'];
        
        for (const collectionName of collections) {
            console.log(`\nMigrating ${collectionName}...`);
            
            // Get all documents from source collection
            const documents = await sourceDb.collection(collectionName).find({}).toArray();
            console.log(`Found ${documents.length} documents in ${collectionName}`);
            
            if (documents.length > 0) {
                // Insert documents into target collection
                const result = await targetDb.collection(collectionName).insertMany(documents);
                console.log(`Successfully migrated ${result.insertedCount} documents to blog_database.${collectionName}`);
                
                // Drop the source collection
                await sourceDb.collection(collectionName).drop();
                console.log(`Dropped ${collectionName} from test database`);
            }
        }
        
        // Drop the test database after migration
        await client.db('test').dropDatabase();
        console.log('\nSuccessfully dropped test database');
        
        // Verify the migration
        console.log('\nVerifying migration...');
        const collections_after = await targetDb.listCollections().toArray();
        console.log('Collections in blog_database:');
        collections_after.forEach(coll => {
            console.log(` - ${coll.name}`);
        });
        
        // Count documents in each collection
        for (const collectionName of collections) {
            const count = await targetDb.collection(collectionName).countDocuments();
            console.log(`${collectionName}: ${count} documents`);
        }
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await client.close();
    }
}

migrateCollections(); 