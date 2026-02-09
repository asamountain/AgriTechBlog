#!/bin/bash
# Remove exposed secrets from Git history
# Usage: npm run fix:secrets

set -e

echo "🔐 Secret Removal - Git History Cleanup"
echo "========================================"
echo ""
echo "⚠️  WARNING: This will rewrite Git history!"
echo "    All collaborators must re-clone after this."
echo ""

echo "Choose a cleanup method:"
echo ""
echo "1) Create orphan branch (simplest - loses history)"
echo "2) Use git filter-repo (preserves history, requires install)"
echo "3) Cancel"
echo ""
read -p "Enter choice (1-3): " choice

case $choice in
    1)
        echo ""
        echo "Creating clean orphan branch..."
        git checkout --orphan clean-main
        git add -A
        git commit -m "chore: clean repository - remove exposed secrets"
        git branch -D main
        git branch -m main
        echo ""
        echo "✓ Clean branch created. Force push with:"
        echo "  git push origin main --force"
        ;;

    2)
        if ! command -v git-filter-repo &> /dev/null; then
            echo "❌ git-filter-repo not installed"
            echo "Install: brew install git-filter-repo"
            exit 1
        fi
        echo ""
        read -sp "Paste the secret string to remove: " secret_str
        echo ""
        if [[ -z "$secret_str" ]]; then
            echo "❌ No secret provided. Aborting."
            exit 1
        fi
        echo "${secret_str}==>***REMOVED***" > /tmp/git-secrets-replace.txt
        git filter-repo --replace-text /tmp/git-secrets-replace.txt --force
        rm -f /tmp/git-secrets-replace.txt
        echo "✓ Secret replaced in history"
        echo ""
        echo "Force push with:"
        echo "  git push origin main --force"
        ;;

    3)
        echo "Cancelled."
        exit 0
        ;;

    *)
        echo "Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "Next steps:"
echo "1. Revoke the exposed key in provider console"
echo "2. Generate a new key"
echo "3. Add new key to .env"
echo "4. git push origin main --force"
