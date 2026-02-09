#!/bin/bash

# SEO Endpoints Test Script
# Tests all SEO-related endpoints to verify they're working

BASE_URL="${1:-http://localhost:5000}"

echo "🧪 Testing SEO Endpoints"
echo "Base URL: $BASE_URL"
echo "═══════════════════════════════════════════════════"

# Test 1: Sitemap
echo ""
echo "1️⃣  Testing /sitemap.xml..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/sitemap.xml")
if [ "$STATUS" = "200" ]; then
  echo "   ✅ Sitemap: OK ($STATUS)"
  URLS=$(curl -s "$BASE_URL/sitemap.xml" | grep -c "<loc>")
  echo "   📊 Found $URLS URLs in sitemap"
else
  echo "   ❌ Sitemap: FAILED ($STATUS)"
fi

# Test 2: RSS Feed
echo ""
echo "2️⃣  Testing /rss.xml..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/rss.xml")
if [ "$STATUS" = "200" ]; then
  echo "   ✅ RSS Feed: OK ($STATUS)"
  ITEMS=$(curl -s "$BASE_URL/rss.xml" | grep -c "<item>")
  echo "   📊 Found $ITEMS items in RSS feed"
else
  echo "   ❌ RSS Feed: FAILED ($STATUS)"
fi

# Test 3: Robots.txt
echo ""
echo "3️⃣  Testing /robots.txt..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/robots.txt")
if [ "$STATUS" = "200" ]; then
  echo "   ✅ Robots.txt: OK ($STATUS)"
  BOTS=$(curl -s "$BASE_URL/robots.txt" | grep -c "User-agent:")
  echo "   📊 Found $BOTS user-agent directives"
else
  echo "   ❌ Robots.txt: FAILED ($STATUS)"
fi

# Test 4: Open Graph Image
echo ""
echo "4️⃣  Testing /api/og-image..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/og-image?title=Test&category=Tech")
if [ "$STATUS" = "200" ]; then
  echo "   ✅ OG Image: OK ($STATUS)"
else
  echo "   ❌ OG Image: FAILED ($STATUS)"
fi

# Test 5: Structured Data
echo ""
echo "5️⃣  Testing /api/structured-data..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/structured-data")
if [ "$STATUS" = "200" ]; then
  echo "   ✅ Structured Data: OK ($STATUS)"
  TYPES=$(curl -s "$BASE_URL/api/structured-data" | grep -o '"@type"' | wc -l)
  echo "   📊 Found $TYPES schema types"
else
  echo "   ❌ Structured Data: FAILED ($STATUS)"
fi

# Test 6: Meta API (NEW)
echo ""
echo "6️⃣  Testing /api/meta/:slug..."
# First, get a slug from the sitemap
SLUG=$(curl -s "$BASE_URL/sitemap.xml" | grep -o 'blog/[^<]*' | head -1 | sed 's/blog\///')
if [ -n "$SLUG" ]; then
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/meta/$SLUG")
  if [ "$STATUS" = "200" ]; then
    echo "   ✅ Meta API: OK ($STATUS)"
    echo "   📊 Testing slug: $SLUG"
    RESPONSE=$(curl -s "$BASE_URL/api/meta/$SLUG")
    TITLE=$(echo "$RESPONSE" | grep -o '"title":"[^"]*"' | head -1)
    echo "   📝 $TITLE"
  else
    echo "   ❌ Meta API: FAILED ($STATUS)"
  fi
else
  echo "   ⚠️  Meta API: No slugs found to test"
fi

echo ""
echo "═══════════════════════════════════════════════════"
echo "✅ SEO Endpoint Testing Complete!"
echo ""
echo "📋 Quick Links:"
echo "   Sitemap:         $BASE_URL/sitemap.xml"
echo "   RSS Feed:        $BASE_URL/rss.xml"
echo "   Robots:          $BASE_URL/robots.txt"
echo "   OG Image:        $BASE_URL/api/og-image?title=Test"
echo "   Structured Data: $BASE_URL/api/structured-data"
if [ -n "$SLUG" ]; then
  echo "   Meta API:        $BASE_URL/api/meta/$SLUG"
fi
echo ""
