# 📓 Bulk Import Journal Entries to Notion

This Python script automates the process of importing local Markdown journal entries into your Notion database.

## 🎯 What It Does

- **Recursively searches** for Markdown files in your local journal folder (e.g., `Journal/2024/**/*.md`)
- **Parses YAML frontmatter** to extract metadata (title, tags, date)
- **Converts Markdown content** to Notion blocks (headings, paragraphs, lists)
- **Uploads to Notion** as properly formatted pages
- **Prevents duplicates** by checking if entries already exist

## 📋 Prerequisites

### 1. Python 3.7+

Check your Python version:
```bash
python3 --version
```

### 2. Notion Integration

You need a Notion integration token with access to your Journal database.

#### Create a Notion Integration:

1. Go to [https://www.notion.so/my-integrations](https://www.notion.so/my-integrations)
2. Click **"+ New integration"**
3. Give it a name (e.g., "Journal Importer")
4. Select your workspace
5. Click **"Submit"**
6. Copy the **"Internal Integration Token"** (starts with `secret_`)

#### Connect Integration to Your Database:

1. Open your Notion "Journal.db" database
2. Click the **"..."** menu (top right)
3. Select **"Add connections"**
4. Find and select your integration (e.g., "Journal Importer")

### 3. Get Your Database ID

Your Notion database URL looks like:
```
https://www.notion.so/workspace/DatabaseName-1234567890abcdef1234567890abcdef?v=...
```

The database ID is the 32-character hex string: `1234567890abcdef1234567890abcdef`

## 🚀 Setup

### Step 1: Install Python Dependencies

```bash
pip install -r scripts/requirements-journal-import.txt
```

Or install manually:
```bash
pip install notion-client python-frontmatter python-dotenv
```

### Step 2: Configure Environment Variables

Add these to your `.env` file:

```bash
# Notion Journal Import
NOTION_TOKEN=secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NOTION_JOURNAL_DB_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
JOURNAL_ROOT_PATH=./Journal
```

**Replace:**
- `NOTION_TOKEN`: Your integration token from Step 2 above
- `NOTION_JOURNAL_DB_ID`: Your database ID from Step 3 above
- `JOURNAL_ROOT_PATH`: Path to your local journal folder (relative or absolute)

### Step 3: Prepare Your Notion Database

Your Notion database should have these properties:

| Property Name | Type         | Required | Description                    |
|---------------|--------------|----------|--------------------------------|
| **Name**      | Title        | ✅ Yes   | Entry title                    |
| **Tags**      | Multi-select | ❌ No    | Tags/categories                |
| **Date**      | Date         | ❌ No    | Entry date                     |

**Note:** The script assumes the title property is named "Name". If yours is different, you'll need to adjust the script.

## 📝 Markdown File Format

Your Markdown files should follow this format:

```markdown
---
title: Lands as candidates in South Korea
tags: real-estate, information
date: 2024-02-14
---

1. Jeollanam-do Boseong-gun
   - Location details...
   - Price information...

2. Gyeongsangnam-do Hadong-gun
   - Location details...
   - Price information...

## Additional Notes

Some additional thoughts and observations...
```

### Supported Frontmatter Fields:

- **`title`**: Entry title (string)
- **`tags`**: Tags/categories (comma-separated string or YAML list)
- **`date`**: Entry date (YYYY-MM-DD format)

### Supported Markdown Features:

- ✅ Headings (`#`, `##`, `###`)
- ✅ Paragraphs
- ✅ Bullet lists (`-` or `*`)
- ✅ Numbered lists (`1.`, `2.`, etc.)
- ⚠️ **Limited:** Bold, italic, links (converted to plain text)
- ❌ **Not supported:** Images, tables, code blocks (will be converted to paragraphs)

## 🎬 Usage

### Run the Import Script:

```bash
python3 scripts/import-journal-to-notion.py
```

### Expected Output:

```
╔════════════════════════════════════════════════════════╗
║     📓 Bulk Import Journal Entries to Notion 📓        ║
╚════════════════════════════════════════════════════════╝

📁 Searching for Markdown files in: ./Journal
✅ Found 15 Markdown file(s)

[1/15] Processing: 2024-02-14-Title.md
   Title: Lands as candidates in South Korea
   Tags: real-estate, information
   Date: 2024-02-14
   ✅ Imported successfully

[2/15] Processing: 2024-02-15-Another-Entry.md
   Title: Another Entry
   Tags: personal
   Date: 2024-02-15
   ⏭️  Skipped (already exists)

...

════════════════════════════════════════════════════════
📊 Import Summary
   ✅ Imported: 12
   ⏭️  Skipped: 2
   ❌ Failed: 1
   📝 Total: 15
════════════════════════════════════════════════════════

🎉 Import completed successfully!
```

## 🔧 Troubleshooting

### Error: "Missing required environment variable: NOTION_TOKEN"

**Solution:** Make sure you've added `NOTION_TOKEN` to your `.env` file.

### Error: "Could not find database"

**Solution:** 
1. Check that `NOTION_JOURNAL_DB_ID` is correct
2. Verify that your integration has access to the database (see "Connect Integration to Your Database" above)

### Error: "Journal root path not found"

**Solution:** 
1. Check that `JOURNAL_ROOT_PATH` in `.env` points to the correct folder
2. Use an absolute path if relative paths aren't working: `JOURNAL_ROOT_PATH=/Users/yourname/Documents/Journal`

### Error: "property_not_found: Tags"

**Solution:** Your Notion database doesn't have a "Tags" property. Either:
1. Add a "Tags" multi-select property to your database, or
2. Comment out the tags section in the script (lines with `properties["Tags"]`)

### Pages are created but content is missing

**Solution:** 
- Notion has a limit of 100 blocks per page creation
- If your entries are very long, the script will truncate to 100 blocks
- Consider splitting long entries into multiple files

### Duplicate entries are being created

**Solution:** The script checks for duplicates by title. If you're still getting duplicates:
1. Ensure titles in your frontmatter are unique
2. Check that the "Name" property in Notion matches exactly

## 🎨 Customization

### Change the Title Property Name

If your Notion database uses a different name for the title property (e.g., "Title" instead of "Name"), update line 269:

```python
properties = {
    "Title": {  # Change "Name" to "Title"
        "title": [
            {
                "type": "text",
                "text": {"content": title}
            }
        ]
    }
}
```

### Add Custom Properties

To add more properties (e.g., "Status", "Category"), add them to the `properties` dict:

```python
# Add a status property
properties["Status"] = {
    "select": {"name": "Published"}
}

# Add a category property
properties["Category"] = {
    "select": {"name": metadata.get("category", "General")}
}
```

### Change File Search Pattern

To search in a different location or pattern, modify the `JOURNAL_ROOT_PATH` in `.env` or update the `find_markdown_files()` function.

## 📚 Related Documentation

- [Notion API Documentation](https://developers.notion.com/)
- [Python Frontmatter Library](https://python-frontmatter.readthedocs.io/)
- [Main Notion Sync Script](./NOTION_SYNC_README.md) - For syncing blog posts from Notion

## 🤝 Support

If you encounter issues:

1. Check the error message carefully
2. Verify all environment variables are set correctly
3. Ensure your Notion integration has proper permissions
4. Test with a single file first before bulk importing

## 📄 License

This script is part of the AgriTech Blog project and follows the same license.
