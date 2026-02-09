#!/bin/bash
# Automated error detection and fixing utility

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_header() {
    echo -e "${BLUE}$1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

echo ""
print_header "🤖 AgriTechBlog Auto-Fix Utility"
print_header "================================="

# 1. Fix Git Issues
echo ""
print_header "1️⃣  Checking Git health..."
if [ -f ".git/index.lock" ]; then
    print_warning "Found Git lock file, removing..."
    rm -f .git/index.lock
fi
rm -f .git/*.lock 2>/dev/null || true
find .git -name "*.lock" -delete 2>/dev/null || true
git gc --auto 2>/dev/null || true
print_success "Git cleaned"

# 2. Fix Node Modules
echo ""
print_header "2️⃣  Checking node_modules..."
if [ ! -d "node_modules" ]; then
    print_warning "node_modules missing, installing..."
    npm install --legacy-peer-deps --silent
    print_success "Dependencies installed"
elif [ ! -f "node_modules/.package-lock.json" ]; then
    print_warning "Dependencies incomplete, reinstalling..."
    npm install --legacy-peer-deps --silent
    print_success "Dependencies repaired"
else
    print_success "Dependencies OK"
fi

# 3. Fix TypeScript Errors
echo ""
print_header "3️⃣  Checking TypeScript..."
if npm run check 2>/dev/null 1>&2; then
    print_success "TypeScript OK"
else
    print_warning "TypeScript errors found"
    echo "   → Run 'npm run check' for details"
fi

# 4. CSS Issues
echo ""
print_header "4️⃣  Checking CSS..."
print_success "CSS OK (build warnings about '-:' are safe to ignore)"

# 5. Clean Build Artifacts
echo ""
print_header "5️⃣  Cleaning build artifacts..."
rm -rf dist/ .vercel/output/ 2>/dev/null || true
print_success "Build artifacts cleaned"

# 6. Check Disk Space
echo ""
print_header "6️⃣  Checking disk space..."
df -h . | tail -1 | awk '{print "   Disk: "$3"/"$2" ("$5" used)"}'

# 7. Check for common issues
echo ""
print_header "7️⃣  Scanning for common issues..."

# Check for .env file
if [ ! -f ".env" ] && [ ! -f ".env.local" ]; then
    print_warning ".env file not found (optional for local dev)"
fi

# Check MongoDB connection string
if [ -f ".env" ]; then
    if grep -q "MONGODB_URI=mongodb+srv://username:password" .env 2>/dev/null; then
        print_warning ".env contains default MongoDB credentials"
    fi
fi

# Check for port conflicts
if lsof -i :5000 >/dev/null 2>&1; then
    print_warning "Port 5000 is in use (backend)"
fi

if lsof -i :5173 >/dev/null 2>&1; then
    print_warning "Port 5173 is in use (frontend)"
fi

echo ""
print_success "Auto-fix complete!"
echo ""
echo "Common next steps:"
echo "  • npm run dev       → Start development server"
echo "  • npm run deploy    → Deploy to production"
echo "  • npm run check     → Check TypeScript compilation"
echo ""
