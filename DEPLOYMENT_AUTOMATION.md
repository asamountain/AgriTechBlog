# 🤖 Deployment Automation Guide

## 🚀 Automated Deployment Options

### **GitHub Actions (Recommended)**
Automatic deployment on every push to main branch.

**Setup:**
1. Workflow already configured in `.github/workflows/deploy.yml`
2. Add these secrets to your GitHub repository:
   - `VERCEL_ORG_ID` - From `.vercel/project.json`
   - `VERCEL_PROJECT_ID` - From `.vercel/project.json`  
   - `VERCEL_TOKEN` - Generate at [Vercel Settings](https://vercel.com/account/tokens)

### **Deploy Script**
Manual deployment with validation checks.

```bash
# Production deployment
npm run deploy

# Preview deployment  
npm run deploy:preview

# Local testing
npm run deploy:local
```

**Features:**
- ✅ TypeScript compilation check
- ✅ Build validation
- ✅ Git commit/push automation
- ✅ Vercel deployment
- ✅ Error handling

### **Direct Vercel CLI**
Quick manual deployment.

```bash
# Production
vercel --prod

# Preview
vercel

# Check deployments
vercel ls
```

## 🧪 Testing Your Deployment

```bash
# Test current deployment
node test-deployment.mjs

# Test specific URL
node test-deployment.mjs https://your-url.vercel.app
```

**Test Results:**
- ✅ Homepage loads
- ✅ API endpoints respond
- ✅ Static assets serve correctly

## 🚨 Troubleshooting

| Issue | Solution |
|-------|----------|
| GitHub Actions failing | Check repository secrets |
| Deploy script errors | Verify Vercel CLI login: `vercel whoami` |
| Build failures | Run `npm run test:build` locally |
| Permission denied | `chmod +x deploy.sh` |

## 📝 Manual Deployment Checklist

1. ✅ Code committed to git
2. ✅ TypeScript compiles: `npm run check`
3. ✅ Build succeeds: `npm run build`
4. ✅ Environment variables set in Vercel
5. ✅ Deploy: `vercel --prod`
6. ✅ Test live site
7. ✅ Monitor logs: `vercel logs`

## 🔄 Rollback Process

```bash
# List deployments
vercel ls

# Promote previous deployment
vercel promote <previous-deployment-url>
```

## ⚙️ Configuration Files

- **Deploy Script**: `./deploy.sh`
- **GitHub Actions**: `.github/workflows/deploy.yml`
- **Vercel Config**: `./vercel.json`
- **Test Script**: `./test-deployment.mjs` 