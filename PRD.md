# Project Initiator Guidelines

## 🚨 CRITICAL: ALWAYS CHECK FIX-LOG.md BEFORE MAKING CHANGES

**⚠️ MANDATORY: Before modifying any deployment configuration, API endpoints, or core system components, you MUST review `FIX-LOG.md` to avoid repeating critical errors that have already been solved.**

### Why This Matters:
- Prevents reverting critical fixes that took hours to resolve
- Avoids breaking production deployments with known problematic configurations
- Saves development time by learning from past issues
- Maintains system stability by following proven working solutions

### When to Check FIX-LOG.md:
- Before modifying `vercel.json` configuration
- Before changing API endpoint configurations
- Before updating deployment scripts
- Before removing or adding dependencies
- When encountering errors similar to ones listed in the log
- Before implementing any "quick fixes" that might be documented

### Critical Rules:
1. **READ FIX-LOG.md** before making system changes
2. **UPDATE FIX-LOG.md** when you solve a new critical issue  
3. **FOLLOW the prevention rules** documented in previous fixes
4. **TEST thoroughly** using the verification steps in the log

**Location**: `FIX-LOG.md` in the project root

---

## 🛡️ CRITICAL: ENVIRONMENT FILE PROTECTION RULES

**🚨 ABSOLUTE RESTRICTION: NEVER MODIFY .env FILES DIRECTLY**

### Why This Is Critical:
- `.env` files contain sensitive production credentials
- Protected by `.cursorignore` for security reasons
- Unauthorized changes can break production deployments
- User's MongoDB Atlas database contains valuable blog post data
- Changes can cause data loss or service disruption

### Environment File Protection Rules:
1. **NEVER use `edit_file` or `search_replace` on `.env` files**
2. **NEVER suggest direct `.env` modifications** without user explicit request
3. **ALWAYS ask user** to provide credentials rather than guessing/creating them
4. **RESPECT `.cursorignore` protection** - these files are intentionally protected
5. **ONLY provide guidance** on what credentials are needed, never create them

### When Environment Issues Occur:
1. **IDENTIFY the problem** (missing credentials, wrong format, etc.)
2. **EXPLAIN what credentials are needed** (MongoDB Atlas URI, API tokens, etc.)
3. **PROVIDE guidance** on where to find the credentials
4. **WAIT for user to provide** the actual credentials
5. **NEVER create placeholder or fake credentials**

### MongoDB Atlas Connection Protection:
- **NEVER change MongoDB URI** to localhost without explicit user request
- **PRESERVE existing Atlas connections** that contain user's blog post data
- **ALWAYS ask** before suggesting database changes
- **RESPECT user's existing data** and production setup

### Figma Integration Protection:
- **NEVER create fake Figma tokens** or file keys
- **ALWAYS ask user** to provide real Figma credentials
- **EXPLAIN the process** of getting Figma API tokens and file keys
- **WAIT for user input** before proceeding with integration

### Emergency Recovery:
If environment files are accidentally modified:
1. **STOP all development servers immediately**
2. **ASK user** for their original credentials
3. **HELP user restore** their original `.env` configuration
4. **VERIFY connection** to their existing databases
5. **TEST thoroughly** before proceeding

**Remember: User's data and production setup are more important than "fixing" configuration issues.**

---

## Rule #1: Simplicity Over Complexity

**CRITICAL: Always choose the simplest solution that works. Complexity is the enemy of maintainability.**

### Core Principles:
- **One responsibility per function/component** - no multi-purpose code
- **Linear logic flow** - avoid nested conditions and complex branching
- **Explicit over implicit** - clear, readable code over clever shortcuts
- **Delete code before adding code** - remove unused features and dead code
- **Flat over nested** - prefer composition over deep inheritance or nesting

### Implementation Standards:
- Maximum 3 levels of nesting in any function
- Functions should be under 50 lines
- Components should have single, clear purposes
- Avoid abstract patterns unless absolutely necessary
- Use descriptive names over comments
- Prefer multiple simple functions over one complex function

### Warning Signs of Complexity:
- Functions that do multiple things
- Nested ternary operators or complex conditionals
- Deep object/array manipulations
- Hard-to-test code
- Code that requires extensive comments to understand

### Benefits:
- Easier debugging and maintenance
- Faster development velocity
- Better testability
- Reduced bug surface area
- Easier onboarding for new developers

**When in doubt, choose the boring, simple solution.**

---

## CRITICAL ADMIN EDIT POST SYSTEM LOG

**⚠️ DANGER ZONE: Admin Post Editor Critical Dependencies**

### Critical API Endpoint Failures - FIXED 2025-01-XX:
**ISSUE**: Auto-save functionality was broken due to HTTP 405 "Method Not Allowed" errors
**ROOT CAUSE**: `/api/admin/blog-posts` endpoint only accepted GET requests but auto-save attempts POST requests
**SOLUTION**: Added POST method support to `api/admin/blog-posts.ts` with proper MongoDB integration
**CRITICAL LESSON**: Any changes to auto-save logic MUST be tested with network tab monitoring

### Auto-Save System Architecture:
**Files That Must Stay In Sync**:
1. `client/src/pages/create-post.tsx` - Auto-save mutation logic
2. `client/src/components/simple-markdown-editor.tsx` - Auto-save UI components
3. `api/admin/blog-posts.ts` - POST/GET endpoint handlers
4. `api/admin/blog-posts/[id].ts` - PATCH endpoint for updates
5. `server/routes.ts` - Server-side route definitions

### Bulk Edit System Status: ✅ IMPLEMENTED
**Location**: `client/src/pages/admin-working.tsx` (PostManagement component)
**Features Available**:
- ✅ Select individual posts with checkboxes
- ✅ Select all posts functionality  
- ✅ Bulk publish/unpublish operations
- ✅ Bulk feature/unfeature operations
- ✅ Bulk delete operations
- ✅ Clear selection functionality

### NEVER TOUCH THESE WITHOUT FULL SYSTEM TEST:
1. **Auto-save timing intervals** (currently 10s periodic, 3s on change)
2. **MongoDB field mapping** (isPublished ↔ draft field inversion)
3. **Post ID generation strategy** (ObjectId substring method)
4. **CORS headers** in API endpoints - required for cross-origin requests
5. **Authentication flow** - admin routes bypass normal auth

### Emergency Rollback Commands:
```bash
# If auto-save breaks, check these endpoints:
curl -X POST /api/admin/blog-posts -H "Content-Type: application/json" -d '{"title":"test","content":"test"}'
curl -X GET /api/admin/blog-posts
curl -X PATCH /api/admin/blog-posts/123 -H "Content-Type: application/json" -d '{"isPublished":true}'
```

### Testing Protocol Before Any Admin Changes:
1. ✅ Test auto-save in browser dev tools network tab
2. ✅ Test bulk operations with multiple post selection
3. ✅ Test PATCH updates for individual posts
4. ✅ Verify MongoDB data consistency
5. ✅ Test both new post creation and existing post updates

**⚠️ WARNING**: The admin system is complex with multiple interdependent parts. Always test the complete workflow end-to-end before deploying changes.

---

## Data Architecture Rule

**CRITICAL: MongoDB is the ONLY data source. No local storage, memory storage, or mixed data approaches.**

### Core Requirements:
- All application data MUST be stored in and retrieved from MongoDB exclusively
- **NEVER use local MongoDB installations** - Only use MongoDB Atlas cloud connections
- **MANDATORY: Only connect to online MongoDB Atlas clusters** - No localhost, no local development databases
- No localStorage, sessionStorage, or in-memory storage for application state
- No fallback to local data sources - if MongoDB is unavailable, show proper error states
- All drafts, posts, user data, and application state must persist in MongoDB
- Temporary caching is acceptable only for performance, never as a data source alternative

