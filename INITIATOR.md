# Project Initiator Guidelines

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