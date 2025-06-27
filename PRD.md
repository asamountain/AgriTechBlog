# Project Initiator Guidelines

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

# San Blog Design Standards

## Color Scheme
- **Primary Color**: Forest Green (#2D5016) 
- **All accent colors must use Forest Green (#2D5016)** - no variations or different shades
- **Background**: White (#FFFFFF) for content areas
- **Secondary Background**: Light Gray (#F9FAFB) for sections
- **Text**: Dark Gray (#111827) for primary text, Medium Gray (#6B7280) for secondary text

## Streaming Pipeline Setup Definition

**CRITICAL: Unified Data Flow Architecture for Consistent Post Fetching**

### Pipeline Overview
The streaming pipeline ensures seamless data flow between MongoDB, API endpoints, and frontend components across all pages (landing page, posts page, and admin page).

### Core Components:
1. **MongoDB Storage Layer** (`server/mongodb-storage-updated.ts`)
   - Primary data source for all blog posts
   - Handles CRUD operations with proper error handling
   - Maps MongoDB documents to standardized BlogPost interface

2. **API Endpoint Layer** (`api/blog-posts.ts`, `api/blog-posts/featured.ts`)
   - Provides RESTful endpoints for data access
   - Handles query parameters (limit, offset, featured)
   - Returns fallback sample data if MongoDB connection fails

3. **Query Client Layer** (`client/src/lib/queryClient.ts`)
   - Manages API request caching and state management
   - Handles query parameters for pagination and filtering
   - Provides consistent error handling and retry logic

4. **Component Integration Layer**
   - **Landing Page**: `FeaturedStories` + `BlogGrid` components
   - **Posts Page**: Full post listing with search and filtering
   - **Admin Page**: Post management with CRUD operations

### Data Flow Pipeline:
```
MongoDB → API Endpoints → Query Client → React Components → User Interface
```

### Consistency Rules:
1. **Single Source of Truth**: MongoDB is the authoritative data source
2. **Standardized Response Format**: All endpoints return consistent BlogPost objects
3. **Fallback Strategy**: Sample data provided when MongoDB unavailable
4. **Error Propagation**: Clear error messages throughout the pipeline
5. **Cache Management**: Intelligent invalidation and refetching

### Endpoint Synchronization:
- `/api/blog-posts` - All published posts
- `/api/blog-posts/featured` - Featured posts only
- `/api/admin/blog-posts` - Admin view with drafts
- All endpoints must support the same query parameters and return format

### Testing Protocol:
1. Test MongoDB connection and fallback behavior
2. Verify API endpoint response consistency
3. Test frontend component data fetching
4. Validate cross-page navigation and state management
5. Ensure admin operations sync with public views

This pipeline ensures that posts display consistently across the landing page, posts page, and admin interface, with proper error handling and fallback mechanisms.

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

This document ensures visual consistency, mathematical harmony, and optimal performance throughout the application.