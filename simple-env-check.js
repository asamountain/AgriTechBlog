const fs = require('fs');

console.log('🔍 Simple Environment Check\n');

// Check current MONGODB_URI
const currentUri = process.env.MONGODB_URI;
if (currentUri) {
  const masked = currentUri.replace(/:\/\/([^:]+):([^@]+)@/, '://[USER]:[PASS]@');
  console.log('✅ MONGODB_URI is set:', masked);
} else {
  console.log('❌ MONGODB_URI is not set');
}

// Check if .env file exists
try {
  const envExists = fs.existsSync('.env');
  console.log('📄 .env file exists:', envExists);
  
  if (envExists) {
    const envContent = fs.readFileSync('.env', 'utf8');
    console.log('📄 .env file size:', envContent.length, 'characters');
    
    // Look for MONGODB_URI in the file
    const lines = envContent.split('\n');
    const mongoLine = lines.find(line => line.startsWith('MONGODB_URI'));
    if (mongoLine) {
      const maskedLine = mongoLine.replace(/:\/\/([^:]+):([^@]+)@/, '://[USER]:[PASS]@');
      console.log('📄 .env contains MONGODB_URI:', maskedLine);
    } else {
      console.log('📄 .env does not contain MONGODB_URI');
    }
  }
} catch (error) {
  console.log('❌ Error reading .env:', error.message);
}

console.log('\n💡 Where MONGODB_URI comes from in Replit:');
console.log('1. 🔒 Replit Secrets (highest priority)');
console.log('2. 📄 .env file in project root');
console.log('3. 🖥️  System environment variables');
console.log('\nTo change it: Update Replit Secrets tab!'); 