# Notion to MongoDB Sync Script

This script syncs published blog posts from a Notion database to your MongoDB `posts` collection.

## Setup

### 1. Install Dependencies

The required dependencies are already in your `package.json`:
- `@notionhq/client` - Official Notion API client
- `notion-to-md` - Converts Notion blocks to Markdown
- `mongodb` - MongoDB native driver
- `dotenv` - Environment variable loader
- `tsx` - TypeScript execution (dev dependency)

If not already installed:
```bash
npm install
```

### 2. Configure Environment Variables

Add these to your `.env` file:

```bash
# Notion Configuration
NOTION_TOKEN=secret_your_integration_token_here
NOTION_DATABASE_ID=your-database-id-here
DEFAULT_USER_ID=notion-sync  # Optional, defaults to "notion-sync"

# MongoDB Configuration (should already be set)
MONGODB_URI=mongodb+srv://...
MONGODB_DATABASE=blog_database
```

### 3. Set Up Notion Integration

1. **Create a Notion Integration:**
   - Go to https://www.notion.so/my-integrations
   - Click "New integration"
   - Give it a name (e.g., "Blog Sync")
   - Copy the "Internal Integration Token" → This is your `NOTION_TOKEN`

2. **Connect Integration to Your Database:**
   - Open your Notion database
   - Click the "..." menu in the top right
   - Select "Connections" → "Connect to" → Select your integration

3. **Get Database ID:**
   - Open your Notion database in a browser
   - Copy the ID from the URL:
     ```
     https://notion.so/workspace/DATABASE_ID_HERE?v=...
                                 ^^^^^^^^^^^^^^^^
     ```

### 4. Configure Your Notion Database

Your Notion database should have these properties:

#### Required Properties:
- **Name** (Title) - The blog post title
- **Status** (Status/Select) - Must have "Published" option

#### Optional Properties:
- **Slug** (Text) - URL slug (auto-generated from title if missing)
- **Tags** (Multi-select) - Post tags/categories
- **Summary** or **Excerpt** (Text) - Post summary (auto-generated if missing)
- **Featured Image** (URL or Files) - Featured image URL
- Cover image on the page itself also works

#### Example Database Structure:
```
| Name (Title)           | Status    | Slug          | Tags              | Summary        |
|------------------------|-----------|---------------|-------------------|----------------|
| My First Blog Post     | Published | first-post    | Tech, Tutorial    | Learn about... |
| Another Great Article  | Draft     | great-article | Agriculture       | This post...   |
```

## Usage

### Run the Sync

```bash
npm run notion:sync
```

### What It Does

1. ✅ Connects to your Notion database
2. ✅ Fetches all pages where `Status = "Published"`
3. ✅ Converts Notion blocks to Markdown
4. ✅ Extracts metadata (title, tags, images, etc.)
5. ✅ Upserts into MongoDB `posts` collection (matches by `slug`)
6. ✅ Sets `isPublished: true` and `draft: false`

### Output Example

```
🔄 Starting Notion → MongoDB Sync
══════════════════════════════════════════════════

🔌 Connecting to MongoDB...
   ✓ Connected successfully

📥 Fetching pages from Notion...
   Filtering by Status = "Published"
   Found 3 page(s)

📝 Processing: "My First Blog Post"
   Slug: first-post
   Tags: Tech, Tutorial
   Read time: 5 min
   ✓ Inserted new post

📝 Processing: "Another Great Article"
   Slug: great-article
   Tags: Agriculture
   Read time: 8 min
   ✓ Updated existing post

══════════════════════════════════════════════════
📊 Sync Summary
   ✓ Total processed: 2 post(s)
   ✓ Inserted: 1 post(s)
   ✓ Updated: 1 post(s)
══════════════════════════════════════════════════

🔌 MongoDB connection closed

✅ Sync completed successfully!
```

## MongoDB Schema Mapping

| Notion Property | MongoDB Field | Type | Notes |
|----------------|---------------|------|-------|
| Name | `title` | string | Required |
| Slug | `slug` | string | Auto-generated from title if missing |
| Page content | `content` | string | Converted to Markdown |
| Summary/Excerpt | `excerpt` | string | Auto-generated from content if missing |
| Cover image | `featuredImage` | string | Also checks FeaturedImage property |
| Tags | `tags` | string[] | From multi-select or select |
| - | `userId` | string | Set to DEFAULT_USER_ID |
| - | `isPublished` | boolean | Always `true` |
| - | `draft` | boolean | Always `false` |
| - | `readTime` | number | Auto-calculated |
| - | `isFeatured` | boolean | Always `false` (can be changed manually) |
| Created time | `createdAt` | Date | From Notion page creation |
| - | `updatedAt` | Date | Current timestamp |

## Troubleshooting

### "Missing required environment variables"
- Make sure your `.env` file has `NOTION_TOKEN`, `NOTION_DATABASE_ID`, and `MONGODB_URI`

### "Could not find property with name or id: Status"
- Your Notion database doesn't have a "Status" property
- Add a Status property (type: Status or Select) with a "Published" option
- Or the script will fetch all pages if no Status property exists

### "No pages to sync"
- Make sure at least one page has `Status = "Published"`
- Check that your Notion integration is connected to the database

### "Could not convert page to markdown"
- The page might have unsupported block types
- The script will insert an empty content field and log a warning

### Duplicate posts
- The script uses `slug` as the unique identifier
- If two pages have the same slug, the second one will overwrite the first
- Make sure your slugs are unique!

## Advanced Usage

### Custom User ID
Set a custom user ID for synced posts:
```bash
DEFAULT_USER_ID=my-custom-user-id npm run notion:sync
```

### Automation
You can set up a cron job or GitHub Action to run this script periodically:

```yaml
# .github/workflows/notion-sync.yml
name: Sync Notion to MongoDB
on:
  schedule:
    - cron: '0 */6 * * *'  # Every 6 hours
  workflow_dispatch:  # Manual trigger

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '22'
      - run: npm install
      - run: npm run notion:sync
        env:
          NOTION_TOKEN: ${{ secrets.NOTION_TOKEN }}
          NOTION_DATABASE_ID: ${{ secrets.NOTION_DATABASE_ID }}
          MONGODB_URI: ${{ secrets.MONGODB_URI }}
          MONGODB_DATABASE: blog_database
```

## Support

If you encounter any issues, check:
1. Notion integration has access to the database
2. Environment variables are set correctly
3. MongoDB connection is working
4. Your Notion database has the correct property names
