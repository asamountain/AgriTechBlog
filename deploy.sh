#!/bin/bash

# AgriTech Blog Deployment Script
# Usage: ./deploy.sh [production|preview|local]

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[DEPLOY]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Default to preview if no argument provided
DEPLOY_ENV=${1:-preview}

print_status "Starting deployment process for: $DEPLOY_ENV"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Are you in the project root?"
    exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    print_warning "node_modules not found. Installing dependencies..."
    npm install
fi

# Pre-deployment checks
print_status "Running pre-deployment checks..."

# Check if TypeScript compiles
print_status "Checking TypeScript compilation..."
if npm run check; then
    print_success "TypeScript check passed"
else
    print_error "TypeScript check failed. Fix errors before deploying."
    exit 1
fi

# Build the project locally to catch any build errors
print_status "Building project locally..."
if npm run build; then
    print_success "Local build successful"
else
    print_error "Local build failed. Check the errors above."
    exit 1
fi

# Git operations
print_status "Preparing Git repository..."

# Check if there are uncommitted changes
if ! git diff-index --quiet HEAD --; then
    print_warning "You have uncommitted changes. Committing them now..."
    git add .
    
    # Get commit message from user or use default
    if [ -n "$2" ]; then
        COMMIT_MSG="$2"
    else
        COMMIT_MSG="Deploy: $(date '+%Y-%m-%d %H:%M:%S')"
    fi
    
    git commit -m "$COMMIT_MSG"
    print_success "Changes committed: $COMMIT_MSG"
else
    print_status "No uncommitted changes found."
fi

# Push to GitHub
print_status "Pushing to GitHub..."
if git push origin main; then
    print_success "Successfully pushed to GitHub"
else
    print_error "Failed to push to GitHub. Check your authentication."
    exit 1
fi

# Deploy with Vercel
print_status "Deploying with Vercel..."

case $DEPLOY_ENV in
    "production"|"prod")
        print_status "Deploying to PRODUCTION..."
        if vercel --prod --yes; then
            print_success "🎉 Production deployment successful!"
            print_status "Check your Vercel dashboard for the production URL."
        else
            print_error "Production deployment failed."
            exit 1
        fi
        ;;
    "preview"|"staging")
        print_status "Deploying to PREVIEW..."
        if vercel --yes; then
            print_success "🚀 Preview deployment successful!"
            print_status "Check your Vercel dashboard for the preview URL."
        else
            print_error "Preview deployment failed."
            exit 1
        fi
        ;;
    "local")
        print_status "Starting local development server..."
        npm run dev
        ;;
    *)
        print_error "Invalid deployment environment: $DEPLOY_ENV"
        print_status "Usage: ./deploy.sh [production|preview|local]"
        exit 1
        ;;
esac

print_success "🎯 Deployment process completed successfully!"
print_status "Next steps:"
echo "  1. Check your deployment URL"
echo "  2. Test all functionality"
echo "  3. Monitor for any issues" 