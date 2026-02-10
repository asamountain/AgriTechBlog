# Claude AI Project Context - AgriTech Blog

**Last Updated:** February 9, 2026  
**Project Status:** Production (deployed at tech-san.vercel.app)  
**Environment:** Windows 11 + WSL2

---

## 🎯 Project Overview

Full-stack AgriTech blog platform built with:
- **Frontend:** Vite + React 18 + TypeScript + TailwindCSS
- **Backend:** Express (dev) + Vercel Serverless Functions (production)
- **Database:** MongoDB Atlas
- **Deployment:** Vercel
- **Features:** Admin dashboard, Notion sync, AI tagging (Claude), real-time comments (Firebase)

---

## 🔍 Debugging & Problem Solving

**CRITICAL: Read this before debugging any issue**

When debugging issues, thoroughly investigate root causes before proposing fixes. Do not suggest quick workarounds (e.g., copying .env files) without understanding the underlying system. Ask clarifying questions if the problem domain is unclear.

**Test-Driven Bug Fix Workflow:**
1. **Read** all relevant files to understand current behavior
2. **Write a failing test** that reproduces the exact bug (test MUST fail)
3. **Run the test** with Bash to confirm it fails for the right reason
4. **Only then** propose and implement a fix
5. **Run the test again** to confirm it passes
6. **Run full test suite** to check for regressions

**Never skip straight to editing production code.** If you can't write a failing test, you don't understand the bug yet.

---

## ✨ Code Quality

This project uses **JavaScript and TypeScript** (Next.js/Vercel). When editing files, always validate syntax before finishing—run the relevant linter or type checker. **Never leave syntax errors in edited files.**

Validation commands:
```powershell
npx tsc --noEmit --skipLibCheck     # Type check all
npx tsc --noEmit file.ts            # Check specific file
```

---

## 🌾 Domain Context

**This is an IoT/Industrial AgriTech Project**

When the user asks about hardware/sensor data flow (RS-485, RX data, register values, K values), focus on the **actual embedded/serial data path in the codebase**—not browser-level interception or network tools like Playwright. This project reads data from **physical sensors**.

**Hardware Stack:**
- **Sensors:** RS-485 Modbus sensors connected via serial
- **Data Flow:** Hardware RX pins → Modbus register parsing → Node.js backend → Web UI
- **Registers:** Hold raw sensor values (temperature, humidity, etc.)
- **K Values:** Calibration coefficients stored in specific registers (e.g., Register 16)

**When proposing scaling or data transformation approaches for sensor registers:**
- Present constraints and trade-offs upfront
- Ask the user to confirm before implementing
- Sensor hardware has **strict compatibility requirements**
- Do NOT assume standard software rounding or scaling is acceptable
- Test with actual hardware behavior (e.g., Mode 3 calibration)

---

## ✅ COMPLETED FIXES (Do NOT Redo)

### 1. Vercel Function Limit Fix (COMPLETED Feb 9, 2026)

**Problem:** Had 15 serverless functions, Vercel free tier limit is 12  
**Solution:** Consolidated to 10 functions

**Changes Made:**
- Created `api/_shared/post-helpers.ts` with shared utilities
- Merged `api/blog-post.ts` + `api/blog-posts.ts` + `api/blog-posts/featured.ts` → `api/posts.ts`
- Merged `api/blog-post-meta.ts` + `api/blog-post-ssr.ts` → `api/meta.ts`
- Merged `api/notion-sync/list-pages.ts` + `api/notion-sync/test.ts` → `api/notion-sync/pages.ts`
- Deleted 8 old files
- Updated `vercel.json` with rewrites to maintain backward compatibility

**Current Function Count:** 10 ✅
```
api/posts.ts                    (merged 3)
api/meta.ts                     (merged 2)
api/og-image.ts
api/rss.xml.ts
api/sitemap.xml.ts
api/admin/blog-posts.ts
api/admin/publish-all-posts.ts
api/auth/user.ts
api/notion-sync/pages.ts        (merged 2)
api/notion-sync/process-page.ts
```

**Frontend:** Zero changes needed - `vercel.json` rewrites handle old URLs

---

### 2. Editor Cursor Jumping Bug (FIXED Feb 9, 2026)

