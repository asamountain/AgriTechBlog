# 📓 Journal Import to Notion - Quick Start Guide

Import your local Markdown journal entries into Notion with a single command!

## 🚀 Quick Setup (3 Steps)

### 1️⃣ Install Dependencies

```bash
./scripts/setup-journal-import.sh
```

Or manually:
```bash
pip3 install notion-client python-frontmatter python-dotenv
```

### 2️⃣ Configure Environment

Add to your `.env` file:

```bash
# Get these from Notion (see instructions below)
NOTION_TOKEN=secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NOTION_JOURNAL_DB_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
JOURNAL_ROOT_PATH=./Journal
```

#### 🔑 How to Get Your Notion Token:

1. Go to [https://www.notion.so/my-integrations](https://www.notion.so/my-integrations)
2. Click **"+ New integration"**
3. Name it (e.g., "Journal Importer")
4. Copy the **"Internal Integration Token"**

#### 🗄️ How to Get Your Database ID:

Your Notion database URL:
```
https://www.notion.so/workspace/DatabaseName-1234567890abcdef1234567890abcdef?v=...
                                            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
                                            This is your database ID
```

#### 🔗 Connect Integration to Database:

1. Open your Notion "Journal.db"
2. Click **"..."** (top right)
3. **"Add connections"** → Select your integration

### 3️⃣ Run the Import

```bash
npm run notion:import-journal
```

Or directly:
```bash
python3 scripts/import-journal-to-notion.py
```

## 📝 Markdown File Format

Your journal entries should look like this:

```markdown
---
title: My Journal Entry Title
tags: personal, thoughts, ideas
date: 2024-01-18
---

# Main Heading

Your content goes here...

## Subheading

- Bullet point 1
- Bullet point 2

1. Numbered item 1
2. Numbered item 2
```

## 📊 Expected Output

```
╔════════════════════════════════════════════════════════╗
║     📓 Bulk Import Journal Entries to Notion 📓        ║
╚════════════════════════════════════════════════════════╝

📁 Searching for Markdown files in: ./Journal
✅ Found 15 Markdown file(s)

[1/15] Processing: 2024-01-18-example.md
   Title: My Journal Entry Title
   Tags: personal, thoughts, ideas
   Date: 2024-01-18
   ✅ Imported successfully

...

════════════════════════════════════════════════════════
📊 Import Summary
   ✅ Imported: 12
   ⏭️  Skipped: 2 (already exist)
   ❌ Failed: 1
   📝 Total: 15
════════════════════════════════════════════════════════

🎉 Import completed successfully!
```

## 🎯 Notion Database Setup

Your Notion database needs these properties:

| Property | Type         | Required |
|----------|--------------|----------|
| Name     | Title        | ✅ Yes   |
| Tags     | Multi-select | ❌ No    |
| Date     | Date         | ❌ No    |

## 🔧 Common Issues

### ❌ "Missing required environment variable: NOTION_TOKEN"

**Fix:** Add `NOTION_TOKEN` to your `.env` file

### ❌ "Could not find database"

**Fix:** 
1. Check `NOTION_JOURNAL_DB_ID` is correct
2. Make sure integration is connected to the database

### ❌ "Journal root path not found"

**Fix:** Update `JOURNAL_ROOT_PATH` in `.env` to point to your journal folder

### ❌ "property_not_found: Tags"

**Fix:** Add a "Tags" multi-select property to your Notion database

## 📚 Full Documentation

For detailed documentation, see:
- **[JOURNAL_IMPORT_README.md](./scripts/JOURNAL_IMPORT_README.md)** - Complete guide with troubleshooting
- **[example-journal-entry.md](./scripts/example-journal-entry.md)** - Example Markdown template

## 🎨 Features

✅ **Automatic Duplicate Detection** - Won't import the same entry twice  
✅ **YAML Frontmatter Parsing** - Extracts title, tags, and date  
✅ **Markdown Conversion** - Converts headings, lists, and paragraphs  
✅ **Recursive Search** - Finds all `.md` files in nested folders  
✅ **Progress Tracking** - Shows real-time import status  
✅ **Error Handling** - Gracefully handles parsing errors  

## 🤝 Need Help?

1. Check the error message
2. Read the [full documentation](./scripts/JOURNAL_IMPORT_README.md)
3. Verify your `.env` configuration
4. Test with the example file first

---

**Happy Journaling! 📓✨**
