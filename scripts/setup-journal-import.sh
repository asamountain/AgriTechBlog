#!/bin/bash

# Setup script for Journal Import to Notion
# This script installs the required Python dependencies

echo "╔════════════════════════════════════════════════════════╗"
echo "║   📓 Setting up Journal Import to Notion 📓            ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# Check if Python 3 is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed."
    echo "Please install Python 3.7 or higher:"
    echo "  - macOS: brew install python3"
    echo "  - Ubuntu: sudo apt install python3 python3-pip"
    exit 1
fi

PYTHON_VERSION=$(python3 --version 2>&1 | awk '{print $2}')
echo "✅ Found Python $PYTHON_VERSION"

# Check if pip is installed
if ! command -v pip3 &> /dev/null; then
    echo "❌ pip3 is not installed."
    echo "Please install pip3:"
    echo "  - macOS: python3 -m ensurepip"
    echo "  - Ubuntu: sudo apt install python3-pip"
    exit 1
fi

echo "✅ Found pip3"
echo ""

# Install dependencies
echo "📦 Installing Python dependencies..."
pip3 install -r scripts/requirements-journal-import.txt

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Dependencies installed successfully!"
    echo ""
    echo "═══════════════════════════════════════════════════════"
    echo "📋 Next Steps:"
    echo "═══════════════════════════════════════════════════════"
    echo ""
    echo "1. Add these to your .env file:"
    echo "   NOTION_TOKEN=secret_your_token_here"
    echo "   NOTION_JOURNAL_DB_ID=your_database_id_here"
    echo "   JOURNAL_ROOT_PATH=./Journal"
    echo ""
    echo "2. Run the import script:"
    echo "   python3 scripts/import-journal-to-notion.py"
    echo ""
    echo "3. Read the full documentation:"
    echo "   cat scripts/JOURNAL_IMPORT_README.md"
    echo ""
else
    echo ""
    echo "❌ Failed to install dependencies."
    echo "Please try installing manually:"
    echo "  pip3 install notion-client python-frontmatter python-dotenv"
    exit 1
fi