**Problem:** Typing in post editor caused:
- Space key not working properly
- Backspace removing extra characters
- Cursor jumping to wrong position

**Root Cause:** React re-rendering while typing due to:
1. `useEffect` in `simple-markdown-editor.tsx` watching all field values in dependency array
2. `useEffect` in `notion-editor.tsx` re-running on every content change

**Solution Applied:**
- **File 1:** `client/src/components/simple-markdown-editor.tsx` line 234
  - Changed: `}, [initialTitle, initialContent, ..., tags]);`
  - To: `}, [postId]);`
  - Result: Only re-renders when switching posts, not on keystrokes

- **File 2:** `client/src/components/notion-editor.tsx` line 88
  - Changed: `}, [content, editor]);`
  - To: `}, []);`
  - Result: Only runs on mount, prevents cursor reset

**Status:** ✅ FIXED - Do not touch these dependency arrays again

---

### 3. Medium-Style Inline Commenting (IMPLEMENTED Feb 9, 2026)

**Feature:** Allow users to select text and add inline comments (like Medium.com)

**Implementation:**
1. **Frontend Components:**
   - `client/src/components/inline-comment-popup.tsx` - Comment form that appears on text selection
   - `client/src/components/inline-comment-sidebar.tsx` - Sidebar showing all inline comments
   - `client/src/hooks/useTextSelection.ts` - Hook to detect text highlighting

2. **Backend API:**
   - `api/admin/inline-comments.ts` - GET/POST endpoint for inline comments
   - Extended Comment schema with: selectedText, paragraphId, startOffset, endOffset
   - MongoDB collection: `inline-comments`

3. **Integration:**
   - Modified `client/src/pages/blog-post.tsx`:
     - Added paragraph IDs to markdown rendering
     - Changed layout from 4-column to 5-column grid (TOC | Content | Inline Comments)
     - Integrated InlineCommentPopup and InlineCommentSidebar
     - Added text selection highlighting

4. **URL Routing:**
   - Added vercel.json rewrite: `/api/blog-posts/:postId/inline-comments` → `/api/admin/inline-comments?postId=:postId`

**Function Count:** Still at 11 (added 1 for inline-comments) ✅

**Status:** ✅ IMPLEMENTED - Ready to deploy

---

### 4. Windows Development Setup (RESOLVED)

**Problem:** Bash scripts fail on Windows  
**Solutions Applied:**
- Removed `./scripts/kill-port.sh` from `predev` script
- Updated deploy commands to use Vercel CLI directly
- User should run from PowerShell, not WSL (to avoid esbuild platform mismatch)

**Working Commands:**
```powershell
npm run dev           # Runs backend + frontend
npm run build         # Vite build
npm run deploy:quick  # Direct Vercel deploy
```

**Do NOT reinstall node_modules in WSL** - causes esbuild platform errors

---

## 📂 Important File Locations

### API Functions (Serverless)
- `api/posts.ts` - Unified blog post handler (GET with query params)
- `api/meta.ts` - OG meta tags generator
- `api/_shared/post-helpers.ts` - Shared utilities (do not deploy as function)
- `vercel.json` - URL rewrites (maintains backward compatibility)

### Frontend Components
- `client/src/components/simple-markdown-editor.tsx` - Main post editor
- `client/src/components/notion-editor.tsx` - TipTap rich text editor
- `client/src/pages/create-post.tsx` - Post creation page
- `client/src/pages/admin-working.tsx` - Admin dashboard

### Configuration
- `package.json` - Scripts updated for Windows compatibility
- `vercel.json` - 7 rewrites for API consolidation
- `tsconfig.json` - TypeScript config

---

## 🚫 KNOWN ISSUES (Do Not Debug)

### 1. Admin Dashboard Error on Deployed Site
- **Status:** Known issue - admin endpoint returns 500 on Vercel
- **Error:** "FUNCTION_INVOCATION_FAILED" on `/api/admin/blog-posts`
- **Workaround:** Admin functionality works locally, use `npm run dev`
- **Likely Cause:** Vercel cold start or MongoDB connection timeout
- **DO NOT FIX YET** - User needs to deploy first to see real logs

### 2. MongoDB Connection in Development
- User has MongoDB Atlas configured
- Connection works (verified via test scripts)
- ~86 posts exist in database

