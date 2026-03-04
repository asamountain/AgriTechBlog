# 🔐 MongoDB Credential Management & Connection Guide

## 🚨 **Critical Security Steps** (Do These First!)

### 1. **Remove Hardcoded Credentials** ✅ COMPLETED
- All hardcoded MongoDB credentials have been removed from the codebase
- Files updated: `list-dbs.js`, `check-posts.js`, `api/admin/blog-posts.ts`, `api/admin/blog-posts/[id].ts`
- Environment variables are now required for all MongoDB connections

### 2. **Secure Environment Configuration**

Create a `.env` file in your project root (never commit this file):

```bash
# Copy from env.example and fill in your real credentials
cp env.example .env
```

## 🛠️ **MongoDB Connection Setup**

### **Option A: MongoDB Atlas (Cloud) - Recommended**

1. **Create MongoDB Atlas Account**
   ```
   1. Go to https://www.mongodb.com/atlas
   2. Create free account
   3. Create new cluster (M0 Sandbox - Free)
   4. Wait for cluster provisioning (2-3 minutes)
   ```

2. **Database User Setup**
   ```
   1. Database Access → Add New Database User
   2. Username: your-app-user
   3. Password: Generate secure password (save it!)
   4. Roles: Read and write to any database
   ```

3. **Network Access Configuration**
   ```
   1. Network Access → Add IP Address
   2. For development: 0.0.0.0/0 (Allow all IPs)
   3. For production: Add your server's specific IP
   ```

4. **Get Connection String**
   ```
   1. Clusters → Connect → Connect your application
   2. Node.js driver → Copy connection string
   3. Replace <password> with your database user password
   ```

5. **Add to .env file**
   ```bash
   MONGODB_URI=mongodb+srv://your-app-user:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/blog_database?retryWrites=true&w=majority
   MONGODB_DATABASE=blog_database
   ```

### **Option B: Local MongoDB (Development)**

1. **Install MongoDB**
   ```bash
   # macOS
   brew install mongodb-community
   
   # Ubuntu/Debian
   sudo apt-get install mongodb
   
   # Windows: Download from mongodb.com
   ```

2. **Start MongoDB Service**
   ```bash
   # macOS
   brew services start mongodb-community
   
   # Linux
   sudo systemctl start mongod
   
   # Windows: Start as Windows Service
   ```

3. **Add to .env file**
   ```bash
   MONGODB_URI=mongodb://localhost:27017/blog_database
   MONGODB_DATABASE=blog_database
   ```

## 🔧 **Using the New Connection Manager**

### **Basic Usage**
```typescript
import { mongoConnectionManager } from './server/mongodb-connection-manager';

// Connect to MongoDB
await mongoConnectionManager.connect();

// Get database instance
const db = mongoConnectionManager.getDatabase();

// Use collections
const postsCollection = db.collection('posts');
const posts = await postsCollection.find({}).toArray();

// Check connection health
const health = await mongoConnectionManager.getConnectionHealth();
console.log('MongoDB Health:', health);
```

### **Advanced Configuration**
```typescript
// Custom connection configuration
const customConfig = {
  uri: 'your-mongodb-uri',
  database: 'your-database-name',
  options: {
    maxPoolSize: 50,
    serverSelectionTimeoutMS: 5000
  }
};

await mongoConnectionManager.connect(customConfig);
```

### **Transaction Support**
```typescript
// Perform multiple operations in a transaction
const result = await mongoConnectionManager.withTransaction(async (session) => {
  const posts = db.collection('posts');
  const authors = db.collection('authors');
  
  await posts.insertOne({ title: 'New Post' }, { session });
  await authors.updateOne({ id: 1 }, { $inc: { postCount: 1 } }, { session });
  
  return { success: true };
});
```

## 🔐 **Security Best Practices**

### **1. Environment Variables**
- ✅ Never commit `.env` files to version control
- ✅ Use different credentials for development/staging/production
- ✅ Rotate credentials regularly (every 90 days)
- ✅ Use strong, unique passwords

### **2. Connection Security**
- ✅ Always use SSL/TLS for remote connections
- ✅ Limit network access by IP address
- ✅ Use authentication for all connections
- ✅ Enable MongoDB authentication

### **3. Database Security**
- ✅ Create database users with minimal required permissions
- ✅ Don't use admin users for application connections
- ✅ Enable MongoDB auditing in production
- ✅ Regular security updates

### **4. Application Security**
```typescript
// ✅ Good: Environment variable validation
const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error('MONGODB_URI is required');
}

// ❌ Bad: Hardcoded credentials
const uri = 'mongodb://admin:password123@host/db';

// ✅ Good: Secure password patterns
const isSecurePassword = (password: string) => {
  return password.length >= 12 && 
         /[A-Z]/.test(password) && 
         /[a-z]/.test(password) && 
         /[0-9]/.test(password) && 
         /[^A-Za-z0-9]/.test(password);
};
```

