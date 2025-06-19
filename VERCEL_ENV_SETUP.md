# 🔧 Vercel Environment Variables Setup Guide

## Required Environment Variables

Add these environment variables in your Vercel Dashboard (**Settings** → **Environment Variables**):

### **Database Configuration**
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/blog?retryWrites=true&w=majority
DATABASE_URL=mongodb+srv://username:password@cluster.mongodb.net/blog?retryWrites=true&w=majority
MONGODB_DATABASE=blog
```

### **Authentication**
```
SESSION_SECRET=your_random_32_character_secret_key_here
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret
```

### **Analytics**
```
VITE_GA_MEASUREMENT_ID=G-LM04J3WC3L
```

### **Environment**
```
NODE_ENV=production
```

## 🚀 How to Add Variables in Vercel:

1. **Go to Vercel Dashboard**: [vercel.com](https://vercel.com)
2. **Select Your Project**: `agri-tech-blog`
3. **Navigate to Settings** → **Environment Variables**
4. **Click "Add New"** for each variable
5. **Set Environment**: Production, Preview, Development (or just Production)

## 🔑 Getting Your Values:

### **MongoDB Setup:**
1. **Create MongoDB Atlas Account**: [mongodb.com/atlas](https://mongodb.com/atlas)
2. **Create a Free Cluster**
3. **Get Connection String**: 
   - Replace `<username>` and `<password>` with your database user credentials
   - Replace `<cluster>` with your cluster name

### **Google OAuth Setup:**
1. **Go to**: [console.cloud.google.com](https://console.cloud.google.com)
2. **Create Project** (if needed)
3. **Enable Google+ API**
4. **Create OAuth 2.0 Credentials**
5. **Add Authorized Redirect URI**: `https://your-vercel-url.vercel.app/auth/google/callback`

### **Session Secret:**
Generate a random 32-character string:
```bash
openssl rand -base64 32
```

## 🧪 Testing Your Environment Variables:

After adding variables, test by:

1. **Redeploy**: Force a new deployment in Vercel
2. **Check Logs**: View function logs for connection status
3. **Test Features**:
   - Database connection
   - Google OAuth login
   - Analytics tracking

## 🚨 Important Notes:

- **MongoDB URI**: Must include database name and connection options
- **Google OAuth**: Redirect URI must match your Vercel domain exactly
- **Session Secret**: Keep this secure and random
- **Analytics**: Optional but recommended for tracking

## 🔄 After Adding Variables:

1. **Trigger Redeploy**: Go to Deployments → Click "Redeploy"
2. **Check Function Logs**: Monitor for successful database connections
3. **Test Live Site**: Verify all features work

## 📞 Troubleshooting:

- **Database not connecting**: Check MongoDB URI format and credentials
- **OAuth failing**: Verify redirect URI and client credentials
- **Analytics not working**: Confirm GA4 measurement ID format 