### 3. Firebase Comments
- Optional feature - configured but not critical
- Can be enabled later with environment variables

---

## 🔄 Deployment Process

### Current Status
- **Vercel Project:** Exists (tech-san.vercel.app)
- **Git Remote:** Should be connected
- **Function Count:** 10/12 ✅

### To Deploy:
```powershell
# Option 1: Auto-deploy via git push
git add .
git commit -m "your message"
git push

# Option 2: Direct deploy
npm run deploy:quick

# Option 3: Preview deploy
npm run deploy:preview
```

**Environment Variables Needed on Vercel:**
- `MONGODB_URI`
- `MONGODB_DATABASE` (blog_database)
- `SESSION_SECRET`
- Optional: `NOTION_TOKEN`, `CLOUDINARY_*`, Firebase vars

---

## 🛠️ Development Workflow

### Starting Development
```powershell
cd "C:\Users\iocrops admin\Coding\AgriTechBlog"
npm run dev
```
- Backend: http://localhost:5000
- Frontend: http://localhost:5173
- Admin: http://localhost:5173/admin

### Building for Production
```powershell
npm run build
```

### Testing API Changes
```powershell
# Type check specific files
npx tsc --noEmit --skipLibCheck api/posts.ts api/meta.ts
```

---

## 📊 Database Schema

**MongoDB Collection:** `posts`

**Key Fields:**
- `_id` - ObjectId
- `id` - Numeric ID (generated from ObjectId)
- `title` - String
- `content` - Markdown string
- `slug` - URL-friendly string
- `excerpt` - Short description
- `coverImage` / `featuredImage` - Image URL
- `tags` - Array of strings
- `draft` - Boolean (true = unpublished)
- `featured` - Boolean (true = featured post)
- `date` - Creation date
- `lastModified` - Last update date

**Published Posts:** `draft: { $ne: true }`

---

## 🐛 Common Debugging Steps

### If Editor Acts Weird
1. Check `simple-markdown-editor.tsx` line 234 - should only depend on `[postId]`
2. Check `notion-editor.tsx` line 88 - should be empty `[]`
3. Clear browser cache
4. Restart dev server

### If API Fails
1. Check function count: `Get-ChildItem -Path "api" -Recurse -File | Where-Object { $_.Directory.Name -ne '_shared' }` should show 10 files
2. Verify `vercel.json` rewrites exist
3. Check Vercel deployment logs
4. Test locally with `npm run dev`

### If Build Fails
1. Check for TypeScript errors: `npm run check`
2. Ensure dependencies installed: `npm install`
3. Clear dist: `rm -rf dist`

---

## 🎨 User Preferences

- **Editor:** VSCode
- **Terminal:** PowerShell (avoid WSL due to esbuild issues)
- **OS:** Windows 11 with WSL2 available
- **Goal:** Personal AgriTech blog about IoT engineering, smart farming, RS485, Modbus
- **Tone:** Authentic, technical, beginner-friendly

---

## 📝 TODO (Future Work)

- [ ] Fix admin dashboard 500 error on production
- [ ] Enable Firebase comments (optional)
- [ ] Set up Notion auto-sync (optional)
- [ ] Add SSL certificate for custom domain (if needed)
- [ ] Publish September journal post

---

## ⚠️ IMPORTANT REMINDERS

1. **DO NOT merge API functions further** - Already at 10, safe margin below 12 limit
2. **DO NOT touch editor useEffect dependencies** - Cursor bug is fixed
3. **DO NOT run `npm install` in WSL** - Causes esbuild platform errors
4. **DO NOT create markdown docs for each change** - User doesn't want them
5. **DO verify function count before suggesting more consolidation** - It's done

---

## 🔗 Useful Commands

```powershell
# Count current functions
(Get-ChildItem -Path "api" -Recurse -File | Where-Object { $_.Directory.Name -ne '_shared' }).Count

# Check MongoDB connection
npm run db:test

# List all posts in DB
npm run db:check

# Kill stuck ports
taskkill /F /IM node.exe

# Clean build artifacts
npm run clean
```

---

**End of Context Document**

This file serves as a memory for Claude AI assistants working on this project.  
Do not recreate fixes that are marked as ✅ COMPLETED above.
