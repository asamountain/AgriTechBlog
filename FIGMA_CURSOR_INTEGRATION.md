# Figma + Cursor IDE Integration Guide

## Overview

Since Cursor IDE doesn't have native Figma extensions, this guide provides several effective methods to integrate Figma designs with your development workflow.

## Method 1: Automated Design Token Sync (Recommended)

### Setup

1. **Get Figma API Credentials**
   ```bash
   # Go to: https://www.figma.com/developers/api#access-tokens
   # Generate a Personal Access Token
   ```

2. **Get Your Figma File Key**
   ```
   From your Figma URL: https://www.figma.com/file/{FILE_KEY}/your-design-name
   Copy the FILE_KEY part
   ```

3. **Configure Environment**
   ```bash
   # Add to your .env file:
   echo "FIGMA_ACCESS_TOKEN=your_token_here" >> .env
   echo "FIGMA_FILE_KEY=your_file_key_here" >> .env
   ```

### Usage Commands

```bash
# Initialize Figma integration
bun run figma:init

# One-time sync of design tokens
bun run figma:sync

# Watch mode - automatically sync changes
bun run figma:watch

# Development with auto-sync
bun run dev:figma
```

### Features

- ✅ **Preserves Your Golden Ratio System** - Maintains your existing spacing and typography
- ✅ **Keeps Forest Green Primary Color** - Your `#2D5016` color system stays intact
- ✅ **Auto-generates CSS Variables** - Creates `figma-tokens.css` with design tokens
- ✅ **Component Specifications** - Generates component specs with Figma links
- ✅ **Real-time Updates** - Watch mode syncs changes automatically

## Method 2: Split Screen Workflow

### Desktop Setup
```bash
# Install Figma Desktop App (if not installed)
# Download from: https://www.figma.com/downloads/

# Open Figma and Cursor side-by-side
open -a "Figma"
# Then open Cursor IDE
```

### Browser Setup
```bash
# Use Figma in browser + Cursor IDE
# Navigate to: https://www.figma.com/
# Arrange windows side-by-side
```

### Benefits
- ✅ **Direct Visual Reference** - See designs while coding
- ✅ **Copy CSS Properties** - Use Figma's Dev Mode for exact values
- ✅ **Component Inspection** - Hover over elements for measurements
- ✅ **No Setup Required** - Works immediately

## Method 3: Manual Design Token Extraction

### Quick CSS Value Extraction
1. **Open Figma Design** in browser or desktop app
2. **Enable Dev Mode** (if available in your Figma plan)
3. **Select Component** and copy CSS values
4. **Paste into Cursor** and adapt to your golden ratio system

### Example Workflow
```css
/* From Figma Dev Mode: */
/* padding: 12px 24px; */

/* Adapted to Golden Ratio: */
padding: var(--space-sm) var(--space-lg); /* 10px 26px */
```

## Method 4: Component-to-Code Mapping

### Create Component Links
```json
// component-mapping.json
{
  "Button": {
    "figmaUrl": "https://www.figma.com/file/YOUR_FILE_KEY?node-id=123:456",
    "componentPath": "client/src/components/ui/button.tsx",
    "props": ["variant", "size", "disabled"]
  },
  "Card": {
    "figmaUrl": "https://www.figma.com/file/YOUR_FILE_KEY?node-id=789:012",
    "componentPath": "client/src/components/ui/card.tsx",
    "props": ["title", "content", "footer"]
  }
}
```

### Usage in Components
```tsx
// client/src/components/ui/button.tsx
/**
 * Button Component
 * 
 * 🎨 Figma Design: https://www.figma.com/file/YOUR_FILE_KEY?node-id=123:456
 * 🔧 Last Synced: 2024-01-20
 * 
 * Design System:
 * - Primary Color: Forest Green (#2D5016)
 * - Spacing: Golden Ratio (10px, 16px, 26px)
 * - Border Radius: Golden Ratio (6px, 10px, 16px)
 */
export function Button({ variant = "primary", ...props }) {
  // Component implementation
}
```

## Generated File Structure

```
client/src/styles/
├── figma-tokens.css          # Auto-generated design tokens
├── component-specs.json      # Component specifications
└── figma-sync-log.json      # Sync history and metadata
```

## Integration with Existing System

### Your Golden Ratio System (Preserved)
```css
/* These values are maintained and NOT overridden */
--space-xs: 6px;      /* Base */
--space-sm: 10px;     /* Base × 1.618 */
--space-md: 16px;     /* Base × 1.618² */
--space-lg: 26px;     /* Base × 1.618³ */
--space-xl: 42px;     /* Base × 1.618⁴ */
```

### Figma Additions (Supplementary)
```css
/* These are added from Figma without breaking your system */
--color-figma-accent: #FF6B35;
--color-figma-success: #4CAF50;
--font-figma-heading: 'Custom Font', serif;
```

## Troubleshooting

### Common Issues

1. **"Extension not found" in Cursor**
   - ✅ **Solution**: Use the automated CLI method above instead of extensions

2. **Figma API Token Invalid**
   ```bash
   # Regenerate token at: https://www.figma.com/developers/api#access-tokens
   # Update .env file with new token
   ```

3. **File Key Not Found**
   ```bash
   # Check Figma URL format: figma.com/file/{FILE_KEY}/...
   # Ensure you have access to the file
   ```

4. **Permission Denied**
   ```bash
   chmod +x scripts/figma-integration.js
   ```

## Best Practices

### Design-to-Code Workflow
1. **Design First** - Complete design in Figma
2. **Sync Tokens** - Run `bun run figma:sync` 
3. **Build Components** - Use generated tokens and specs
4. **Reference Links** - Add Figma links to component comments
5. **Update Documentation** - Keep component specs current

### Maintaining Consistency
- ✅ **Always use generated CSS variables** from `figma-tokens.css`
- ✅ **Preserve golden ratio system** - don't override spacing/typography
- ✅ **Keep forest green primary** - use Figma colors as accents only
- ✅ **Update regularly** - sync tokens when designs change

## Alternative Tools

If you need more advanced integration:

1. **Figma Desktop + Alfred Workflow** (macOS)
2. **Figma API + VS Code** (if switching IDEs)
3. **Figma Dev Mode + Manual Copy** (browser workflow)
4. **Design System Documentation** (Storybook + Figma)

## Keyboard Shortcuts

```bash
# Quick commands (add to your shell profile)
alias fs="bun run figma:sync"
alias fw="bun run figma:watch"
alias fd="bun run dev:figma"
```

## Success Indicators

You'll know the integration is working when:

- ✅ `figma-tokens.css` file is generated automatically
- ✅ Component specs include Figma links
- ✅ Your golden ratio spacing is preserved
- ✅ Forest green primary color remains `#2D5016`
- ✅ New Figma colors appear as `--color-figma-*` variables

## Next Steps

1. **Set up your .env variables** with Figma credentials
2. **Run `bun run figma:init`** to test the connection
3. **Start development** with `bun run dev:figma`
4. **Add Figma links** to your component comments
5. **Sync regularly** to keep designs and code in sync

---

**Happy designing! 🎨✨** 