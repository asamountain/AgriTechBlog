# 🚀 AgriTech Blog - Deployment Setup Guide

This guide will help you set up a complete deployment pipeline for your AgriTech blog with multiple deployment options.

## 📋 Table of Contents
- [Quick Start](#quick-start)
- [Setup Requirements](#setup-requirements)
- [Deployment Options](#deployment-options)
- [GitHub Actions Setup](#github-actions-setup)
- [Troubleshooting](#troubleshooting)

## ⚡ Quick Start

### 1. Initial Setup
```bash
# Make deployment script executable and install Vercel CLI
npm run setup:deploy

# Test that everything builds correctly
npm run test:build
```

### 2. Deploy to Production
```bash
# Option A: Using npm script
npm run deploy

# Option B: Using deploy script directly
./deploy.sh production "Your commit message"

# Option C: Using Vercel CLI directly
vercel --prod
```

## 🔧 Setup Requirements

### Prerequisites
- [x] Node.js 18+ installed
- [x] Git configured with GitHub access
- [x] Vercel account connected to GitHub
- [ ] Vercel CLI installed globally
- [ ] GitHub repository secrets configured (for GitHub Actions)

### 1. Install Vercel CLI
```bash
npm install -g vercel@latest
```

### 2. Login to Vercel
```bash
vercel login
```

### 3. Link Project to Vercel
```bash
vercel link
# Follow prompts to link to your existing project
```

## 🎯 Deployment Options

### Option 1: Manual Deployment Script
Use our custom deployment script for full control:

```bash
# Deploy to production
./deploy.sh production "Commit message"

# Deploy preview/staging
./deploy.sh preview

# Start local development
./deploy.sh local
```

**Features:**
- ✅ Pre-deployment checks (TypeScript, build)
- ✅ Automatic git commits and pushes
- ✅ Colored output and error handling
- ✅ Build verification before deployment

### Option 2: NPM Scripts
Quick deployment using package.json scripts:

```bash
npm run deploy          # Production
npm run deploy:preview  # Preview
npm run deploy:local    # Local dev server
```

### Option 3: GitHub Actions (Automated)
Automatic deployment on every push to main branch.

**Setup required:** See [GitHub Actions Setup](#github-actions-setup) below.

### Option 4: Direct Vercel CLI
For advanced users:

```bash
vercel                  # Preview deployment
vercel --prod          # Production deployment
vercel --prod --yes    # Production (skip prompts)
```

## ⚙️ GitHub Actions Setup

### 1. Get Vercel Tokens
1. Go to [Vercel Dashboard](https://vercel.com/account/tokens)
2. Create a new token
3. Copy the token value

### 2. Get Project IDs
```bash
# In your project directory
vercel link
cat .vercel/project.json
```

### 3. Add GitHub Secrets
Go to your GitHub repository → Settings → Secrets and variables → Actions

Add these secrets:
- `VERCEL_TOKEN`: Your Vercel token
- `VERCEL_ORG_ID`: Your organization ID from `.vercel/project.json`
- `VERCEL_PROJECT_ID`: Your project ID from `.vercel/project.json`

### 4. GitHub Actions Features
- 🧪 **Automatic testing** on every push/PR
- 🔍 **Preview deployments** for pull requests
- 🌟 **Production deployments** on main branch
- 🚨 **Build failure notifications**
- 📊 **Lighthouse performance audits**

## 🛠️ Configuration Files

### vercel.json
```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist/public"
      }
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
```

### Environment Variables (Required)
Set these in your Vercel dashboard:

```env
DATABASE_URL=your_mongodb_connection_string
MONGODB_URI=your_mongodb_connection_string  
MONGODB_DATABASE=blog
VITE_GA_MEASUREMENT_ID=G-LM04J3WC3L
SESSION_SECRET=your_random_32_character_string
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret
NODE_ENV=production
```

## 🔍 Troubleshooting

### Common Issues

#### 1. "Command not found: ./deploy.sh"
```bash
chmod +x deploy.sh
```

#### 2. "Vercel CLI not found"
```bash
npm install -g vercel@latest
```

#### 3. "Git authentication failed"
```bash
# For GitHub CLI
gh auth login

# For SSH
ssh-keygen -t ed25519 -C "your_email@example.com"
# Add the key to GitHub
```

#### 4. "Build failed in Vercel"
```bash
# Test build locally first
npm run test:build

# Clean and rebuild
npm run clean
npm install
npm run build
```

#### 5. "Environment variables not found"
- Check Vercel dashboard → Project → Settings → Environment Variables
- Ensure all required variables are set
- Redeploy after adding variables

### Debug Commands
```bash
# Check Vercel project status
vercel ls

# View deployment logs
vercel logs [deployment-url]

# Test local build
npm run test:build

# Clean all build files
npm run clean
```

## 📚 Usage Examples

### Typical Development Workflow
```bash
# 1. Make your changes
# 2. Test locally
npm run dev

# 3. Deploy preview for testing
npm run deploy:preview

# 4. Deploy to production when ready
npm run deploy

# 5. Check deployment
vercel ls
```

### Hotfix Workflow
```bash
# Quick production hotfix
./deploy.sh production "Hotfix: Fix critical bug in auth"
```

### Feature Branch Workflow
```bash
# Create feature branch
git checkout -b feature/new-feature

# Work on feature...
git add .
git commit -m "Add new feature"
git push origin feature/new-feature

# Create PR (GitHub Actions will auto-deploy preview)
# Merge when ready (GitHub Actions will auto-deploy production)
```

## 🎉 Next Steps

1. **Test the deployment script:** `./deploy.sh preview`
2. **Set up GitHub Actions** following the guide above
3. **Configure environment variables** in Vercel dashboard
4. **Test your live site** thoroughly
5. **Set up monitoring** and analytics

## 📞 Support

If you encounter issues:
1. Check the [Troubleshooting](#troubleshooting) section
2. Review Vercel deployment logs
3. Test builds locally with `npm run test:build`
4. Check GitHub Actions logs (if using automated deployment)

---

**Happy Deploying! 🚀** 