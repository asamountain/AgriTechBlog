# San Blog - Systematic Development Process

## Pre-Implementation Checklist

Before implementing ANY update or feature, follow these steps:

### Step 1: Reference Documentation Review
1. **Read Initiator.md** - Understand project vision and constraints
2. **Check current file structure** - Identify existing components and patterns
3. **Review database schema** - Understand data relationships and constraints
4. **Verify technology stack** - Ensure compliance with React.js (NO Next.js), MongoDB, Express

### Step 2: Feature Planning
1. **Align with monetization goals** - Does this enhance value generation?
2. **Consider user experience** - Will farmers/agricultural professionals benefit?
3. **Assess performance impact** - Maintain < 3 second load times
4. **Plan mobile responsiveness** - Essential for field workers

## Implementation Process Template

### Phase 1: Database Schema (if applicable)
```bash
# Always check existing MongoDB collections first
# Update shared/schema.ts with new types
# Ensure backward compatibility with existing 86 blog posts
# Add userId fields for user-specific data separation
```

### Phase 2: Backend Implementation
```bash
# Update server/storage.ts interface
# Implement MongoDB operations in server/mongodb-storage-updated.ts
# Add API routes in server/routes.ts
# Include authentication checks where needed
# Test all endpoints with existing data
```

### Phase 3: Frontend Components
```bash
# Follow agricultural design theme (forest green, golden ratio)
# Use Tailwind CSS with custom agricultural classes
# Implement mobile-first responsive design
# Add loading states and error handling
# Include analytics tracking for user interactions
```

### Phase 4: Integration & Testing
```bash
# Test with actual MongoDB data (86 existing posts)
# Verify Google Analytics tracking events
# Check comment system functionality
# Validate authentication flows (Google/GitHub)
# Ensure admin panel accessibility
```

## Critical Integration Rules

### Always Preserve
- **Existing MongoDB connection and data**
- **Google Analytics tracking codes**
- **Comment system functionality**
- **Admin panel access**
- **Authentication system**
- **User-specific data separation**

### Never Break
- **Responsive design across all screen sizes**
- **Page load performance (< 3 seconds)**
- **SEO optimization**
- **Existing blog post display and navigation**
- **Social sharing functionality**

### Required Tracking Events
```javascript
// Include these in every user interaction
trackEvent('feature_interaction', 'category', 'action_name');
trackEvent('page_view', 'blog_post', postTitle, readTime);
trackEvent('admin_action', 'content_management', action_type);
```

## Quality Assurance Checklist

### Before Deployment
- [ ] All forms validate properly
- [ ] Mobile responsiveness tested on multiple devices
- [ ] Analytics tracking verified in browser console
- [ ] Comment system functional (submit, approve, display)
- [ ] Social sharing works with proper tracking
- [ ] Admin panel accessible with authentication
- [ ] Database connections stable
- [ ] Performance metrics met (Lighthouse score > 90)
- [ ] SEO metadata properly configured
- [ ] Error states handled gracefully

### Post-Deployment Verification
- [ ] Monitor analytics for tracking accuracy
- [ ] Check comment moderation workflow
- [ ] Verify user authentication flows
- [ ] Test social sharing on multiple platforms
- [ ] Monitor page load speeds
- [ ] Check mobile experience on real devices

## Common Implementation Patterns

### Authentication Flow
```javascript
// Always check user authentication status
const { user, isAuthenticated } = useAuth();

// Protect admin routes
if (!isAuthenticated) {
  return <AdminLogin />;
}

// Filter data by user ID for separation
const userSpecificData = await storage.getData({ userId: user.id });
```

### Database Operations
```javascript
// Always include user ID for data separation
const createData = async (data, userId) => {
  return await storage.create({ ...data, userId });
};

// Filter queries by user
const getUserData = async (userId, options) => {
  return await storage.getBlogPosts({ ...options, userId });
};
```

### Component Structure
```jsx
// Follow this pattern for all components
function ComponentName({ prop1, prop2 }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { toast } = useToast();
  
  // Analytics tracking
  useEffect(() => {
    trackEvent('component_view', 'category', 'ComponentName');
  }, []);
  
  // Error handling
  const handleAction = async () => {
    try {
      setLoading(true);
      // Action implementation
      toast({ title: "Success message" });
    } catch (error) {
      setError(error.message);
      toast({ title: "Error", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="mobile-responsive agricultural-theme">
      {/* Component content */}
    </div>
  );
}
```

## File Organization Standards

### Required File Structure
```
client/src/
├── components/         # Reusable UI components
├── pages/             # Main application pages
├── hooks/             # Custom React hooks
├── lib/               # Utilities and configurations
└── assets/            # Images and static files

server/
├── routes.ts          # API endpoint definitions
├── storage.ts         # Storage interface
├── mongodb-storage-updated.ts  # MongoDB implementation
├── auth.ts           # Authentication logic
└── db.ts             # Database connection

shared/
└── schema.ts         # TypeScript types and Zod schemas
```

### Naming Conventions
- **Components**: PascalCase (e.g., `BlogPostEditor.tsx`)
- **Files**: kebab-case (e.g., `blog-post-editor.tsx`)
- **Variables**: camelCase (e.g., `blogPostData`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `API_ENDPOINTS`)

## Emergency Rollback Procedures

### If Update Breaks Functionality
1. **Identify the issue** - Check browser console and server logs
2. **Isolate the problem** - Determine if it's frontend, backend, or database
3. **Quick fixes first** - Try simple solutions before major rollbacks
4. **Document the issue** - Add to known issues list
5. **Implement proper fix** - Follow development process for permanent solution

### Database Safety
- **Never delete existing collections**
- **Always add fields, don't remove existing ones**
- **Use optional fields for new features**
- **Test migrations on development data first**

## Success Metrics

### Performance Targets
- **Page Load Speed**: < 3 seconds
- **Mobile Lighthouse Score**: > 90
- **SEO Score**: > 95
- **User Engagement**: > 2 minutes average session
- **Comment Conversion**: > 5% of readers engage

### Feature Success Indicators
- **Analytics Events**: All user interactions tracked
- **Error Rate**: < 1% of user actions fail
- **Mobile Usage**: > 60% mobile traffic supported
- **Authentication**: > 95% successful login rate
- **Content Management**: < 30 seconds to publish new post

---

**Implementation Command**: Always run `DEVELOPMENT_PROCESS.md` review before starting any new feature or update.

**Last Updated**: June 15, 2025
**Next Review**: When major features are added or technology stack changes