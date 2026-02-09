# Multi-AI Blog Polishing Setup

## Overview

Your blog now uses a **two-stage AI pipeline** to optimize costs:

1. **Stage 1 (Claude)**: Heavy lifting - image analysis, style matching, content generation
2. **Stage 2 (Grok/Llama3)**: Polish and refine - grammar, readability, SEO optimization

This saves money by using expensive Claude only for tasks requiring vision and style analysis, while using cheaper alternatives for final polishing.

---

## Architecture

```
Notion Page
    ↓
[Claude Vision] → Analyze images ($$$)
    ↓
[Claude Sonnet] → Generate draft from style analysis ($$$)
    ↓
[Grok/Llama3] → Polish grammar, SEO, readability ($)
    ↓
Draft saved for your review
```

---

## Setup Options

### Option 1: Grok (xAI) - Recommended

**Pros**: Fast, good quality, reasonable pricing
**Cons**: Requires API key and payment
**Cost**: ~$5 per million tokens (~$0.05-0.10 per polish)

**Setup**:
1. Go to https://console.x.ai/
2. Sign up and create API key
3. Add to `.env`:
   ```env
   POLISHER_ENABLED=true
   POLISHER_PROVIDER=grok
   POLISHER_API_KEY=xai-your-grok-api-key
   POLISHER_MODEL=grok-beta
   ```

---

### Option 2: Groq (Llama3) - Free Tier Available

**Pros**: Super fast inference, often has free tier
**Cons**: Rate limits on free tier
**Cost**: Free tier available, then ~$0.27 per million tokens

**Setup**:
1. Go to https://console.groq.com/
2. Sign up and get API key
3. Add to `.env`:
   ```env
   POLISHER_ENABLED=true
   POLISHER_PROVIDER=groq-llama3
   POLISHER_API_KEY=gsk_your-groq-api-key
   POLISHER_MODEL=llama-3.1-70b-versatile
   ```

**Models available**:
- `llama-3.1-70b-versatile` (best quality)
- `llama-3.1-8b-instant` (fastest)
- `mixtral-8x7b-32768` (good balance)

---

### Option 3: Ollama (Local Llama3) - 100% Free

**Pros**: Completely free, no API limits, privacy
**Cons**: Requires local setup, slower, needs good GPU
**Cost**: $0 (uses your computer)

**Setup**:
1. Install Ollama: https://ollama.ai/
2. Download model:
   ```bash
   ollama pull llama3.1:70b  # or llama3.1:8b for faster
   ```
3. Verify it's running:
   ```bash
   ollama list
   ```
4. Add to `.env`:
   ```env
   POLISHER_ENABLED=true
   POLISHER_PROVIDER=ollama-llama3
   POLISHER_MODEL=llama3.1:70b
   # No API key needed!
   ```

**Hardware requirements**:
- 8B model: 8GB RAM minimum
- 70B model: 40GB RAM or good GPU recommended

---

## Testing the Setup

### 1. Test Polisher Connection

Create a test endpoint or use Node REPL:

```typescript
import { ContentPolisher } from './server/services/grok-polisher';

const polisher = new ContentPolisher({
  provider: 'grok', // or 'groq-llama3' or 'ollama-llama3'
  apiKey: 'your-api-key',
});

// Test connection
const isConnected = await polisher.testConnection();
console.log('Polisher connected:', isConnected);

// Test polishing
const result = await polisher.polishContent(
  'This is a test blog post with some grammer errors.',
  'Test Post',
  'A test post for testing'
);

console.log('Polished:', result.polishedContent);
console.log('Improvements:', result.improvements);
```

### 2. Process a Test Notion Page

```bash
curl -X POST http://localhost:3000/api/notion-sync/process-page \
  -H "Content-Type: application/json" \
  -d '{"pageId": "your-test-page-id"}'
```

Check the logs for polishing step:
```
[Pipeline] Step 5: Generating blog post...
[Pipeline] Generated post: "..."
[Pipeline] Step 5.5: Polishing with secondary AI...
[Pipeline] Content polished. Improvements: 5
[Pipeline] Polish notes: Fixed 3 grammar errors, Improved readability score, ...
```

---

## What Gets Polished

The polisher focuses on:

### ✅ Grammar & Style
- Fix grammatical errors
- Improve sentence structure
- Consistent punctuation
- Remove awkward phrasing

### ✅ Readability
- Better flow and transitions
- Clearer explanations
- Active voice where appropriate
- Remove redundancy

### ✅ Consistency
- Consistent terminology
- Uniform tone
- Standard formatting

### ✅ SEO Optimization
- Keyword optimization
- Better heading structure
- Meta description suggestions
- Internal link opportunities

### ❌ What's NOT Changed
- Technical accuracy (preserved)
- Code blocks (untouched)
- Core message (maintained)
- Author's voice (respected)
- Markdown structure (kept)

