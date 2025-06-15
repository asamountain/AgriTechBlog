# Automated Development Guidance System

## Pre-Implementation Hook Commands

### Command: `CHECK_GUIDANCE`
Before implementing any feature, run this mental checklist:

```bash
# 1. Reference Check
- Read Initiator.md (lines 1-249)
- Review DEVELOPMENT_PROCESS.md 
- Check existing file structure
- Verify MongoDB schema compatibility

# 2. Technology Stack Verification
- ✅ React.js (NO Next.js)
- ✅ Node.js + Express backend
- ✅ MongoDB database (86 existing posts)
- ✅ Tailwind CSS + agricultural theme
- ✅ Google Analytics tracking

# 3. User Experience Standards
- ✅ Mobile-first responsive design
- ✅ < 3 second page load times
- ✅ Agricultural professional focus
- ✅ Monetization alignment
- ✅ SEO optimization
```

### Command: `VERIFY_PATTERNS`
Check these implementation patterns are followed:

```javascript
// Authentication Pattern
const { user, isAuthenticated } = useAuth();
if (!isAuthenticated) return <AdminLogin />;

// Data Separation Pattern  
const userData = await storage.getData({ userId: user.id });

// Analytics Pattern
trackEvent('action_name', 'category', 'label');

// Error Handling Pattern
try {
  setLoading(true);
  // operation
  toast({ title: "Success" });
} catch (error) {
  toast({ title: "Error", variant: "destructive" });
} finally {
  setLoading(false);
}
```

### Command: `PRESERVE_CORE`
Never break these critical systems:

```bash
# Database Integrity
- MongoDB connection (existing 86 posts)
- User-specific data separation (userId fields)
- Comment system functionality
- Authentication flows (Google/GitHub)

# User Experience
- Admin panel accessibility
- Social sharing with tracking
- Responsive design (mobile farmers)
- Page performance (< 3 seconds)

# Analytics & Tracking
- Google Analytics integration
- Custom event tracking
- User behavior monitoring
- SEO metadata
```

## Implementation Workflow Automation

### Step 1: Pre-Code Analysis
```bash
# Automatically check before coding:
1. Does this align with agricultural technology focus?
2. Will farmers/agricultural professionals benefit?
3. Does it enhance monetization potential?
4. Is it mobile-friendly for field workers?
5. Will it maintain performance standards?
```

### Step 2: Code Structure Enforcement
```javascript
// Always follow this component structure:
function NewComponent({ props }) {
  // 1. State management
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // 2. Authentication check
  const { user, isAuthenticated } = useAuth();
  
  // 3. Analytics tracking
  useEffect(() => {
    trackEvent('component_view', 'category', 'NewComponent');
  }, []);
  
  // 4. Data operations with user filtering
  const fetchData = async () => {
    const data = await storage.getData({ userId: user.id });
  };
  
  // 5. Mobile-responsive JSX
  return (
    <div className="agricultural-theme mobile-responsive">
      {/* Content */}
    </div>
  );
}
```

### Step 3: Quality Gates
```bash
# Before deployment, verify:
- [ ] Mobile responsiveness tested
- [ ] Analytics events firing
- [ ] Authentication working
- [ ] Database operations user-filtered
- [ ] Performance metrics met
- [ ] Error states handled
- [ ] Agricultural theme maintained
```

## Automated Reminders System

### Database Operations
```javascript
// ALWAYS include userId for data separation
const createPost = async (postData, userId) => {
  return await storage.createBlogPost({ ...postData, userId });
};

const getPosts = async (userId, options = {}) => {
  return await storage.getBlogPosts({ ...options, userId });
};
```

### Component Styling
```css
/* Always use agricultural theme classes */
.forest-green { color: var(--forest-green); }
.golden-ratio { aspect-ratio: 1.618; }
.mobile-responsive { @apply responsive-classes; }
.agricultural-theme { @apply nature-inspired-palette; }
```

### Analytics Integration
```javascript
// Required tracking for all user interactions
trackEvent('page_view', 'blog_post', postTitle, readTime);
trackEvent('admin_action', 'content_management', action);
trackEvent('user_engagement', 'interaction', component);
```

## Failure Prevention System

### Critical Warnings
```bash
# STOP if attempting:
❌ Using Next.js instead of React.js
❌ Breaking MongoDB connection
❌ Removing user authentication
❌ Deleting existing blog posts
❌ Ignoring mobile responsiveness
❌ Skipping analytics tracking
❌ Breaking admin panel access
```

### Recovery Procedures
```bash
# If something breaks:
1. Check server/mongodb-storage-updated.ts for data issues
2. Verify client/src/hooks/useAuth.ts for authentication
3. Test client/src/lib/analytics.ts for tracking
4. Confirm server/routes.ts API endpoints
5. Validate shared/schema.ts type definitions
```

## Integration Checklist Automation

### Before Every Update
- [ ] Read Initiator.md guidance
- [ ] Check DEVELOPMENT_PROCESS.md steps
- [ ] Verify agricultural theme compliance
- [ ] Confirm MongoDB compatibility
- [ ] Test user authentication flows
- [ ] Validate analytics tracking
- [ ] Check mobile responsiveness

### After Every Update  
- [ ] All existing functionality still works
- [ ] New features follow established patterns
- [ ] Performance metrics maintained
- [ ] User experience enhanced
- [ ] Documentation updated
- [ ] Error handling implemented
- [ ] Security measures intact

## Continuous Monitoring

### Performance Metrics
```javascript
// Track these automatically:
const metrics = {
  pageLoadTime: '< 3 seconds',
  mobileScore: '> 90 Lighthouse',
  seoScore: '> 95 optimization',
  userEngagement: '> 2 minutes session',
  commentConversion: '> 5% engagement'
};
```

### Success Indicators
```bash
# Monitor these for feature success:
✅ Analytics events capturing user behavior
✅ Mobile traffic supported (>60% users)
✅ Authentication success rate >95%
✅ Content management efficiency
✅ Agricultural community engagement
```

---

**Usage**: Reference this file before implementing any new features or updates. It ensures consistency with project vision and prevents breaking existing functionality.

**Automation Level**: High - Follow all checkpoints for guaranteed quality
**Last Updated**: June 15, 2025