### Benefits:
- Eliminates data inconsistency and "spaghetti code"
- Ensures data persistence across devices and sessions
- Simplifies debugging and data management
- Enables proper backup and recovery strategies
- Supports multi-user access and collaboration

### Implementation Standards:
- Use MongoDB collections for all entities (posts, users, drafts, settings)
- Implement proper error handling for database connectivity issues
- Use MongoDB transactions for data integrity when needed
- Follow single source of truth principle - never duplicate data storage

This rule prevents architectural chaos and ensures reliable, consistent data management throughout the application.

---

## Loading Effects Standard

**Rule: All loading effects must use consistent shadowing effects, not farm-related or agricultural themes.**

### Implementation Requirements:
- Use `LoadingSpinner` or `ShadowLoader` components for all loading states
- Use `PageLoader` for full-page loading screens
- Use `ContentSkeleton` for content placeholders
- All loading messages should be generic and professional (e.g., "Loading...", "Please wait...")
- No farm-related terminology in loading states (avoid "cultivating", "harvesting", "growing", etc.)

### Approved Loading Components:
```tsx
// Basic spinner with shadow effect
<LoadingSpinner size="lg" text="Loading content..." />

// Full page loader
<PageLoader message="Loading dashboard..." />

// Content skeleton with shadows
<ContentSkeleton />
```

### Visual Standards:
- Gray color scheme for loading elements
- Subtle shadow effects using CSS shadows and blur
- Smooth animations with consistent timing
- Professional, non-thematic appearance

### Legacy Components (Deprecated):
- `AgricultureLoader` - replaced with `LoadingSpinner`
- `AgriculturePageLoader` - replaced with `PageLoader`
- `AgriculturalSkeleton` - replaced with `ContentSkeleton`
- All farm-themed loading variations

This ensures a consistent, professional user experience across the application while maintaining the agricultural content focus in actual content areas, not loading states.

---

## Content Sanitization Standard

**Rule: All blog post excerpts must display as clean text without HTML tags or markdown formatting.**

### Implementation:
- **Server-side**: All API endpoints use `generateCleanExcerpt()` for consistent excerpt generation
- **Client-side**: All excerpt displays use `markdownToText()` for formatting protection
- **Functions location**: `client/src/lib/html-to-markdown.ts`

### Core Functions:
```typescript
generateCleanExcerpt(content: string, maxLength: number): string
markdownToText(markdown: string): string
stripHtmlTags(html: string): string
```

### Coverage:
- All excerpt displays in blog-grid, featured-stories, search results, admin panels
- All API endpoints: `/api/blog-posts`, `/api/blog-posts/featured`, `/api/blog-post`, `/api/admin/blog-posts`
- MongoDB storage layer in `server/mongodb-storage-updated.ts`

This ensures professional, readable text across all interfaces without HTML/markdown artifacts.

---

# San Blog Design Standards

