# Vercel Local Development Setup Guide

## Overview
This guide explains how to run your Vercel-deployed application locally with full functionality, including database connections and environment variables.

## Quick Start

### 1. Install and Setup Vercel CLI
```bash
npm install -g vercel@latest
vercel login  # Login to your Vercel account
```

### 2. Link Your Project
```bash
vercel link  # Link to your existing Vercel project
```

### 3. Pull Environment Variables
```bash
npm run env:pull  # Pulls latest env vars from Vercel
# Or manually: vercel env pull .env.development
```

### 4. Start Development Server
```bash
npm run dev:vercel  # Starts Vercel dev on localhost:3000
# Or manually: vercel dev --listen 127.0.0.1:3000
```

## Development Commands

### Available Scripts
- `npm run dev` - Traditional Node.js development (port 5000)
- `npm run dev:vercel` - Vercel development mode (port 3000)
- `npm run env:pull` - Pull environment variables from Vercel
- `npm run env:list` - List environment variables in Vercel
- `npm run build` - Build for production

### Environment File Priority (server/index.ts)
1. `.env.local` (development only - no MongoDB)
2. `.env.vercel` (Vercel production credentials)
3. `.env.temp` (temporary environment)
4. `.env` (fallback)

## Vercel vs Traditional Development

### Traditional Development (`npm run dev`)
- ✅ Fast startup
- ✅ Direct Node.js execution
- ❌ Uses local/fallback environment
- ❌ May not match production exactly
- 🔧 Uses in-memory storage if MongoDB fails

### Vercel Development (`npm run dev:vercel`)
- ✅ Matches production environment exactly
- ✅ Uses production database credentials
- ✅ Serverless function simulation
- ❌ Slower startup (cold starts)
- ❌ Requires Vercel CLI setup

## Configuration Files

### vercel.json
```json
{
  "version": 2,
  "builds": [
    {
      "src": "server/index.ts",
      "use": "@vercel/node"
    },
    {
      "src": "package.json", 
      "use": "@vercel/static-build",
      "config": { "distDir": "dist" }
    }
  ],
  "routes": [
    { "src": "/api/(.*)", "dest": "/server/index.ts" },
    { "src": "/auth/(.*)", "dest": "/server/index.ts" },
    { "src": "/(.*)", "dest": "/index.html" }
  ]
}
```

### package.json Build Scripts
- `vercel-build`: Runs during Vercel deployment
- `build`: Builds client-side application

## Environment Variables

### Required Variables
- `MONGODB_URI` - MongoDB connection string
- `MONGODB_DB` - Database name
- `SESSION_SECRET` - Session encryption key
- OAuth credentials (optional):
  - `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`
  - `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET`

### Environment Management
```bash
# List all environment variables
vercel env ls

# Add new environment variable
vercel env add VARIABLE_NAME

# Remove environment variable  
vercel env rm VARIABLE_NAME

# Pull latest to local development
vercel env pull .env.development
```

## Troubleshooting

### MongoDB Authentication Issues
If you see "bad auth: Authentication failed":
1. Check if IP is whitelisted in MongoDB Atlas
2. Verify credentials are correct in Vercel dashboard
3. Use `npm run dev` instead for local development with in-memory storage

### Port Conflicts
- Vercel dev: `http://localhost:3000`
- Traditional dev: `http://localhost:5000`
- Change ports: `vercel dev --listen 127.0.0.1:PORT`

### Build Issues
```bash
npm run build  # Build before running Vercel dev
npm run clean  # Clean dist and cache
```

### Environment File Issues
```bash
rm .env.development  # Remove old env file
npm run env:pull     # Pull fresh environment variables
```

## Best Practices

1. **Development Workflow**:
   - Use `npm run dev` for quick iterations
   - Use `npm run dev:vercel` to test production-like environment
   - Always build before deploying

2. **Environment Management**:
   - Keep production secrets in Vercel dashboard
   - Use `.env.local` for local-only configuration
   - Never commit environment files to git

3. **Database Strategy**:
   - Production: Use MongoDB Atlas through Vercel
   - Development: Use in-memory storage for speed
   - Testing: Use separate test database

## Links
- [Vercel CLI Documentation](https://vercel.com/docs/cli)
- [Vercel Environment Variables](https://vercel.com/docs/environment-variables)
- [Vercel Local Development](https://vercel.com/docs/cli/dev) 