# Quick Fix Guide

## Issue 1: Port Conflicts ✅ FIXED

### Problem
- Backend was finding port 5001 instead of 5000
- Port 3000/5000/5173 occupied by zombie processes
- Frontend proxy expects backend on port 5000

### Solution
**Automatic port cleanup before starting dev server:**

```bash
npm run dev
```

The `predev` script now automatically:
1. ✅ Kills any process on port 3000
2. ✅ Kills any process on port 5000
3. ✅ Kills any process on port 5173
4. ✅ Starts backend on port 5000 (fixed, no more port hunting)
5. ✅ Starts frontend on port 5173

### Manual Port Cleanup (if needed)
```bash
# Kill specific port
./scripts/kill-port.sh 3000
./scripts/kill-port.sh 5000
./scripts/kill-port.sh 5173

# Or run the predev script manually
npm run predev
```

---

## Issue 2: Hidden Posts (96 out of 101) ✅ FIXED

### Problem
- Database has 101 posts
- Only 5 are visible (marked as published)
- 96 posts have `draft: true` or missing `isPublished: true`

### Solution
**Publish all posts at once:**

```bash
npm run db:publish-all
```

This script will:
1. ✅ Connect to MongoDB
2. ✅ Find ALL posts (101 total)
3. ✅ Update them to `{ isPublished: true, draft: false }`
4. ✅ Show summary of changes

### Expected Output
```
📢 Publishing All Posts
══════════════════════════════════════════════════

🔌 Connecting to MongoDB...
   Database: blog_database
   ✓ Connected successfully

📊 Total posts in database: 101
   Currently published: 5
   Currently hidden: 96

🔄 Updating 96 post(s)...

══════════════════════════════════════════════════
📊 Update Summary
   ✓ Total posts: 101
   ✓ Modified: 96
   ✓ Matched: 101
══════════════════════════════════════════════════

✅ All 101 posts are now published!
```

---

## Complete Workflow

### First Time Setup
```bash
# 1. Publish all existing posts
npm run db:publish-all

# 2. Start the dev server (with automatic port cleanup)
npm run dev
```

### Daily Development
```bash
# Just run dev - ports are automatically cleaned
npm run dev
```

### If Ports Are Still Stuck
```bash
# Manually kill ports
npm run predev

# Then start dev
npm run dev
```

---

## Files Modified

1. **`package.json`**
   - Added `predev` script (runs before `dev`)
   - Added `db:publish-all` script
   - Backend now always uses port 5000

2. **`server/index.ts`**
   - Removed dynamic port finding
   - Fixed to always use port 5000

3. **`scripts/kill-port.sh`** (NEW)
   - Utility to kill processes on specific ports

4. **`scripts/publish-all.ts`** (NEW)
   - Publishes all posts in MongoDB

---

## Troubleshooting

### "Permission denied" when running kill-port.sh
```bash
chmod +x scripts/kill-port.sh
```

### "Port 5000 is already in use"
```bash
npm run predev
# Then try again
npm run dev
```

### "No posts visible after publishing"
1. Check MongoDB connection:
   ```bash
   npm run db:test
   ```

2. Verify posts are published:
   ```bash
   npm run db:publish-all
   ```

3. Restart dev server:
   ```bash
   npm run dev
   ```

### Backend still on wrong port
- Make sure you've saved `server/index.ts`
- Restart the dev server
- Check terminal output for port number

---

## Quick Commands Reference

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start dev server (auto-cleans ports) |
| `npm run predev` | Manually clean ports |
| `npm run db:publish-all` | Publish all posts |
| `./scripts/kill-port.sh 5000` | Kill specific port |
| `npm run db:test` | Test MongoDB connection |
| `npm run db:check` | Check posts in database |

---

## Success Indicators

✅ Backend starts on port 5000  
✅ Frontend starts on port 5173  
✅ No "Found available port" messages  
✅ All 101 posts visible in the app  
✅ No "Unable to load articles" errors  

---

**Need Help?**
- Check logs in terminal for errors
- Verify `.env` has correct MongoDB credentials
- Run `npm run db:test` to verify connection