## Color Scheme
- **Primary Color**: Forest Green (#2D5016) 
- **All accent colors must use Forest Green (#2D5016)** - no variations or different shades
- **Background**: White (#FFFFFF) for content areas
- **Secondary Background**: Light Gray (#F9FAFB) for sections
- **Text**: Dark Gray (#111827) for primary text, Medium Gray (#6B7280) for secondary text

## MongoDB Post Data Distribution Architecture

**⚠️ CRITICAL SYSTEM ARCHITECTURE - DO NOT MODIFY WITHOUT FOLLOWING THIS STRUCTURE ⚠️**

### **Primary Post Data Endpoints - MONGODB ONLY**

The following three endpoints serve as the **ONLY** data sources for all blog post displays across the application. These endpoints directly connect to **MongoDB** and must remain stable:

#### **1. Landing Page (/) Data Source:**
```bash
Endpoint: GET /api/blog-posts/featured
Purpose: Featured posts for homepage hero section
Query: { featured: true, limit: 3, includeDrafts: false }
Usage: Landing page hero section, featured stories carousel
MongoDB Filter: Only published posts marked as featured
```

#### **2. Posts Grid Page (/posts) Data Source:**
```bash
Endpoint: GET /api/blog-posts
Purpose: All published posts with pagination and filtering
Query: { limit, offset, featured, category, includeDrafts: false }
Usage: Main posts listing, search results, category filtering
MongoDB Filter: Only published posts (no drafts)
```

#### **3. Admin Page (/admin) Data Source:**
```bash
Endpoint: GET /api/admin/blog-posts
Purpose: All posts including drafts for management
Query: { includeDrafts: true }
Usage: Admin dashboard, post management, bulk operations
MongoDB Filter: All posts (published + drafts)
```

### **MANDATORY ARCHITECTURE RULES:**

1. **🔒 MongoDB Primary Rule**: All three endpoints MUST use `activeStorage.getBlogPosts()` which connects directly to MongoDB
2. **🔒 No Alternative Sources**: Never use localStorage, sessionStorage, or any non-MongoDB data sources
3. **🔒 Endpoint Stability**: These three endpoints are permanent fixtures - modifications require updating this documentation
4. **🔒 Consistent Response Format**: All endpoints return identical `BlogPostWithDetails[]` structure
5. **🔒 Error Handling**: Fallback to empty arrays, never crash the UI

### **Data Flow Architecture:**
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   MongoDB   │ -> │ activeStorage│ -> │ API Endpoint│ -> │  Frontend   │
│  Database   │    │  .getBlogPosts() │    │ Component   │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
      ↑                    ↑                    ↑                    ↑
  Single Source      Native Driver      RESTful API         React Query
   of Truth          Connection         Standard            Cache Management
```

### **Frontend Integration Points:**
- **Landing Page**: `FeaturedStories` component fetches from `/api/blog-posts/featured`
- **Posts Page**: `BlogGrid` component fetches from `/api/blog-posts`
- **Admin Page**: `PostManagement` component fetches from `/api/admin/blog-posts`

### **Modification Protocol:**
1. **Before any changes**: Review this documentation
2. **After modifications**: Update this architecture document
3. **Testing required**: Test all three endpoints after any storage layer changes
4. **Never break**: The three-endpoint structure is foundational to the application

### **Cache Invalidation Strategy:**
- Admin actions invalidate all related frontend caches
- Real-time updates across all three page types
- Consistent data display regardless of entry point

**⚠️ WARNING: Breaking this architecture will cause data inconsistency across pages ⚠️**

---

## Golden Ratio Design Principle (1:1.618)
All design components and spacing must follow the golden ratio for optimal visual harmony:

### Spacing & Layout
- **Container widths**: Base width × 1.618 for optimal proportions
- **Margins**: Use ratios like 24px base, 39px (24×1.618) for larger margins  
- **Padding**: 16px base, 26px (16×1.618) for expanded padding
- **Grid gaps**: 12px base, 19px (12×1.618) for larger gaps

### Typography Scale
- **Base font size**: 16px
- **Large text**: 26px (16×1.618)
- **Heading hierarchy**: 16px → 26px → 42px → 68px (each step ×1.618)
- **Line height**: 1.618 ratio for optimal readability

### Component Dimensions
- **Buttons**: Height to width ratio should approach 1:1.618 when possible
- **Cards**: Width to height ratio should use golden ratio proportions
- **Images**: Aspect ratios should favor 1.618:1 when possible
- **Navigation**: Item spacing should use golden ratio intervals

### Border Radius & Visual Elements
- **Small radius**: 6px base
- **Medium radius**: 10px (6×1.618)
- **Large radius**: 16px (10×1.618)
- **Icon sizes**: 16px base, 26px medium, 42px large

## Implementation Rules
1. **All green colors must be Forest Green (#2D5016)** - no exceptions
2. **All measurements must follow golden ratio progressions**
3. **Maintain consistency across all components**
4. **Test proportions visually to ensure harmony**

## Component Guidelines
- Buttons: Use forest green background, white text
- Badges: Use forest green for categories, outline style for tags
- Navigation: Forest green for active states and hover effects
- Cards: Follow golden ratio for padding and content proportions
- Forms: Input heights and spacing based on golden ratio

## Performance & Complexity Rules
- Avoid duplicating complexity in code
- Optimize Big O notation processing time
- Eliminate redundant AI functions between tags and categories
- Use single-purpose, streamlined functions instead of multiple overlapping features

## Editor-Database Synchronization Rule
**CRITICAL: Maintain perfect synchronization between post editor interface and MongoDB storage layer**
- Any modification to the post editor form must include corresponding MongoDB schema updates
- All fields in PostFormData interface must match BlogPost database schema exactly
- Tags, categories, and metadata fields must be synchronized across:
  1. Client-side editor form (`client/src/pages/admin.tsx`)
  2. MongoDB storage implementation (`server/mongodb-storage-updated.ts`)
  3. API route handlers (`server/routes.ts`)
  4. Shared schema types (`shared/schema.ts`)
- Never modify editor functionality without ensuring database compatibility
- Test update operations immediately after any editor changes
- This prevents "Failed to update post" errors and maintains data integrity

## MongoDB Schema Standards
**CRITICAL: All MongoDB CRUD operations must use consistent schema field names to prevent frontend-backend mismatches**

### Required BlogPost Schema Fields:
```typescript
interface BlogPost {
  id: number | string;           // Primary identifier
  title: string;                 // Post title
  slug: string;                  // URL-friendly identifier
  excerpt: string;               // Short description
  content: string;               // Full post content
  featuredImage: string;         // Main image URL
  authorId: number | string;     // Author reference
  userId: string;                // User who created/owns the post
  tags: string[];                // Array of tag strings
  readTime: number;              // Estimated reading time in minutes
  isFeatured: boolean;           // Featured post status
  isPublished: boolean;          // Publication status
  summary?: string;              // Optional AI-generated summary
  createdAt: Date;               // Creation timestamp
  updatedAt: Date;               // Last modification timestamp
}
```

### MongoDB Storage Implementation Rules:
1. **Use Schema Field Names**: Always use `isPublished`, `isFeatured`, `featuredImage`, `createdAt`, `updatedAt`
2. **Backward Compatibility**: Store both schema fields AND legacy fields during transition:
   - `isPublished: true` + `draft: false` (legacy)
   - `isFeatured: true` + `featured: true` (legacy)
   - `featuredImage: "url"` + `coverImage: "url"` (legacy)
   - `createdAt: Date` + `date: Date` (legacy)
   - `updatedAt: Date` + `lastModified: Date` (legacy)
3. **Query Consistency**: Use schema fields in queries with fallback to legacy fields
4. **API Responses**: Always return schema-compliant field names to frontend

### CRUD Operation Standards:
```typescript
// ✅ CORRECT - Create with schema fields
const postData = {
  title: post.title,
  isPublished: post.isPublished,     // Schema field
  isFeatured: post.isFeatured,       // Schema field  
  featuredImage: post.featuredImage, // Schema field
  createdAt: new Date(),             // Schema field
  updatedAt: new Date(),             // Schema field
  // Legacy fields for backward compatibility
  draft: !post.isPublished,
  featured: post.isFeatured,
  coverImage: post.featuredImage,
  date: new Date(),
  lastModified: new Date()
};

// ✅ CORRECT - Query with schema fields + fallback
const query = {
  $or: [
    { isPublished: true },                           // Schema field
    { isPublished: { $exists: false }, draft: { $ne: true } } // Legacy fallback
  ]
};

// ❌ WRONG - Using only legacy fields
const badQuery = { draft: { $ne: true } }; // Will miss posts with schema fields
```

### API Endpoint Consistency:
- **Frontend sends**: Schema field names (`isPublished`, `isFeatured`, `featuredImage`)
- **Backend stores**: Both schema and legacy fields for compatibility
- **Backend returns**: Schema field names only
- **Database queries**: Schema fields with legacy fallbacks

### Field Name Migration Rules:
- **NEVER remove legacy fields** until 100% of data is migrated
- **ALWAYS add schema fields** to new documents
- **UPDATE existing documents** to include schema fields during writes
- **QUERY with OR conditions** to support both field naming conventions

## API Route Consistency Standards
**CRITICAL: Frontend and backend must use identical URL patterns and parameter formats**

### Path Parameter Rules:
- **ALWAYS use path parameters** for resource IDs: `/api/admin/blog-posts/{id}`
- **NEVER mix path and query parameters** for the same endpoint
- **Consistent across all CRUD operations**:
  ```typescript
  // ✅ CORRECT - Consistent path parameters
  GET    /api/admin/blog-posts/{id}    // Get single post
  PATCH  /api/admin/blog-posts/{id}    // Update post
  DELETE /api/admin/blog-posts/{id}    // Delete post
  
  // ❌ WRONG - Mixed parameter styles
  GET    /api/admin/blog-posts/{id}    // Path parameter
  PATCH  /api/admin/blog-posts?id={id} // Query parameter - INCONSISTENT!
  ```

### Frontend-Backend Parameter Consistency:
```typescript
// ✅ CORRECT - Frontend matches backend route pattern
// Backend route: app.patch("/api/admin/blog-posts/:id", ...)
// Frontend call:
fetch(`/api/admin/blog-posts/${postId}`, {
  method: "PATCH",
  body: JSON.stringify(updateData)
});

// ❌ WRONG - Frontend doesn't match backend route
// Backend route: app.patch("/api/admin/blog-posts/:id", ...)  
// Frontend call:
fetch(`/api/admin/blog-posts?id=${postId}`, { // Query param instead of path!
  method: "PATCH"
});
```

### Route Pattern Standards:
- **Public endpoints**: `/api/blog-posts` (no auth required)
- **Admin endpoints**: `/api/admin/blog-posts` (auth required)
- **Resource-specific**: Always use path parameters for IDs
- **Filtering/pagination**: Use query parameters for filters
- **Bulk operations**: Use request body for multiple IDs

### API Error Prevention Checklist:
1. ✅ **Frontend API calls match backend route patterns exactly**
2. ✅ **Path parameters used consistently for resource IDs**  
3. ✅ **Query parameters used only for filtering/pagination**
4. ✅ **Request/response body uses schema field names**
5. ✅ **Error responses return meaningful messages**

## Performance & Complexity Rules
- **Avoid duplicating functionality** - One feature should serve one purpose
- **Minimize Big O complexity** - Optimize for performance in all operations
- **No redundant processing** - If tagging includes categorization, don't separate them
- **Streamline user workflows** - Each action should have clear, direct purpose
- **Single source of truth** - Data should only be stored and managed in one place
- **No redundant navigation** - Don't add menu items that duplicate existing functionality (e.g., Home menu when logo serves same purpose)

## Documentation Rule for Complex Functions
**MANDATORY: All complex functions require flowchart documentation**
- When creating or modifying complex functions (authentication, database relationships, data persistence), must create Mermaid flowcharts in README.md
- Flowcharts must show complete data flow from user action to database storage
- Include error handling paths and edge cases in diagrams
- Document relationships between user sessions, database records, and frontend state
- This helps other developers understand system architecture and troubleshoot issues
- Update flowcharts whenever modifying existing complex functions

---

## Technical Development Guidelines

### ES Module Standards
**CRITICAL: Always use ES module imports instead of CommonJS require statements**

Due to the project configuration (`"type": "module"` in package.json), all imports must use ES module syntax:

#### ✅ Correct (ES Module):
```typescript
import { existsSync } from "fs";
import path from "path";
import { MongoClient } from "mongodb";
```

#### ❌ Incorrect (CommonJS - will cause ReferenceError):
```javascript
const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');
```

### Common ES Module Conversion Patterns:
```typescript
// File system operations
import { existsSync, readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

// For __dirname equivalent in ES modules:
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
```

### Module Resolution Troubleshooting:
- **Error**: `ReferenceError: require is not defined in ES module scope`
- **Solution**: Convert all `require()` calls to `import` statements
- **Error**: `Cannot use import statement outside a module`
- **Solution**: Ensure `"type": "module"` is set in package.json
- **Error**: Missing file extensions in imports
- **Solution**: Use explicit `.js` extensions for local files in some cases

### Development Environment Rules:
1. **Always use ES module syntax** for consistency across the codebase
2. **Test imports immediately** after adding new dependencies
3. **Check Node.js version compatibility** with ES modules (Node 14+)
4. **Use tsx for TypeScript execution** instead of ts-node when possible

This ensures consistent module handling and prevents runtime errors during development.

---

## MongoDB-Only Data Policy

**⚠️ CRITICAL SYSTEM REQUIREMENT - NEVER USE HARDCODED DATA ⚠️**

### **Mandatory MongoDB-First Architecture**

This application operates under a **strict MongoDB-only data policy**. The following rules are non-negotiable:

#### **🔒 Core Requirements:**
1. **MongoDB is the ONLY data source** - No exceptions, no fallbacks
2. **No in-memory storage fallbacks** - If MongoDB fails, the application must fail
3. **No hardcoded sample data** - All data must come from MongoDB database
4. **No local storage alternatives** - MongoDB or nothing

#### **🚫 Explicitly Forbidden:**
- ✖️ MemStorage class usage
- ✖️ Sample data seeding in constructors  
- ✖️ Fallback to in-memory storage when MongoDB fails
- ✖️ Hardcoded posts in storage layers
- ✖️ localStorage, sessionStorage, or any browser storage as primary data source
- ✖️ Mock data or placeholder content in production

#### **✅ Required Implementation:**
- ✅ MongoDB connection must be established before server starts
- ✅ Server startup must fail if MongoDB is unreachable
- ✅ All endpoints must serve data exclusively from MongoDB
- ✅ Authentication errors should be fixed, not bypassed with fallbacks
- ✅ Error messages must guide users to fix MongoDB issues

#### **🔧 MongoDB Connection Requirements:**
```bash
# Required environment variables
MONGODB_URI=mongodb+srv://admin-account:database-password@cluster0.br3z5.mongodb.net/blog_database
MONGODB_DATABASE=blog_database
```

#### **🚨 Failure Protocol:**
If MongoDB connection fails:
1. **Server must not start** - No graceful degradation
2. **Display clear error messages** about MongoDB connection issues  
3. **Provide troubleshooting guidance** for authentication/connection problems
4. **Never serve cached or hardcoded data** as a substitute

#### **📊 Monitoring & Validation:**
- All blog posts must have MongoDB ObjectIds
- All data operations must log MongoDB collection interactions
- No posts should appear with sequential IDs (1, 2, 3...) which indicate hardcoded data
- Admin panel must show "Connected to MongoDB" status

### **Warning Signs of Policy Violations:**
- 🚨 Posts appearing immediately after server restart without MongoDB connection
- 🚨 Error messages about "falling back to in-memory storage"
- 🚨 Sample blog posts about "hydroponic systems" or "AI-powered farming"
- 🚨 Authors with names like "Dr. Sarah Chen" or "Mark Johnson"
- 🚨 Perfect English content that doesn't match user's writing style

**Breaking this policy results in showing fake data instead of the user's actual blog content, which is completely unacceptable.**

---

This document ensures visual consistency, mathematical harmony, and optimal performance throughout the application.

---

## API Endpoint Standards

**⚠️ CRITICAL: All API endpoints must follow RESTful conventions and consistent error handling**

### **🚨 CRITICAL: Path Parameter Consistency Rule**

**ALL API endpoints MUST use path parameters for resource IDs, NOT query parameters.**

```bash
# ✅ CORRECT - Use path parameters
GET    /api/admin/blog-posts/123
PATCH  /api/admin/blog-posts/123
DELETE /api/admin/blog-posts/123

# ❌ INCORRECT - Do NOT use query parameters
GET    /api/admin/blog-posts?id=123
PATCH  /api/admin/blog-posts?id=123
DELETE /api/admin/blog-posts?id=123
```

**Why This Matters:**
- Ensures frontend and backend routes match exactly
- Prevents 404 errors from route mismatches
- Follows REST conventions for resource identification
- Enables proper API proxy configuration in Vite

**Enforcement:** All existing code has been updated to use path parameters. Any new API calls MUST follow this pattern.

### **Endpoint Naming Conventions:**
```bash
# Blog Posts
GET    /api/blog-posts              # List all published posts
GET    /api/blog-posts/featured     # Featured posts only
GET    /api/blog-posts/[id]         # Single post by ID
POST   /api/blog-posts              # Create new post
PATCH  /api/blog-posts/[id]         # Update existing post
DELETE /api/blog-posts/[id]         # Delete post

# Admin Endpoints
GET    /api/admin/blog-posts        # All posts including drafts
POST   /api/admin/blog-posts        # Admin create with auto-save
PATCH  /api/admin/blog-posts/[id]   # Admin update with bulk operations
DELETE /api/admin/blog-posts/[id]   # Admin delete

# AI Services
POST   /api/ai-tagging/generate-tags      # Generate tags from content
POST   /api/ai-tagging/generate-excerpt   # Generate excerpt from content
GET    /api/ai-tagging/generate-excerpt/[id]  # Generate excerpt from existing post
```

### **Enhanced Debug Tracking System**

**⚠️ DEVELOPMENT FEATURE: Comprehensive console log interception and project-wide debug tracking**

The debug tracker has been enhanced to capture ALL console statements across the project:

```typescript
// Debug tracker automatically captures:
console.log("Any log message")    // Tracked as 'console_log'
console.warn("Warning message")   // Tracked as 'console_warn'
console.error("Error message")    // Tracked as 'console_error'
console.info("Info message")      // Tracked as 'console_info'
```

**Features:**
- **Console Interception**: All console.log, warn, error, info statements are tracked
- **Stack Trace Capture**: Shows where each console statement originated
- **Categorized Logging**: Different console levels have different colors in debug UI
- **Project-wide Coverage**: Captures logs from all components, pages, and API calls
- **Enhanced Filtering**: Filter debug events by console level (log/warn/error/info)

**Access Methods:**
```javascript
// Get all console events
debugTracker.getConsoleEvents()

// Get specific console level
debugTracker.getConsoleEventsByLevel('error')  // 'log', 'warn', 'error', 'info'

// Access through debug visualizer
// Press Ctrl+Shift+D or click purple "🔍 Debug Flow" button
```

**Admin Page Restriction**: Debug Flow Visualizer only appears on `/admin/` pages for focused development debugging.

### **Response Format Standards:**
```typescript
// Success Response
{
  success: true,
  data: T,
  meta?: {
    total?: number,
    page?: number,
    limit?: number
  }
}

// Error Response
{
  success: false,
  error: string,
  details?: string,
  code?: number
}
```

### **HTTP Status Code Rules:**
- **200**: Successful GET/PATCH operations
- **201**: Successful POST (creation)
- **400**: Bad request (validation errors)
- **401**: Unauthorized (authentication required)
- **403**: Forbidden (insufficient permissions)
- **404**: Resource not found
- **405**: Method not allowed
- **500**: Internal server error

### **Authentication Standards:**
- Admin endpoints require session-based authentication
- Public endpoints require no authentication
- AI endpoints use content-based auth (no auth for new posts, auth for existing posts)
- Session validation must be consistent across all protected routes

---

## Component Architecture Standards

**⚠️ CRITICAL: Maintain consistent component patterns and avoid prop drilling**

### **Component File Organization:**
```
client/src/components/
├── ui/              # Shadcn/ui components (unchanged)
├── [feature].tsx    # Feature-specific components
└── layout/          # Layout components (navigation, footer, etc.)
```

### **Component Naming Conventions:**
- **PascalCase** for all component files: `BlogGrid.tsx`, `PostEditor.tsx`
- **kebab-case** for non-component files: `use-auth.ts`, `query-client.ts`
- **Descriptive names** that indicate purpose: `AdvancedSearch.tsx` not `Search.tsx`

### **Component Structure Standards:**
```typescript
// Required component structure
interface ComponentProps {
  // Props interface at top
}

export default function ComponentName({ ...props }: ComponentProps) {
  // 1. State declarations
  // 2. Hooks (useQuery, useAuth, etc.)
  // 3. Event handlers
  // 4. Effects
  // 5. Render logic (early returns for loading/error states)
  // 6. Main JSX return
}
```

### **State Management Rules:**
- **Local state** for component-specific data (form inputs, UI toggles)
- **React Query** for server state (API data, caching)
- **Props** for parent-child communication
- **Context** only for truly global state (auth, theme)
- **No Redux** - Keep state management simple

### **Performance Requirements:**
- Use `React.memo()` for expensive components that receive stable props
- Implement proper `useMemo()` and `useCallback()` for complex calculations
- Avoid inline object/array creation in JSX
- Use `React.lazy()` for route-level code splitting

---

## Security & Authentication Guidelines

**⚠️ CRITICAL: Security is non-negotiable - follow these standards exactly**

### **Authentication Flow:**
```mermaid
graph TD
    A[User Login] --> B[OAuth Provider]
    B --> C[Callback with Code]
    C --> D[Exchange Code for Token]
    D --> E[Create Session]
    E --> F[Set HttpOnly Cookie]
    F --> G[Access Admin Features]
```

### **Session Security Standards:**
```typescript
// Production session configuration
{
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    httpOnly: true,                                // Prevent XSS
    maxAge: 24 * 60 * 60 * 1000,                 // 24 hours
    sameSite: 'lax'                               // CSRF protection
  }
}
```

### **OAuth Configuration Security:**
- **Domain matching**: OAuth callbacks MUST match deployment domain
- **Environment separation**: Different OAuth apps for development/production
- **Secret rotation**: Regular rotation of SESSION_SECRET and OAuth secrets
- **Scope limitation**: Request minimal necessary OAuth scopes

### **API Security Rules:**
1. **Input validation** on all POST/PATCH endpoints
2. **Rate limiting** on AI endpoints to prevent abuse
3. **CORS headers** configured for specific domains only
4. **No sensitive data** in client-side logs or error messages
5. **Environment variables** for all secrets (never hardcode)

### **Content Security:**
- **HTML sanitization** for user-generated content
- **Markdown parsing** with XSS protection
- **Image URL validation** for featured images
- **File upload restrictions** (if implemented)

---

## Performance & Monitoring Standards

**⚠️ CRITICAL: Performance directly impacts user experience and SEO rankings**

### **Core Web Vitals Targets:**
- **Largest Contentful Paint (LCP)**: < 2.5 seconds
- **First Input Delay (FID)**: < 100 milliseconds
- **Cumulative Layout Shift (CLS)**: < 0.1
- **First Contentful Paint (FCP)**: < 1.8 seconds

### **Performance Optimization Rules:**
```typescript
// Image optimization
<img 
  src={featuredImage} 
  alt={title}
  loading="lazy"           // Lazy load below fold
  decoding="async"         // Non-blocking decode
  width={400}              // Explicit dimensions
  height={300}             // Prevent layout shift
/>

// Code splitting
const AdminPage = lazy(() => import('./pages/admin'));
const PostEditor = lazy(() => import('./components/post-editor'));
```

### **Bundle Size Monitoring:**
- **Total bundle size**: < 500KB gzipped
- **Route chunks**: < 200KB per route
- **Third-party deps**: Audit regularly, remove unused
- **Tree shaking**: Ensure ES modules and proper imports

### **Database Performance:**
```typescript
// MongoDB query optimization
// ✅ Good: Use indexes and projections
const posts = await collection.find(
  { published: true },
  { projection: { content: 0 } }  // Exclude large fields
).limit(10).toArray();

// ❌ Bad: Full text search without indexes
const posts = await collection.find({
  $text: { $search: query }       // Requires text index
}).toArray();
```

### **Caching Strategy:**
- **React Query**: 5 minute stale time for blog posts
- **Browser caching**: Proper cache headers for static assets
- **CDN integration**: Vercel Edge Network for global distribution
- **API response caching**: Cache-Control headers on stable endpoints

---

## SEO & Content Optimization Standards

**⚠️ CRITICAL: SEO is essential for content discovery and traffic growth**

### **Meta Tag Requirements:**
```typescript
// Required for every page
<head>
  <title>{title} | San AgriTech Blog</title>
  <meta name="description" content={description} />
  <meta name="keywords" content={tags.join(', ')} />
  
  {/* Open Graph */}
  <meta property="og:title" content={title} />
  <meta property="og:description" content={description} />
  <meta property="og:image" content={featuredImage} />
  <meta property="og:type" content="article" />
  
  {/* Twitter Cards */}
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content={title} />
  <meta name="twitter:description" content={description} />
  <meta name="twitter:image" content={featuredImage} />
</head>
```

### **URL Structure Standards:**
```bash
# SEO-friendly URL patterns
/                           # Homepage
/posts                      # All posts listing
/posts/[slug]              # Individual post
/posts/tagged/[tag]        # Posts by tag
/posts/category/[category] # Posts by category (if implemented)
```

### **Content Quality Requirements:**
- **Minimum word count**: 300 words per post
- **Heading structure**: Proper H1, H2, H3 hierarchy
- **Internal linking**: Link to related posts
- **Alt text**: Descriptive alt text for all images
- **Schema markup**: JSON-LD structured data for articles

### **Technical SEO Checklist:**
- ✅ Sitemap.xml generation
- ✅ Robots.txt configuration
- ✅ Mobile responsiveness
- ✅ Page load speed optimization
- ✅ HTTPS enforcement
- ✅ Canonical URLs
- ✅ 404 error handling

---

## Deployment & DevOps Standards

**⚠️ CRITICAL: Deployment must be reliable and repeatable**

### **Environment Configuration:**
```bash
# Production Environment Variables (Vercel)
MONGODB_URI=mongodb+srv://...        # Atlas connection string
MONGODB_DATABASE=blog_database       # Database name
SESSION_SECRET=crypto_random_string  # Session encryption key
NODE_ENV=production                  # Environment flag
GOOGLE_CLIENT_ID=oauth_client_id     # OAuth configuration
GOOGLE_CLIENT_SECRET=oauth_secret    # OAuth secret
GITHUB_CLIENT_ID=oauth_client_id     # OAuth configuration
GITHUB_CLIENT_SECRET=oauth_secret    # OAuth secret
```

### **Deployment Pipeline:**
```mermaid
graph TD
    A[Git Push] --> B[Vercel Build]
    B --> C[Type Check]
    C --> D[Build Production]
    D --> E[Environment Variables]
    E --> F[Deploy to Edge]
    F --> G[Health Check]
    G --> H{Success?}
    H -->|Yes| I[Update Live]
    H -->|No| J[Rollback]
```

### **Pre-Deployment Checklist:**
- ✅ All environment variables configured in Vercel
- ✅ OAuth domains updated for production URL
- ✅ MongoDB connection tested with production credentials
- ✅ Build process completes without errors
- ✅ No TypeScript errors or warnings
- ✅ All critical features tested locally

### **Health Check Endpoints:**
```typescript
// Health check for monitoring
GET /api/health
Response: {
  status: "healthy",
  database: "connected",
  timestamp: "2025-01-XX...",
  version: "1.0.0"
}
```

### **Rollback Procedure:**
1. **Immediate**: Use Vercel dashboard to rollback to previous deployment
2. **Investigate**: Check Vercel logs and error reports
3. **Fix**: Address issues in development environment
4. **Test**: Verify fix with full deployment cycle
5. **Document**: Update FIX-LOG.md with issue and resolution

---

## Error Handling & Debugging Standards

**⚠️ CRITICAL: Proper error handling prevents user frustration and data loss**

### **Error Boundary Implementation:**
```typescript
// Required error boundary for all route components
function ErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      fallback={<ErrorFallback />}
      onError={(error, errorInfo) => {
        console.error('App Error:', error, errorInfo);
        // Log to monitoring service in production
      }}
    >
      {children}
    </ErrorBoundary>
  );
}
```

### **API Error Response Standards:**
```typescript
// Consistent error format across all endpoints
try {
  // API logic
} catch (error) {
  console.error('API Error:', error);
  
  return Response.json({
    success: false,
    error: 'Failed to process request',
    details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    timestamp: new Date().toISOString()
  }, { status: 500 });
}
```

### **User-Facing Error Messages:**
- **Network errors**: "Please check your connection and try again"
- **Authentication errors**: "Please log in to access this feature"
- **Validation errors**: Specific field-level messages
- **Server errors**: "Something went wrong. Please try again later"
- **Not found errors**: "The content you're looking for doesn't exist"

### **Debugging Tools Configuration:**
```typescript
// Development-only debugging helpers
if (process.env.NODE_ENV === 'development') {
  // React Query DevTools
  import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
  
  // Console logging for API calls
  console.log('API Request:', method, url, data);
}
```

### **Error Logging Strategy:**
- **Client-side**: Console logging in development, service logging in production
- **Server-side**: Structured logging with timestamps and context
- **Database**: Log critical data operations and failures
- **Authentication**: Log login attempts and security events

---

## Testing & Quality Assurance Standards

**⚠️ CRITICAL: Quality assurance prevents bugs from reaching production**

### **Manual Testing Checklist:**
```bash
# Core Functionality Testing
✅ Homepage loads with featured posts
✅ Posts page displays all published content
✅ Individual post pages render correctly
✅ Admin login works with OAuth providers
✅ Post creation and editing functions
✅ Auto-save works without errors
✅ Featured image upload and display
✅ Tag and category management
✅ Bulk operations in admin panel
✅ Search functionality works
✅ Mobile responsiveness verified
```

### **API Testing Protocol:**
```bash
# Test all endpoints before deployment
curl -X GET https://your-domain.com/api/blog-posts
curl -X POST https://your-domain.com/api/admin/blog-posts -H "Content-Type: application/json"
curl -X PATCH https://your-domain.com/api/admin/blog-posts/123
curl -X GET https://your-domain.com/api/health
```

### **Browser Compatibility Testing:**
- **Chrome** (latest 2 versions)
- **Firefox** (latest 2 versions)
- **Safari** (latest 2 versions)
- **Edge** (latest 2 versions)
- **Mobile Safari** (iOS)
- **Chrome Mobile** (Android)

### **Performance Testing:**
- Use Chrome DevTools Lighthouse for Core Web Vitals
- Test with simulated slow 3G connection
- Verify bundle sizes with webpack-bundle-analyzer
- Check database query performance with MongoDB Compass

### **Security Testing:**
- Verify HTTPS enforcement
- Test OAuth callback security
- Check for XSS vulnerabilities in content rendering
- Validate CORS header configuration
- Test session security and timeout behavior

---

## Content Management Workflow

**⚠️ CRITICAL: Streamlined content workflow ensures consistent quality**

### **Post Creation Workflow:**
```mermaid
graph TD
    A[Create New Post] --> B[Write Content]
    B --> C[Add Featured Image]
    C --> D[Generate AI Tags/Excerpt]
    D --> E[Preview Post]
    E --> F{Content Ready?}
    F -->|No| B
    F -->|Yes| G[Publish Post]
    G --> H[Verify Live Display]
    H --> I[Share on Social Media]
```

### **Content Quality Standards:**
- **Spelling and grammar**: Use AI assistance for proofreading
- **Image quality**: High-resolution featured images (minimum 1200x630)
- **Content length**: Minimum 300 words for SEO value
- **Linking**: Include relevant internal and external links
- **Tags**: 3-7 relevant tags per post
- **Excerpt**: Engaging 120-180 character AI-generated excerpt

### **Editorial Calendar Integration:**
- Plan content themes around agricultural seasons
- Maintain consistent publishing schedule
- Balance technical and educational content
- Include trending agricultural technology topics

### **Content Backup Strategy:**
- All content stored in MongoDB with automatic Atlas backups
- Export functionality for content portability
- Version control for major content updates
- Regular database health checks and maintenance

---

## Edit Post Functionality - CRITICAL ID CONSISTENCY

### 🚨 **RESOLVED: ID Generation Inconsistency (Critical Bug)**

**Problem:** Post editing failed because ID generation algorithms were inconsistent between display and API lookup.

**Root Cause:** Different parts of system used different ID generation from MongoDB ObjectId:
- **mapPostDocument()**: `timestamp + sequence` (CORRECT)
- **Admin API search**: Only `timestamp` (BROKEN)

**Fix Applied:** All ID generation now uses consistent algorithm:
```javascript
const timestamp = parseInt(objectIdStr.substring(0, 8), 16);
const sequence = parseInt(objectIdStr.substring(16, 24), 16);
let generatedId = Math.abs(timestamp + sequence);
```

### 🏗️ **ID Generation Rules (MANDATORY)**

**NEVER use different ID generation algorithms in the same system.**

1. **Single Source of Truth**: All ID generation MUST use identical logic
2. **Consistency Check**: When adding new endpoints, verify ID generation matches existing
3. **Testing Protocol**: Always test edit functionality after API changes

### 📋 **Files with ID Generation Logic**
- `api/admin/blog-posts.ts` (5 instances - ALL FIXED)
- `api/blog-post.ts` (mapPostDocument function)
- `server/mongodb-storage-updated.ts`

**Rule:** Any new ID generation MUST match the mapPostDocument algorithm exactly.

---

## Edit Post Workflow - Complete Architecture

### **Frontend Routes:**
- **Edit URL**: `/edit-post/[id]` ✅
- **Component**: `client/src/pages/create-post.tsx` (handles both create and edit)

### **API Endpoints:**
- **Fetch Post**: `GET /api/admin/blog-posts?id=[id]` ✅
- **Update Post**: `PATCH /api/admin/blog-posts?id=[id]` ✅

### **Critical Success Criteria:**
1. ✅ Post loads correctly in edit interface
2. ✅ All post data (title, content, tags, etc.) populated
3. ✅ Updates save successfully
4. ✅ Consistent ID matching between display and API

**PREVENTION:** Test edit functionality immediately after any ID-related changes.

---

### 📋 **Data Flow Structure**

#### **1. Frontend Components:**
```typescript
// CreatePost Component (client/src/pages/create-post.tsx)
- Uses useQuery to fetch: `/api/admin/blog-posts?id=${id}`
- Uses useMutation to save: `/api/admin/blog-posts?id=${id}` (PATCH)

// PostEditor Component (client/src/components/post-editor.tsx)  
- Uses useMutation to update: `/api/admin/blog-posts?id=${id}` (PATCH)
```

#### **2. Backend API Structure:**
```typescript
// Single Endpoint: api/admin/blog-posts.ts
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { id } = req.query;
  
  if (id && !Array.isArray(id)) {
    // Handle individual post operations
    if (req.method === 'GET') { /* fetch individual post */ }
    if (req.method === 'PATCH') { /* update post */ }
    if (req.method === 'DELETE') { /* delete post */ }
  } else {
    // Handle list operations
    if (req.method === 'GET') { /* fetch all posts */ }
    if (req.method === 'POST') { /* create new post */ }
  }
}
```

#### **3. Database ID Resolution Strategy:**
```typescript
// Robust ID matching for MongoDB posts
// Strategy 1: Try explicit ID field first (most reliable)
existingPost = await postsCollection.findOne({ id: numericId });

// Strategy 2: If not found, search by generated ID from ObjectId
const allPosts = await postsCollection.find({}).toArray();
for (const post of allPosts) {
  const generatedId = parseInt(post._id.toString().substring(0, 8), 16);
  if (generatedId === numericId) {
    existingPost = post;
    // Add explicit ID field for future lookups
    await postsCollection.updateOne(
      { _id: post._id },
      { $set: { id: generatedId } }
    );
    break;
  }
}
```

---

### 🔧 **Technical Implementation Details**

#### **Key Changes Made:**
1. **Replaced Dynamic Routes:** 
   - ❌ `/api/admin/blog-posts/[id].ts` (Vercel deployment issues)
   - ✅ `/api/admin/blog-posts.ts?id=X` (Query parameter approach)

2. **Updated Frontend Calls:**
   - ❌ `fetch(\`/api/admin/blog-posts/\${id}\`)`
   - ✅ `fetch(\`/api/admin/blog-posts?id=\${id}\`)`

3. **Fixed Vercel Compatibility:**
   - ❌ `Express` types (`Request`, `Response`)
   - ✅ `Vercel` types (`VercelRequest`, `VercelResponse`)

#### **Data Format Mapping:**
```typescript
// Frontend Format ↔ MongoDB Format
{
  id: number,              // ↔ id: number | generated from _id
  title: string,           // ↔ title: string
  content: string,         // ↔ content: string
  slug: string,            // ↔ slug: string
  excerpt: string,         // ↔ excerpt: string
  featuredImage: string,   // ↔ coverImage: string
  createdAt: Date,         // ↔ date: Date
  updatedAt: Date,         // ↔ lastModified: Date
  userId: string,          // ↔ userId: string
  tags: string[],          // ↔ tags: string[]
  isFeatured: boolean,     // ↔ featured: boolean
  isPublished: boolean,    // ↔ !draft: boolean (inverted)
  readTime: number         // ↔ calculated from content
}
```

---

### 🧪 **Testing & Verification**

#### **Test Commands:**
```bash
# Test List Endpoint
curl -s https://tech-san.vercel.app/api/admin/blog-posts | jq '. | length'

# Test Individual Post
curl -s "https://tech-san.vercel.app/api/admin/blog-posts?id=3567125075" | jq .

# Test Update (PATCH)
curl -X PATCH "https://tech-san.vercel.app/api/admin/blog-posts?id=3567125075" \
  -H "Content-Type: application/json" \
  -d '{"title": "Updated Title"}'
```

#### **Verification Results:**
- ✅ **Production API Working:** Individual post fetch successful
- ✅ **Frontend Loading:** Edit page shows post content
- ✅ **Database Integration:** MongoDB data properly fetched and formatted
- ✅ **Save Functionality:** Post updates persist correctly

---

### 🛠️ **Future Engineering Notes**

#### **If This Breaks Again:**
1. **Check Vercel Deployment Logs:** Look for function timeout or memory issues
2. **Verify Environment Variables:** `MONGODB_URI` and `MONGODB_DATABASE` must be set
3. **Test API Endpoints Directly:** Use curl commands above to isolate frontend vs backend issues
4. **Check Data Format:** Ensure frontend-backend data mapping is consistent

#### **Performance Considerations:**
- The ID resolution strategy may be slow for large datasets
- Consider adding database indexes: `db.posts.createIndex({ id: 1 })`
- For production scale, implement caching layer

#### **Security Notes:**
- Admin endpoints bypass user authentication
- Consider adding admin token validation for production
- Implement rate limiting for API endpoints

---

### 📊 **Known Working Configuration**

#### **Environment:**
- **Node.js:** v18+ 
- **MongoDB:** v5+
- **Vercel:** Platform v2
- **TypeScript:** v5+

#### **Dependencies:**
- `@vercel/node`: ^5.3.0
- `mongodb`: ^6.x
- `@tanstack/react-query`: ^5.x

#### **File Structure:**
```
api/
├── admin/
│   └── blog-posts.ts        # ✅ Single endpoint handling all operations
├── blog-posts.ts            # ✅ Public blog posts endpoint
├── blog-post.ts             # ✅ Individual public post endpoint
└── test-route.ts            # ✅ Health check endpoint

client/src/
├── pages/
│   └── create-post.tsx      # ✅ Edit post page
└── components/
    └── post-editor.tsx      # ✅ Post editing component
```

---

### 🎯 **Success Metrics**

- **✅ Local Development:** Working perfectly
- **✅ Production Deployment:** All endpoints responding correctly
- **✅ Database Integration:** MongoDB data fetching and updating
- **✅ User Experience:** Edit page loads and saves posts successfully

**Last Updated:** 2025-07-06  
**Status:** ✅ FULLY FUNCTIONAL  
**Next Engineer:** Use this documentation as the complete reference for edit-post functionality

This comprehensive PRD ensures the San AgriTech Blog maintains high standards across all aspects of development, deployment, and content management while providing clear guidelines for current and future team members.

---

## 🤖 **CRITICAL AUTO-SAVE FIX - AI ENGINEER GUIDELINES**

### 🚨 **RECENTLY RESOLVED: React Rules of Hooks Violation (2025-01-20)**

**Issue:** Edit post page (`/edit-post/:id`) was crashing with React error #310 and "Rendered more hooks than during the previous render" error.

**Root Cause:** The `CreatePost` component had early conditional returns (`if (isEditing && isLoading)` and `if (isEditing && error)`) that happened **before** all React hooks were called, violating the Rules of Hooks.

**Critical Rules of Hooks Violation:**
- React expects **all hooks to be called in the same order every time**
- Early returns before hooks cause inconsistent hook counts between renders
- This breaks React's internal state management and causes crashes

**Fix Applied:** Restructured the component to ensure all hooks are called first, before any conditional logic:
1. **All hooks at the top** - `useParams`, `useLocation`, `useQuery`, `useMutation`, `useEffect`
2. **Helper functions** - `handleAutoSave`, `handleSave`
3. **Conditional rendering** - Loading, error, and main editor states

**Files Modified:**
- `client/src/pages/create-post.tsx` - Restructured hook order

**Prevention Rules:**
1. **NEVER put conditional returns before hooks** - always call all hooks first
2. **Keep hook order consistent** - same hooks in same order every render
3. **Move early returns after all hooks** - use conditional rendering instead
4. **Test hook consistency** - ensure no "Rendered more hooks" errors

**Verification Steps:**
1. Edit post page loads without React errors
2. All form fields (title, content, tags, excerpt, featured image) are visible
3. Auto-save functionality works without infinite loops
4. Console shows no "Rules of Hooks" violations

### 🚨 **RECENTLY RESOLVED: Auto-Save 404 Errors (2025-07-06)**

**Issue:** Auto-save functionality was failing with 404 errors in production because it was using inconsistent endpoint formats.

**Root Cause:** The auto-save mutations in `create-post.tsx` were still using the old dynamic route format `/api/admin/blog-posts/${id}` while the main functionality had been converted to query parameters `/api/admin/blog-posts?id=${id}`.

**Fix Applied:** Updated all auto-save and manual save mutations to use the consistent query parameter format.

**Files Modified:**
- `client/src/pages/create-post.tsx` - Fixed `autoSaveMutation` and `saveMutation`

---

### 📋 **MANDATORY GUIDELINES FOR FUTURE AI ENGINEERS**

#### **🔧 Endpoint Consistency Rules**

**RULE 1: Always Use Query Parameter Format for Individual Posts**
```typescript
✅ CORRECT: `/api/admin/blog-posts?id=${id}`
❌ WRONG:   `/api/admin/blog-posts/${id}`
```

**RULE 2: Check ALL Mutations and Queries**
When updating endpoints, verify these files have consistent formats:
- `client/src/pages/create-post.tsx` (autoSaveMutation, saveMutation)
- `client/src/components/post-editor.tsx` (updatePostMutation)
- `client/src/pages/create-post.tsx` (useQuery for fetching)

**RULE 3: Vercel Deployment Compatibility**
- Dynamic nested routes `/api/admin/blog-posts/[id].ts` cause deployment issues
- Query parameters `/api/admin/blog-posts.ts?id=X` are more reliable
- Always use `VercelRequest`/`VercelResponse` types, never Express types

#### **🧪 Testing Protocol for API Changes**

**STEP 1: Local Testing**
```bash
# Test local endpoints
curl -s "http://localhost:5000/api/admin/blog-posts?id=4367658208" | jq .
curl -X PATCH "http://localhost:5000/api/admin/blog-posts?id=4367658208" \
  -H "Content-Type: application/json" \
  -d '{"title": "Test Update"}'
```

**STEP 2: Production Testing**
```bash
# Test production endpoints after deployment
curl -s "https://tech-san.vercel.app/api/admin/blog-posts?id=4367658208" | jq .
curl -X PATCH "https://tech-san.vercel.app/api/admin/blog-posts?id=4367658208" \
  -H "Content-Type: application/json" \
  -d '{"title": "Test Update"}'
```

**STEP 3: Frontend Integration Testing**
1. Open browser console
2. Navigate to `/edit-post/[id]` 
3. Make edits and verify:
   - No 404 errors in console
   - Auto-save status indicators work
   - Success toasts appear
   - Data persists after page refresh

#### **🔍 Common Pitfalls to Avoid**

**PITFALL 1: Incomplete Endpoint Updates**
- When changing API structure, grep search for ALL occurrences
- Check both frontend queries AND mutations
- Don't forget auto-save functionality

**PITFALL 2: Mixed Endpoint Formats**
- Never mix `/api/admin/blog-posts/${id}` and `/api/admin/blog-posts?id=${id}`
- Use grep search to find inconsistencies: `grep -r "blog-posts.*\${.*}" client/`

**PITFALL 3: Forgetting Production Testing**
- Local testing is not enough - Vercel has different behavior
- Always test production endpoints after deployment
- Check browser console for 404 errors

#### **🚀 Auto-Save Functionality Architecture**

**Auto-Save Flow:**
```typescript
// 1. User makes changes
// 2. Debounced timer (3 seconds) triggers
// 3. autoSaveMutation executes
// 4. PATCH request to /api/admin/blog-posts?id=${id}
// 5. Success toast shows "Draft saved"
// 6. Status indicator updates
```

**Auto-Save Status States:**
- `idle`: No changes or waiting
- `saving`: Currently saving (shows spinner)
- `saved`: Successfully saved (shows checkmark)
- `error`: Save failed (shows error icon)

**Auto-Save Trigger Conditions:**
- Timer: Every 10 seconds if content exists
- Debounced: 3 seconds after any content change
- Manual: When user clicks save button

#### **🔧 Debugging Auto-Save Issues**

**Check These Files First:**
1. `client/src/pages/create-post.tsx` - Main auto-save logic
2. `client/src/components/simple-markdown-editor.tsx` - Editor auto-save
3. `api/admin/blog-posts.ts` - Backend endpoint handling

**Common Debug Steps:**
```bash
# 1. Check if API endpoint responds
curl -s "https://tech-san.vercel.app/api/admin/blog-posts?id=TEST_ID"

# 2. Check for console errors
# Open browser dev tools → Console tab
# Look for: "Auto-save failed" or HTTP 404 errors

# 3. Verify endpoint format in code
grep -r "blog-posts.*\${.*}" client/src/

# 4. Check Vercel function logs
# Go to Vercel dashboard → Functions tab → Look for errors
```

#### **📝 Code Pattern Templates**

**Query Pattern (for fetching):**
```typescript
const { data: post } = useQuery({
  queryKey: ['/api/admin/blog-posts', id],
  queryFn: async () => {
    const response = await fetch(`/api/admin/blog-posts?id=${id}`);
    if (!response.ok) throw new Error(`Failed to fetch: ${response.status}`);
    return response.json();
  },
  enabled: !!id,
});
```

**Mutation Pattern (for saving):**
```typescript
const mutation = useMutation({
  mutationFn: async (data) => {
    const response = await fetch(`/api/admin/blog-posts?id=${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`Save failed: ${response.status}`);
    return response.json();
  },
});
```

#### **⚠️ CRITICAL REMINDERS**

1. **NEVER** create new `/api/admin/blog-posts/[id].ts` files
2. **ALWAYS** use query parameters for individual post operations
3. **ALWAYS** test both local and production after API changes
4. **ALWAYS** check browser console for 404 errors
5. **ALWAYS** verify auto-save works by making test edits

---

### 🎯 **Success Verification Checklist**

After any API endpoint changes, verify ALL of these work:

**Frontend Routes:**
- [ ] `/edit-post/[id]` loads post data
- [ ] Auto-save shows "Saving..." → "Auto-saved" 
- [ ] Manual save works and redirects
- [ ] No 404 errors in browser console

**API Endpoints:**
- [ ] `GET /api/admin/blog-posts` (list all posts)
- [ ] `GET /api/admin/blog-posts?id=X` (individual post)
- [ ] `PATCH /api/admin/blog-posts?id=X` (update post)
- [ ] `POST /api/admin/blog-posts` (create post)

**Production Testing:**
- [ ] All endpoints respond correctly on Vercel
- [ ] Auto-save works in production environment
- [ ] Data persists across page refreshes
- [ ] Error handling shows appropriate messages

---

**⭐ GOLDEN RULE: When in doubt, use query parameters over dynamic routes for Vercel compatibility!**