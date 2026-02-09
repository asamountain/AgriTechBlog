#!/bin/bash
# Quick fix for GitHub repository rule violations

set -e

echo "🔧 GitHub Repository Rule Violation - Quick Fix"
echo "================================================"
echo ""

# Check current branch
CURRENT_BRANCH=$(git branch --show-current)
echo "Current branch: $CURRENT_BRANCH"
echo ""

# Check if there are uncommitted changes
if ! git diff-index --quiet HEAD --; then
    echo "⚠️  You have uncommitted changes. Committing them first..."
    git add .
    git commit -m "chore: updates before deployment" || echo "Commit may have failed, continuing..."
fi

echo "Your repository has branch protection rules preventing direct pushes to 'main'."
echo ""
echo "Choose a solution:"
echo ""
echo "1) Push to a feature branch (recommended for teams)"
echo "2) Disable branch protection temporarily (repo owner only)"
echo "3) Force push to main (dangerous - repo owner only)"
echo "4) Show GitHub repo settings URL"
echo "5) Cancel"
echo ""
read -p "Enter choice (1-5): " choice

case $choice in
    1)
        # Create and push feature branch
        BRANCH_NAME="auto-deploy-$(date +%s)"
        echo ""
        echo "Creating feature branch: $BRANCH_NAME"
        git checkout -b "$BRANCH_NAME"
        git push origin "$BRANCH_NAME"
        echo ""
        echo "✅ Pushed to feature branch: $BRANCH_NAME"
        echo ""
        echo "Next steps:"
        echo "  1. Go to: https://github.com/asamountain/AgriTechBlog/pulls"
        echo "  2. Create a Pull Request from $BRANCH_NAME to main"
        echo "  3. Merge the PR"
        echo ""
        echo "To return to main branch:"
        echo "  git checkout main"
        ;;
        
    2)
        echo ""
        echo "To disable branch protection:"
        echo ""
        echo "1. Go to: https://github.com/asamountain/AgriTechBlog/settings/branches"
        echo "2. Find 'main' branch rule"
        echo "3. Click 'Edit' or 'Delete'"
        echo "4. Disable 'Require a pull request before merging'"
        echo "5. Save changes"
        echo "6. Re-run: npm run deploy"
        echo ""
        echo "Opening browser..."
        open "https://github.com/asamountain/AgriTechBlog/settings/branches" 2>/dev/null || \
        xdg-open "https://github.com/asamountain/AgriTechBlog/settings/branches" 2>/dev/null || \
        echo "Manual URL: https://github.com/asamountain/AgriTechBlog/settings/branches"
        ;;
        
    3)
        echo ""
        echo "⚠️  WARNING: Force push will overwrite remote history!"
        read -p "Are you sure? Type 'YES' to confirm: " confirm
        if [ "$confirm" = "YES" ]; then
            echo ""
            echo "Force pushing to main..."
            git push origin main --force
            echo "✅ Force push successful"
        else
            echo "Cancelled."
        fi
        ;;
        
    4)
        echo ""
        echo "GitHub Repository Settings:"
        echo "  Main: https://github.com/asamountain/AgriTechBlog/settings"
        echo "  Branch Protection: https://github.com/asamountain/AgriTechBlog/settings/branches"
        echo "  Rulesets: https://github.com/asamountain/AgriTechBlog/settings/rules"
        echo ""
        ;;
        
    5)
        echo "Cancelled."
        exit 0
        ;;
        
    *)
        echo "Invalid choice."
        exit 1
        ;;
esac
