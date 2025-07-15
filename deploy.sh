#!/bin/bash

# AgriTech Blog Deployment Script
# Usage: ./deploy.sh [production|preview|local] [custom-commit-message]

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

# Generate intelligent commit message based on changes
generate_commit_message() {
    local changes=$(git diff --name-only HEAD 2>/dev/null || git diff --name-only --cached 2>/dev/null || echo "")
    local stats=$(git diff --stat HEAD 2>/dev/null || git diff --stat --cached 2>/dev/null || echo "")
    
    if [ -z "$changes" ]; then
        echo "chore: prepare deployment $(date '+%Y-%m-%d')"
        return
    fi
    
    # Count changes by type
    local frontend_changes=$(echo "$changes" | grep -E "client/|src/|components/|pages/" | wc -l | tr -d ' ')
    local backend_changes=$(echo "$changes" | grep -E "server/|api/|routes" | wc -l | tr -d ' ')
    local config_changes=$(echo "$changes" | grep -E "package\.json|tsconfig|vite\.config|tailwind|vercel\.json" | wc -l | tr -d ' ')
    local doc_changes=$(echo "$changes" | grep -E "\.md$|README|GUIDE" | wc -l | tr -d ' ')
    local schema_changes=$(echo "$changes" | grep -E "schema|types|interface" | wc -l | tr -d ' ')
    
    # Analyze specific file patterns for more context
    local has_new_features=$(echo "$changes" | grep -E "new-|add-|create-" | wc -l | tr -d ' ')
    local has_bug_fixes=$(echo "$changes" | grep -E "fix|bug|error|crash" | wc -l | tr -d ' ')
    local has_ui_changes=$(echo "$changes" | grep -E "components/|\.css|\.tsx$" | wc -l | tr -d ' ')
    local has_api_changes=$(echo "$changes" | grep -E "api/|routes|server/" | wc -l | tr -d ' ')
    
    # Get file count and line changes
    local files_changed=$(echo "$changes" | wc -l | tr -d ' ')
    local insertions=$(echo "$stats" | grep -o '[0-9]\+ insertion' | grep -o '[0-9]\+' | head -1)
    local deletions=$(echo "$stats" | grep -o '[0-9]\+ deletion' | grep -o '[0-9]\+' | head -1)
    
    # Default values if grep doesn't find anything
    insertions=${insertions:-0}
    deletions=${deletions:-0}
    
    # Determine commit type and scope
    local commit_type="feat"
    local scope=""
    local description=""
    
    # Determine primary type of changes
    if [ "$config_changes" -gt 0 ] && [ "$files_changed" -le 3 ]; then
        commit_type="chore"
        scope="config"
        description="update project configuration"
    elif [ "$doc_changes" -gt 0 ] && [ "$((frontend_changes + backend_changes))" -eq 0 ]; then
        commit_type="docs"
        description="update documentation"
    elif [ "$schema_changes" -gt 0 ]; then
        commit_type="refactor"
        scope="types"
        description="update schema definitions and types"
    elif [ "$backend_changes" -gt "$frontend_changes" ]; then
        if [ "$has_api_changes" -gt 0 ]; then
            commit_type="feat"
            scope="api"
            description="enhance API endpoints and server functionality"
        else
            commit_type="refactor"
            scope="backend"
            description="improve server-side implementation"
        fi
    elif [ "$frontend_changes" -gt 0 ]; then
        if [ "$has_ui_changes" -gt 0 ]; then
            commit_type="feat"
            scope="ui"
            description="improve user interface and components"
        else
            commit_type="refactor"
            scope="frontend"
            description="refactor client-side code"
        fi
    elif [ "$has_bug_fixes" -gt 0 ]; then
        commit_type="fix"
        description="resolve application issues and bugs"
    else
        commit_type="feat"
        description="implement new features and improvements"
    fi
    
    # Add scope if determined
    local scope_text=""
    if [ -n "$scope" ]; then
        scope_text="($scope)"
    fi
    
    # Generate more specific descriptions based on file analysis
    if [ "$files_changed" -gt 10 ]; then
        description="$description across multiple modules"
    elif [ "$insertions" -gt 200 ]; then
        description="$description with significant additions"
    elif [ "$deletions" -gt 100 ]; then
        description="$description and code cleanup"
    fi
    
    # Add deployment context
    local deploy_suffix=""
    case $1 in
        "production"|"prod")
            deploy_suffix=" - production ready"
            ;;
        "preview"|"staging")
            deploy_suffix=" - staging deployment"
            ;;
    esac
    
    # Final commit message
    echo "${commit_type}${scope_text}: ${description}${deploy_suffix}"
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
    
    # Get commit message from user or generate intelligent one
    if [ -n "$2" ]; then
        COMMIT_MSG="$2"
        print_status "Using custom commit message: $COMMIT_MSG"
    else
        COMMIT_MSG=$(generate_commit_message "$DEPLOY_ENV")
        print_status "Generated commit message: $COMMIT_MSG"
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
        print_status "Usage: ./deploy.sh [production|preview|local] [custom-commit-message]"
        exit 1
        ;;
esac

print_success "🎯 Deployment process completed successfully!"
print_status "Next steps:"
echo "  1. Check your deployment URL"
echo "  2. Test all functionality"
echo "  3. Monitor for any issues" 