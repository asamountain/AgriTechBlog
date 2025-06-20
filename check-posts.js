import { MongoClient } from 'mongodb';

const uri = "mongodb+srv://blog-admin-new:wrbnidP8UoFl4RCO@cluster0.br3z5.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0";
const client = new MongoClient(uri);

async function checkPosts() {
    try {
        await client.connect();
        const db = client.db('test');
        
        // Check posts
        const posts = await db.collection('posts').find({}).toArray();
        console.log('\nPosts found:', posts.length);
        if (posts.length > 0) {
            console.log('Sample post titles:');
            posts.slice(0, 3).forEach(post => {
                console.log(` - ${post.title}`);
            });
        }
        
        // Check authors
        const authors = await db.collection('authors').find({}).toArray();
        console.log('\nAuthors found:', authors.length);
        if (authors.length > 0) {
            console.log('Sample authors:');
            authors.slice(0, 3).forEach(author => {
                console.log(` - ${author.name}`);
            });
        }
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await client.close();
    }
}

checkPosts(); 