---

## Cost Comparison

For a 1500-word blog post with 3 images:

| Service | Stage | Cost | What It Does |
|---------|-------|------|--------------|
| Claude Sonnet | Generation | $0.20-0.30 | Image analysis + style matching + draft generation |
| Grok | Polish | $0.05-0.10 | Grammar + readability + SEO polish |
| Groq (Llama3) | Polish | $0.01-0.02 | Same as Grok (free tier available) |
| Ollama (Local) | Polish | $0.00 | Same, but uses your computer |

**Total cost per post**:
- Claude only: $0.20-0.30
- Claude + Grok: $0.25-0.40
- Claude + Groq: $0.21-0.32 (or free with free tier)
- Claude + Ollama: $0.20-0.30 (polish is free)

**Savings strategy**: Use Groq free tier or Ollama local for unlimited free polishing!

---

## Disabling the Polisher

To skip the polishing step:

```env
POLISHER_ENABLED=false
```

Or remove the environment variable entirely. The pipeline will work fine without it.

---

## Advanced Configuration

### Custom Polishing Prompts

Edit [server/services/grok-polisher.ts](server/services/grok-polisher.ts) → `buildPolishingPrompt()` to customize what the polisher focuses on.

### Quick Grammar Check Only

For faster, cheaper checks:

```typescript
const errors = await polisher.quickCheck(content);
console.log('Grammar errors:', errors);
```

### Multiple Passes

For extra polish, run it twice:

```typescript
let content = generatedPost.content;

// First pass: grammar and style
const firstPass = await polisher.polishContent(content, title, excerpt);
content = firstPass.polishedContent;

// Second pass: SEO and engagement
const secondPass = await polisher.polishContent(content, title, excerpt);
content = secondPass.polishedContent;
```

---

## Troubleshooting

### "Polisher not configured"

**Issue**: Environment variables not set
**Fix**: Check that `POLISHER_ENABLED=true` and provider/API key are set

### "Grok API error: 401"

**Issue**: Invalid API key
**Fix**: Verify your API key at https://console.x.ai/

### "Ollama error: Connection refused"

**Issue**: Ollama not running
**Fix**: Start Ollama: `ollama serve`

### Polishing takes too long

**Issue**: Large content or slow model
**Fix**:
- Use faster model (llama-3.1-8b-instant)
- Reduce content length before polishing
- Check network connection for API services

### Polished content quality is poor

**Issue**: Model not suitable for task
**Fix**:
- Try different provider (Grok usually best quality)
- Adjust temperature in code (lower = more consistent)
- Customize polishing prompt for your needs

---

## Best Practices

1. **Start with Groq free tier** - Test without cost
2. **Monitor costs** - Track API usage in dashboards
3. **Test with sample posts** - Verify quality before production
4. **Keep Claude for generation** - It's the best at style matching
5. **Use Ollama for high volume** - Free for unlimited posts
6. **Customize prompts** - Tailor polishing to your needs

---

## Example Workflow

```bash
# 1. Write in Notion with images
# 2. Trigger processing
curl -X POST https://your-blog.vercel.app/api/notion-sync/process-page \
  -d '{"pageId": "abc123"}'

# 3. System processes:
#    - Claude: $0.25 (images + generation)
#    - Grok: $0.08 (polish)
#    - Total: $0.33

# 4. Review draft in /admin
# 5. Publish!
```

---

## Comparing Output Quality

Create the same post with different settings:

```bash
# Without polish
POLISHER_ENABLED=false npm run process-notion abc123

# With Grok
POLISHER_ENABLED=true POLISHER_PROVIDER=grok npm run process-notion abc123

# With Groq
POLISHER_ENABLED=true POLISHER_PROVIDER=groq-llama3 npm run process-notion abc123

# With Ollama
POLISHER_ENABLED=true POLISHER_PROVIDER=ollama-llama3 npm run process-notion abc123
```

Compare the results and choose your preferred setup!

---

## FAQ

**Q: Do I need both Claude and a polisher?**
A: No, Claude alone works fine. The polisher is optional for cost savings and extra refinement.

**Q: Can I use only Grok/Llama without Claude?**
A: No, Claude is required for image analysis and style matching. Grok/Llama only polish the final draft.

**Q: Which polisher is best?**
A: Grok for quality, Groq for free tier, Ollama for unlimited free usage.

**Q: Will polishing change my writing style?**
A: No, it's instructed to maintain your voice. It only fixes errors and improves readability.

**Q: Can I review before polishing?**
A: Currently it's automatic. But you can disable it and manually trigger polishing on specific drafts (future feature).

---

**Happy multi-AI blogging! 🤖🤖📝**

Save money while maintaining quality with intelligent AI orchestration.
