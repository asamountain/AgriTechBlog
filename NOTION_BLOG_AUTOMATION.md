# Notion-to-Blog Automation System

## Overview

This system automatically transforms your Notion pages with images and videos into polished blog post drafts using Claude AI. It analyzes your writing style from existing posts and generates content that matches your voice.

## Features

- **Automatic Content Extraction**: Pulls text, images, and videos from Notion pages
- **AI Image Analysis**: Claude Vision analyzes your images to understand context
- **Style Matching**: Analyzes your existing blog posts to replicate your writing style
- **Draft Generation**: Creates complete blog posts as drafts for your review
- **Manual Control**: All posts are created as drafts - you approve before publishing

---

## Prerequisites

Before you begin, you'll need:

1. **Notion Account** with an integration token
2. **Claude API Key** from Anthropic
3. **Your Notion Database ID** where you write blog content
4. **A User ID** from your blog for post authorship

---

## Setup Instructions

### Step 1: Get Your Notion API Credentials

1. Go to [Notion Integrations](https://www.notion.so/my-integrations)
2. Click **"+ New integration"**
3. Give it a name (e.g., "Blog Automation")
4. Copy the **Integration Token** (starts with `ntn_`)
5. Share your Notion database with this integration:
   - Open your Notion database
   - Click **"..."** (three dots) → **"Connections"**
   - Search for your integration and add it

6. Get your **Database ID**:
   - Open your Notion database
   - Copy the URL: `https://notion.so/[THIS-IS-YOUR-DATABASE-ID]?v=...`
   - The database ID is the part after `notion.so/` and before `?v=`

### Step 2: Get Your Claude API Key

1. Go to [Anthropic Console](https://console.anthropic.com/)
2. Sign up or log in
3. Go to **"API Keys"** section
4. Click **"Create Key"**
5. Copy your API key (starts with `sk-ant-`)
6. **Important**: Set up billing in the Anthropic console
   - Go to **"Settings"** → **"Billing"**
   - Add a payment method
   - Set usage limits if desired (recommended: $20/month)

### Step 3: Get Your User ID

You need your blog user ID for post authorship:

```bash
# Option 1: Check your MongoDB database
# Connect to MongoDB and find your user ID

# Option 2: Create a test post and check the userId field
# Then look in the database for your user document
```

### Step 4: Configure Environment Variables

Update your `.env` file with the credentials:

```env
# Notion Integration
NOTION_API_KEY=ntn_your_actual_notion_token_here
NOTION_DATABASE_ID=your_actual_database_id_here

# Claude AI
ANTHROPIC_API_KEY=sk-ant-your_actual_claude_api_key_here

# Automation Settings
AUTO_DRAFT_ENABLED=true
DEFAULT_AUTHOR_ID=your_actual_user_id_here
```

### Step 5: Set Up Your Notion Database

Your Notion database should have these properties:

- **Name** (Title): The blog post title
- **Status** (Select/Status): For tracking processing
  - Values: "Ready to Publish", "Processing", "Published", "Failed"
- **Tags** (Multi-select): Optional tags for categorization

You can customize these property names in [server/config/notion-claude.config.ts](server/config/notion-claude.config.ts).

### Step 6: Deploy to Vercel (if not already)

1. Push your changes to GitHub
2. Import to Vercel
3. Add all environment variables in Vercel dashboard:
   - Go to **Project Settings** → **Environment Variables**
   - Add each variable from your `.env` file
4. Redeploy

---

## Usage

### Method 1: Manual Processing (Recommended for Testing)

Process a specific Notion page on-demand:

```bash
# Using curl
curl -X POST https://your-blog.vercel.app/api/notion-sync/process-page \
  -H "Content-Type: application/json" \
  -d '{"pageId": "your-notion-page-id"}'

# The page ID is from the URL: notion.so/Page-Title-[THIS-IS-THE-PAGE-ID]
```

**Response**:
```json
{
  "success": true,
  "message": "Blog post draft created successfully",
  "data": {
    "draftId": "123",
    "notionPageId": "...",
    "processingTimeMs": 12500,
    "imagesAnalyzed": 3
  }
}
```

### Method 2: Test Configuration

Before processing, test that everything is configured correctly:

```bash
curl https://your-blog.vercel.app/api/notion-sync/test
```

**Response**:
```json
{
  "success": true,
  "message": "All systems operational",
  "tests": {
    "notionConnection": { "passed": true, "message": "Connected" },
    "claudeConnection": { "passed": true, "message": "Connected" },
    "configuration": { "passed": true, "message": "Valid" }
  }
}
```

### Method 3: Automated Polling (Future Enhancement)

To enable automatic processing, you can set up a Vercel Cron Job:

1. Create `api/cron/notion-poll.ts` (see plan for code)
2. Add to `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/notion-poll",
    "schedule": "*/15 * * * *"
  }]
}
```

This will check for new pages every 15 minutes.

---

## Workflow

### Creating a Blog Post from Notion

1. **Write in Notion**:
   - Create a new page in your Notion database
   - Write your notes, ideas, or rough draft
   - Add images and videos inline
   - Keep it natural - the AI will polish it

2. **Mark as Ready**:
   - Set the Status property to "Ready to Publish"
   - Or manually trigger via API (see above)

3. **Processing**:
   - The system extracts your Notion content
   - Claude analyzes any images
   - A writing style profile is created from your existing posts
   - Claude generates a polished blog post matching your style

4. **Review & Edit**:
   - Go to your admin dashboard: `/admin`
   - Find the new draft (marked with "Generated from Notion")
   - Review and edit the content
   - Click "Publish" when ready

5. **Done**!
   - Your blog post is live
   - The Notion page status updates to "Published"

---

## Writing Style Matching

The system learns your writing style by analyzing your existing blog posts:

- **Tone**: Technical vs. casual, educational vs. promotional
- **Structure**: How you use headings, lists, and paragraphs
- **Introduction**: How you hook readers
- **Conclusion**: How you wrap up posts
- **Vocabulary**: Technical depth and jargon usage

This analysis is cached for 7 days. To refresh your style profile:

```bash
# Future enhancement - POST to /api/notion-sync/refresh-style
```

---

## Cost Estimates

### Claude API Costs

Approximate costs per blog post:

- **Image Analysis**: $0.01-0.05 per image
- **Style Analysis**: $0.20-0.50 (cached for 7 days)
- **Blog Generation**: $0.10-0.30 per post

**Example**:
- 20 posts/month with 2 images each = ~$8-12/month
- 100 posts/month with 3 images each = $40-60/month

**Tip**: Set usage limits in Anthropic Console to avoid surprises.

---

## Troubleshooting

### "Configuration validation failed"

**Problem**: Missing environment variables

**Solution**:
1. Run the test endpoint: `/api/notion-sync/test`
2. Check which variables are missing
3. Add them to `.env` and Vercel environment variables
4. Redeploy

### "Notion connection failed"

**Problem**: Invalid Notion API key or database not shared

**Solution**:
1. Verify your NOTION_API_KEY is correct
2. Ensure the integration has access to your database:
   - Open the database → "..." → "Connections"
   - Add your integration if missing

### "Claude API connection failed"

**Problem**: Invalid API key or billing not set up

**Solution**:
1. Verify your ANTHROPIC_API_KEY is correct
2. Check that billing is configured in Anthropic Console
3. Ensure you have available credits/balance

### "Content too short"

**Problem**: Notion page doesn't have enough content

**Solution**:
- Write at least 100 characters in your Notion page
- Adjust `minContentLength` in [server/config/notion-claude.config.ts](server/config/notion-claude.config.ts)

### "Processing timeout"

**Problem**: Too many images or large content

**Solution**:
- Reduce number of images (max 5 recommended)
- Split into multiple posts
- Increase timeout in config

---

## Configuration

Customize behavior in [server/config/notion-claude.config.ts](server/config/notion-claude.config.ts):

```typescript
generation: {
  minContentLength: 100,  // Minimum chars to process
  targetWordCount: {
    min: 800,  // Minimum post length
    max: 2500, // Maximum post length
  },
  styleAnalysisSampleSize: 10,  // Posts to analyze for style
  styleCacheDuration: 7 * 24 * 60 * 60,  // 7 days
  minTags: 3,
  maxTags: 7,
}
```

---

## Advanced Features

### Batch Processing

Process multiple pages at once:

```typescript
// Coming soon - batch processing endpoint
POST /api/notion-sync/batch
{
  "pageIds": ["id1", "id2", "id3"]
}
```

### Custom Prompts

Modify prompts in [server/prompts/blog-generation.ts](server/prompts/blog-generation.ts) to:
- Change tone or style instructions
- Add specific content requirements
- Customize output format

### Integration with Admin Dashboard

Future enhancements will add:
- Processing queue viewer
- Retry failed generations
- Side-by-side Notion vs Generated comparison
- One-click regeneration with different settings

---

## Examples

### Example 1: Simple Notion Page

**Notion Content**:
```
Title: Smart Irrigation with IoT Sensors

We installed moisture sensors in the greenhouse last week.
The sensors send data every 15 minutes to a dashboard.

[Image of sensors in soil]

When moisture drops below 30%, the system automatically
triggers irrigation. This saved us 40% water usage!

[Image of dashboard]
```

**Generated Post**:
A polished 1200-word blog post explaining the setup, technical details,
and benefits - all in your writing style.

### Example 2: Technical Documentation

**Notion Content**:
```
Title: Setting Up LoRaWAN Gateway for Farm Monitoring

Steps I followed:
1. Unboxed the gateway
2. Connected to power
3. Configured via web interface
4. Registered in TTN console

[Images of each step]

Code for sensor:
[Code block with Arduino sketch]
```

**Generated Post**:
A comprehensive tutorial with:
- Introduction explaining LoRaWAN benefits
- Step-by-step guide (expanded with details)
- Code explanation and setup instructions
- Troubleshooting tips
- Conclusion with next steps

---

## Support

### Getting Help

1. Check the [full implementation plan](/Users/test/.claude/plans/snuggly-doodling-engelbart.md)
2. Review error logs in Vercel dashboard
3. Test configuration with `/api/notion-sync/test`
4. Check Claude API usage in Anthropic Console

### Common Questions

**Q: Can I edit generated posts?**
A: Yes! All posts are created as drafts. Edit freely before publishing.

**Q: Will it overwrite my existing posts?**
A: No. It only creates new drafts. Your existing posts are never modified.

**Q: What if I don't like the generated content?**
A: Simply delete the draft or edit it manually. You can also regenerate by processing the Notion page again.

**Q: Can I turn off automation?**
A: Yes. Set `AUTO_DRAFT_ENABLED=false` in your `.env` file.

**Q: How do I update my writing style?**
A: The style profile refreshes automatically every 7 days. Or implement the refresh endpoint to manually update.

---

## Next Steps

1. **Test the System**:
   ```bash
   curl https://your-blog.vercel.app/api/notion-sync/test
   ```

2. **Create a Test Post**:
   - Write a short page in Notion with an image
   - Get the page ID from the URL
   - Process it via the API
   - Check your admin dashboard for the draft

3. **Iterate on Prompts**:
   - Review generated posts
   - Adjust prompts in `server/prompts/blog-generation.ts`
   - Regenerate and compare

4. **Deploy Automation**:
   - Set up cron job for polling
   - Or implement webhooks (advanced)

---

## File Reference

### Core Services
- [notion-content-extractor.ts](server/services/notion-content-extractor.ts) - Extracts content from Notion
- [claude-processor.ts](server/services/claude-processor.ts) - Claude API integration
- [blog-automation-pipeline.ts](server/services/blog-automation-pipeline.ts) - Main orchestrator

### API Endpoints
- [process-page.ts](api/notion-sync/process-page.ts) - Manual processing endpoint
- [test.ts](api/notion-sync/test.ts) - Configuration test endpoint

### Configuration
- [notion-claude.config.ts](server/config/notion-claude.config.ts) - All settings
- [blog-generation.ts](server/prompts/blog-generation.ts) - Claude prompts

### Database
- [schema.ts](shared/schema.ts) - Extended with AI fields

---

## License

This automation system is part of your AgriTech Blog platform.

---

**Happy Blogging! 🌱📝**

Transform your Notion notes into polished blog posts with the power of AI.
