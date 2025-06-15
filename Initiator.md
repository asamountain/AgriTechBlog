# AgroTech Blog Design Standards

## Color Scheme
- **Primary Color**: Forest Green (#2D5016) 
- **All accent colors must use Forest Green (#2D5016)** - no variations or different shades
- **Background**: White (#FFFFFF) for content areas
- **Secondary Background**: Light Gray (#F9FAFB) for sections
- **Text**: Dark Gray (#111827) for primary text, Medium Gray (#6B7280) for secondary text

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
- **Avoid duplicating functionality** - One feature should serve one purpose
- **Minimize Big O complexity** - Optimize for performance in all operations
- **No redundant processing** - If tagging includes categorization, don't separate them
- **Streamline user workflows** - Each action should have clear, direct purpose
- **Single source of truth** - Data should only be stored and managed in one place

This document ensures visual consistency, mathematical harmony, and optimal performance throughout the application.