## 🧪 **Testing Your Setup**

### **1. Test Connection**
```bash
# Test MongoDB connection
node -e "
const { mongoConnectionManager } = require('./server/mongodb-connection-manager');
mongoConnectionManager.connect().then(() => {
  console.log('✅ MongoDB connection successful');
  process.exit(0);
}).catch(err => {
  console.error('❌ MongoDB connection failed:', err.message);
  process.exit(1);
});
"
```

### **2. Check Database Health**
```bash
# Check database status
npm run dev
# Then visit: http://localhost:3000/api/admin/health
```

### **3. Verify Data Access**
```bash
# List databases and collections
node list-dbs.js

# Check posts
node check-posts.js
```

## 🚀 **Production Deployment**

### **Environment Variables Setup**
```bash
# Vercel
vercel env add MONGODB_URI

# Heroku
heroku config:set MONGODB_URI="your-uri"

# Docker
docker run -e MONGODB_URI="your-uri" your-app

# AWS/Azure/GCP
# Set in your cloud provider's environment variables section
```

### **Production Checklist**
- [ ] MongoDB Atlas cluster in same region as your app
- [ ] Dedicated MongoDB user for production
- [ ] Network access restricted to your server IPs
- [ ] Connection pooling optimized for your load
- [ ] Monitoring and alerting configured
- [ ] Backup strategy implemented
- [ ] SSL/TLS enabled and enforced

## 🔧 **Troubleshooting**

### **Common Connection Issues**

1. **"MONGODB_URI not set"**
   ```bash
   # Check if .env file exists and has correct variables
   cat .env | grep MONGODB_URI
   
   # Verify environment loading
   node -e "console.log(process.env.MONGODB_URI)"
   ```

2. **"Authentication failed"**
   ```bash
   # Check username/password in connection string
   # Verify database user exists in MongoDB Atlas
   # Ensure user has correct permissions
   ```

3. **"Network timeout"**
   ```bash
   # Check network access whitelist in MongoDB Atlas
   # Verify firewall settings
   # Test with curl or ping
   ```

4. **"SSL connection error"**
   ```bash
   # Ensure connection string includes ssl=true
   # Check if using mongodb+srv:// (auto-enables SSL)
   ```

### **Performance Issues**

1. **Slow queries**
   ```bash
   # Check for proper indexes
   # Use MongoDB Compass to analyze performance
   # Enable slow query logging
   ```

2. **Connection pool exhaustion**
   ```bash
   # Increase maxPoolSize in connection options
   # Check for connection leaks (unclosed connections)
   # Monitor connection usage
   ```

## 📊 **Monitoring & Maintenance**

### **Health Checks**
```typescript
// Add this endpoint to your routes
app.get('/api/health/mongodb', async (req, res) => {
  try {
    const health = await mongoConnectionManager.getConnectionHealth();
    res.json(health);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### **Regular Maintenance**
- Weekly: Check connection pool metrics
- Monthly: Review slow query logs
- Quarterly: Rotate credentials
- Annually: Review security settings and permissions

## 🆘 **Emergency Procedures**

### **Connection Lost**
```bash
# 1. Check MongoDB Atlas status
# 2. Verify network connectivity
# 3. Restart application
# 4. Check application logs
```

### **Security Breach**
```bash
# 1. Immediately rotate all credentials
# 2. Check MongoDB access logs
# 3. Review database user permissions
# 4. Update IP access lists
```

### **Data Recovery**
```bash
# 1. Stop all write operations
# 2. Use MongoDB Atlas backups
# 3. Contact MongoDB support if needed
# 4. Test recovery in staging first
```

---

## 📝 **Quick Reference**

### **Essential Commands**
```bash
# Start development server
npm run dev

# Check MongoDB connection
node list-dbs.js

# Test API endpoints
curl http://localhost:3000/api/blog-posts
curl http://localhost:3000/api/admin/blog-posts

# Check environment variables
echo $MONGODB_URI
```

### **Important Files**
- `env.example` - Environment variable template
- `server/mongodb-connection-manager.ts` - Connection manager
- `.env` - Your actual credentials (never commit!)
- `.gitignore` - Ensures sensitive files aren't committed

### **Support Resources**
- [MongoDB Documentation](https://docs.mongodb.com/)
- [MongoDB Atlas Support](https://support.mongodb.com/)
- [Node.js MongoDB Driver Docs](https://docs.mongodb.com/drivers/node/)

---

**Remember: Security is not optional. Always follow the security best practices outlined in this guide.** 