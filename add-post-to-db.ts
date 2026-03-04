import { MongoStorage } from './server/mongodb-storage-updated.js';
import dotenv from 'dotenv';
dotenv.config();

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DATABASE || 'blog_database';

async function addPost() {
    if (!uri) {
        console.error('MONGODB_URI environment variable is not set');
        process.exit(1);
    }

    const storage = new MongoStorage(uri, dbName);
    await storage.connect();
    
    const newPost = {
        title: 'Finding Joy in the "Bare-Metal" Struggle: A 3D Breakthrough',
        slug: 'finding-joy-in-bare-metal-struggle-3d-breakthrough',
        content: `# Finding Joy in the "Bare-Metal" Struggle: A 3D Breakthrough

### Hitting the Engineering Wall
It was a very interesting day today. I’ve been struggling to understand how the Arduino Uno works on a bare-metal level. Trying to learn it through text was super difficult, and I hit a total "engineering wall." My brain just got stuck because there was too much information to process in text format.

### A New Way to Focus with Gemini
I discussed this problem with Gemini, and it explained that I was hitting this wall because of information overload. Gemini then gave me a much better way to focus: using generative features to visualize the concepts. I knew Gemini had these capabilities, but seeing it work while using Vim inside Ghostty (the terminal the Anthropic team uses!) was incredible.

### Visualizing the Virtual Model
Gemini figured out a solution using a Python package to generate a 3D virtual model that explains how the Uno works in a bare-metal way. It was amazingly nice! I realized that when we need to learn something complex, we have to establish a strong mental model. Understanding purely through text is often too hard, so creating a visual or virtual model I can interact with is exactly what I needed to really "get" it.

### Sparking Joy in Learning
This breakthrough made me feel so much better about the learning process—it actually sparked joy! I’m looking forward to learning deeper and deeper through these virtual methods applied with AI. I love this so much and want to share this journey with others, so I’m making this my blog post for today.`,
        excerpt: 'I’ve been struggling to understand how the Arduino Uno works on a bare-metal level. Gemini helped me breakthrough by visualizing the concepts with a 3D virtual model.',
        featuredImage: '', // No image provided
        tags: ['Arduino', 'Bare Metal', 'Learning', 'AI', 'Gemini', 'Ghostty', 'Engineering'],
        isPublished: true,
        isFeatured: false,
        userId: 'demo-user-001', // Using the standard demo user ID found in your system
        postType: 'blog'
    };

    try {
        const createdPost = await storage.createBlogPost(newPost);
        console.log(`Successfully created post: "${createdPost.title}"`);
        console.log(`Slug: ${createdPost.slug}`);
        console.log(`ID: ${createdPost.id}`);
    } catch (error) {
        console.error('Error creating post:', error);
    } finally {
        await storage.disconnect();
    }
}

addPost();
